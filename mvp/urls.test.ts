import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePostUrl, normHandle } from "./urls.ts";

test("x.com status urls collapse to https://x.com/i/status/id", () => {
    const a = parsePostUrl("https://x.com/isaac_yeang/status/1954029843701805328?s=20");
    const b = parsePostUrl("https://x.com/i/status/1954029843701805328");
    const c = parsePostUrl("https://www.x.com/foo/statuses/1954029843701805328/");
    assert.equal(a?.canonical, "https://x.com/i/status/1954029843701805328");
    assert.equal(b?.canonical, a?.canonical);
    assert.equal(c?.canonical, a?.canonical);
    assert.equal(a?.network, "x");
});

test("twitter.com and other hosts are rejected", () => {
    assert.equal(parsePostUrl("https://twitter.com/isaac_yeang/status/1954029843701805328"), null);
    assert.equal(parsePostUrl("https://mobile.twitter.com/foo/status/1954029843701805328"), null);
    assert.equal(parsePostUrl("https://fxtwitter.com/foo/status/1954029843701805328"), null);
    assert.equal(parsePostUrl("https://mobile.x.com/foo/status/1954029843701805328"), null);
});

test("threads urls canonicalize", () => {
    const a = parsePostUrl("https://www.threads.net/@Vote_Map/post/CxgZjwPsIsA?x=1");
    assert.equal(a?.canonical, "https://www.threads.net/@vote_map/post/CxgZjwPsIsA");
    const b = parsePostUrl("https://threads.com/t/CxgZjwPsIsA");
    assert.equal(b?.canonical, "https://www.threads.net/t/CxgZjwPsIsA");
});

test("junk is rejected", () => {
    assert.equal(parsePostUrl("https://example.com"), null);
    assert.equal(parsePostUrl("not a url"), null);
});

test("handles drop @ and case", () => {
    assert.equal(normHandle("@Isaac_Yeang"), "isaac_yeang");
});
