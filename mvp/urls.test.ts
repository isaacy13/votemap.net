import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePostUrl } from "./urls";

test("accepts x.com status URLs and canonicalizes", () => {
    const p = parsePostUrl("https://x.com/isaac_yeang/status/1954029843701805328");
    assert.equal(p?.network, "x");
    assert.equal(p?.canonical, "https://x.com/i/status/1954029843701805328");
});

test("rewrites twitter.com to x.com canonical", () => {
    const p = parsePostUrl("https://twitter.com/vote_map/status/1234567890123456789");
    assert.equal(p?.network, "x");
    assert.equal(p?.canonical, "https://x.com/i/status/1234567890123456789");
});

test("accepts threads.net and threads.com posts", () => {
    const a = parsePostUrl("https://www.threads.net/@vote_map/post/C123abc");
    const b = parsePostUrl("https://threads.com/@vote_map/post/C123abc");
    assert.equal(a?.network, "threads");
    assert.equal(b?.network, "threads");
    assert.equal(a?.canonical, "https://www.threads.net/@vote_map/post/C123abc");
    assert.equal(b?.canonical, a?.canonical);
});

test("rejects other hosts", () => {
    assert.equal(parsePostUrl("https://instagram.com/p/abc"), null);
    assert.equal(parsePostUrl("https://github.com/isaacy13/votemap.net"), null);
    assert.equal(parsePostUrl("https://x.com/vote_map"), null);
    assert.equal(parsePostUrl("http://x.com/i/status/1"), null);
});
