import { base, baseSepolia } from "viem/chains";
import type { Chain } from "viem";

/** Replace at deploy. Not a real treasury. */
export const PLACEHOLDER_TREASURY =
    "0x0000000000000000000000000000000000000001" as const;

/** Circle native USDC (not bridged USDbC). */
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const USDC_BASE_SEPOLIA =
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

export const COINBASE_INDEXER_BASE =
    "0x2c7eE1E5f416dfF40054c27A62f7B357C4E8619C" as const;
export const COINBASE_INDEXER_BASE_SEPOLIA =
    "0xd147a19c3B085Fb9B0c15D2EAAFC6CB086ea849B" as const;
export const EAS_OP_PREDEPLOY =
    "0x4200000000000000000000000000000000000021" as const;

/** Verified Country (ISO 3166-1 alpha-2). */
export const SCHEMA_VERIFIED_COUNTRY_BASE =
    "0x1801901fabd0e6189356b4fb52bb0ab855276d84f7ec140839fbd1f6801ca065" as const;
export const SCHEMA_VERIFIED_COUNTRY_SEPOLIA =
    "0xef54ae90f47a187acc050ce631c55584fd4273c0ca9456ab21750921c3a84028" as const;

export type ChainMode = "mock" | "base-sepolia" | "base";

function env(name: string): string {
    const v = process.env[name];
    return v?.trim() ?? "";
}

export function chainMode(): ChainMode {
    const explicit = env("NEXT_PUBLIC_VOTEMAP_CHAIN").toLowerCase();
    if (explicit === "mock") return "mock";
    if (explicit === "base") return "base";
    if (explicit === "base-sepolia" || explicit === "sepolia") return "base-sepolia";
    if (!env("NEXT_PUBLIC_VOTEMAP_CONTRACT")) return "mock";
    return "base-sepolia";
}

export function isMock(): boolean {
    return chainMode() === "mock";
}

export function viemChain(): Chain {
    return chainMode() === "base" ? base : baseSepolia;
}

export function chainId(): number {
    return viemChain().id;
}

export function publicRpc(): string {
    const override = env("NEXT_PUBLIC_BASE_RPC");
    if (override) return override;
    return chainMode() === "base"
        ? "https://mainnet.base.org"
        : "https://sepolia.base.org";
}

export function contractAddress(): `0x${string}` | null {
    const a = env("NEXT_PUBLIC_VOTEMAP_CONTRACT");
    return a && a.startsWith("0x") ? (a as `0x${string}`) : null;
}

export function usdcAddress(): `0x${string}` {
    const a = env("NEXT_PUBLIC_USDC_ADDRESS");
    if (a && a.startsWith("0x")) return a as `0x${string}`;
    return chainMode() === "base" ? USDC_BASE : USDC_BASE_SEPOLIA;
}

export function treasuryAddress(): `0x${string}` {
    const a = env("NEXT_PUBLIC_TREASURY_ADDRESS");
    if (a && a.startsWith("0x")) return a as `0x${string}`;
    return PLACEHOLDER_TREASURY;
}

export function oauthCallbackUrl(): string {
    return env("NEXT_PUBLIC_OAUTH_CALLBACK_URL");
}

export function xConfigured(): boolean {
    return Boolean(env("NEXT_PUBLIC_X_CLIENT_ID"));
}

export function threadsConfigured(): boolean {
    return Boolean(env("NEXT_PUBLIC_THREADS_CLIENT_ID"));
}

export function explorerBase(): string {
    return chainMode() === "base"
        ? "https://basescan.org"
        : "https://sepolia.basescan.org";
}

export function txUrl(hash: string): string {
    return `${explorerBase()}/tx/${hash}`;
}

export function addressUrl(addr: string): string {
    return `${explorerBase()}/address/${addr}`;
}

export function coinbaseIndexer(): `0x${string}` {
    return chainMode() === "base"
        ? COINBASE_INDEXER_BASE
        : COINBASE_INDEXER_BASE_SEPOLIA;
}

export function verifiedCountrySchema(): `0x${string}` {
    return chainMode() === "base"
        ? SCHEMA_VERIFIED_COUNTRY_BASE
        : SCHEMA_VERIFIED_COUNTRY_SEPOLIA;
}
