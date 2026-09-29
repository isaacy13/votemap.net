import { createPublicKey, createHmac, createHash, randomBytes, sign as cryptoSign, verify, createPrivateKey } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, keccak256, stringToHex, getAddress, verifyMessage, type Hex } from "viem";
import { base, baseSepolia } from "viem/chains";
import { voteMapAbi } from "../mvp/abi";
import { claimTypes, domain, payTypes, stakeTypes } from "../mvp/eip712";
import { chainName, contractAddress, rpcUrl } from "../mvp/config";
import { assertDeviceProof, fail } from "./proof";
import * as store from "./store";
import type { User } from "./store";
import { assertPubliclyEmbeddable, canonicalizePost, publicSnap, snapshotFirstStake } from "./snapshot";

const PORT = Number(process.env.PORT || 8787);

function trimSlashes(s: string): string {
    let n = s.length;
    while (n > 0 && s.charCodeAt(n - 1) === 47) n--;
    return s.slice(0, n);
}

const APP_ORIGINS = (process.env.APP_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((s) => trimSlashes(s.trim()))
    .filter(Boolean);
const SESSION_SECRET = process.env.SESSION_SECRET || "";
const SIGNER_PRIVATE_KEY = (process.env.SIGNER_PRIVATE_KEY || "") as Hex | "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || "";
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || "";
const APPLE_KEY_ID = process.env.APPLE_KEY_ID || "";
const APPLE_PRIVATE_KEY = (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM = process.env.TWILIO_FROM || "";
const TWILIO_VERIFY = process.env.TWILIO_VERIFY_SERVICE_SID || "";

const SPKI_P256 = Buffer.from("3059301306072a8648ce3d020106082a8648ce3d030107034200", "hex");

function envOn(v: string) {
    return Boolean(v);
}

function configured() {
    return {
        google: envOn(GOOGLE_CLIENT_ID) && envOn(GOOGLE_CLIENT_SECRET),
        apple: envOn(APPLE_CLIENT_ID) && envOn(APPLE_TEAM_ID) && envOn(APPLE_KEY_ID) && envOn(APPLE_PRIVATE_KEY),
        sms: envOn(TWILIO_SID) && envOn(TWILIO_TOKEN) && (envOn(TWILIO_FROM) || envOn(TWILIO_VERIFY)),
        signer: Boolean(SIGNER_PRIVATE_KEY && SESSION_SECRET && contractAddress()),
    };
}

function corsOrigin(req: IncomingMessage): string {
    const origin = trimSlashes(req.headers.origin || "");
    if (origin && APP_ORIGINS.includes(origin)) return origin;
    return APP_ORIGINS[0] || "*";
}

function json(res: ServerResponse, status: number, body: unknown) {
    const data = JSON.stringify(body);
    const origin = activeReq ? corsOrigin(activeReq) : APP_ORIGINS[0] || "*";
    res.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": origin,
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": "content-type, authorization",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "cache-control": "no-store",
        vary: "origin",
    });
    res.end(data);
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (c) => chunks.push(c as Buffer));
        req.on("end", () => {
            if (!chunks.length) return resolve({});
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>);
            } catch {
                reject(Object.assign(new Error("invalid json"), { status: 400 }));
            }
        });
        req.on("error", reject);
    });
}

function tokenFor(userId: string) {
    if (!SESSION_SECRET) fail(503, "SESSION_SECRET is required");
    const body = Buffer.from(JSON.stringify({ sub: userId, exp: Date.now() + 7 * 86400_000 })).toString("base64url");
    const sig = createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
    return `${body}.${sig}`;
}

function userIdFromAuth(req: IncomingMessage): string {
    if (!SESSION_SECRET) fail(503, "SESSION_SECRET is required");
    const h = req.headers.authorization || "";
    const raw = h.startsWith("Bearer ") ? h.slice(7) : "";
    const [body, sig] = raw.split(".");
    if (!body || !sig) fail(401, "sign in");
    const expect = createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
    if (expect !== sig) fail(401, "sign in");
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { sub?: string; exp?: number };
    if (!payload.sub || (payload.exp && payload.exp < Date.now())) fail(401, "sign in");
    return payload.sub;
}

async function needUser(req: IncomingMessage): Promise<User> {
    const id = userIdFromAuth(req);
    const u = await store.getUser(id);
    if (!u) fail(401, "sign in");
    return u;
}

function redirect(res: ServerResponse, url: string) {
    res.writeHead(302, { location: url });
    res.end();
}

function appleSecret(): string {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: APPLE_KEY_ID })).toString("base64url");
    const payload = Buffer.from(
        JSON.stringify({
            iss: APPLE_TEAM_ID,
            iat: now,
            exp: now + 86400 * 150,
            aud: "https://appleid.apple.com",
            sub: APPLE_CLIENT_ID,
        }),
    ).toString("base64url");
    const data = `${header}.${payload}`;
    const key = createPrivateKey(APPLE_PRIVATE_KEY);
    const sig = cryptoSign("SHA256", Buffer.from(data), { key, dsaEncoding: "ieee-p1363" });
    return `${data}.${Buffer.from(sig).toString("base64url")}`;
}

function verifyP256(pubkeyHex: string, message: Buffer, sigHex: string): boolean {
    let raw = Buffer.from(pubkeyHex.replace(/^0x/, ""), "hex");
    if (raw.length === 64) raw = Buffer.concat([Buffer.from([0x04]), raw]);
    if (raw.length !== 65 || raw[0] !== 0x04) return false;
    const key = createPublicKey({ key: Buffer.concat([SPKI_P256, raw]), format: "der", type: "spki" });
    const sig = Buffer.from(sigHex.replace(/^0x/, ""), "hex");
    try {
        return verify("sha256", message, key, sig);
    } catch {
        return false;
    }
}

function chain() {
    return chainName() === "base" ? base : baseSepolia;
}

function pub() {
    return createPublicClient({ chain: chain(), transport: http(rpcUrl()) });
}

function signerAccount() {
    if (!SIGNER_PRIVATE_KEY) fail(503, "SIGNER_PRIVATE_KEY is required");
    return privateKeyToAccount(SIGNER_PRIVATE_KEY);
}

function eipDomain() {
    const c = contractAddress();
    if (!c) fail(503, "NEXT_PUBLIC_VOTEMAP_CONTRACT is required");
    return domain(chain().id, c);
}

function oidcSubHash(provider: string, sub: string): Hex {
    return keccak256(stringToHex(`${provider}:${sub}`));
}

function phoneHash(phone: string): Hex {
    return keccak256(stringToHex(phone));
}

async function onChainNonce(staker: `0x${string}`): Promise<bigint> {
    const c = contractAddress();
    if (!c) fail(503, "contract");
    return (await pub().readContract({ address: c, abi: voteMapAbi, functionName: "nonces", args: [staker] })) as bigint;
}

function apiBase(req: IncomingMessage) {
    const host = req.headers.host || `127.0.0.1:${PORT}`;
    const proto = (req.headers["x-forwarded-proto"] as string) || "http";
    return `${proto}://${host}`;
}

function oauthCallback(req: IncomingMessage, provider: "google" | "apple") {
    return `${apiBase(req)}/auth/${provider}/callback`;
}

const lastSms = new Map<string, number>();
let activeReq: IncomingMessage | null = null;

async function handle(req: IncomingMessage, res: ServerResponse) {
    activeReq = req;
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (req.method === "OPTIONS") return json(res, 204, {});

    if (req.method === "GET" && url.pathname === "/health") {
        const c = configured();
        return json(res, 200, { ok: true, ...c, mock: false });
    }

    if (req.method === "GET" && url.pathname === "/me") {
        const u = await needUser(req);
        return json(res, 200, store.publicUser(u));
    }

    if (req.method === "GET" && url.pathname === "/auth/google") {
        if (!configured().google) fail(503, "Google OAuth env is not set");
        const st = randomBytes(16).toString("hex");
        const dest = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        dest.searchParams.set("client_id", GOOGLE_CLIENT_ID);
        dest.searchParams.set("redirect_uri", oauthCallback(req, "google"));
        dest.searchParams.set("response_type", "code");
        dest.searchParams.set("scope", "openid email profile");
        dest.searchParams.set("state", st);
        return redirect(res, dest.toString());
    }

    if (req.method === "GET" && url.pathname === "/auth/google/callback") {
        if (!configured().google) fail(503, "Google OAuth env is not set");
        const code = url.searchParams.get("code") || "";
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: oauthCallback(req, "google"),
                grant_type: "authorization_code",
            }),
        });
        const token = (await tokenRes.json()) as { id_token?: string };
        if (!token.id_token) fail(401, "google");
        const payload = JSON.parse(Buffer.from(token.id_token.split(".")[1], "base64url").toString("utf8")) as {
            sub: string;
            email?: string;
            name?: string;
            aud?: string;
        };
        if (payload.aud !== GOOGLE_CLIENT_ID) fail(401, "google aud");
        const user = await store.upsertOidc({
            provider: "google",
            sub: payload.sub,
            email: payload.email || "",
            name: payload.name || "",
        });
        return redirect(res, `${APP_ORIGINS[0]}/signup?token=${tokenFor(user.id)}`);
    }

    if (req.method === "GET" && url.pathname === "/auth/apple") {
        if (!configured().apple) fail(503, "Apple OAuth env is not set");
        const dest = new URL("https://appleid.apple.com/auth/authorize");
        dest.searchParams.set("client_id", APPLE_CLIENT_ID);
        dest.searchParams.set("redirect_uri", oauthCallback(req, "apple"));
        dest.searchParams.set("response_type", "code");
        dest.searchParams.set("response_mode", "query");
        dest.searchParams.set("scope", "name email");
        return redirect(res, dest.toString());
    }

    if (req.method === "GET" && url.pathname === "/auth/apple/callback") {
        if (!configured().apple) fail(503, "Apple OAuth env is not set");
        const code = url.searchParams.get("code") || "";
        const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: APPLE_CLIENT_ID,
                client_secret: appleSecret(),
                redirect_uri: oauthCallback(req, "apple"),
                grant_type: "authorization_code",
            }),
        });
        const token = (await tokenRes.json()) as { id_token?: string };
        if (!token.id_token) fail(401, "apple");
        const payload = JSON.parse(Buffer.from(token.id_token.split(".")[1], "base64url").toString("utf8")) as {
            sub: string;
            email?: string;
        };
        const user = await store.upsertOidc({
            provider: "apple",
            sub: payload.sub,
            email: payload.email || "",
            name: "",
        });
        return redirect(res, `${APP_ORIGINS[0]}/signup?token=${tokenFor(user.id)}`);
    }

    if (req.method === "GET" && url.pathname === "/posts/canonical") {
        const raw = url.searchParams.get("url") || "";
        const post = await canonicalizePost(raw);
        return json(res, 200, { canonical: post.canonical, network: post.network, postId: post.postId });
    }

    if (req.method === "GET" && url.pathname === "/posts/snap") {
        const raw = url.searchParams.get("url") || "";
        const post = await canonicalizePost(raw);
        const snap = await publicSnap(post.canonical);
        return json(res, 200, snap || { network: post.network, handle: "handle" in post ? post.handle : null, postedAt: null });
    }

    if (req.method === "GET" && url.pathname === "/posts/snaps") {
        const rows = await store.allSnaps();
        const out: Record<string, { network: string; handle: string | null; text?: string; name?: string; postedAt: number | null; mediaUrl?: string; avatarUrl?: string }> = {};
        for (const [k, v] of Object.entries(rows)) {
            out[k] = {
                network: v.network,
                handle: v.handle,
                text: v.text,
                name: v.name,
                postedAt: v.postedAt,
                mediaUrl: v.mediaUrl,
                avatarUrl: v.avatarUrl,
            };
        }
        return json(res, 200, out);
    }

    if (req.method === "POST" && url.pathname === "/profile/gender") {
        const u = await needUser(req);
        const body = await readBody(req);
        const gender = Number(body.gender);
        if (![0, 1, 2, 3].includes(gender)) fail(400, "gender");
        const next = await store.updateUser(u.id, (row) => {
            row.gender = gender;
        });
        return json(res, 200, store.publicUser(next));
    }

    if (req.method === "POST" && url.pathname === "/profile/birth-year") {
        const u = await needUser(req);
        const body = await readBody(req);
        const year = Number(body.birthYear);
        const now = new Date().getUTCFullYear();
        if (!Number.isInteger(year) || year < 1900 || year > now - 13) fail(400, "birth year");
        const next = await store.updateUser(u.id, (row) => {
            row.birthYear = year;
        });
        return json(res, 200, store.publicUser(next));
    }

    if (req.method === "POST" && url.pathname === "/otp/send") {
        const u = await needUser(req);
        if (u.gender === null || u.birthYear === null) fail(400, "finish gender and birth year first");
        if (!configured().sms) fail(503, "Twilio SMS env is not set");
        const body = await readBody(req);
        const phone = String(body.phone || "").trim();
        if (!/^\+[1-9]\d{7,14}$/.test(phone)) fail(400, "use E.164 like +15551234567");
        const prev = lastSms.get(phone) || 0;
        if (Date.now() - prev < 60_000) fail(429, "wait a minute");
        lastSms.set(phone, Date.now());
        await store.updateUser(u.id, (row) => {
            row.phone = phone;
            row.phoneVerified = false;
        });
        if (TWILIO_VERIFY) {
            const r = await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY}/Verifications`, {
                method: "POST",
                headers: {
                    authorization: "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64"),
                    "content-type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ To: phone, Channel: "sms" }),
            });
            if (!r.ok) fail(502, "twilio");
        } else {
            const code = String(Math.floor(100000 + Math.random() * 900000));
            const hash = createHash("sha256").update(code).digest("hex");
            await store.putOtp({ phone, userId: u.id, hash, exp: Date.now() + 10 * 60_000 });
            const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
                method: "POST",
                headers: {
                    authorization: "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64"),
                    "content-type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ To: phone, From: TWILIO_FROM, Body: `votemap code: ${code}` }),
            });
            if (!r.ok) fail(502, "twilio");
        }
        return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/otp/verify") {
        const u = await needUser(req);
        if (!u.phone) fail(400, "phone");
        const body = await readBody(req);
        const code = String(body.code || "").trim();
        if (!configured().sms) fail(503, "Twilio SMS env is not set");
        if (TWILIO_VERIFY) {
            const r = await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY}/VerificationCheck`, {
                method: "POST",
                headers: {
                    authorization: "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64"),
                    "content-type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ To: u.phone, Code: code }),
            });
            const out = (await r.json()) as { status?: string };
            if (out.status !== "approved") fail(401, "code");
        } else {
            const row = await store.takeOtp(u.id, u.phone);
            const hash = createHash("sha256").update(code).digest("hex");
            if (!row || row.hash !== hash) fail(401, "code");
        }
        const next = await store.updateUser(u.id, (row) => {
            row.phoneVerified = true;
        });
        return json(res, 200, store.publicUser(next));
    }

    if (req.method === "POST" && url.pathname === "/handle") {
        const u = await needUser(req);
        if (!u.phoneVerified) fail(400, "verify phone first");
        const body = await readBody(req);
        const handle = String(body.handle || "")
            .trim()
            .replace(/^@/, "")
            .toLowerCase();
        if (!/^[a-z0-9_]{3,20}$/.test(handle)) fail(400, "3–20 letters, numbers, underscore");
        if (await store.handleTaken(handle, u.id)) fail(409, "taken");
        const next = await store.updateUser(u.id, (row) => {
            row.handle = handle;
        });
        return json(res, 200, store.publicUser(next));
    }

    if (req.method === "POST" && url.pathname === "/socials") {
        const u = await needUser(req);
        const body = await readBody(req);
        const next = await store.updateUser(u.id, (row) => {
            for (const k of ["x", "threads", "instagram", "tiktok"] as const) {
                if (typeof body[k] === "string") row.socials[k] = String(body[k]).trim().replace(/^@/, "");
            }
        });
        return json(res, 200, store.publicUser(next));
    }

    if (req.method === "POST" && url.pathname === "/wallets/link") {
        const u = await needUser(req);
        const body = await readBody(req);
        const address = getAddress(String(body.address || ""));
        const message = String(body.message || "");
        const signature = String(body.signature || "") as Hex;
        if (!message.includes(address) || !message.includes("votemap") || !message.includes(u.id)) fail(400, "message");
        const ok = await verifyMessage({ address, message, signature });
        if (!ok) fail(401, "signature");
        const next = await store.updateUser(u.id, (row) => {
            if (!row.wallets.some((w) => w.address === address)) row.wallets.push({ address, linkedAt: Date.now() });
            if (!row.payout) row.payout = address;
        });
        return json(res, 200, store.publicUser(next));
    }

    if (req.method === "POST" && url.pathname === "/wallets/payout") {
        const u = await needUser(req);
        const body = await readBody(req);
        const address = getAddress(String(body.address || ""));
        if (!u.wallets.some((w) => w.address === address)) fail(400, "link it first");
        const next = await store.updateUser(u.id, (row) => {
            row.payout = address;
        });
        return json(res, 200, store.publicUser(next));
    }

    if (req.method === "POST" && url.pathname === "/sign/challenge") {
        const u = await needUser(req);
        const bytes = randomBytes(32).toString("hex");
        const c = await store.putChallenge(u.id, bytes);
        return json(res, 200, { challengeId: c.id, challenge: c.bytes, exp: c.exp });
    }

    if (req.method === "POST" && url.pathname === "/device/register") {
        const u = await needUser(req);
        const body = await readBody(req);
        const { challengeId, deviceSig } = assertDeviceProof(body);
        const pubkey = String(body.pubkey || "").trim();
        const platform = String(body.platform || "").trim();
        if (platform !== "ios" && platform !== "android") fail(400, "platform");
        const c = await store.takeChallenge(challengeId, u.id);
        if (!verifyP256(pubkey, Buffer.from(c.bytes, "hex"), deviceSig)) fail(401, "device");
        const next = await store.updateUser(u.id, (row) => {
            row.device = { pubkey, platform, at: Date.now() };
        });
        return json(res, 200, store.publicUser(next));
    }

    async function prove(req0: IncomingMessage, body: Record<string, unknown>, u: User) {
        const { challengeId, deviceSig } = assertDeviceProof(body);
        if (!u.device) fail(401, "register this phone first");
        const c = await store.takeChallenge(challengeId, u.id);
        if (!verifyP256(u.device.pubkey, Buffer.from(c.bytes, "hex"), deviceSig)) fail(401, "device");
    }

    if (req.method === "POST" && url.pathname === "/sign/stake") {
        const u = await needUser(req);
        if (!u.handle || !u.phoneVerified) fail(400, "finish signup");
        const body = await readBody(req);
        await prove(req, body, u);
        const staker = getAddress(String(body.staker || ""));
        if (!u.wallets.some((w) => w.address === staker)) fail(400, "link this wallet");
        const originalUrl = String(body.url || "");
        const post = await canonicalizePost(originalUrl);
        const embed = await assertPubliclyEmbeddable(post);
        await snapshotFirstStake(post, originalUrl, embed);
        const amount = BigInt(String(body.amount || "0"));
        const expiry = Number(body.expiry);
        if (amount < BigInt(1_000_000)) fail(400, "min 1 USDC");
        if (!Number.isInteger(expiry) || expiry * 1000 <= Date.now()) fail(400, "expiry");
        const nonce = await onChainNonce(staker);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 10 * 60);
        const signature = await signerAccount().signTypedData({
            domain: eipDomain(),
            types: stakeTypes,
            primaryType: "Stake",
            message: { staker, url: post.canonical, amount, expiry: BigInt(expiry), nonce, deadline },
        });
        return json(res, 200, { signature, nonce: nonce.toString(), deadline: Number(deadline), url: post.canonical });
    }

    if (req.method === "POST" && url.pathname === "/sign/pay") {
        const u = await needUser(req);
        const body = await readBody(req);
        await prove(req, body, u);
        const staker = getAddress(String(body.staker || ""));
        const solver = getAddress(String(body.solver || ""));
        const issueId = String(body.issueId || "") as Hex;
        if (!u.wallets.some((w) => w.address === staker)) fail(400, "link this wallet");
        const nonce = await onChainNonce(staker);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 10 * 60);
        const signature = await signerAccount().signTypedData({
            domain: eipDomain(),
            types: payTypes,
            primaryType: "Pay",
            message: { staker, issueId, solver, nonce, deadline },
        });
        return json(res, 200, { signature, nonce: nonce.toString(), deadline: Number(deadline) });
    }

    if (req.method === "POST" && url.pathname === "/sign/claim") {
        const u = await needUser(req);
        if (!u.handle || !u.phoneVerified || u.gender === null || u.birthYear === null) fail(400, "finish signup");
        const body = await readBody(req);
        await prove(req, body, u);
        const wallet = getAddress(String(body.wallet || ""));
        if (!u.wallets.some((w) => w.address === wallet)) fail(400, "link this wallet");
        const nonce = await onChainNonce(wallet);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 10 * 60);
        const signature = await signerAccount().signTypedData({
            domain: eipDomain(),
            types: claimTypes,
            primaryType: "Claim",
            message: {
                wallet,
                oidcSubHash: oidcSubHash(u.provider, u.sub),
                email: u.email,
                name: u.name,
                gender: u.gender,
                birthYear: u.birthYear,
                phoneHash: phoneHash(u.phone || ""),
                phoneVerified: true,
                nonce,
                deadline,
            },
        });
        return json(res, 200, {
            signature,
            nonce: nonce.toString(),
            deadline: Number(deadline),
            oidcSubHash: oidcSubHash(u.provider, u.sub),
            email: u.email,
            name: u.name,
            gender: u.gender,
            birthYear: u.birthYear,
            phoneHash: phoneHash(u.phone || ""),
            phoneVerified: true,
        });
    }

    fail(404, "not found");
}

const server = createServer((req, res) => {
    handle(req, res).catch((err: unknown) => {
        const status = (err as { status?: number }).status || 500;
        const message = err instanceof Error ? err.message : "error";
        json(res, status, { error: message });
    });
});

server.listen(PORT, () => {
    const c = configured();
    console.log(`votemap api http://127.0.0.1:${PORT} google=${c.google} apple=${c.apple} sms=${c.sms} signer=${c.signer}`);
});
