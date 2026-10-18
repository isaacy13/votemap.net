import assert from "node:assert/strict";
import { test } from "node:test";
import { isTikTokHop, tiktokFromLocation, tiktokHopHref, tiktokPermalinkHref, tiktokShortHop } from "./safeUrl";

test("tiktokShortHop extracts ids; href is constant origin + code", () => {
    const vm = tiktokShortHop("https://vm.tiktok.com/ZMabcdef/");
    assert.deepEqual(vm, { fetch: "vm", code: "ZMabcdef" });
    assert.equal(tiktokHopHref(vm!), "https://vm.tiktok.com/ZMabcdef");
    const t = tiktokShortHop("https://www.tiktok.com/t/ZTabcdef/");
    assert.deepEqual(t, { fetch: "t", code: "ZTabcdef" });
    assert.equal(tiktokHopHref(t!), "https://www.tiktok.com/t/ZTabcdef");
    const vt = tiktokShortHop("https://vt.tiktok.com/ZMxyz123");
    assert.equal(tiktokHopHref(vt!), "https://vt.tiktok.com/ZMxyz123");
});

test("tiktokShortHop rejects other hosts, http, credentials, and extra path", () => {
    assert.equal(tiktokShortHop("http://vm.tiktok.com/ZMabcdef"), null);
    assert.equal(tiktokShortHop("https://evil.example/vm.tiktok.com/x"), null);
    assert.equal(tiktokShortHop("https://127.0.0.1/x"), null);
    assert.equal(tiktokShortHop("https://user:pass@vm.tiktok.com/ZMabcdef"), null);
    assert.equal(tiktokShortHop("https://nottiktok.com/t/ZTabcd"), null);
    assert.equal(tiktokShortHop("https://vm.tiktok.com/ZMabcdef/extra"), null);
    assert.equal(tiktokShortHop("https://vm.tiktok.com/@evil.com"), null);
});

test("Location is parsed to ids, never used as a fetch string", () => {
    const perm = tiktokFromLocation("https://www.tiktok.com/@vote_map/video/6718335390845095173");
    assert.ok(perm && !isTikTokHop(perm));
    if (perm && !isTikTokHop(perm)) {
        assert.equal(perm.handle, "vote_map");
        assert.equal(tiktokPermalinkHref(perm), "https://www.tiktok.com/@vote_map/video/6718335390845095173");
    }
    const rel = tiktokFromLocation("/t/ZTabcdef");
    assert.deepEqual(rel, { fetch: "t", code: "ZTabcdef" });
    assert.equal(tiktokFromLocation("https://evil.example/@vote_map/video/1"), null);
    assert.equal(tiktokFromLocation("https://evil.example/t/ZTabcdef"), null);
    assert.equal(tiktokFromLocation("//evil.example/t/ZTabcdef"), null);
    assert.equal(tiktokFromLocation("https://user:pass@vm.tiktok.com/ZMabcdef"), null);
    const nextHop = tiktokFromLocation("https://vm.tiktok.com/ZMnextcode");
    assert.deepEqual(nextHop, { fetch: "vm", code: "ZMnextcode" });
    assert.equal(tiktokHopHref(nextHop && isTikTokHop(nextHop) ? nextHop : { fetch: "vm", code: "nope" }), "https://vm.tiktok.com/ZMnextcode");
});
