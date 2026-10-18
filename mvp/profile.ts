/** Public Linktree-like profile. Display links are not binds; pay lookup does not read this list. */

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

/** Bio re-check cadence is 60 days — not 90. */
export const BIND_TTL_MS = 60 * 24 * 60 * 60 * 1000;

export type SocialNet = "x" | "threads" | "instagram" | "tiktok";

export const SOCIAL_NETS: SocialNet[] = ["x", "threads", "instagram", "tiktok"];

export type Bind = {
    network: SocialNet;
    handle: string;
    at: number;
    until: number;
};

export type ProfileLink = {
    id: string;
    label: string;
    url: string;
    order: number;
    hidden: boolean;
    bindNetwork?: SocialNet | null;
};

export type PublicLink = {
    label: string;
    url: string;
    verified: boolean;
};

export type PublicCard = {
    handle: string;
    links: PublicLink[];
};

export type Binds = Partial<Record<SocialNet, Bind>>;

export function isSocialNet(v: unknown): v is SocialNet {
    return v === "x" || v === "threads" || v === "instagram" || v === "tiktok";
}

export function normHandle(raw: string): string {
    return raw.trim().replace(/^@/, "").toLowerCase();
}

export function profilePath(handle: string): string {
    return `/@${normHandle(handle)}`;
}

export function handleFromPathname(pathname: string): string | null {
    const m = pathname.match(/^\/@([A-Za-z0-9_]{3,20})\/?$/);
    if (!m) return null;
    const h = m[1].toLowerCase();
    return HANDLE_RE.test(h) ? h : null;
}

export function handleFromSearch(sp: URLSearchParams | { get(k: string): string | null }): string | null {
    const raw = normHandle(sp.get("h") || sp.get("u") || "");
    return HANDLE_RE.test(raw) ? raw : null;
}

export function socialLabel(net: SocialNet): string {
    if (net === "x") return "X";
    if (net === "threads") return "Threads";
    if (net === "instagram") return "Instagram";
    return "TikTok";
}

export function socialProfileUrl(net: SocialNet, handle: string): string {
    const h = normHandle(handle);
    if (net === "x") return `https://x.com/${h}`;
    if (net === "threads") return `https://www.threads.net/@${h}`;
    if (net === "instagram") return `https://www.instagram.com/${h}`;
    return `https://www.tiktok.com/@${h}`;
}

export function httpsHref(raw: string): string | null {
    let u: URL;
    try {
        u = new URL(raw.trim());
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    if (u.hostname.toLowerCase() === "localhost" || u.hostname === "127.0.0.1") return null;
    return u.href;
}

export function bindLive(b: Bind | undefined | null, now = Date.now()): b is Bind {
    return Boolean(b && HANDLE_RE.test(b.handle) && b.until > now);
}

export function asPublicLinks(input: { binds?: Binds; links?: ProfileLink[] }, now = Date.now()): PublicLink[] {
    const binds = input.binds || {};
    const rows = [...(input.links || [])].filter((l) => !l.hidden).sort((a, b) => a.order - b.order);
    return rows.map((l) => {
        const net = l.bindNetwork && isSocialNet(l.bindNetwork) ? l.bindNetwork : null;
        const bind = net ? binds[net] : undefined;
        const live = bindLive(bind, now);
        const canon = live && net ? socialProfileUrl(net, bind.handle) : null;
        const verified = Boolean(canon && l.url === canon);
        return { label: l.label, url: l.url, verified };
    });
}
