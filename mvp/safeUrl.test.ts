import assert from "node:assert/strict";
import { test } from "node:test";
import { httpsOnHost, isTikTokFetchHost, tiktokRequestUrl } from "./safeUrl";

test("tiktokRequestUrl allows vm/vt/www shorts and rebuilds https", () => {
    assert.equal(tiktokRequestUrl("https://vm.tiktok.com/ZMabcdef/"), "https://vm.tiktok.com/ZMabcdef/");
    assert.equal(tiktokRequestUrl("https://vt.tiktok.com/ZMabcdef"), "https://vt.tiktok.com/ZMabcdef");
    assert.equal(
        tiktokRequestUrl("https://www.tiktok.com/t/ZTabcdef/"),
        "https://www.tiktok.com/t/ZTabcdef/",
    );
});

test("tiktokRequestUrl rejects open redirects, http, credentials, and other hosts", () => {
    assert.equal(tiktokRequestUrl("http://vm.tiktok.com/ZMabcdef"), null);
    assert.equal(tiktokRequestUrl("https://evil.example/vm.tiktok.com/x"), null);
    assert.equal(tiktokRequestUrl("https://127.0.0.1/x"), null);
    assert.equal(tiktokRequestUrl("https://user:pass@vm.tiktok.com/ZMabcdef"), null);
    assert.equal(tiktokRequestUrl("https://vm.tiktok.com:8443/ZMabcdef"), null);
    assert.equal(tiktokRequestUrl("https://nottiktok.com/t/x"), null);
});

test("httpsOnHost is exact-host, not a substring match", () => {
    const ok = (h: string) => h === "www.instagram.com";
    assert.equal(httpsOnHost("https://www.instagram.com/p/AbCdEf12345", ok), "https://www.instagram.com/p/AbCdEf12345");
    assert.equal(httpsOnHost("https://www.instagram.com.evil.example/p/AbCdEf12345", ok), null);
    assert.equal(httpsOnHost("https://evilwww.instagram.com/p/AbCdEf12345", ok), null);
    assert.equal(isTikTokFetchHost("vm.tiktok.com.evil.example"), false);
    assert.equal(isTikTokFetchHost("nottiktok.com"), false);
});
