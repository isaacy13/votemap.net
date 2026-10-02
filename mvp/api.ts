import { apiUrl } from "./config";
import { readSessionToken } from "./session";
import type { Binds, ProfileLink } from "./profile";

export type Me = {
    id: string;
    provider: "google" | "apple";
    email: string;
    name: string;
    gender: number | null;
    birthYear: number | null;
    phone: string | null;
    phoneVerified: boolean;
    handle: string | null;
    payout: string | null;
    wallets: { address: string; linkedAt: number }[];
    socials: { x: string; threads: string; instagram: string; tiktok: string };
    binds: Binds;
    links: ProfileLink[];
    hasDevice: boolean;
};

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
    }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const base = apiUrl();
    if (!base) throw new ApiError(503, "Set NEXT_PUBLIC_API_URL to the votemap HTTP API.");
    const token = readSessionToken();
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    if (token) headers.set("authorization", `Bearer ${token}`);
    const res = await fetch(`${base}${path}`, { ...init, headers });
    const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
    if (!res.ok) throw new ApiError(res.status, body.error || res.statusText);
    return body;
}

export function me(): Promise<Me> {
    return api<Me>("/me");
}

export function health(): Promise<{ google: boolean; apple: boolean; sms: boolean; signer: boolean }> {
    return api("/health");
}
