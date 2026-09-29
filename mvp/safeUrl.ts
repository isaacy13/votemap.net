/** HTTPS URL checks for outbound fetches. Exact hosts only — no substring / startsWith. */

export function isTikTokFetchHost(host: string): boolean {
    switch (host) {
        case "vm.tiktok.com":
        case "vt.tiktok.com":
        case "www.tiktok.com":
        case "tiktok.com":
        case "m.tiktok.com":
            return true;
        default:
            return false;
    }
}

function isIpv4Literal(host: string): boolean {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

/**
 * Parse `raw` as https:// on an allowlisted hostname.
 * Rebuilds the URL so userinfo, hash, and odd ports cannot ride along.
 */
export function httpsOnHost(raw: string, hostOk: (host: string) => boolean): string | null {
    let u: URL;
    try {
        u = new URL(raw.trim());
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    if (u.username !== "" || u.password !== "") return null;
    if (u.port !== "" && u.port !== "443") return null;
    const host = u.hostname.toLowerCase();
    if (host.startsWith("[") || host.includes(":") || isIpv4Literal(host)) return null;
    if (!hostOk(host)) return null;
    const path = u.pathname || "/";
    return `https://${host}${path}${u.search}`;
}

/** Literal TikTok hosts only, rebuilt from the parsed URL. */
export function tiktokRequestUrl(raw: string): string | null {
    let u: URL;
    try {
        u = new URL(raw.trim());
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    if (u.username !== "" || u.password !== "") return null;
    if (u.port !== "" && u.port !== "443") return null;
    const host = u.hostname.toLowerCase();
    if (host.startsWith("[") || host.includes(":") || isIpv4Literal(host)) return null;
    const path = u.pathname || "/";
    const search = u.search;
    switch (host) {
        case "vm.tiktok.com":
            return `https://vm.tiktok.com${path}${search}`;
        case "vt.tiktok.com":
            return `https://vt.tiktok.com${path}${search}`;
        case "www.tiktok.com":
            return `https://www.tiktok.com${path}${search}`;
        case "tiktok.com":
            return `https://www.tiktok.com${path}${search}`;
        case "m.tiktok.com":
            return `https://m.tiktok.com${path}${search}`;
        default:
            return null;
    }
}

export const UA = "Mozilla/5.0 (compatible; votemap/0.1; +https://votemap.net)";
