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
