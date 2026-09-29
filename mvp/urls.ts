/** Issue key = canonical X / Threads / Instagram / TikTok post URL. Everything else is rejected. */

export type Network = "x" | "threads" | "instagram" | "tiktok";

export type KeyedPost =
    | { network: "x"; canonical: string; postId: string; handle: string | null }
    | { network: "threads"; canonical: string; postId: string; handle: string }
    | { network: "instagram"; canonical: string; postId: string; handle: string | null; kind: "p" | "reel" | "stories" }
    | { network: "tiktok"; canonical: string; postId: string; handle: string; kind: "video" | "photo" };

export type ParsedPost = KeyedPost | { network: "tiktok"; canonical: null; needsResolve: true };

const IG_RESERVED = new Set([
    "p",
    "reel",
    "reels",
    "tv",
    "stories",
    "share",
    "accounts",
    "explore",
    "direct",
    "legal",
    "about",
    "developer",
]);

export function isKeyedPost(p: ParsedPost | null | undefined): p is KeyedPost {
    return Boolean(p && p.canonical);
}

export function isTikTokShort(p: ParsedPost | null | undefined): p is { network: "tiktok"; canonical: null; needsResolve: true } {
    return p?.network === "tiktok" && p.canonical === null;
}

function hostOf(u: URL): string {
    return u.hostname.toLowerCase().replace(/^www\./, "");
}

function pathOf(u: URL): string {
    return u.pathname.replace(/\/+$/, "") || "/";
}

function igShortcode(raw: string): string | null {
    return /^[A-Za-z0-9_-]{5,64}$/.test(raw) ? raw : null;
}

function parseInstagram(path: string): { kind: "p" | "reel" | "stories"; postId: string; handle: string | null } | null {
    let m = path.match(/^\/p\/([A-Za-z0-9_-]+)$/);
    if (m) {
        const postId = igShortcode(m[1]);
        return postId ? { kind: "p", postId, handle: null } : null;
    }
    m = path.match(/^\/reels?\/([A-Za-z0-9_-]+)$/);
    if (m) {
        const postId = igShortcode(m[1]);
        return postId ? { kind: "reel", postId, handle: null } : null;
    }
    m = path.match(/^\/tv\/([A-Za-z0-9_-]+)$/);
    if (m) {
        const postId = igShortcode(m[1]);
        return postId ? { kind: "p", postId, handle: null } : null;
    }
    m = path.match(/^\/share\/(p|reels?)\/([A-Za-z0-9_-]+)$/);
    if (m) {
        const postId = igShortcode(m[2]);
        if (!postId) return null;
        return { kind: m[1].startsWith("reel") ? "reel" : "p", postId, handle: null };
    }
    m = path.match(/^\/stories\/([^/]+)\/(\d+)$/);
    if (m && !IG_RESERVED.has(m[1].toLowerCase())) {
        return { kind: "stories", postId: m[2], handle: m[1].toLowerCase() };
    }
    m = path.match(/^\/([^/]+)\/(p|reels?|tv)\/([A-Za-z0-9_-]+)$/);
    if (m && !IG_RESERVED.has(m[1].toLowerCase())) {
        const postId = igShortcode(m[3]);
        if (!postId) return null;
        return {
            kind: m[2].startsWith("reel") ? "reel" : "p",
            postId,
            handle: m[1].replace(/^@/, ""),
        };
    }
    return null;
}

export function parsePostUrl(raw: string): ParsedPost | null {
    let u: URL;
    try {
        u = new URL(raw.trim());
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    const host = hostOf(u);
    const path = pathOf(u);

    if (host === "x.com" || host === "twitter.com") {
        const m = path.match(/^(?:\/i\/web\/status|\/i\/status|\/([^/]+)\/status(?:es)?)\/(\d+)$/i);
        if (!m) return null;
        const postId = m[2];
        const name = m[1];
        const handle =
            name && name.toLowerCase() !== "i" && name.toLowerCase() !== "web" ? name.replace(/^@/, "") : null;
        return { network: "x", canonical: `https://x.com/i/status/${postId}`, postId, handle };
    }

    if (host === "threads.net" || host === "threads.com") {
        const m = path.match(/^\/@([^/]+)\/post\/([^/]+)$/i);
        if (!m) return null;
        const handle = m[1].toLowerCase();
        const postId = m[2];
        return {
            network: "threads",
            canonical: `https://www.threads.net/@${handle}/post/${postId}`,
            postId,
            handle,
        };
    }

    if (host === "instagram.com" || host === "instagr.am") {
        const ig = parseInstagram(path);
        if (!ig) return null;
        if (ig.kind === "stories" && ig.handle) {
            return {
                network: "instagram",
                canonical: `https://www.instagram.com/stories/${ig.handle}/${ig.postId}`,
                postId: ig.postId,
                handle: ig.handle,
                kind: "stories",
            };
        }
        return {
            network: "instagram",
            canonical: `https://www.instagram.com/${ig.kind}/${ig.postId}`,
            postId: ig.postId,
            handle: ig.handle,
            kind: ig.kind,
        };
    }

    if (host === "vm.tiktok.com" || host === "vt.tiktok.com") {
        if (/^\/[A-Za-z0-9_]+$/i.test(path) || path === "/") return { network: "tiktok", canonical: null, needsResolve: true };
        return { network: "tiktok", canonical: null, needsResolve: true };
    }
    if ((host === "tiktok.com" || host.endsWith(".tiktok.com")) && /^\/t\/[^/]+$/i.test(path)) {
        return { network: "tiktok", canonical: null, needsResolve: true };
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
        const m = path.match(/^\/@([^/]+)\/(video|photo)\/(\d+)$/i);
        if (!m) return null;
        const handle = m[1].toLowerCase();
        const kind = m[2].toLowerCase() === "photo" ? "photo" : "video";
        const postId = m[3];
        return {
            network: "tiktok",
            canonical: `https://www.tiktok.com/@${handle}/${kind}/${postId}`,
            postId,
            handle,
            kind,
        };
    }

    return null;
}

/** Real App Router path. Static export cannot prebuild every post, so identity lives in `u`. */
export function issuePath(canonical: string): string {
    return `/issue?u=${encodeURIComponent(canonical)}`;
}

export function issueUrlFromSearch(search: string | URLSearchParams): string {
    const sp = typeof search === "string" ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search) : search;
    return (sp.get("u") || sp.get("i") || "").trim();
}

export type PreviewNetwork = "X" | "Threads" | "Instagram" | "TikTok" | "Post";

export function networkLabel(network: Network | string | null | undefined): PreviewNetwork {
    if (network === "x" || network === "X") return "X";
    if (network === "threads" || network === "Threads") return "Threads";
    if (network === "instagram" || network === "Instagram") return "Instagram";
    if (network === "tiktok" || network === "TikTok") return "TikTok";
    return "Post";
}

/** Light catalog label — no live embed. Handle when the stored URL still has it. */
export function postPreview(
    url: string,
    parsed: ParsedPost | null,
): { network: PreviewNetwork; handle: string | null } {
    if (isKeyedPost(parsed)) {
        const handle = "handle" in parsed ? parsed.handle : null;
        return {
            network: networkLabel(parsed.network),
            handle: handle ? (handle.startsWith("@") ? handle : `@${handle}`) : null,
        };
    }
    try {
        const u = new URL(url);
        const host = hostOf(u);
        const path = pathOf(u);
        if (host === "x.com" || host === "twitter.com") {
            const m = path.match(/^\/([^/]+)\/status(?:es)?\/\d+$/i);
            const name = m?.[1];
            if (name && name.toLowerCase() !== "i" && name.toLowerCase() !== "web") {
                return { network: "X", handle: `@${name}` };
            }
            return { network: "X", handle: null };
        }
        if (host === "threads.net" || host === "threads.com") {
            const m = path.match(/^\/@([^/]+)\/post\/[^/]+$/i);
            return { network: "Threads", handle: m ? `@${m[1]}` : null };
        }
        if (host === "instagram.com" || host === "instagr.am") {
            const withUser = path.match(/^\/([^/]+)\/(?:p|reel|reels|tv)\/[^/]+$/i);
            const user = withUser?.[1];
            if (user && !IG_RESERVED.has(user.toLowerCase())) {
                return { network: "Instagram", handle: `@${user}` };
            }
            return { network: "Instagram", handle: null };
        }
        if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
            const m = path.match(/^\/@([^/]+)\/(?:video|photo)\/\d+$/i);
            return { network: "TikTok", handle: m ? `@${m[1]}` : null };
        }
    } catch {
        /* ignore */
    }
    return { network: "Post", handle: null };
}

const IG_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const IG_EPOCH_MS = 1_314_220_021_721n;
const X_EPOCH_MS = 1_288_834_974_657n;

function igMediaId(shortcode: string): bigint | null {
    let n = 0n;
    for (const ch of shortcode) {
        const i = IG_ALPHABET.indexOf(ch);
        if (i < 0) return null;
        n = (n << 6n) + BigInt(i);
    }
    return n;
}

/** Post date from the id — no network. ms since epoch, or null. */
export function postedAtMs(parsed: ParsedPost | null, fallbackUrl?: string): number | null {
    const p = parsed && isKeyedPost(parsed) ? parsed : fallbackUrl ? parsePostUrl(fallbackUrl) : parsed;
    if (!p || !isKeyedPost(p)) return null;
    try {
        if (p.network === "x") {
            const id = BigInt(p.postId);
            const ms = Number((id >> 22n) + X_EPOCH_MS);
            return Number.isFinite(ms) && ms > 0 ? ms : null;
        }
        if (p.network === "tiktok") {
            const id = BigInt(p.postId);
            const ms = Number(id >> 32n) * 1000;
            return Number.isFinite(ms) && ms > 0 ? ms : null;
        }
        if (p.network === "threads" || (p.network === "instagram" && p.kind !== "stories")) {
            const id = igMediaId(p.postId);
            if (id == null) return null;
            const ms = Number((id >> 23n) + IG_EPOCH_MS);
            return Number.isFinite(ms) && ms > 0 ? ms : null;
        }
    } catch {
        return null;
    }
    return null;
}

export function formatPostedAt(ms: number | null | undefined): string | null {
    if (!ms) return null;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
