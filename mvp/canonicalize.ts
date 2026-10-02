import https from "node:https";
import type { IncomingMessage, RequestOptions } from "node:http";
import { isKeyedPost, isTikTokShort, parsePostUrl } from "./urls";
import { isTikTokHop, tiktokFromLocation, tiktokPermalinkHref, tiktokShortHop, type TikTokHop, UA } from "./safeUrl";

function fail(status: number, error: string): never {
    throw Object.assign(new Error(error), { status });
}

const MAX_HOPS = 5;
const CODE = /^[A-Za-z0-9]{4,32}$/;
const HOP_HEADERS = { "user-agent": UA, accept: "text/html" };

function readLocation(res: IncomingMessage): string | null {
    const loc = res.headers.location;
    if (typeof loc === "string" && loc.length > 0) return loc;
    if (Array.isArray(loc) && loc[0]) return loc[0];
    return null;
}

function httpsLocation(opts: RequestOptions): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const req = https.request(opts, (res) => {
            res.resume();
            resolve(readLocation(res));
        });
        req.setTimeout(10_000, () => {
            req.destroy();
            reject(new Error("timeout"));
        });
        req.on("error", reject);
        req.end();
    });
}

/**
 * Literal hostname + charset-checked id. Never fetch(userString) or fetch(Location).
 * CodeQL does not treat allowlisted host concat as sanitizing fetch()'s URL argument.
 */
async function hopLocation(hop: TikTokHop): Promise<string | null> {
    const code = hop.code;
    if (!CODE.test(code)) fail(400, "TikTok short link did not resolve");
    if (hop.fetch === "vm") {
        return httpsLocation({
            protocol: "https:",
            hostname: "vm.tiktok.com",
            path: "/" + code,
            method: "GET",
            headers: HOP_HEADERS,
        });
    }
    if (hop.fetch === "vt") {
        return httpsLocation({
            protocol: "https:",
            hostname: "vt.tiktok.com",
            path: "/" + code,
            method: "GET",
            headers: HOP_HEADERS,
        });
    }
    return httpsLocation({
        protocol: "https:",
        hostname: "www.tiktok.com",
        path: "/t/" + code,
        method: "GET",
        headers: HOP_HEADERS,
    });
}

/**
 * Resolve vm. / vt. / /t/ to a /@user/video|photo/ permalink.
 * Location is parsed to ids; the next request is rebuilt from constants + id.
 */
export async function resolveTikTokShort(raw: string): Promise<string> {
    const first = parsePostUrl(raw);
    if (isKeyedPost(first) && first.network === "tiktok") return first.canonical;
    if (!isTikTokShort(first)) fail(400, "not a TikTok short link");

    let hop = tiktokShortHop(raw);
    if (!hop) fail(400, "TikTok short link did not resolve");

    for (let i = 0; i < MAX_HOPS; i++) {
        let loc: string | null;
        try {
            loc = await hopLocation(hop);
        } catch {
            fail(400, "TikTok short link did not resolve");
        }
        if (!loc) fail(400, "TikTok short link did not resolve");
        const next = tiktokFromLocation(loc);
        if (!next) fail(400, "TikTok short link did not resolve");
        if (!isTikTokHop(next)) {
            const permalink = tiktokPermalinkHref(next);
            if (!permalink) fail(400, "TikTok short link did not resolve");
            return permalink;
        }
        hop = next;
    }
    fail(400, "TikTok short link did not resolve");
}
