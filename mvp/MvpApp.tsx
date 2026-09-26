"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { getAddress } from "viem";
import { getApi } from "./lib/client";
import {
    chainMode,
    contractAddress,
    isMock,
    oauthCallbackUrl,
    threadsConfigured,
    treasuryAddress,
    txUrl,
    addressUrl,
    xConfigured,
} from "./lib/config";
import { EARLY_FEE_BPS, EXPIRY_FEE_BPS, MIN_STAKE_USDC, PAY_FEE_BPS } from "./lib/fees";
import { MOCK_WALLETS } from "./lib/mock";
import { oauthStartUrl, readBindQuery } from "./lib/oauth";
import {
    checkResidence,
    mockResidenceOnThisChain,
    setMockResidence,
} from "./lib/residence";
import type { Handles, Issue, Network, TxResult } from "./lib/types";
import { parsePostUrl } from "./lib/urls";
import { formatUsdc, parseUsdc } from "./lib/usdc";
import { PostEmbed } from "./PostEmbed";
import "./mvp.css";
import "react-tweet/theme.css";

function short(addr: string) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function defaultExpiryInput() {
    const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    d.setSeconds(0, 0);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function MvpApp() {
    const router = useRouter();
    const params = useSearchParams();
    const rawIssueUrl = params.get("url");
    const issueUrl = rawIssueUrl ? parsePostUrl(rawIssueUrl)?.canonical ?? rawIssueUrl : null;
    const { resolvedTheme, setTheme } = useTheme();

    const [wallet, setWallet] = useState<string | null>(isMock() ? MOCK_WALLETS[0].address : null);
    const [handles, setHandles] = useState<Handles>({ x: "", threads: "" });
    const [residence, setResidence] = useState<{ ok: boolean; country: string | null } | null>(null);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [issue, setIssue] = useState<Issue | null>(null);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState("");
    const [lastTx, setLastTx] = useState<TxResult | null>(null);
    const [mounted, setMounted] = useState(false);
    const bindOnce = useState({ done: false })[0];

    const api = useMemo(() => getApi(), []);
    const mode = chainMode();
    const hasOauth = Boolean(handles.x || handles.threads);
    const gated = Boolean(wallet && residence?.ok && hasOauth);

    async function refresh(w = wallet) {
        if (!w) return;
        const [h, r] = await Promise.all([api.handlesOf(w), checkResidence(w)]);
        setHandles(h);
        setResidence({ ok: r.ok, country: r.country });
        if (issueUrl) setIssue(await api.getIssue(issueUrl));
        else setIssues(await api.listIssues());
    }

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        refresh().catch((e) => setErr(String((e as Error).message || e)));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- load when url or wallet changes
    }, [wallet, issueUrl]);

    useEffect(() => {
        if (!wallet || typeof window === "undefined") return;
        const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const bind = readBindQuery(fromHash) || readBindQuery(new URLSearchParams(window.location.search));
        if (!bind) return;
        const stated = fromHash.get("bind_wallet") || params.get("bind_wallet");
        if (stated && getAddress(stated) !== getAddress(wallet)) {
            setErr(`OAuth was started with ${short(stated)}. Switch to that wallet.`);
            return;
        }
        if (bindOnce.done) return;
        // Clear hash before the async bind so React Strict Mode cannot double-submit.
        bindOnce.done = true;
        window.history.replaceState(null, "", "/mvp");
        (async () => {
            try {
                setBusy("Binding handle on chain…");
                const tx = await api.bindHandle(bind, wallet);
                setLastTx(tx);
                router.replace("/mvp");
                await refresh(wallet);
            } catch (e) {
                bindOnce.done = false;
                setErr(String((e as Error).message || e));
            } finally {
                setBusy("");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet]);

    useEffect(() => {
        if (isMock() || !window.ethereum?.on) return;
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

    async function run(label: string, fn: () => Promise<TxResult | void>) {
        setErr("");
        setBusy(label);
        try {
            const tx = await fn();
            if (tx) setLastTx(tx);
            await refresh();
        } catch (e) {
            setErr(String((e as Error).message || e));
        } finally {
            setBusy("");
        }
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
                {mode === "mock" && "Mock mode (no contract). Click-through uses local storage — not Base."}
                {mode === "base-sepolia" && (
                    <>
                        Base Sepolia. Factory{" "}
                        {contractAddress() ? (
                            <a href={addressUrl(contractAddress()!)} target="_blank" rel="noreferrer">
                                {short(contractAddress()!)}
                            </a>
                        ) : (
                            "(set NEXT_PUBLIC_VOTEMAP_CONTRACT)"
                        )}
                        . Residence is mocked on testnet.
                    </>
                )}
                {mode === "base" && "Base mainnet. Coinbase residence is checked on chain."} Treasury{" "}
                <code>{short(treasuryAddress())}</code> (placeholder unless you set it).
            </p>

            <WalletSection
                wallet={wallet}
                onMock={setWallet}
                onConnect={connect}
                handles={handles}
                residence={residence}
                onMockResidence={() => {
                    if (!wallet) return;
                    setMockResidence(wallet, "US");
                    refresh();
                }}
                onMockOauth={(network, handle) =>
                    run("bind", () =>
                        api.bindHandle(
                            { network, handle, deadline: 0, signature: "0x" },
                            wallet!,
                        ),
                    )
                }
            />

            {err && <p className="err">{err}</p>}
            {busy && <p className="muted">{busy}</p>}
            {lastTx && (
                <p className="muted">
                    last tx:{" "}
                    {lastTx.mock ? (
                        <code>{lastTx.hash.slice(0, 18)}… (mock)</code>
                    ) : (
                        <a href={txUrl(lastTx.hash)} target="_blank" rel="noreferrer">
                            Basescan
                        </a>
                    )}
                </p>
            )}

            {!gated && wallet && (
                <p className="muted">
                    Connect Coinbase residence and at least one of X / Threads before staking. You can
                    stake on either network&apos;s posts regardless of which account you linked. Pay
                    only goes to handles that OAuth&apos;d here.
                </p>
            )}

            {issueUrl ? (
                <IssuePanel
                    issue={issue}
                    wallet={wallet}
                    gated={gated}
                    onBack={() => router.push("/mvp")}
                    onPay={(network, handle) =>
                        run("pay", () => api.paySolver(issueUrl, network, handle, wallet!))
                    }
                    onEarly={() => run("withdraw", () => api.withdrawEarly(issueUrl, wallet!))}
                    onExpiry={() => run("withdraw", () => api.withdrawExpired(issueUrl, wallet!))}
                />
            ) : (
                <HomePanel
                    issues={issues}
                    gated={gated}
                    onOpen={(url) => router.push(`/mvp?url=${encodeURIComponent(url)}`)}
                    onStake={(url, expiry, amount) =>
                        run("stake", async () => {
                            const tx = await api.stake(url, expiry, amount, wallet!);
                            router.push(`/mvp?url=${encodeURIComponent(url)}`);
                            return tx;
                        })
                    }
                />
            )}
        </div>
    );
}

function WalletSection({
    wallet,
    onMock,
    onConnect,
    handles,
    residence,
    onMockResidence,
    onMockOauth,
}: {
    wallet: string | null;
    onMock: (a: string) => void;
    onConnect: () => void;
    handles: Handles;
    residence: { ok: boolean; country: string | null } | null;
    onMockResidence: () => void;
    onMockOauth: (network: Network, handle: string) => void;
}) {
    const [mockHandle, setMockHandle] = useState("alice");
    const [mockNet, setMockNet] = useState<Network>("x");

    return (
        <section>
            <h2>1. Wallet, residence, OAuth</h2>
            {isMock() ? (
                <p>
                    <label htmlFor="mock-wallet">Mock wallet</label>
                    <select
                        id="mock-wallet"
                        value={wallet ?? ""}
                        onChange={(e) => onMock(e.target.value)}
                    >
                        {MOCK_WALLETS.map((w) => (
                            <option key={w.address} value={w.address}>
                                {w.label} ({short(w.address)})
                            </option>
                        ))}
                    </select>
                </p>
            ) : wallet ? (
                <p>
                    {short(wallet)}{" "}
                    <a href={addressUrl(wallet)} target="_blank" rel="noreferrer">
                        Basescan
                    </a>
                </p>
            ) : (
                <button type="button" onClick={onConnect}>
                    Connect wallet
                </button>
            )}

            {wallet && (
                <>
                    <p className="muted">
                        Residence:{" "}
                        {residence?.ok
                            ? `ok${residence.country ? ` (${residence.country})` : ""}`
                            : "required"}
                        {mockResidenceOnThisChain() && !residence?.ok && (
                            <>
                                {" "}
                                <button type="button" className="ghost" onClick={onMockResidence}>
                                    Mock Coinbase residence
                                </button>
                            </>
                        )}
                        {!mockResidenceOnThisChain() && !residence?.ok && (
                            <>
                                {" "}
                                Claim{" "}
                                <a
                                    href="https://www.coinbase.com/onchain-verify"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Coinbase Verified Country
                                </a>{" "}
                                on this wallet.
                            </>
                        )}
                    </p>
                    <p className="muted">
                        Linked: {handles.x ? `X @${handles.x}` : "no X"} ·{" "}
                        {handles.threads ? `Threads @${handles.threads}` : "no Threads"}
                    </p>
                    <p>
                        {(xConfigured() || oauthCallbackUrl()) && (
                            <button
                                type="button"
                                className="ghost"
                                onClick={() => {
                                    window.location.href = oauthStartUrl("x", wallet);
                                }}
                                disabled={!oauthCallbackUrl()}
                            >
                                Connect X
                            </button>
                        )}
                        {(threadsConfigured() || oauthCallbackUrl()) && (
                            <button
                                type="button"
                                className="ghost"
                                onClick={() => {
                                    window.location.href = oauthStartUrl("threads", wallet);
                                }}
                                disabled={!oauthCallbackUrl()}
                            >
                                Connect Threads
                            </button>
                        )}
                    </p>
                    {isMock() && (
                        <p>
                            <label htmlFor="mock-handle">Mock OAuth handle</label>
                            <select
                                value={mockNet}
                                onChange={(e) => setMockNet(e.target.value as Network)}
                            >
                                <option value="x">X</option>
                                <option value="threads">Threads</option>
                            </select>
                            <input
                                id="mock-handle"
                                value={mockHandle}
                                onChange={(e) => setMockHandle(e.target.value)}
                                placeholder="handle"
                            />
                            <button
                                type="button"
                                disabled={!mockHandle.trim()}
                                onClick={() => onMockOauth(mockNet, mockHandle.trim().replace(/^@/, "").toLowerCase())}
                            >
                                Bind mock handle
                            </button>
                        </p>
                    )}
                </>
            )}
        </section>
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
    const [expiry, setExpiry] = useState(defaultExpiryInput);
    const [formErr, setFormErr] = useState("");
    const parsed = parsePostUrl(url);

    return (
        <>
            <section>
                <h2>2. Stake on a post</h2>
                <p className="muted">
                    Issue key = canonical X or Threads URL. First {MIN_STAKE_USDC} USDC creates it;
                    the same URL joins. You must set your own expiry. Pay solver {PAY_FEE_BPS / 100}%
                    fee · early out {EARLY_FEE_BPS / 100}% · expiry {EXPIRY_FEE_BPS / 100}%. Gas is
                    extra ETH on Base, paid by you.
                </p>
                <label htmlFor="post-url">X or Threads post URL</label>
                <input
                    id="post-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://x.com/…/status/… or https://www.threads.net/@…/post/…"
                />
                {formErr && <p className="err">{formErr}</p>}
                {url && !parsed && <p className="err">Not a recognized X or Threads post URL.</p>}
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
                    <p className="muted">None yet. Stake on a post URL to create one. (Nothing is seeded.)</p>
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
                                <div className="muted">{formatUsdc(i.total)} USDC staked</div>
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
            <p className="muted">Total {formatUsdc(issue.total)} USDC</p>
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
                                {isMock() ? (
                                    short(s.wallet)
                                ) : (
                                    <a href={addressUrl(s.wallet)} target="_blank" rel="noreferrer">
                                        {short(s.wallet)}
                                    </a>
                                )}
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
                        {formatUsdc(mine.amount)} until {new Date(mine.expiry * 1000).toLocaleString()}
                    </p>
                    <label htmlFor="pay-handle">Pay solver (must have OAuth&apos;d here)</label>
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
