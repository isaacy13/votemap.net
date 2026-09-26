/** Issue key = canonical x.com or Threads post URL. twitter.com is rejected. */

export type Network = "x" | "threads";

export type ParsedPost =
    | { network: "x"; canonical: string; tweetId: string }
    | { network: "threads"; canonical: string; permalink: string; handle: string | null; code: string };

export function normHandle(raw: string): string {
    return raw.trim().replace(/^@/, "").toLowerCase();
}

export function networkByte(network: Network): number {
    return network === "x" ? 0 : 1;
}

export function parsePostUrl(raw: string): ParsedPost | null {
    let u: URL;
    try {
        u = new URL(raw.trim());
    } catch {
        return null;
    }
    const host = u.hostname.toLowerCase();
    const path = u.pathname.replace(/\/+$/, "");

    if (host === "x.com" || host === "www.x.com") {
        const m = path.match(/^(?:\/i\/web\/status|\/i\/status|\/[^/]+\/status(?:es)?)\/(\d+)$/i);
        if (!m) return null;
        const tweetId = m[1];
        return { network: "x", canonical: `https://x.com/i/status/${tweetId}`, tweetId };
    }

    if (host === "www.threads.net" || host === "threads.net" || host === "threads.com" || host === "www.threads.com") {
        let m = path.match(/^\/@([^/]+)\/post\/([A-Za-z0-9_-]+)$/i);
        if (m) {
            const handle = normHandle(m[1]);
            const code = m[2];
            const canonical = `https://www.threads.net/@${handle}/post/${code}`;
            return { network: "threads", canonical, permalink: canonical, handle, code };
        }
        m = path.match(/^\/t\/([A-Za-z0-9_-]+)$/i);
        if (m) {
            const code = m[1];
            const canonical = `https://www.threads.net/t/${code}`;
            return { network: "threads", canonical, permalink: canonical, handle: null, code };
        }
    }

    return null;
}
