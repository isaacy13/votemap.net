import { isKeyedPost, isTikTokShort, parsePostUrl } from "./urls";

const UA = "Mozilla/5.0 (compatible; votemap/0.1; +https://votemap.net)";

function fail(status: number, error: string): never {
    throw Object.assign(new Error(error), { status });
}

/**
 * Follow vm. / vt. / /t/ to a /@user/video|photo/ permalink.
 * Never return the short URL — pots must not key on it.
 */
export async function resolveTikTokShort(raw: string): Promise<string> {
    const first = parsePostUrl(raw);
    if (isKeyedPost(first) && first.network === "tiktok") return first.canonical;
    if (!isTikTokShort(first)) fail(400, "not a TikTok short link");

    let res: Response;
    try {
        res = await fetch(raw, {
            redirect: "follow",
            headers: { "user-agent": UA, accept: "text/html" },
            signal: AbortSignal.timeout(10_000),
        });
    } catch {
        fail(400, "TikTok short link did not resolve");
    }

    const html = await res.text().catch(() => "");
    const og =
        html.match(/property=["']og:url["'][^>]*content=["']([^"']+)/i) ||
        html.match(/content=["']([^"']+)["'][^>]*property=["']og:url["']/i);
    const candidates = [og?.[1], res.url, raw].filter((x): x is string => Boolean(x));
    for (const c of candidates) {
        try {
            const abs = new URL(c, res.url || raw).toString();
            const p = parsePostUrl(abs);
            if (isKeyedPost(p) && p.network === "tiktok") return p.canonical;
        } catch {
            /* next */
        }
    }
    fail(400, "TikTok short link did not resolve");
}
