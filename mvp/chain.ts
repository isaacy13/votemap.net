import {
    createPublicClient,
    createWalletClient,
    custom,
    http,
    getAddress,
    type Hex,
    type EIP1193Provider,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import { voteMapAbi, erc20Abi } from "./abi";
import { chainName, contractAddress, rpcUrl, isoFromBytes } from "./config";
import { parsePostUrl, type ParsedPost } from "./urls";

export type StakeRow = {
    wallet: string;
    amount: bigint;
    expiry: number;
    country: string;
    closed: boolean;
};

export type Issue = {
    id: Hex;
    url: string;
    parsed: ParsedPost | null;
    total: bigint;
    live: bigint;
    stakers: StakeRow[];
    byCountry: { country: string; live: bigint }[];
};

function chain() {
    return chainName() === "base" ? base : baseSepolia;
}

export function pub() {
    return createPublicClient({ chain: chain(), transport: http(rpcUrl()) });
}

function factory(): `0x${string}` {
    const a = contractAddress();
    if (!a) throw new Error("NEXT_PUBLIC_VOTEMAP_CONTRACT is not set");
    return a;
}

function provider(): EIP1193Provider {
    if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No wallet in this browser. Link a wallet with an injected provider, or use WalletConnect in the phone app.");
    }
    return window.ethereum;
}

function wallet() {
    return createWalletClient({ chain: chain(), transport: custom(provider()) });
}

export async function switchChain(): Promise<void> {
    const id = `0x${chain().id.toString(16)}`;
    try {
        await provider().request({ method: "wallet_switchEthereumChain", params: [{ chainId: id }] });
    } catch (e: unknown) {
        if ((e as { code?: number }).code !== 4902) throw e;
        const c = chain();
        await provider().request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    chainId: id,
                    chainName: c.name,
                    nativeCurrency: c.nativeCurrency,
                    rpcUrls: [rpcUrl()],
                    blockExplorerUrls: [c.blockExplorers?.default.url].filter(Boolean),
                },
            ],
        });
    }
}

export async function connectedAddress(): Promise<`0x${string}`> {
    await switchChain();
    const accounts = (await provider().request({ method: "eth_requestAccounts" })) as string[];
    if (!accounts?.[0]) throw new Error("wallet rejected");
    return getAddress(accounts[0]);
}

export async function signLinkMessage(userId: string): Promise<{ address: `0x${string}`; message: string; signature: Hex }> {
    const address = await connectedAddress();
    const message = `votemap link ${address} as ${userId} at ${Math.floor(Date.now() / 1000)}`;
    const signature = await wallet().signMessage({ account: address, message });
    return { address, message, signature };
}

async function send(
    account: `0x${string}`,
    address: `0x${string}`,
    abi: typeof voteMapAbi | typeof erc20Abi,
    functionName: string,
    args: unknown[],
): Promise<Hex> {
    const hash = await wallet().writeContract({
        account,
        address,
        abi,
        functionName,
        args,
        chain: chain(),
    } as never);
    await pub().waitForTransactionReceipt({ hash });
    return hash;
}

async function loadIssue(id: Hex, urlHint?: string): Promise<Issue | null> {
    const address = factory();
    const client = pub();
    const url =
        urlHint ||
        ((await client.readContract({ address, abi: voteMapAbi, functionName: "issueUrl", args: [id] })) as string);
    if (!url) return null;
    const total = (await client.readContract({
        address,
        abi: voteMapAbi,
        functionName: "issueTotal",
        args: [id],
    })) as bigint;
    const n = (await client.readContract({
        address,
        abi: voteMapAbi,
        functionName: "stakerCount",
        args: [id],
    })) as bigint;
    const stakers: StakeRow[] = [];
    for (let i = 0; i < Number(n); i++) {
        const row = (await client.readContract({
            address,
            abi: voteMapAbi,
            functionName: "getStakerAt",
            args: [id, BigInt(i)],
        })) as [string, bigint, bigint | number, Hex, boolean];
        stakers.push({
            wallet: getAddress(row[0]),
            amount: row[1],
            expiry: Number(row[2]),
            country: isoFromBytes(row[3]),
            closed: row[4],
        });
    }
    const now = Math.floor(Date.now() / 1000);
    const liveRows = stakers.filter((s) => !s.closed && s.amount > BigInt(0) && s.expiry > now);
    const live = liveRows.reduce((n, s) => n + s.amount, BigInt(0));
    const map = new Map<string, bigint>();
    for (const s of liveRows) map.set(s.country || "—", (map.get(s.country || "—") ?? BigInt(0)) + s.amount);
    const byCountry = [...map.entries()].map(([country, liveAmt]) => ({ country, live: liveAmt }));
    return { id, url, parsed: parsePostUrl(url), total, live, stakers, byCountry };
}

export async function listIssues(): Promise<Issue[]> {
    try {
        const address = factory();
        const client = pub();
        const n = (await client.readContract({ address, abi: voteMapAbi, functionName: "issueCount" })) as bigint;
        const out: Issue[] = [];
        for (let i = 0; i < Number(n); i++) {
            const id = (await client.readContract({
                address,
                abi: voteMapAbi,
                functionName: "issueIds",
                args: [BigInt(i)],
            })) as Hex;
            const issue = await loadIssue(id);
            if (issue) out.push(issue);
        }
        return out;
    } catch {
        return [];
    }
}

export async function getIssue(canonicalUrl: string): Promise<Issue | null> {
    const empty = (): Issue => ({
        id: "0x0000000000000000000000000000000000000000000000000000000000000000",
        url: canonicalUrl,
        parsed: parsePostUrl(canonicalUrl),
        total: BigInt(0),
        live: BigInt(0),
        stakers: [],
        byCountry: [],
    });
    try {
        const address = factory();
        const client = pub();
        const id = (await client.readContract({
            address,
            abi: voteMapAbi,
            functionName: "issueIdOf",
            args: [canonicalUrl],
        })) as Hex;
        const stored = (await client.readContract({
            address,
            abi: voteMapAbi,
            functionName: "issueUrl",
            args: [id],
        })) as string;
        if (!stored) return empty();
        return (await loadIssue(id, stored)) || empty();
    } catch {
        return empty();
    }
}

export async function readTreasury(): Promise<string> {
    return getAddress(
        (await pub().readContract({ address: factory(), abi: voteMapAbi, functionName: "treasury" })) as string,
    );
}

export async function countryAllowed(walletAddr: string): Promise<boolean> {
    return (await pub().readContract({
        address: factory(),
        abi: voteMapAbi,
        functionName: "countryAllowed",
        args: [getAddress(walletAddr)],
    })) as boolean;
}

export async function countryOf(walletAddr: string): Promise<string> {
    const iso = (await pub().readContract({
        address: factory(),
        abi: voteMapAbi,
        functionName: "countryOf",
        args: [getAddress(walletAddr)],
    })) as Hex;
    return isoFromBytes(iso);
}

export async function identityExists(walletAddr: string): Promise<boolean> {
        const row = (await pub().readContract({
        address: factory(),
        abi: voteMapAbi,
        functionName: "identityOf",
        args: [getAddress(walletAddr)],
    })) as readonly unknown[];
    return Boolean(row[7]);
}

export async function nextNonce(walletAddr: string): Promise<bigint> {
    return (await pub().readContract({
        address: factory(),
        abi: voteMapAbi,
        functionName: "nonces",
        args: [getAddress(walletAddr)],
    })) as bigint;
}

export async function issueId(canonicalUrl: string): Promise<Hex> {
    return (await pub().readContract({
        address: factory(),
        abi: voteMapAbi,
        functionName: "issueIdOf",
        args: [canonicalUrl],
    })) as Hex;
}

async function approveUsdc(account: `0x${string}`, amount: bigint): Promise<void> {
    const address = factory();
    const usdc = (await pub().readContract({ address, abi: voteMapAbi, functionName: "usdc" })) as `0x${string}`;
    const allowance = (await pub().readContract({
        address: usdc,
        abi: erc20Abi,
        functionName: "allowance",
        args: [account, address],
    })) as bigint;
    if (allowance < amount) await send(account, usdc, erc20Abi, "approve", [address, amount]);
}

export async function submitStake(opts: {
    canonicalUrl: string;
    expiry: number;
    amount: bigint;
    nonce: bigint;
    deadline: number;
    signature: Hex;
    from: string;
}): Promise<Hex> {
    await switchChain();
    const account = getAddress(opts.from);
    if (!(await countryAllowed(account))) throw new Error("Coinbase Verified Country must be an allowlisted ISO (US in v0)");
    await approveUsdc(account, opts.amount);
    return send(account, factory(), voteMapAbi, "stake", [
        opts.canonicalUrl,
        BigInt(opts.expiry),
        opts.amount,
        opts.nonce,
        BigInt(opts.deadline),
        opts.signature,
    ]);
}

export async function submitPay(opts: {
    canonicalUrl: string;
    solver: `0x${string}`;
    nonce: bigint;
    deadline: number;
    signature: Hex;
    from: string;
}): Promise<Hex> {
    await switchChain();
    const account = getAddress(opts.from);
    return send(account, factory(), voteMapAbi, "pay", [
        await issueId(opts.canonicalUrl),
        getAddress(opts.solver),
        opts.nonce,
        BigInt(opts.deadline),
        opts.signature,
    ]);
}

export async function submitClaim(opts: {
    oidcSubHash: Hex;
    email: string;
    name: string;
    gender: number;
    birthYear: number;
    phoneHash: Hex;
    phoneVerified: boolean;
    nonce: bigint;
    deadline: number;
    signature: Hex;
    from: string;
}): Promise<Hex> {
    await switchChain();
    const account = getAddress(opts.from);
    return send(account, factory(), voteMapAbi, "claim", [
        opts.oidcSubHash,
        opts.email,
        opts.name,
        opts.gender,
        opts.birthYear,
        opts.phoneHash,
        opts.phoneVerified,
        opts.nonce,
        BigInt(opts.deadline),
        opts.signature,
    ]);
}

export async function withdrawEarly(canonicalUrl: string, from: string): Promise<Hex> {
    await switchChain();
    return send(getAddress(from), factory(), voteMapAbi, "withdrawEarly", [await issueId(canonicalUrl)]);
}

export async function withdrawExpired(canonicalUrl: string, from: string): Promise<Hex> {
    await switchChain();
    return send(getAddress(from), factory(), voteMapAbi, "withdrawExpired", [await issueId(canonicalUrl)]);
}
