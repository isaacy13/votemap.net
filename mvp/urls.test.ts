import assert from "node:assert/strict";
import { test } from "node:test";
import { formatPostedAt, issuePath, parsePostUrl, postedAtMs, postPreview } from "./urls";

test("accepts x.com status URLs and canonicalizes", () => {
    const p = parsePostUrl("https://x.com/isaac_yeang/status/1954029843701805328");
    assert.equal(p?.network, "x");
    assert.equal(p && "canonical" in p ? p.canonical : null, "https://x.com/i/status/1954029843701805328");
    assert.equal(p && "handle" in p ? p.handle : null, "isaac_yeang");
});

test("rewrites twitter.com to x.com canonical", () => {
    const p = parsePostUrl("https://twitter.com/vote_map/status/1234567890123456789");
    assert.equal(p?.network, "x");
    assert.equal(p && "canonical" in p ? p.canonical : null, "https://x.com/i/status/1234567890123456789");
});

test("accepts threads.net and threads.com posts", () => {
    const a = parsePostUrl("https://www.threads.net/@vote_map/post/C123abc");
    const b = parsePostUrl("https://threads.com/@vote_map/post/C123abc");
    assert.equal(a?.network, "threads");
    assert.equal(b?.network, "threads");
    assert.equal(a && "canonical" in a ? a.canonical : null, "https://www.threads.net/@vote_map/post/C123abc");
    assert.equal(a && "canonical" in a ? a.canonical : null, b && "canonical" in b ? b.canonical : null);
});

test("accepts Instagram posts, Reels, IGTV, and user-prefixed URLs — not Reels-only", () => {
    const post = parsePostUrl("https://instagram.com/p/AbCdEf12345");
    const reel = parsePostUrl("https://www.instagram.com/reel/AbCdEf12345/");
    const reels = parsePostUrl("https://www.instagram.com/reels/AbCdEf12345");
    const tv = parsePostUrl("https://www.instagram.com/tv/AbCdEf12345");
    const userP = parsePostUrl("https://www.instagram.com/vote_map/p/AbCdEf12345");
    assert.equal(post && "kind" in post ? post.kind : null, "p");
    assert.equal(post && "canonical" in post ? post.canonical : null, "https://www.instagram.com/p/AbCdEf12345");
    assert.equal(reel && "kind" in reel ? reel.kind : null, "reel");
    assert.equal(reel && "canonical" in reel ? reel.canonical : null, "https://www.instagram.com/reel/AbCdEf12345");
    assert.equal(reels && "canonical" in reels ? reels.canonical : null, "https://www.instagram.com/reel/AbCdEf12345");
    assert.equal(tv && "kind" in tv ? tv.kind : null, "p");
    assert.equal(userP && "handle" in userP ? userP.handle : null, "vote_map");
    assert.equal(userP && "canonical" in userP ? userP.canonical : null, "https://www.instagram.com/p/AbCdEf12345");
});

test("rejects Instagram profiles and other hosts", () => {
    assert.equal(parsePostUrl("https://instagram.com/vote_map"), null);
    assert.equal(parsePostUrl("https://github.com/isaacy13/votemap.net"), null);
    assert.equal(parsePostUrl("https://x.com/vote_map"), null);
    assert.equal(parsePostUrl("http://x.com/i/status/1"), null);
});

test("accepts TikTok permalinks and flags short links for resolve", () => {
    const v = parsePostUrl("https://www.tiktok.com/@vote_map/video/6718335390845095173");
    const photo = parsePostUrl("https://www.tiktok.com/@vote_map/photo/6718335390845095173");
    const vm = parsePostUrl("https://vm.tiktok.com/ZMabcdefg/");
    const vt = parsePostUrl("https://vt.tiktok.com/ZMabcdefg");
    const t = parsePostUrl("https://www.tiktok.com/t/ZTabcdef/");
    assert.equal(v?.network, "tiktok");
    assert.equal(v && "canonical" in v ? v.canonical : null, "https://www.tiktok.com/@vote_map/video/6718335390845095173");
    assert.equal(photo && "kind" in photo ? photo.kind : null, "photo");
    assert.equal(vm && "needsResolve" in vm && vm.needsResolve, true);
    assert.equal(vm && "canonical" in vm ? vm.canonical : "x", null);
    assert.equal(vt && "needsResolve" in vt && vt.needsResolve, true);
    assert.equal(t && "needsResolve" in t && t.needsResolve, true);
});

test("issuePath is a real /issue route, not /mvp?view=", () => {
    assert.equal(
        issuePath("https://x.com/i/status/1954029843701805328"),
        "/issue?u=https%3A%2F%2Fx.com%2Fi%2Fstatus%2F1954029843701805328",
    );
});

test("X snowflake and TikTok id decode post date", () => {
    const x = parsePostUrl("https://x.com/i/status/2024186960454021466");
    const ms = postedAtMs(x);
    assert.ok(ms);
    assert.equal(new Date(ms!).toISOString().slice(0, 19), "2026-02-18T18:19:13");
    const tt = parsePostUrl("https://www.tiktok.com/@scout2015/video/6718335390845095173");
    const tms = postedAtMs(tt);
    assert.ok(tms);
    assert.equal(new Date(tms!).toISOString(), "2019-07-27T13:32:33.000Z");
});

test("Instagram/Threads shortcode decodes post date", () => {
    const th = parsePostUrl("https://www.threads.net/@vote_map/post/CuXFPIeLLod");
    const ms = postedAtMs(th);
    assert.ok(ms);
    assert.equal(new Date(ms!).toISOString().slice(0, 19), "2023-07-06T15:17:53");
    assert.match(formatPostedAt(ms) || "", /2023/);
});

test("postPreview keeps the handle without needing an embed", () => {
    const url = "https://x.com/isaac_yeang/status/1954029843701805328";
    const parsed = parsePostUrl(url);
    assert.deepEqual(postPreview(url, parsed), { network: "X", handle: "@isaac_yeang" });
    assert.deepEqual(postPreview("https://x.com/i/status/1954029843701805328", parsePostUrl("https://x.com/i/status/1954029843701805328")), {
        network: "X",
        handle: null,
    });
    const th = parsePostUrl("https://www.threads.net/@vote_map/post/C123abc");
    assert.deepEqual(postPreview("https://www.threads.net/@vote_map/post/C123abc", th), {
        network: "Threads",
        handle: "@vote_map",
    });
    const ig = parsePostUrl("https://www.instagram.com/p/AbCdEf");
    assert.deepEqual(postPreview("https://www.instagram.com/p/AbCdEf", ig), {
        network: "Instagram",
        handle: null,
    });
    const igUser = parsePostUrl("https://www.instagram.com/vote_map/p/AbCdEf");
    assert.deepEqual(postPreview("https://www.instagram.com/vote_map/p/AbCdEf", igUser), {
        network: "Instagram",
        handle: "@vote_map",
    });
    const tt = parsePostUrl("https://www.tiktok.com/@vote_map/video/1234567890123456789");
    assert.deepEqual(postPreview("https://www.tiktok.com/@vote_map/video/1234567890123456789", tt), {
        network: "TikTok",
        handle: "@vote_map",
    });
});
