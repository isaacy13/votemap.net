/** Issue key = canonical x.com or Threads post URL. Everything else is rejected. */

export type Network = "x" | "threads";

export type ParsedPost =
    | { network: "x"; canonical: string; postId: string }
    | { network: "threads"; canonical: string; postId: string; handle: string };

export function parsePostUrl(raw: string): ParsedPost | null {
    let u: URL;
    try {
        u = new URL(raw.trim());
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "x.com" || host === "twitter.com") {
        const path = u.pathname.replace(/\/+$/, "");
        const m = path.match(/^(?:\/i\/web\/status|\/i\/status|\/[^/]+\/status(?:es)?)\/(\d+)$/i);
        if (!m) return null;
        const postId = m[1];
        return { network: "x", canonical: `https://x.com/i/status/${postId}`, postId };
    }

    if (host === "threads.net" || host === "threads.com") {
        const path = u.pathname.replace(/\/+$/, "");
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

    return null;
}

export function issuePath(canonical: string): string {
    return `/mvp?i=${encodeURIComponent(canonical)}`;
}

/** Light catalog label — no live embed. Handle when the stored URL still has it. */
export function postPreview(
    url: string,
    parsed: ParsedPost | null,
): { network: "X" | "Threads" | "Post"; handle: string | null } {
    if (parsed?.network === "threads") {
        return { network: "Threads", handle: `@${parsed.handle}` };
    }
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase().replace(/^www\./, "");
        if (host === "x.com" || host === "twitter.com") {
            const path = u.pathname.replace(/\/+$/, "");
            const m = path.match(/^\/([^/]+)\/status(?:es)?\/\d+$/i);
            const name = m?.[1];
            if (name && name.toLowerCase() !== "i" && name.toLowerCase() !== "web") {
                return { network: "X", handle: `@${name}` };
            }
            return { network: "X", handle: null };
        }
    } catch {
        /* ignore */
    }
    return { network: parsed?.network === "x" ? "X" : "Post", handle: null };
}
