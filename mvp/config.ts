export const PAY_FEE_BPS = 150;
export const EARLY_FEE_BPS = 1000;
export const EXPIRY_FEE_BPS = 500;
export const MIN_STAKE_USDC = 1;
export const USDC_DECIMALS = 6;
export const MIN_STAKE_UNITS = BigInt(1_000_000);

export const COINBASE = {
    base: {
        schema: "0x1801901fabd0e6189356b4fb52bb0ab855276d84f7ec140839fbd1f6801ca065" as const,
        indexer: "0x2c7eE1E5f416dfF40054c27A62f7B357C4E8619C" as const,
        attester: "0x357458739F90461b99789350868CD7CF330Dd7EE" as const,
        usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const,
    },
    "base-sepolia": {
        schema: "0xef54ae90f47a187acc050ce631c55584fd4273c0ca9456ab21750921c3a84028" as const,
        indexer: "0xd147a19c3B085Fb9B0c15D2EAAFC6CB086ea849B" as const,
        attester: "0xB5644397a9733f86Cacd928478B29b4cD6041C45" as const,
        usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const,
    },
} as const;

export type ChainName = keyof typeof COINBASE;

function env(name: string): string {
    return (process.env[name] ?? "").trim();
}

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

export function apiUrl(): string {
    return env("NEXT_PUBLIC_API_URL").replace(/\/+$/, "");
}

export function siteUrl(): string {
    return env("NEXT_PUBLIC_SITE_URL") || "https://votemap.net";
}

export function missingEnv(): string | null {
    const need: string[] = [];
    if (!chainName()) need.push("NEXT_PUBLIC_VOTEMAP_CHAIN (base | base-sepolia)");
    if (!contractAddress()) need.push("NEXT_PUBLIC_VOTEMAP_CONTRACT");
    return need.length ? `Set ${need.join(" and ")}.` : null;
}

export function rpcUrl(): string {
    return env("NEXT_PUBLIC_BASE_RPC") || (chainName() === "base" ? "https://mainnet.base.org" : "https://sepolia.base.org");
}

export function explorerHost(): string {
    return chainName() === "base" ? "https://basescan.org" : "https://sepolia.basescan.org";
}

export function txUrl(hash: string): string {
    return `${explorerHost()}/tx/${hash}`;
}

export function addressUrl(addr: string): string {
    return `${explorerHost()}/address/${addr}`;
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

export function isoBytes(code: string): `0x${string}` {
    const c = code.trim().toUpperCase().slice(0, 2);
    const a = c.charCodeAt(0).toString(16).padStart(2, "0");
    const b = c.charCodeAt(1).toString(16).padStart(2, "0");
    return `0x${a}${b}`;
}

export function isoFromBytes(hex: string): string {
    const h = hex.replace(/^0x/, "").padEnd(4, "0").slice(0, 4);
    const a = Number.parseInt(h.slice(0, 2), 16);
    const b = Number.parseInt(h.slice(2, 4), 16);
    if (!a || !b) return "";
    return String.fromCharCode(a, b);
}
