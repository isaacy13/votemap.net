/**
 * Portable OAuth callback (vanilla HTTP).
 *
 * One function for X and Threads. Secrets come from `env` (process.env,
 * Lambda, Worker bindings — not Cloudflare KV or any vendor API).
 *
 * After OAuth, this process signs a handle↔wallet attestation. The static
 * app submits that signature on chain. No database.
 *
 * Node (from repo root):  node mvp/oauth/callback.mjs
 */

import { createServer } from "node:http";
import { encodeAbiParameters, keccak256, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const encoder = new TextEncoder();

function envOf(env, key, fallback = "") {
    return String(env[key] ?? fallback).trim();
}

function b64urlFromBytes(bytes) {
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesFromB64url(s) {
    const pad = s.replace(/-/g, "+").replace(/_/g, "/");
    const padded = pad + "=".repeat((4 - (pad.length % 4)) % 4);
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

async function aesKey(secret) {
    const hash = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
    return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function seal(obj, secret) {
    const key = await aesKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(obj))),
    );
    const packed = new Uint8Array(iv.length + ct.length);
    packed.set(iv, 0);
    packed.set(ct, iv.length);
    return b64urlFromBytes(packed);
}

async function unseal(token, secret) {
    const key = await aesKey(secret);
    const packed = bytesFromB64url(token);
    const iv = packed.slice(0, 12);
    const ct = packed.slice(12);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(pt));
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function html(status, body) {
    return new Response(
        `<!doctype html><meta charset="utf-8"><title>votemap oauth</title><pre>${escapeHtml(body)}</pre>`,
        { status, headers: { "content-type": "text/html; charset=utf-8" } },
    );
}

function redirect(url) {
    return new Response(null, { status: 302, headers: { location: url } });
}

function normHandle(raw) {
    return String(raw || "")
        .trim()
        .replace(/^@/, "")
        .toLowerCase();
}

function networkByte(network) {
    return network === "x" ? 0 : 1;
}

function pkceVerifier() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return b64urlFromBytes(bytes);
}

async function pkceChallenge(verifier) {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
    return b64urlFromBytes(new Uint8Array(digest));
}

function redirectUri(request, env) {
    const configured = envOf(env, "OAUTH_REDIRECT_URI");
    if (configured) return configured;
    const u = new URL(request.url);
    u.search = "";
    u.hash = "";
    return u.toString();
}

async function signBind(env, wallet, network, handle, deadline) {
    const key = envOf(env, "OAUTH_ATTESTER_PRIVATE_KEY");
    const contract = envOf(env, "VOTEMAP_CONTRACT");
    const chainId = BigInt(envOf(env, "CHAIN_ID", "84532"));
    if (!key || !contract) {
        throw new Error("OAUTH_ATTESTER_PRIVATE_KEY and VOTEMAP_CONTRACT are required to bind on chain");
    }
    const inner = keccak256(
        encodeAbiParameters(
            [
                { type: "address" },
                { type: "uint8" },
                { type: "bytes32" },
                { type: "uint64" },
                { type: "address" },
                { type: "uint256" },
            ],
            [
                wallet,
                networkByte(network),
                keccak256(stringToHex(handle)),
                BigInt(deadline),
                contract,
                chainId,
            ],
        ),
    );
    const account = privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`);
    const signature = await account.signMessage({ message: { raw: inner } });
    return signature;
}

async function startOAuth(request, env) {
    const url = new URL(request.url);
    const network = url.searchParams.get("network");
    const wallet = url.searchParams.get("wallet");
    if (network !== "x" && network !== "threads") return html(400, "network must be x or threads");
    if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) return html(400, "wallet required");

    const secret = envOf(env, "OAUTH_STATE_SECRET");
    if (!secret) return html(500, "OAUTH_STATE_SECRET is not set");

    const verifier = pkceVerifier();
    const state = await seal(
        { n: network, w: wallet.toLowerCase(), v: verifier, t: Date.now() },
        secret,
    );
    const redir = redirectUri(request, env);

    if (network === "x") {
        const clientId = envOf(env, "X_CLIENT_ID");
        if (!clientId) return html(500, "X_CLIENT_ID is not set");
        const challenge = await pkceChallenge(verifier);
        const dest = new URL("https://x.com/i/oauth2/authorize");
        dest.searchParams.set("response_type", "code");
        dest.searchParams.set("client_id", clientId);
        dest.searchParams.set("redirect_uri", redir);
        dest.searchParams.set("scope", "users.read tweet.read");
        dest.searchParams.set("state", state);
        dest.searchParams.set("code_challenge", challenge);
        dest.searchParams.set("code_challenge_method", "S256");
        return redirect(dest.toString());
    }

    const clientId = envOf(env, "THREADS_CLIENT_ID");
    if (!clientId) return html(500, "THREADS_CLIENT_ID is not set");
    const dest = new URL("https://www.threads.net/oauth/authorize");
    dest.searchParams.set("client_id", clientId);
    dest.searchParams.set("redirect_uri", redir);
    dest.searchParams.set("scope", "threads_basic");
    dest.searchParams.set("response_type", "code");
    dest.searchParams.set("state", state);
    return redirect(dest.toString());
}

async function fetchXHandle(env, code, verifier, redir) {
    const clientId = envOf(env, "X_CLIENT_ID");
    const clientSecret = envOf(env, "X_CLIENT_SECRET");
    const basic = btoa(`${clientId}:${clientSecret}`);
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redir,
        code_verifier: verifier,
        client_id: clientId,
    });
    const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
        method: "POST",
        headers: {
            authorization: `Basic ${basic}`,
            "content-type": "application/x-www-form-urlencoded",
        },
        body,
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenJson.error || JSON.stringify(tokenJson));
    const me = await fetch("https://api.x.com/2/users/me", {
        headers: { authorization: `Bearer ${tokenJson.access_token}` },
    });
    const meJson = await me.json();
    if (!me.ok) throw new Error(meJson.detail || JSON.stringify(meJson));
    return meJson.data?.username;
}

async function fetchThreadsHandle(env, code, redir) {
    const body = new URLSearchParams({
        client_id: envOf(env, "THREADS_CLIENT_ID"),
        client_secret: envOf(env, "THREADS_CLIENT_SECRET"),
        grant_type: "authorization_code",
        redirect_uri: redir,
        code,
    });
    const tokenRes = await fetch("https://graph.threads.net/oauth/access_token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenJson.error_message || JSON.stringify(tokenJson));
    const me = await fetch(
        `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${encodeURIComponent(tokenJson.access_token)}`,
    );
    const meJson = await me.json();
    if (!me.ok) throw new Error(meJson.error?.message || JSON.stringify(meJson));
    return meJson.username;
}

async function finishOAuth(request, env) {
    const url = new URL(request.url);
    if (url.searchParams.get("error")) {
        return html(400, url.searchParams.get("error_description") || url.searchParams.get("error"));
    }
    const code = url.searchParams.get("code");
    const stateTok = url.searchParams.get("state");
    if (!code || !stateTok) return html(400, "missing code/state");

    const secret = envOf(env, "OAUTH_STATE_SECRET");
    let state;
    try {
        state = await unseal(stateTok, secret);
    } catch {
        return html(400, "bad state");
    }
    if (Date.now() - Number(state.t) > 15 * 60 * 1000) return html(400, "state expired");

    const redir = redirectUri(request, env);
    let handle;
    try {
        handle =
            state.n === "x"
                ? await fetchXHandle(env, code, state.v, redir)
                : await fetchThreadsHandle(env, code, redir);
    } catch (e) {
        return html(502, `oauth token failed: ${e.message || e}`);
    }
    handle = normHandle(handle);
    if (!handle) return html(502, "provider did not return a username");

    const deadline = Math.floor(Date.now() / 1000) + 60 * 60;
    let sig;
    try {
        sig = await signBind(env, state.w, state.n, handle, deadline);
    } catch (e) {
        return html(500, e.message || String(e));
    }

    const app = envOf(env, "APP_ORIGIN", "http://localhost:3000").replace(/\/$/, "");
    const dest = new URL(`${app}/mvp`);
    // Hash, not query: attester signature should not hit CDN/access logs.
    dest.hash = new URLSearchParams({
        bind_network: state.n,
        bind_handle: handle,
        bind_deadline: String(deadline),
        bind_sig: sig,
        bind_wallet: state.w,
    }).toString();
    return redirect(dest.toString());
}

export async function handleRequest(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
        return html(405, "GET only");
    }
    const url = new URL(request.url);
    if (url.searchParams.get("action") === "start") return startOAuth(request, env);
    if (url.searchParams.has("code") || url.searchParams.has("error")) return finishOAuth(request, env);
    return html(
        200,
        "votemap oauth callback is up.\nGET ?action=start&network=x|threads&wallet=0x…",
    );
}

const port = Number(process.env.PORT || 8787);
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("callback.mjs")) {
    createServer(async (req, res) => {
        try {
            const host = req.headers.host || `127.0.0.1:${port}`;
            const url = new URL(req.url || "/", `http://${host}`);
            const headers = new Headers();
            for (const [k, v] of Object.entries(req.headers)) {
                if (typeof v === "string") headers.set(k, v);
            }
            const request = new Request(url, { method: req.method, headers });
            const response = await handleRequest(request, process.env);
            const buf = Buffer.from(await response.arrayBuffer());
            const out = {};
            response.headers.forEach((val, key) => {
                out[key] = val;
            });
            res.writeHead(response.status, out);
            res.end(buf);
        } catch (e) {
            console.error(e);
            res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
            res.end("internal error");
        }
    }).listen(port, () => {
        console.log(`votemap oauth listening on http://127.0.0.1:${port}`);
    });
}
