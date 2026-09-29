import { BAKED_SNAPS, type PostSnap } from "../mvp/postSnap";
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

/** Hardcoded oEmbed origins only — query is the already-canonical post URL. */
function oembedHref(post: KeyedPost): string {
    const u =
        post.network === "x"
            ? new URL("https://publish.x.com/oembed")
            : post.network === "tiktok"
              ? new URL("https://www.tiktok.com/oembed")
              : post.network === "threads"
                ? new URL("https://graph.threads.net/oembed")
                : new URL("https://www.instagram.com/oembed");
    u.searchParams.set("url", post.canonical);
    return u.href;
}

async function fetchOembed(post: KeyedPost): Promise<Record<string, unknown> | null> {
    try {
        const res = await fetch(oembedHref(post), {
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

/** One-pass HTML entities — never decode `&amp;` then `&quot;` in a second pass. */
function decodeEntities(s: string): string {
    return s.replace(/&(?:amp|quot|#39|lt|gt);/g, (m) => {
        switch (m) {
            case "&amp;":
                return "&";
            case "&quot;":
                return '"';
            case "&#39;":
                return "'";
            case "&lt;":
                return "<";
            case "&gt;":
                return ">";
            default:
                return m;
        }
    });
}

function meta(html: string, key: string): string | null {
    if (!/^[a-zA-Z:]+$/.test(key)) return null;
    const escaped = key.replace(":", "\\:");
    const prop =
        html.match(new RegExp(`property=["']${escaped}["'][^>]*content=["']([^"']{0,512})`, "i")) ||
        html.match(new RegExp(`content=["']([^"']{0,512})["'][^>]*property=["']${escaped}["']`, "i"));
    const name = html.match(new RegExp(`name=["']${escaped}["'][^>]*content=["']([^"']{0,512})`, "i"));
    const raw = prop?.[1] || name?.[1];
    return raw ? decodeEntities(raw) : null;
}

function igFromOg(description: string | null): { handle: string | null; text: string | null } {
    if (!description) return { handle: null, text: null };
    const m = description.match(/-\s+([A-Za-z0-9._]{1,30})\s+on\s+[^:]{1,40}:\s+"([^"]{0,500})"/);
    if (m) return { handle: m[1], text: m[2] };
    return { handle: null, text: description };
}

function xHandleFromOembed(o: Record<string, unknown>): string | null {
    const author = String(o.author_url || "");
    let u: URL;
    try {
        u = new URL(author);
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    if (host !== "x.com" && host !== "www.x.com" && host !== "twitter.com" && host !== "www.twitter.com") return null;
    const m = u.pathname.match(/^\/([^/]+)\/?$/);
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

function htmlFromOembed(o: Record<string, unknown>): string {
    return typeof o.html === "string" ? o.html : "";
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

    const o = Object.keys(embed).length > 0 ? embed : (await fetchOembed(post)) || {};

    if (post.network === "x") {
        row.handle = row.handle || xHandleFromOembed(o);
        if (typeof o.author_name === "string") row.name = row.name || o.author_name;
        const html = htmlFromOembed(o);
        if (!row.text && html) {
            const t = html.match(/<p>([\s\S]{1,2000}?)<\/p>/i);
            if (t) row.text = decodeEntities(t[1].replace(/<[^>]+>/g, ""));
        }
    }

    if (post.network === "tiktok") {
        if (typeof o.author_unique_id === "string") row.handle = row.handle || o.author_unique_id;
        if (typeof o.author_name === "string") row.name = row.name || o.author_name;
        if (typeof o.title === "string") row.text = row.text || o.title;
        if (typeof o.thumbnail_url === "string") row.mediaUrl = row.mediaUrl || o.thumbnail_url;
    }

    if (post.network === "instagram") {
        if (typeof o.author_name === "string") row.handle = row.handle || o.author_name.replace(/^@/, "");
        if (typeof o.title === "string") row.text = row.text || o.title;
        const html = htmlFromOembed(o);
        if (html) {
            const og = igFromOg(meta(html, "og:description"));
            row.handle = row.handle || og.handle;
            row.text = row.text || og.text || meta(html, "og:title") || undefined;
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
