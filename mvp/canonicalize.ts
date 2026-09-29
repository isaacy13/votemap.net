import { isKeyedPost, isTikTokShort, parsePostUrl } from "./urls";
import { tiktokRequestUrl, UA } from "./safeUrl";

function fail(status: number, error: string): never {
    throw Object.assign(new Error(error), { status });
}

const MAX_HOPS = 5;

async function fetchTikTokHop(url: string): Promise<Response> {
    const safe = tiktokRequestUrl(url);
    if (!safe) fail(400, "TikTok short link did not resolve");
    return fetch(safe, {
        method: "GET",
        redirect: "manual",
        headers: { "user-agent": UA, accept: "text/html" },
        signal: AbortSignal.timeout(10_000),
    });
}

function permalinkFrom(raw: string, base?: string): string | null {
    let abs = raw;
    try {
        abs = base ? new URL(raw, base).toString() : new URL(raw).toString();
    } catch {
        return null;
    }
    const p = parsePostUrl(abs);
    if (isKeyedPost(p) && p.network === "tiktok") return p.canonical;
    return null;
}

/**
 * Follow vm. / vt. / /t/ to a /@user/video|photo/ permalink.
 * Each hop is rebuilt onto an allowlisted TikTok host. Redirects are not followed by fetch.
 * Never return the short URL — pots must not key on it.
 */
export async function resolveTikTokShort(raw: string): Promise<string> {
    const first = parsePostUrl(raw);
    if (isKeyedPost(first) && first.network === "tiktok") return first.canonical;
    if (!isTikTokShort(first)) fail(400, "not a TikTok short link");

    let current = tiktokRequestUrl(raw);
    if (!current) fail(400, "TikTok short link did not resolve");

    for (let hop = 0; hop < MAX_HOPS; hop++) {
        const keyed = permalinkFrom(current);
        if (keyed) return keyed;

        let res: Response;
        try {
            res = await fetchTikTokHop(current);
        } catch {
            fail(400, "TikTok short link did not resolve");
        }

        const loc = res.headers.get("location");
        if (loc) {
            const nextAbs = (() => {
                try {
                    return new URL(loc, current).toString();
                } catch {
                    return "";
                }
            })();
            const keyedLoc = permalinkFrom(nextAbs);
            if (keyedLoc) return keyedLoc;
            const next = tiktokRequestUrl(nextAbs);
            if (!next) fail(400, "TikTok short link did not resolve");
            current = next;
            continue;
        }

        if (res.status >= 200 && res.status < 300) {
            const html = await res.text().catch(() => "");
            const og =
                html.match(/property=["']og:url["'][^>]*content=["']([^"']{8,512})/i) ||
                html.match(/content=["']([^"']{8,512})["'][^>]*property=["']og:url["']/i);
            const keyedOg = og?.[1] ? permalinkFrom(og[1], current) : null;
            if (keyedOg) return keyedOg;
        }
        fail(400, "TikTok short link did not resolve");
    }
    fail(400, "TikTok short link did not resolve");
}
