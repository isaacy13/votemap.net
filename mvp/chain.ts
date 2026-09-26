import {
    createPublicClient,
    createWalletClient,
    custom,
    http,
    getAddress,
    parseAbi,
    type Hex,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import { networkByte, parsePostUrl, type Network, type ParsedPost } from "./urls";

export type { Network, ParsedPost };

export const PAY_FEE_BPS = 150;
export const EARLY_FEE_BPS = 1000;
export const EXPIRY_FEE_BPS = 500;
export const MIN_STAKE_USDC = 1;
const USDC_DECIMALS = 6;
const MIN_STAKE_UNITS = BigInt(1_000_000);

const abi = parseAbi([
    "function usdc() view returns (address)",
    "function treasury() view returns (address)",
    "function issueCount() view returns (uint256)",
    "function issueIds(uint256) view returns (bytes32)",
    "function issueUrl(bytes32) view returns (string)",
    "function issueTotal(bytes32) view returns (uint256)",
    "function stakerCount(bytes32 id) view returns (uint256)",
    "function getStakerAt(bytes32 id, uint256 i) view returns (address wallet, uint256 amount, uint64 expiry, bool closed)",
    "function handlesOf(address wallet) view returns (string x, string threads)",
    "function issueIdOf(string url) pure returns (bytes32)",
    "function registerHandle(uint8 network, string handle)",
    "function stake(string url, uint64 expiry, uint256 amount)",
    "function paySolver(bytes32 id, uint8 network, string handle)",
    "function withdrawEarly(bytes32 id)",
    "function withdrawExpired(bytes32 id)",
]);

const erc20 = parseAbi([
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
]);

function env(name: string): string {
    return (process.env[name] ?? "").trim();
}

export type ChainName = "base" | "base-sepolia";

export function chainName(): ChainName | null {
    const v = env("NEXT_PUBLIC_VOTEMAP_CHAIN").toLowerCase();
    if (v === "base") return "base";
    if (v === "base-sepolia" || v === "sepolia") return "base-sepolia";
    return null;
}

export function contractAddress(): `0x${string}` | null {
    const a = env("NEXT_PUBLIC_VOTEMAP_CONTRACT");
    return a.startsWith("0x") && a.length === 42 ? (a as `0x${string}`) : null;
}

export function oauthCallbackUrl(): string {
    return env("NEXT_PUBLIC_OAUTH_CALLBACK_URL");
}

export function missingEnv(): string | null {
    const need = [];
    if (!chainName()) need.push("NEXT_PUBLIC_VOTEMAP_CHAIN (base | base-sepolia)");
    if (!contractAddress()) need.push("NEXT_PUBLIC_VOTEMAP_CONTRACT");
    return need.length ? `Set ${need.join(" and ")}.` : null;
}

function chain() {
    return chainName() === "base" ? base : baseSepolia;
}

function rpc(): string {
    return env("NEXT_PUBLIC_BASE_RPC") || (chainName() === "base" ? "https://mainnet.base.org" : "https://sepolia.base.org");
}

function explorer(): string {
    return chainName() === "base" ? "https://basescan.org" : "https://sepolia.basescan.org";
}

export function txUrl(hash: string): string {
    return `${explorer()}/tx/${hash}`;
}

export function addressUrl(addr: string): string {
    return `${explorer()}/address/${addr}`;
}

export function oauthStartUrl(network: Network, wallet: string): string {
    const baseUrl = oauthCallbackUrl();
    if (!baseUrl) throw new Error("NEXT_PUBLIC_OAUTH_CALLBACK_URL is not set");
    const u = new URL(baseUrl);
    u.searchParams.set("action", "start");
    u.searchParams.set("network", network);
    u.searchParams.set("wallet", wallet);
    return u.toString();
}

export function parseUsdc(input: string): bigint {
    const t = input.trim();
    if (!t || !/^\d+(\.\d+)?$/.test(t)) throw new Error("amount must be a number");
    const [whole, frac = ""] = t.split(".");
    if (frac.length > USDC_DECIMALS) throw new Error("USDC has 6 decimals");
    const fracPad = (frac + "000000").slice(0, USDC_DECIMALS);
    return BigInt(whole) * BigInt(10) ** BigInt(USDC_DECIMALS) + BigInt(fracPad);
}

export function formatUsdc(amount: bigint): string {
    const whole = amount / MIN_STAKE_UNITS;
    const frac = (amount % MIN_STAKE_UNITS).toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
    return `${whole.toString()}${frac ? `.${frac}` : ""}`;
}

export type StakeRow = {
    wallet: string;
    amount: bigint;
    expiry: number;
    closed: boolean;
};

export type Issue = {
    id: `0x${string}`;
    url: string;
    parsed: ParsedPost | null;
    total: bigint;
    stakers: StakeRow[];
};

function eth() {
    if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No injected wallet. Install Coinbase Wallet or MetaMask.");
    }
    return window.ethereum;
}

function pub() {
    return createPublicClient({ chain: chain(), transport: http(rpc()) });
}

function wallet() {
    return createWalletClient({ chain: chain(), transport: custom(eth()) });
}

function factory(): `0x${string}` {
    const a = contractAddress();
    if (!a) throw new Error("NEXT_PUBLIC_VOTEMAP_CONTRACT is not set");
    return a;
}

async function send(account: `0x${string}`, address: `0x${string}`, abiArg: typeof abi | typeof erc20, functionName: string, args: unknown[]): Promise<string> {
    const hash = await wallet().writeContract({
        account,
        address,
        abi: abiArg,
        functionName,
        args,
        chain: chain(),
    } as never);
    await pub().waitForTransactionReceipt({ hash });
    return hash;
}

export async function switchChain(): Promise<void> {
    const id = `0x${chain().id.toString(16)}`;
    try {
        await eth().request({ method: "wallet_switchEthereumChain", params: [{ chainId: id }] });
    } catch (e: unknown) {
        if ((e as { code?: number }).code !== 4902) throw e;
        const c = chain();
        await eth().request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    chainId: id,
                    chainName: c.name,
                    nativeCurrency: c.nativeCurrency,
                    rpcUrls: [rpc()],
                    blockExplorerUrls: [c.blockExplorers?.default.url].filter(Boolean),
                },
            ],
        });
    }
}

async function loadIssue(id: Hex, urlHint?: string): Promise<Issue | null> {
    const address = factory();
    const url =
        urlHint ||
        ((await pub().readContract({ address, abi, functionName: "issueUrl", args: [id] })) as string);
    if (!url) return null;
    const total = (await pub().readContract({ address, abi, functionName: "issueTotal", args: [id] })) as bigint;
    const n = (await pub().readContract({ address, abi, functionName: "stakerCount", args: [id] })) as bigint;
    const stakers: StakeRow[] = [];
    for (let i = 0; i < Number(n); i++) {
        const row = (await pub().readContract({
            address,
            abi,
            functionName: "getStakerAt",
            args: [id, BigInt(i)],
        })) as [string, bigint, bigint | number, boolean];
        stakers.push({
            wallet: getAddress(row[0]),
            amount: row[1],
            expiry: Number(row[2]),
            closed: row[3],
        });
    }
    return { id, url, parsed: parsePostUrl(url), total, stakers };
}

export async function readTreasury(): Promise<string> {
    return getAddress((await pub().readContract({ address: factory(), abi, functionName: "treasury" })) as string);
}

export async function listIssues(): Promise<Issue[]> {
    const address = factory();
    const n = (await pub().readContract({ address, abi, functionName: "issueCount" })) as bigint;
    const out: Issue[] = [];
    for (let i = 0; i < Number(n); i++) {
        const id = (await pub().readContract({ address, abi, functionName: "issueIds", args: [BigInt(i)] })) as Hex;
        const issue = await loadIssue(id);
        if (issue) out.push(issue);
    }
    return out;
}

export async function getIssue(canonicalUrl: string): Promise<Issue | null> {
    const address = factory();
    const id = (await pub().readContract({ address, abi, functionName: "issueIdOf", args: [canonicalUrl] })) as Hex;
    const stored = (await pub().readContract({ address, abi, functionName: "issueUrl", args: [id] })) as string;
    if (!stored) return null;
    return loadIssue(id, stored);
}

export async function handlesOf(walletAddr: string): Promise<{ x: string; threads: string }> {
    const pair = (await pub().readContract({
        address: factory(),
        abi,
        functionName: "handlesOf",
        args: [getAddress(walletAddr)],
    })) as [string, string];
    return { x: pair[0], threads: pair[1] };
}

export async function registerHandle(network: Network, handle: string, from: string): Promise<string> {
    await switchChain();
    return send(getAddress(from), factory(), abi, "registerHandle", [networkByte(network), handle]);
}

export async function stake(canonicalUrl: string, expiry: number, amount: bigint, from: string): Promise<string> {
    await switchChain();
    const account = getAddress(from);
    const address = factory();
    const usdc = (await pub().readContract({ address, abi, functionName: "usdc" })) as `0x${string}`;
    const allowance = (await pub().readContract({
        address: usdc,
        abi: erc20,
        functionName: "allowance",
        args: [account, address],
    })) as bigint;
    if (allowance < amount) {
        await send(account, usdc, erc20, "approve", [address, amount]);
    }
    return send(account, address, abi, "stake", [canonicalUrl, BigInt(expiry), amount]);
}

async function issueId(canonicalUrl: string): Promise<Hex> {
    return (await pub().readContract({
        address: factory(),
        abi,
        functionName: "issueIdOf",
        args: [canonicalUrl],
    })) as Hex;
}

export async function paySolver(canonicalUrl: string, network: Network, handle: string, from: string): Promise<string> {
    await switchChain();
    return send(getAddress(from), factory(), abi, "paySolver", [
        await issueId(canonicalUrl),
        networkByte(network),
        handle,
    ]);
}

export async function withdrawEarly(canonicalUrl: string, from: string): Promise<string> {
    await switchChain();
    return send(getAddress(from), factory(), abi, "withdrawEarly", [await issueId(canonicalUrl)]);
}

export async function withdrawExpired(canonicalUrl: string, from: string): Promise<string> {
    await switchChain();
    return send(getAddress(from), factory(), abi, "withdrawExpired", [await issueId(canonicalUrl)]);
}
