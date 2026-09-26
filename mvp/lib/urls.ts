/** Canonical X / Threads post URLs — the issue key. */

export type Network = "x" | "threads";

export type ParsedPost =
    | { network: "x"; canonical: string; tweetId: string }
    | { network: "threads"; canonical: string; permalink: string; handle: string | null; code: string };

export function normHandle(raw: string): string {
    return raw.trim().replace(/^@/, "").toLowerCase();
}

function strip(raw: string): string {
    try {
        const u = new URL(raw.trim());
        u.hash = "";
        u.search = "";
        const path = u.pathname.replace(/\/+$/, "");
        return `${u.protocol}//${u.host.toLowerCase()}${path}`;
    } catch {
        return raw.trim();
    }
}

export function parsePostUrl(raw: string): ParsedPost | null {
    const s = strip(raw);
    let m = s.match(
        /^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/(?:i\/web\/status|i\/status|[^/]+\/status(?:es)?)\/(\d+)$/i,
    );
    if (m) {
        const tweetId = m[1];
        return { network: "x", canonical: `https://x.com/i/status/${tweetId}`, tweetId };
    }

    m = s.match(
        /^https?:\/\/(?:www\.)?threads\.(?:net|com)\/@([^/]+)\/post\/([A-Za-z0-9_-]+)$/i,
    );
    if (m) {
        const handle = normHandle(m[1]);
        const code = m[2];
        const canonical = `https://www.threads.net/@${handle}/post/${code}`;
        return { network: "threads", canonical, permalink: canonical, handle, code };
    }

    m = s.match(/^https?:\/\/(?:www\.)?threads\.(?:net|com)\/t\/([A-Za-z0-9_-]+)$/i);
    if (m) {
        const code = m[1];
        const canonical = `https://www.threads.net/t/${code}`;
        return { network: "threads", canonical, permalink: canonical, handle: null, code };
    }

    return null;
}

export function networkByte(network: Network): number {
    return network === "x" ? 0 : 1;
}

export function networkName(n: number): Network {
    return n === 0 ? "x" : "threads";
}
