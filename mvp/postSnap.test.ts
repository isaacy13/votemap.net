import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePostUrl } from "./urls";
import { snapFromTweet, snapFromUrl } from "./postSnap";

test("snapFromUrl uses baked X text even on canonical /i/status URLs", () => {
    const url = "https://x.com/i/status/2024186960454021466";
    const parsed = parsePostUrl(url);
    const snap = snapFromUrl(url, parsed);
    assert.equal(snap.network, "X");
    assert.equal(snap.handle, "@isaac_yeang");
    assert.equal(snap.name, "isaac");
    assert.match(snap.text ?? "", /i want in/);
});

test("snapFromUrl keeps Threads handle without inventing body text", () => {
    const url = "https://www.threads.net/@vote_map/post/C123abc";
    const snap = snapFromUrl(url, parsePostUrl(url));
    assert.equal(snap.network, "Threads");
    assert.equal(snap.handle, "@vote_map");
    assert.equal(snap.text, undefined);
});

test("snapFromTweet maps syndication JSON, not an iframe", () => {
    const snap = snapFromTweet({
        text: "hello from json",
        user: { name: "isaac", screen_name: "isaac_yeang", profile_image_url_https: "https://example.com/a.jpg" },
        photos: [{ url: "https://example.com/p.jpg" }],
    });
    assert.equal(snap.handle, "@isaac_yeang");
    assert.equal(snap.text, "hello from json");
    assert.equal(snap.mediaUrl, "https://example.com/p.jpg");
    assert.equal(snap.avatarUrl, "https://example.com/a.jpg");
});
