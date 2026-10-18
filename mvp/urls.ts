/** Issue key = canonical x.com post URL. twitter.com and Threads are rejected. */

export type Network = "x" | "threads";

export type ParsedPost = { network: "x"; canonical: string; tweetId: string };

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
    if (host !== "x.com" && host !== "www.x.com") return null;
    const path = u.pathname.replace(/\/+$/, "");
    const m = path.match(/^(?:\/i\/web\/status|\/i\/status|\/[^/]+\/status(?:es)?)\/(\d+)$/i);
    if (!m) return null;
    const tweetId = m[1];
    return { network: "x", canonical: `https://x.com/i/status/${tweetId}`, tweetId };
}
