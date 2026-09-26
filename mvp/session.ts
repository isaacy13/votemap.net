const KEY = "votemap.session";

export function readSessionToken(): string {
    if (typeof window === "undefined") return "";
    const u = new URL(window.location.href);
    const q = u.searchParams.get("token");
    if (q) {
        localStorage.setItem(KEY, q);
        u.searchParams.delete("token");
        window.history.replaceState({}, "", u.pathname + u.search + u.hash);
        return q;
    }
    return localStorage.getItem(KEY) || "";
}

export function clearSession() {
    localStorage.removeItem(KEY);
}

export function setView(params: Record<string, string | null>) {
    const u = new URL(window.location.href);
    for (const [k, v] of Object.entries(params)) {
        if (v === null || v === "") u.searchParams.delete(k);
        else u.searchParams.set(k, v);
    }
    window.history.pushState({}, "", u.pathname + u.search);
    window.dispatchEvent(new Event("votemap:nav"));
}
