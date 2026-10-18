import { BAKED_SNAPS, type PostSnap } from "../mvp/postSnap";
import { potHash } from "../mvp/issueId";
import { resolveTikTokShort } from "../mvp/canonicalize";
import { isKeyedPost, isTikTokShort, parsePostUrl, postedAtMs, type KeyedPost } from "../mvp/urls";
import { UA } from "../mvp/safeUrl";
import * as store from "./store";
import type { SnapRow } from "./store";

function fail(status: number, error: string): never {
    throw Object.assign(new Error(error), { status });
}

export async function canonicalizePost(raw: string): Promise<KeyedPost> {
    let parsed = parsePostUrl(raw);
    if (isTikTokShort(parsed)) {
        const permalink = await resolveTikTokShort(raw);
        parsed = parsePostUrl(permalink);
    }
    if (!isKeyedPost(parsed)) fail(400, "X, Threads, Instagram, or TikTok post URL only");
    return parsed;
}

function oembedEndpoint(network: KeyedPost["network"]): URL {
    switch (network) {
        case "x":
            return new URL("https://publish.x.com/oembed");
        case "tiktok":
            return new URL("https://www.tiktok.com/oembed");
        case "threads":
            return new URL("https://graph.threads.net/oembed");
        default:
            return new URL("https://www.instagram.com/oembed");
    }
}

const X_ID = /^\d{5,32}$/;
const TT_ID = /^\d{5,32}$/;
const TT_HANDLE = /^[A-Za-z0-9._]{1,24}$/;
const IG_ID = /^[A-Za-z0-9_-]{5,64}$/;
const THREADS_HANDLE = /^[A-Za-z0-9._]{1,30}$/;
const THREADS_ID = /^[A-Za-z0-9_-]{5,64}$/;

/** Hardcoded oEmbed origin; query rebuilt from constants + parsed ids (never raw user HTML). */
function oembedHref(post: KeyedPost): string | null {
    const u = oembedEndpoint(post.network);
    if (post.network === "x") {
        if (!X_ID.test(post.postId)) return null;
        u.searchParams.set("url", "https://x.com/i/status/" + post.postId);
        return u.href;
    }
    if (post.network === "tiktok") {
        if (!TT_HANDLE.test(post.handle) || !TT_ID.test(post.postId)) return null;
        u.searchParams.set("url", "https://www.tiktok.com/@" + post.handle + "/" + post.kind + "/" + post.postId);
        return u.href;
    }
    if (post.network === "threads") {
        if (!THREADS_HANDLE.test(post.handle) || !THREADS_ID.test(post.postId)) return null;
        u.searchParams.set("url", "https://www.threads.net/@" + post.handle + "/post/" + post.postId);
        return u.href;
    }
    if (!IG_ID.test(post.postId)) return null;
    const kind = post.kind === "reel" ? "reel" : "p";
    u.searchParams.set("url", "https://www.instagram.com/" + kind + "/" + post.postId);
    return u.href;
}

async function fetchOembed(post: KeyedPost): Promise<Record<string, unknown> | null> {
    const href = oembedHref(post);
    if (!href) return null;
    try {
        const res = await fetch(href, {
            method: "GET",
            redirect: "error",
            headers: { "user-agent": UA, accept: "application/json" },
            signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) return null;
        return (await res.json()) as Record<string, unknown>;
    } catch {
        return null;
    }
}

/** New stakes refuse if the post is gone / not publicly embeddable. */
export async function assertPubliclyEmbeddable(post: KeyedPost): Promise<Record<string, unknown>> {
    const o = await fetchOembed(post);
    if (!o) fail(400, "post is gone");
    return o;
}

/** JSON string fields only. Reject anything that looks like markup — never regex-strip or unescape HTML. */
function jsonString(o: Record<string, unknown>, key: string): string | null {
    const v = o[key];
    if (typeof v !== "string") return null;
    if (v.length === 0 || v.length >= 4000) return null;
    if (v.includes("<") || v.includes(">")) return null;
    return v;
}

function xHandleFromOembed(o: Record<string, unknown>): string | null {
    const author = jsonString(o, "author_url");
    if (!author) return null;
    let u: URL;
    try {
        u = new URL(author);
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    if (host !== "x.com" && host !== "www.x.com" && host !== "twitter.com" && host !== "www.twitter.com") return null;
    const m = u.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/?$/);
    if (!m || m[1] === "i") return null;
    return m[1];
}

function tiktokCdnThumb(raw: string): string | null {
    let u: URL;
    try {
        u = new URL(raw);
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    const labels = u.hostname.toLowerCase().split(".");
    if (labels.length < 3) return null;
    if (labels[labels.length - 2] !== "tiktokcdn" || labels[labels.length - 1] !== "com") return null;
    return u.href;
}

function asSnap(row: SnapRow): PostSnap {
    const handle = row.handle ? (row.handle.startsWith("@") ? row.handle : `@${row.handle}`) : null;
    return {
        network: row.network === "x" ? "X" : row.network === "threads" ? "Threads" : row.network === "instagram" ? "Instagram" : row.network === "tiktok" ? "TikTok" : row.network,
        handle,
        name: row.name,
        text: row.text,
        mediaUrl: row.mediaUrl,
        avatarUrl: row.avatarUrl,
        postedAt: row.postedAt ?? undefined,
    };
}

/**
 * Handle only when it is part of the canonical permalink (Threads, TikTok, IG stories).
 * X and Instagram `/p`/`/reel` drop the user from the pot key — never take that path from the paste.
 */
function handleFromPermalink(post: KeyedPost): string | null {
    if (post.network === "x") return null;
    if (post.network === "instagram" && post.kind !== "stories") return null;
    return post.handle || null;
}

export async function buildSnap(post: KeyedPost, embed?: Record<string, unknown>): Promise<SnapRow> {
    const postedAt = postedAtMs(post);
    const baked = post.network === "x" ? BAKED_SNAPS[post.postId] : undefined;
    const row: SnapRow = {
        network: post.network,
        postId: post.postId,
        canonical: post.canonical,
        issueId: potHash(post.canonical),
        originalUrl: post.canonical,
        handle: handleFromPermalink(post) || baked?.handle?.replace(/^@/, "") || null,
        postedAt,
        text: baked?.text,
        name: baked?.name,
        mediaUrl: baked?.mediaUrl,
        avatarUrl: baked?.avatarUrl,
        at: Date.now(),
    };

    const o = embed !== undefined ? embed : (await fetchOembed(post)) || {};
    // Intentionally ignore o.html — incomplete tag-stripping is not sanitization.

    if (post.network === "x") {
        row.handle = row.handle || xHandleFromOembed(o);
        row.name = row.name || jsonString(o, "author_name") || undefined;
    }

    if (post.network === "tiktok") {
        row.handle = row.handle || jsonString(o, "author_unique_id");
        row.name = row.name || jsonString(o, "author_name") || undefined;
        row.text = row.text || jsonString(o, "title") || undefined;
        const thumb = jsonString(o, "thumbnail_url");
        if (thumb) {
            const cdn = tiktokCdnThumb(thumb);
            if (cdn) row.mediaUrl = cdn;
        }
    }

    if (post.network === "instagram") {
        const author = jsonString(o, "author_name");
        if (author) row.handle = row.handle || author.replace(/^@/, "");
        row.text = row.text || jsonString(o, "title") || undefined;
    }

    if (post.network === "threads") {
        row.text = row.text || jsonString(o, "title") || undefined;
        row.name = row.name || jsonString(o, "author_name") || undefined;
    }

    return row;
}

/** Write once on first stake, keyed by canonical permalink. Signer oEmbed only — not client handle/text/date. */
export async function snapshotFirstStake(post: KeyedPost, embed: Record<string, unknown>): Promise<void> {
    try {
        const existing = await store.getSnap(post.canonical);
        if (existing?.text && existing.handle) return;
        const row = await buildSnap(post, embed);
        await store.putSnap(row);
    } catch {
        /* still stake */
    }
}

export async function publicSnap(canonical: string): Promise<PostSnap | null> {
    const row = await store.getSnap(canonical);
    return row ? asSnap(row) : null;
}

export type IndexCard = {
    canonical: string;
    issueId: string;
    network: string;
    handle: string | null;
    text?: string;
    name?: string;
    postedAt: number | null;
    mediaUrl?: string;
    avatarUrl?: string;
};

export function asIndexCard(row: store.SnapRow): IndexCard {
    return {
        canonical: row.canonical,
        issueId: row.issueId,
        network: row.network === "x" ? "X" : row.network === "threads" ? "Threads" : row.network === "instagram" ? "Instagram" : row.network === "tiktok" ? "TikTok" : row.network,
        handle: row.handle ? (row.handle.startsWith("@") ? row.handle : `@${row.handle}`) : null,
        text: row.text,
        name: row.name,
        postedAt: row.postedAt,
        mediaUrl: row.mediaUrl,
        avatarUrl: row.avatarUrl,
    };
}
