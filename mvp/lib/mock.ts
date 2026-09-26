import { keccak256, stringToHex, encodePacked, getAddress, zeroAddress } from "viem";
import { parsePostUrl, networkByte, type Network } from "./urls";
import type { Issue, StakeRow, TxResult, VoteMapApi } from "./types";

const KEY = "votemap-mvp-mock-v1";

type StoredStake = { wallet: string; amount: string; expiry: number; closed: boolean };

type Store = {
    urls: string[];
    stakes: Record<string, StoredStake[]>;
    totals: Record<string, string>;
    xHandle: Record<string, string>;
    threadsHandle: Record<string, string>;
    walletOfHandle: Record<string, string>;
};

function empty(): Store {
    return {
        urls: [],
        stakes: {},
        totals: {},
        xHandle: {},
        threadsHandle: {},
        walletOfHandle: {},
    };
}

function load(): Store {
    if (typeof window === "undefined") return empty();
    try {
        const raw = window.localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as Store) : empty();
    } catch {
        return empty();
    }
}

function save(s: Store) {
    window.localStorage.setItem(KEY, JSON.stringify(s));
}

function fakeTx(): TxResult {
    const n = crypto.getRandomValues(new Uint8Array(32));
    const hash = `0x${Array.from(n, (b) => b.toString(16).padStart(2, "0")).join("")}`;
    return { hash, mock: true };
}

export function issueIdOf(url: string): `0x${string}` {
    return keccak256(stringToHex(url));
}

export function handleKey(network: Network, handle: string): `0x${string}` {
    const inner = keccak256(stringToHex(handle));
    return keccak256(encodePacked(["uint8", "bytes32"], [networkByte(network), inner]));
}

function toIssue(url: string, s: Store): Issue {
    const id = issueIdOf(url);
    const stakers: StakeRow[] = (s.stakes[id] ?? []).map((row) => ({
        wallet: row.wallet,
        amount: BigInt(row.amount),
        expiry: row.expiry,
        closed: row.closed,
    }));
    return {
        id,
        url,
        parsed: parsePostUrl(url),
        total: BigInt(s.totals[id] ?? "0"),
        stakers,
    };
}

export function createMockApi(): VoteMapApi {
    return {
        async listIssues() {
            const s = load();
            return s.urls.map((u) => toIssue(u, s));
        },
        async getIssue(canonicalUrl) {
            const s = load();
            if (!s.urls.includes(canonicalUrl)) return null;
            return toIssue(canonicalUrl, s);
        },
        async handlesOf(wallet) {
            const s = load();
            const w = getAddress(wallet);
            return { x: s.xHandle[w] ?? "", threads: s.threadsHandle[w] ?? "" };
        },
        async walletOfHandle(network, handle) {
            const s = load();
            const w = s.walletOfHandle[handleKey(network, handle)];
            return w && w !== zeroAddress ? w : null;
        },
        async stake(canonicalUrl, expiry, amount, from) {
            const s = load();
            const id = issueIdOf(canonicalUrl);
            const wallet = getAddress(from);
            if (!s.xHandle[wallet] && !s.threadsHandle[wallet]) {
                throw new Error("link X or Threads first");
            }
            if (!s.urls.includes(canonicalUrl)) s.urls.push(canonicalUrl);
            const rows = s.stakes[id] ?? [];
            const open = rows.find((r) => r.wallet === wallet && !r.closed && BigInt(r.amount) > BigInt(0));
            if (open) throw new Error("already staked on this URL");
            rows.push({ wallet, amount: amount.toString(), expiry, closed: false });
            s.stakes[id] = rows;
            s.totals[id] = (BigInt(s.totals[id] ?? "0") + amount).toString();
            save(s);
            return fakeTx();
        },
        async paySolver(canonicalUrl, network, handle, from) {
            const s = load();
            if (!s.walletOfHandle[handleKey(network, handle)]) {
                throw new Error("handle never OAuth'd on votemap");
            }
            closeStake(s, canonicalUrl, from);
            save(s);
            return fakeTx();
        },
        async withdrawEarly(canonicalUrl, from) {
            const s = load();
            const row = openStake(s, canonicalUrl, from);
            if (Date.now() / 1000 >= row.expiry) throw new Error("already expired — use expiry withdraw");
            closeStake(s, canonicalUrl, from);
            save(s);
            return fakeTx();
        },
        async withdrawExpired(canonicalUrl, from) {
            const s = load();
            const row = openStake(s, canonicalUrl, from);
            if (Date.now() / 1000 < row.expiry) throw new Error("not expired yet");
            closeStake(s, canonicalUrl, from);
            save(s);
            return fakeTx();
        },
        async bindHandle(attestation, from) {
            const s = load();
            const wallet = getAddress(from);
            const handle = attestation.handle.trim().replace(/^@/, "").toLowerCase();
            if (!handle) throw new Error("handle required");
            const key = handleKey(attestation.network, handle);
            const existing = s.walletOfHandle[key];
            if (existing && existing !== wallet) throw new Error("handle already bound");
            const map = attestation.network === "x" ? s.xHandle : s.threadsHandle;
            const prev = map[wallet];
            if (prev) delete s.walletOfHandle[handleKey(attestation.network, prev)];
            map[wallet] = handle;
            s.walletOfHandle[key] = wallet;
            save(s);
            return fakeTx();
        },
        async usdcBalance() {
            return BigInt(1_000_000_000);
        },
    };
}

function openStake(s: Store, url: string, from: string): StoredStake {
    const id = issueIdOf(url);
    const wallet = getAddress(from);
    const row = (s.stakes[id] ?? []).find((r) => r.wallet === wallet && !r.closed && BigInt(r.amount) > BigInt(0));
    if (!row) throw new Error("no stake");
    return row;
}

function closeStake(s: Store, url: string, from: string) {
    const row = openStake(s, url, from);
    const amt = BigInt(row.amount);
    const id = issueIdOf(url);
    row.closed = true;
    row.amount = "0";
    s.totals[id] = (BigInt(s.totals[id] ?? "0") - amt).toString();
}

export const MOCK_WALLETS = [
    { label: "Wallet A", address: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa" },
    { label: "Wallet B", address: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB" },
] as const;
