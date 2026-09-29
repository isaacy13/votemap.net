import { BAKED_SNAPS, type PostSnap } from "../mvp/postSnap";
import { resolveTikTokShort } from "../mvp/canonicalize";
import { isKeyedPost, isTikTokShort, parsePostUrl, postedAtMs, type KeyedPost } from "../mvp/urls";
import * as store from "./store";
import type { SnapRow } from "./store";

const UA = "Mozilla/5.0 (compatible; votemap/0.1; +https://votemap.net)";

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

async function getJson(url: string): Promise<Record<string, unknown> | null> {
    try {
        const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(8_000) });
        if (!res.ok) return null;
        return (await res.json()) as Record<string, unknown>;
    } catch {
        return null;
    }
}

async function getText(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, signal: AbortSignal.timeout(8_000) });
        if (!res.ok) return null;
        return await res.text();
    } catch {
        return null;
    }
}

async function reachable(url: string): Promise<boolean> {
    try {
        const head = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            headers: { "user-agent": UA },
            signal: AbortSignal.timeout(8_000),
        });
        if (head.ok) return true;
        const get = await fetch(url, {
            method: "GET",
            redirect: "follow",
            headers: { "user-agent": UA, accept: "text/html" },
            signal: AbortSignal.timeout(8_000),
        });
        return get.ok;
    } catch {
        return false;
    }
}

/** New stakes refuse if the post is gone / not publicly embeddable. */
export async function assertPubliclyEmbeddable(post: KeyedPost): Promise<Record<string, unknown>> {
    if (post.network === "tiktok") {
        const o = await getJson(`https://www.tiktok.com/oembed?url=${encodeURIComponent(post.canonical)}`);
        if (!o) fail(400, "post is gone");
        return o;
    }
    if (post.network === "x") {
        const o = await getJson(`https://publish.x.com/oembed?url=${encodeURIComponent(post.canonical)}`);
        if (o) return o;
        if (await reachable(post.canonical)) return {};
        fail(400, "post is gone");
    }
    if (!(await reachable(post.canonical))) fail(400, "post is gone");
    return {};
}

function meta(html: string, key: string): string | null {
    const prop = html.match(new RegExp(`property=["']${key}["'][^>]*content=["']([^"']*)`, "i"))
        || html.match(new RegExp(`content=["']([^"']*)["'][^>]*property=["']${key}["']`, "i"));
    const name = html.match(new RegExp(`name=["']${key}["'][^>]*content=["']([^"']*)`, "i"));
    const raw = prop?.[1] || name?.[1];
    return raw ? raw.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'") : null;
}

function igFromOg(description: string | null): { handle: string | null; text: string | null } {
    if (!description) return { handle: null, text: null };
    const m = description.match(/-\s+([A-Za-z0-9._]+)\s+on\s+[^:]+:\s+"([\s\S]*)"\s*$/);
    if (m) return { handle: m[1], text: m[2] };
    return { handle: null, text: description };
}

function xHandleFromOembed(o: Record<string, unknown>): string | null {
    const author = String(o.author_url || "");
    const m = author.match(/(?:x|twitter)\.com\/([^/?#]+)/i);
    if (!m || m[1] === "i") return null;
    return m[1];
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

export async function buildSnap(post: KeyedPost, originalUrl: string, embed: Record<string, unknown> = {}): Promise<SnapRow> {
    const postedAt = postedAtMs(post);
    const baked = post.network === "x" ? BAKED_SNAPS[post.postId] : undefined;
    const row: SnapRow = {
        network: post.network,
        postId: post.postId,
        canonical: post.canonical,
        originalUrl,
        handle: ("handle" in post ? post.handle : null) || baked?.handle?.replace(/^@/, "") || null,
        postedAt,
        text: baked?.text,
        name: baked?.name,
        mediaUrl: baked?.mediaUrl,
        avatarUrl: baked?.avatarUrl,
        at: Date.now(),
    };

    if (post.network === "x") {
        row.handle = row.handle || xHandleFromOembed(embed);
        if (!row.text && typeof embed.author_name === "string") row.name = row.name || embed.author_name;
    }

    if (post.network === "tiktok") {
        const o =
            Object.keys(embed).length > 0
                ? embed
                : (await getJson(`https://www.tiktok.com/oembed?url=${encodeURIComponent(post.canonical)}`)) || {};
        if (typeof o.author_unique_id === "string") row.handle = row.handle || o.author_unique_id;
        if (typeof o.author_name === "string") row.name = row.name || o.author_name;
        if (typeof o.title === "string") row.text = row.text || o.title;
        if (typeof o.thumbnail_url === "string") row.mediaUrl = row.mediaUrl || o.thumbnail_url;
    }

    if (post.network === "instagram") {
        const html = await getText(post.canonical);
        if (html) {
            const og = igFromOg(meta(html, "og:description"));
            row.handle = row.handle || og.handle;
            row.text = row.text || og.text || meta(html, "og:title") || undefined;
            row.mediaUrl = row.mediaUrl || meta(html, "og:image") || undefined;
        }
    }

    if (row.handle && !row.handle.startsWith("@")) {
        /* stored without @ */
    }
    return row;
}

/** Write once on first stake. Fetch failure must not block the stake. */
export async function snapshotFirstStake(post: KeyedPost, originalUrl: string, embed: Record<string, unknown> = {}): Promise<void> {
    try {
        const existing = await store.getSnap(post.canonical);
        if (existing?.text && existing.handle) return;
        const row = await buildSnap(post, originalUrl, embed);
        if (existing) {
            await store.putSnap({
                ...existing,
                handle: existing.handle || row.handle,
                text: existing.text || row.text,
                name: existing.name || row.name,
                mediaUrl: existing.mediaUrl || row.mediaUrl,
                avatarUrl: existing.avatarUrl || row.avatarUrl,
                postedAt: existing.postedAt ?? row.postedAt,
                originalUrl: existing.originalUrl || originalUrl,
            });
            return;
        }
        await store.putSnap(row);
    } catch {
        /* still stake */
    }
}

export async function publicSnap(canonical: string): Promise<PostSnap | null> {
    const row = await store.getSnap(canonical);
    return row ? asSnap(row) : null;
}
