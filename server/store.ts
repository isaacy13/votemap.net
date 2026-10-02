import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { potHash } from "../mvp/issueId";
import {
    SOCIAL_NETS,
    asPublicLinks,
    httpsHref,
    isSocialNet,
    socialLabel,
    socialProfileUrl,
    type Binds,
    type ProfileLink,
    type PublicCard,
} from "../mvp/profile";

export type Wallet = { address: string; linkedAt: number };

export type User = {
    id: string;
    provider: "google" | "apple";
    sub: string;
    email: string;
    name: string;
    gender: number | null;
    birthYear: number | null;
    phone: string | null;
    phoneVerified: boolean;
    handle: string | null;
    payout: string | null;
    wallets: Wallet[];
    socials: { x: string; threads: string; instagram: string; tiktok: string };
    /** Bio binds — not the public link list. Hiding a link does not remove these. */
    binds: Binds;
    /** Public page rows. Pay lookup does not read this. */
    links: ProfileLink[];
    device: { pubkey: string; platform: string; at: number } | null;
    createdAt: number;
};

export type Challenge = { id: string; userId: string; bytes: string; exp: number; used: boolean };

export type Otp = { phone: string; userId: string; hash: string; exp: number };

export type SnapRow = {
    network: string;
    postId: string;
    canonical: string;
    issueId: string;
    originalUrl: string;
    handle: string | null;
    postedAt: number | null;
    text?: string;
    name?: string;
    mediaUrl?: string;
    avatarUrl?: string;
    at: number;
};

export type IndexQuery = {
    limit?: number;
    before?: number;
    network?: string;
    handle?: string;
};

const INDEX_CAP = 50;

function normHandle(h: string | null | undefined): string {
    return (h || "").replace(/^@/, "").toLowerCase();
}

function withPot(row: SnapRow): SnapRow {
    return { ...row, issueId: row.issueId || potHash(row.canonical) };
}

function bad(message: string, status = 400): never {
    throw Object.assign(new Error(message), { status });
}

/** Fill missing profile fields. Re-attach bind slots; omitted slots come back hidden — bind stays. */
export function withProfile(u: User): User {
    if (!u.binds) u.binds = {};
    if (!Array.isArray(u.links)) u.links = [];
    for (const net of SOCIAL_NETS) {
        const b = u.binds[net];
        if (!b?.handle) continue;
        const url = socialProfileUrl(net, b.handle);
        const existing = u.links.find((l) => l.bindNetwork === net);
        if (existing) {
            existing.url = url;
            continue;
        }
        u.links.push({
            id: `bind-${net}`,
            label: socialLabel(net),
            url,
            order: u.links.length,
            hidden: false,
            bindNetwork: net,
        });
    }
    return u;
}

export function applyLinkPatch(u: User, raw: unknown): void {
    withProfile(u);
    if (!Array.isArray(raw)) bad("links");
    if (raw.length > 20) bad("too many links");
    const next: ProfileLink[] = [];
    const seenBind = new Set<string>();
    for (const row of raw) {
        const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
        const label = String(r.label || "")
            .trim()
            .slice(0, 40);
        if (!label) bad("label");
        const bindNetwork = isSocialNet(r.bindNetwork) ? r.bindNetwork : null;
        const bind = bindNetwork ? u.binds[bindNetwork] : undefined;
        let url: string | null;
        let net = bindNetwork;
        if (net && bind?.handle) {
            if (seenBind.has(net)) bad("duplicate bind slot");
            seenBind.add(net);
            url = socialProfileUrl(net, bind.handle);
        } else {
            net = null;
            url = httpsHref(String(r.url || ""));
        }
        if (!url) bad("https url only");
        const id = typeof r.id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(r.id) ? r.id : randomUUID();
        next.push({
            id,
            label,
            url,
            order: next.length,
            hidden: Boolean(r.hidden),
            bindNetwork: net,
        });
    }
    for (const net of SOCIAL_NETS) {
        const b = u.binds[net];
        if (!b?.handle || seenBind.has(net)) continue;
        next.push({
            id: `bind-${net}`,
            label: socialLabel(net),
            url: socialProfileUrl(net, b.handle),
            order: next.length,
            hidden: true,
            bindNetwork: net,
        });
    }
    u.links = next.map((l, i) => ({ ...l, order: i }));
}

export function publicCard(u: User, now = Date.now()): PublicCard | null {
    const row = withProfile(u);
    if (!row.handle) return null;
    return { handle: row.handle, links: asPublicLinks(row, now) };
}

/** Paged browse index — LIMIT 50. Sort postedAt desc. */
export function selectIndex(rows: SnapRow[], q: IndexQuery = {}): SnapRow[] {
    const limit = Math.min(Math.max(1, Number(q.limit) || INDEX_CAP), INDEX_CAP);
    const network = (q.network || "").toLowerCase();
    const handle = normHandle(q.handle);
    const before = q.before && Number.isFinite(q.before) ? q.before : 0;
    return rows
        .filter((r) => {
            if (network && r.network.toLowerCase() !== network) return false;
            if (handle && normHandle(r.handle) !== handle) return false;
            const t = r.postedAt || r.at;
            if (before && t >= before) return false;
            return true;
        })
        .sort((a, b) => (b.postedAt || b.at) - (a.postedAt || a.at))
        .slice(0, limit)
        .map(withPot);
}

type Db = {
    users: User[];
    challenges: Challenge[];
    otps: Otp[];
    snaps: Record<string, SnapRow>;
};

const path = process.env.VOTEMAP_DATA || new URL("../data/votemap.json", import.meta.url).pathname;

function empty(): Db {
    return { users: [], challenges: [], otps: [], snaps: {} };
}

function load(): Db {
    if (!existsSync(path)) return empty();
    try {
        const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<Db>;
        return { ...empty(), ...parsed, snaps: parsed.snaps || {} };
    } catch {
        return empty();
    }
}

function save(db: Db) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(db), { mode: 0o600 });
}

let queue: Promise<unknown> = Promise.resolve();

function withDb<T>(fn: (db: Db) => T): Promise<T> {
    const run = queue.then(() => {
        const db = load();
        const out = fn(db);
        save(db);
        return out;
    });
    queue = run.catch(() => undefined);
    return run;
}

export function publicUser(u: User) {
    const row = withProfile(u);
    return {
        id: row.id,
        provider: row.provider,
        email: row.email,
        name: row.name,
        gender: row.gender,
        birthYear: row.birthYear,
        phone: row.phone,
        phoneVerified: row.phoneVerified,
        handle: row.handle,
        payout: row.payout,
        wallets: row.wallets,
        socials: row.socials,
        binds: row.binds,
        links: row.links,
        hasDevice: Boolean(row.device),
    };
}

export function upsertOidc(input: {
    provider: "google" | "apple";
    sub: string;
    email: string;
    name: string;
}): Promise<User> {
    return withDb((db) => {
        let u = db.users.find((x) => x.provider === input.provider && x.sub === input.sub);
        if (!u) {
            u = {
                id: randomUUID(),
                provider: input.provider,
                sub: input.sub,
                email: input.email,
                name: input.name,
                gender: null,
                birthYear: null,
                phone: null,
                phoneVerified: false,
                handle: null,
                payout: null,
                wallets: [],
                socials: { x: "", threads: "", instagram: "", tiktok: "" },
                binds: {},
                links: [],
                device: null,
                createdAt: Date.now(),
            };
            db.users.push(u);
        } else {
            u.email = input.email || u.email;
            if (input.name) u.name = input.name;
        }
        return withProfile(u);
    });
}

export function getUser(id: string): Promise<User | undefined> {
    return withDb((db) => {
        const u = db.users.find((x) => x.id === id);
        return u ? withProfile(u) : undefined;
    });
}

export function getUserByHandle(handle: string): Promise<User | undefined> {
    const h = normHandle(handle);
    return withDb((db) => {
        const u = db.users.find((x) => x.handle === h);
        return u ? withProfile(u) : undefined;
    });
}

export function updateUser(id: string, patch: (u: User) => void): Promise<User> {
    return withDb((db) => {
        const u = db.users.find((x) => x.id === id);
        if (!u) throw new Error("no user");
        withProfile(u);
        patch(u);
        return u;
    });
}

export function handleTaken(handle: string, exceptId?: string): Promise<boolean> {
    const h = handle.toLowerCase();
    return withDb((db) => db.users.some((u) => u.handle === h && u.id !== exceptId));
}

export function putChallenge(userId: string, bytes: string, ttlMs = 120_000): Promise<Challenge> {
    return withDb((db) => {
        const now = Date.now();
        db.challenges = db.challenges.filter((c) => c.exp > now && !c.used);
        const c: Challenge = { id: randomUUID(), userId, bytes, exp: now + ttlMs, used: false };
        db.challenges.push(c);
        return c;
    });
}

export function takeChallenge(id: string, userId: string): Promise<Challenge> {
    return withDb((db) => {
        const c = db.challenges.find((x) => x.id === id);
        if (!c || c.userId !== userId || c.used || c.exp < Date.now()) throw new Error("challenge");
        c.used = true;
        return c;
    });
}

export function putOtp(row: Otp): Promise<void> {
    return withDb((db) => {
        db.otps = db.otps.filter((o) => o.exp > Date.now());
        db.otps.push(row);
    });
}

export function getSnap(canonical: string): Promise<SnapRow | undefined> {
    return withDb((db) => {
        const row = db.snaps[canonical];
        return row ? withPot(row) : undefined;
    });
}

/**
 * Write-once under `row.canonical` only. `originalUrl` is never a lookup key.
 * A swapped paste cannot occupy or overwrite another pot's row.
 */
export function applySnapWrite(snaps: Record<string, SnapRow>, row: SnapRow): void {
    const key = row.canonical;
    if (!key) return;
    const next = withPot({ ...row, canonical: key, issueId: potHash(key), originalUrl: key });
    const existing = snaps[key];
    if (!existing) {
        snaps[key] = next;
        return;
    }
    snaps[key] = {
        ...existing,
        canonical: existing.canonical,
        issueId: existing.issueId || next.issueId,
        originalUrl: existing.canonical,
        postId: existing.postId || next.postId,
        network: existing.network || next.network,
        handle: existing.handle || next.handle,
        text: existing.text || next.text,
        name: existing.name || next.name,
        mediaUrl: existing.mediaUrl || next.mediaUrl,
        avatarUrl: existing.avatarUrl || next.avatarUrl,
        postedAt: existing.postedAt ?? next.postedAt,
    };
}

/** Write-once keyed by canonical permalink. A swapped URL cannot occupy another pot's row. */
export function putSnap(row: SnapRow): Promise<void> {
    return withDb((db) => {
        applySnapWrite(db.snaps, row);
    });
}

export function listIndex(q: IndexQuery = {}): Promise<SnapRow[]> {
    return withDb((db) => selectIndex(Object.values(db.snaps), q));
}

export function allSnaps(): Promise<Record<string, SnapRow>> {
    return withDb((db) => {
        const out: Record<string, SnapRow> = {};
        for (const [k, v] of Object.entries(db.snaps)) out[k] = withPot(v);
        return out;
    });
}

export function takeOtp(userId: string, phone: string): Promise<Otp | undefined> {
    return withDb((db) => {
        const i = db.otps.findIndex((o) => o.userId === userId && o.phone === phone && o.exp > Date.now());
        if (i < 0) return undefined;
        const row = db.otps[i];
        db.otps.splice(i, 1);
        return row;
    });
}
