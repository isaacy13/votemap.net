"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { getAddress } from "viem";
import {
    EARLY_FEE_BPS,
    EXPIRY_FEE_BPS,
    MIN_STAKE_USDC,
    PAY_FEE_BPS,
    addressUrl,
    chainName,
    contractAddress,
    countryOk,
    formatUsdc,
    getIssue,
    handlesOf,
    listIssues,
    missingEnv,
    oauthCallbackUrl,
    oauthStartUrl,
    parseUsdc,
    paySolver,
    readTreasury,
    registerHandle,
    stake,
    txUrl,
    withdrawEarly,
    withdrawExpired,
    type Issue,
    type Network,
} from "./chain";
import { parsePostUrl } from "./urls";
import { PostEmbed } from "./PostEmbed";
import "./mvp.css";
import "react-tweet/theme.css";

function short(addr: string) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function defaultExpiry() {
    const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    d.setSeconds(0, 0);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function App() {
    const router = useRouter();
    const params = useSearchParams();
    const rawUrl = params.get("url");
    const issueUrl = rawUrl ? parsePostUrl(rawUrl)?.canonical ?? null : null;
    const { resolvedTheme, setTheme } = useTheme();
    const configErr = missingEnv();

    const [wallet, setWallet] = useState<string | null>(null);
    const [handles, setHandles] = useState({ x: "", threads: "" });
    const [country, setCountry] = useState(false);
    const [treasury, setTreasury] = useState<string | null>(null);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [issue, setIssue] = useState<Issue | null>(null);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState("");
    const [lastTx, setLastTx] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [regNet, setRegNet] = useState<Network>("x");
    const [regHandle, setRegHandle] = useState("");
    const [oauthHint, setOauthHint] = useState("");

    const linked = Boolean(handles.x || handles.threads);
    const gated = Boolean(wallet && country && linked);

    async function refresh(w = wallet) {
        if (configErr) return;
        setTreasury(await readTreasury());
        if (issueUrl) setIssue(await getIssue(issueUrl));
        else setIssues(await listIssues());
        if (!w) return;
        const [h, c] = await Promise.all([handlesOf(w), countryOk(w)]);
        setHandles(h);
        setCountry(c);
    }

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (configErr) return;
        refresh().catch((e) => setErr(String((e as Error).message || e)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet, issueUrl]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const network = hash.get("network");
        const handle = hash.get("handle");
        const stated = hash.get("wallet");
        if (!handle || (network !== "x" && network !== "threads")) return;
        setRegNet(network);
        setRegHandle(handle);
        setOauthHint(`OAuth returned @${handle}. Register it on chain (first come).`);
        window.history.replaceState(null, "", "/mvp");
        if (wallet && stated && getAddress(stated) !== getAddress(wallet)) {
            setErr(`OAuth was started with ${short(stated)}. Switch to that wallet.`);
        }
    }, [wallet]);

    useEffect(() => {
        if (!window.ethereum?.on) return;
        const onAcc = (accs: unknown) => {
            const list = accs as string[];
            setWallet(list[0] ? getAddress(list[0]) : null);
        };
        window.ethereum.on("accountsChanged", onAcc);
        return () => window.ethereum?.removeListener?.("accountsChanged", onAcc);
    }, []);

    async function connect() {
        setErr("");
        try {
            const accs = (await window.ethereum?.request({ method: "eth_requestAccounts" })) as string[];
            if (!accs?.[0]) throw new Error("no account");
            setWallet(getAddress(accs[0]));
        } catch (e) {
            setErr(String((e as Error).message || e));
        }
    }

    async function run(label: string, fn: () => Promise<string | void>) {
        setErr("");
        setBusy(label);
        try {
            const hash = await fn();
            if (hash) setLastTx(hash);
            await refresh();
        } catch (e) {
            setErr(String((e as Error).message || e));
        } finally {
            setBusy("");
        }
    }

    if (configErr) {
        return (
            <div className="mvp">
                <header>
                    <h1>votemap mvp</h1>
                    <button
                        type="button"
                        className="ghost"
                        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    >
                        {mounted && resolvedTheme === "dark" ? "light mode" : "dark mode"}
                    </button>
                </header>
                <p className="err">{configErr}</p>
                <p className="muted">
                    Required: <code>NEXT_PUBLIC_VOTEMAP_CHAIN</code> and{" "}
                    <code>NEXT_PUBLIC_VOTEMAP_CONTRACT</code>. Optional:{" "}
                    <code>NEXT_PUBLIC_BASE_RPC</code>, <code>NEXT_PUBLIC_OAUTH_CALLBACK_URL</code>.
                    Treasury is set at deploy (no dummy default). See <code>mvp/README.md</code>.
                </p>
                <p>
                    <Link href="/">home</Link>
                </p>
            </div>
        );
    }

    return (
        <div className="mvp">
            <header>
                <div>
                    <h1>votemap mvp</h1>
                    <div className="nav">
                        <Link href="/">home</Link>
                        <Link href="/mvp">issues</Link>
                    </div>
                </div>
                <button
                    type="button"
                    className="ghost"
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                >
                    {mounted && resolvedTheme === "dark" ? "light mode" : "dark mode"}
                </button>
            </header>

            <p className="banner muted">
                {chainName() === "base" ? "Base mainnet" : "Base Sepolia"}. Factory{" "}
                <a href={addressUrl(contractAddress()!)} target="_blank" rel="noreferrer">
                    {short(contractAddress()!)}
                </a>
                . Treasury {treasury ? <code>{short(treasury)}</code> : "…"}. Pots are x.com only.
            </p>

            <section>
                <h2>1. Wallet, country, handle</h2>
                {wallet ? (
                    <p>
                        {short(wallet)}{" "}
                        <a href={addressUrl(wallet)} target="_blank" rel="noreferrer">
                            Basescan
                        </a>
                    </p>
                ) : (
                    <button type="button" onClick={connect}>
                        Connect wallet
                    </button>
                )}
                {wallet && (
                    <>
                        <p className="muted">
                            Coinbase country: {country ? "ok" : "required"}{" "}
                            {!country && (
                                <a
                                    href="https://www.coinbase.com/onchain-verify"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    claim Verified Country
                                </a>
                            )}
                            . Checked on chain (EAS), not only in this page.
                        </p>
                        <p className="muted">
                            On chain: {handles.x ? `X @${handles.x}` : "no X"} ·{" "}
                            {handles.threads ? `Threads @${handles.threads}` : "no Threads"}
                            . First wallet to <code>registerHandle</code> owns that @. OAuth is login UX
                            only.
                        </p>
                        {oauthHint && <p className="muted">{oauthHint}</p>}
                        <p>
                            {oauthCallbackUrl() && (
                                <>
                                    <button
                                        type="button"
                                        className="ghost"
                                        onClick={() => {
                                            window.location.href = oauthStartUrl("x", wallet);
                                        }}
                                    >
                                        Log in with X
                                    </button>
                                    <button
                                        type="button"
                                        className="ghost"
                                        onClick={() => {
                                            window.location.href = oauthStartUrl("threads", wallet);
                                        }}
                                    >
                                        Log in with Threads
                                    </button>
                                </>
                            )}
                        </p>
                        <label htmlFor="reg-handle">Register handle on chain</label>
                        <select value={regNet} onChange={(e) => setRegNet(e.target.value as Network)}>
                            <option value="x">X</option>
                            <option value="threads">Threads</option>
                        </select>
                        <input
                            id="reg-handle"
                            value={regHandle}
                            onChange={(e) => setRegHandle(e.target.value)}
                            placeholder="@handle"
                        />
                        <p>
                            <button
                                type="button"
                                disabled={!regHandle.trim()}
                                onClick={() =>
                                    run("register", () =>
                                        registerHandle(
                                            regNet,
                                            regHandle.trim().replace(/^@/, "").toLowerCase(),
                                            wallet,
                                        ),
                                    )
                                }
                            >
                                Register handle
                            </button>
                        </p>
                    </>
                )}
            </section>

            {err && <p className="err">{err}</p>}
            {busy && <p className="muted">{busy}</p>}
            {lastTx && (
                <p className="muted">
                    last tx:{" "}
                    <a href={txUrl(lastTx)} target="_blank" rel="noreferrer">
                        Basescan
                    </a>
                </p>
            )}

            {!gated && wallet && (
                <p className="muted">
                    Need Coinbase Verified Country and at least one registered handle before staking.
                    Issue pots are x.com URLs only. Pay only sends your unexpired stake, not the whole
                    pot.
                </p>
            )}

            {issueUrl ? (
                <IssuePanel
                    issue={issue}
                    wallet={wallet}
                    gated={gated}
                    onBack={() => router.push("/mvp")}
                    onPay={(network, handle) =>
                        run("pay", () => paySolver(issueUrl, network, handle, wallet!))
                    }
                    onEarly={() => run("withdraw", () => withdrawEarly(issueUrl, wallet!))}
                    onExpiry={() => run("withdraw", () => withdrawExpired(issueUrl, wallet!))}
                />
            ) : (
                <HomePanel
                    issues={issues}
                    gated={gated}
                    onOpen={(url) => router.push(`/mvp?url=${encodeURIComponent(url)}`)}
                    onStake={(url, expiry, amount) =>
                        run("stake", async () => {
                            const hash = await stake(url, expiry, amount, wallet!);
                            router.push(`/mvp?url=${encodeURIComponent(url)}`);
                            return hash;
                        })
                    }
                />
            )}
        </div>
    );
}

function HomePanel({
    issues,
    gated,
    onOpen,
    onStake,
}: {
    issues: Issue[];
    gated: boolean;
    onOpen: (url: string) => void;
    onStake: (url: string, expiry: number, amount: bigint) => void;
}) {
    const [url, setUrl] = useState("");
    const [amount, setAmount] = useState(String(MIN_STAKE_USDC));
    const [expiry, setExpiry] = useState(() => defaultExpiry());
    const [formErr, setFormErr] = useState("");
    const parsed = parsePostUrl(url);

    return (
        <>
            <section>
                <h2>2. Stake on a post</h2>
                <p className="muted">
                    Issue key = canonical x.com URL (not twitter.com, not Threads). First{" "}
                    {MIN_STAKE_USDC} USDC creates the pot; the same URL joins. You must set your own
                    expiry. Pay / early / expire move only your remaining stake. Pay solver{" "}
                    {PAY_FEE_BPS / 100}% · early out {EARLY_FEE_BPS / 100}% · expiry {EXPIRY_FEE_BPS / 100}
                    %. Gas is extra ETH on Base, paid by you.
                </p>
                <label htmlFor="post-url">x.com post URL</label>
                <input
                    id="post-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://x.com/…/status/…"
                />
                {formErr && <p className="err">{formErr}</p>}
                {url && !parsed && (
                    <p className="err">Need an x.com post URL. twitter.com and Threads are not accepted.</p>
                )}
                {parsed && (
                    <p className="muted">
                        canonical: <code>{parsed.canonical}</code>
                    </p>
                )}
                <label htmlFor="amount">USDC (min {MIN_STAKE_USDC})</label>
                <input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                />
                <label htmlFor="expiry">Your expiry</label>
                <input
                    id="expiry"
                    type="datetime-local"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                />
                <p>
                    <button
                        type="button"
                        disabled={!gated || !parsed}
                        onClick={() => {
                            setFormErr("");
                            if (!parsed) return;
                            const ts = Math.floor(new Date(expiry).getTime() / 1000);
                            if (!Number.isFinite(ts) || ts <= Date.now() / 1000) {
                                setFormErr("expiry must be in the future");
                                return;
                            }
                            try {
                                onStake(parsed.canonical, ts, parseUsdc(amount));
                            } catch (e) {
                                setFormErr(String((e as Error).message || e));
                            }
                        }}
                    >
                        Stake
                    </button>
                </p>
            </section>

            <section>
                <h2>Issues</h2>
                {issues.length === 0 ? (
                    <p className="muted">None yet. Stake on a post URL to create one.</p>
                ) : (
                    <ul className="issues">
                        {issues.map((i) => (
                            <li key={i.id}>
                                <a
                                    href={`/mvp?url=${encodeURIComponent(i.url)}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onOpen(i.url);
                                    }}
                                >
                                    {i.url}
                                </a>
                                <div className="muted">{formatUsdc(i.live)} USDC live (unexpired)</div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}

function IssuePanel({
    issue,
    wallet,
    gated,
    onBack,
    onPay,
    onEarly,
    onExpiry,
}: {
    issue: Issue | null;
    wallet: string | null;
    gated: boolean;
    onBack: () => void;
    onPay: (network: Network, handle: string) => void;
    onEarly: () => void;
    onExpiry: () => void;
}) {
    const [payNet, setPayNet] = useState<Network>("x");
    const [payHandle, setPayHandle] = useState("");
    const mine = issue?.stakers.find(
        (s) => wallet && s.wallet.toLowerCase() === wallet.toLowerCase() && !s.closed && s.amount > BigInt(0),
    );

    if (!issue) {
        return (
            <section>
                <p className="muted">No issue for this URL yet.</p>
                <button type="button" className="ghost" onClick={onBack}>
                    Back
                </button>
            </section>
        );
    }

    return (
        <section>
            <button type="button" className="ghost" onClick={onBack}>
                Back
            </button>
            <h2>Issue</h2>
            <p>
                <a href={issue.url} target="_blank" rel="noreferrer">
                    {issue.url}
                </a>
            </p>
            <p className="muted">
                Live bounty {formatUsdc(issue.live)} USDC unexpired · {formatUsdc(issue.total)} USDC still
                in the pot (expired lines sit until those wallets withdraw). Pay only moves your line.
            </p>
            {issue.parsed && <PostEmbed parsed={issue.parsed} />}

            <h2>Stakes</h2>
            <table>
                <thead>
                    <tr>
                        <th>wallet</th>
                        <th>USDC</th>
                        <th>expiry</th>
                        <th>status</th>
                    </tr>
                </thead>
                <tbody>
                    {issue.stakers.map((s) => (
                        <tr key={s.wallet}>
                            <td>
                                <a href={addressUrl(s.wallet)} target="_blank" rel="noreferrer">
                                    {short(s.wallet)}
                                </a>
                            </td>
                            <td>{formatUsdc(s.amount)}</td>
                            <td>{new Date(s.expiry * 1000).toLocaleString()}</td>
                            <td>{s.closed || s.amount === BigInt(0) ? "closed" : "open"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {mine && gated && (
                <>
                    <h2>Your USDC</h2>
                    <p className="muted">
                        {formatUsdc(mine.amount)} of yours until {new Date(mine.expiry * 1000).toLocaleString()}{" "}
                        — not the whole pot.
                    </p>
                    <label htmlFor="pay-handle">Pay solver from your live stake only</label>
                    <select value={payNet} onChange={(e) => setPayNet(e.target.value as Network)}>
                        <option value="x">X</option>
                        <option value="threads">Threads</option>
                    </select>
                    <input
                        id="pay-handle"
                        value={payHandle}
                        onChange={(e) => setPayHandle(e.target.value)}
                        placeholder="@handle"
                    />
                    <p>
                        <button
                            type="button"
                            disabled={!payHandle.trim()}
                            onClick={() =>
                                onPay(payNet, payHandle.trim().replace(/^@/, "").toLowerCase())
                            }
                        >
                            Pay (1.5% fee)
                        </button>
                        <button type="button" className="ghost" onClick={onEarly}>
                            Withdraw early (10%)
                        </button>
                        <button type="button" className="ghost" onClick={onExpiry}>
                            Withdraw after expiry (5%)
                        </button>
                    </p>
                </>
            )}
        </section>
    );
}
