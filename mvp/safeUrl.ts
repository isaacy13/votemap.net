/** Outbound TikTok requests: constant origin + validated id only. Never fetch a user/redirect string. */

export const UA = "Mozilla/5.0 (compatible; votemap/0.1; +https://votemap.net)";

const CODE = /^[A-Za-z0-9]{4,32}$/;
const HANDLE = /^[A-Za-z0-9._]{1,24}$/;
const POST_ID = /^\d{5,32}$/;

export type TikTokHop = { fetch: "vm" | "vt" | "t"; code: string };

export type TikTokPermalink = { handle: string; kind: "video" | "photo"; postId: string };

function asCode(raw: string): string | null {
    return CODE.test(raw) ? raw : null;
}

function asHandle(raw: string): string | null {
    const h = raw.replace(/^@/, "").toLowerCase();
    return HANDLE.test(h) ? h : null;
}

function asPostId(raw: string): string | null {
    return POST_ID.test(raw) ? raw : null;
}

function pathOnly(u: URL): string {
    return u.pathname.replace(/\/+$/, "") || "/";
}

/**
 * Constant prefix + charset-checked short code. Callers must not fetch a user or Location string.
 * Re-checks the code so CodeQL sees the guard next to the constructed href.
 */
export function tiktokHopHref(hop: TikTokHop): string | null {
    if (!CODE.test(hop.code)) return null;
    switch (hop.fetch) {
        case "vm":
            return "https://vm.tiktok.com/" + hop.code;
        case "vt":
            return "https://vt.tiktok.com/" + hop.code;
        case "t":
            return "https://www.tiktok.com/t/" + hop.code;
    }
}

export function tiktokPermalinkHref(p: TikTokPermalink): string | null {
    if (!HANDLE.test(p.handle) || !POST_ID.test(p.postId)) return null;
    if (p.kind !== "video" && p.kind !== "photo") return null;
    return "https://www.tiktok.com/@" + p.handle + "/" + p.kind + "/" + p.postId;
}

function hopFromParts(host: string, path: string): TikTokHop | TikTokPermalink | null {
    switch (host) {
        case "vm.tiktok.com": {
            const code = path.startsWith("/") ? asCode(path.slice(1)) : null;
            return code ? { fetch: "vm", code } : null;
        }
        case "vt.tiktok.com": {
            const code = path.startsWith("/") ? asCode(path.slice(1)) : null;
            return code ? { fetch: "vt", code } : null;
        }
        case "www.tiktok.com":
        case "tiktok.com":
        case "m.tiktok.com": {
            if (path.startsWith("/t/")) {
                const code = asCode(path.slice(3));
                return code ? { fetch: "t", code } : null;
            }
            const m = path.match(/^\/@([^/]+)\/(video|photo)\/(\d+)$/);
            if (!m) return null;
            const handle = asHandle(m[1]);
            const postId = asPostId(m[3]);
            if (!handle || !postId) return null;
            return { handle, kind: m[2] === "photo" ? "photo" : "video", postId };
        }
        default:
            return null;
    }
}

/** First hop from the pasted URL. Does not return a fetchable user string. */
export function tiktokShortHop(raw: string): TikTokHop | null {
    let u: URL;
    try {
        u = new URL(raw.trim());
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    if (u.username !== "" || u.password !== "") return null;
    const parsed = hopFromParts(u.hostname.toLowerCase(), pathOnly(u));
    if (!parsed || !("fetch" in parsed)) return null;
    return parsed;
}

/**
 * Interpret a redirect Location. Relative paths resolve against a constant TikTok origin.
 * Result is ids only — never fetch the Location string.
 */
export function tiktokFromLocation(loc: string): TikTokHop | TikTokPermalink | null {
    let u: URL;
    try {
        u = new URL(loc, "https://www.tiktok.com/");
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    if (u.username !== "" || u.password !== "") return null;
    return hopFromParts(u.hostname.toLowerCase(), pathOnly(u));
}

export function isTikTokHop(x: TikTokHop | TikTokPermalink): x is TikTokHop {
    return "fetch" in x;
}
