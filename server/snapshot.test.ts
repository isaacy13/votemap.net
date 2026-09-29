import assert from "node:assert/strict";
import { test } from "node:test";
import { isKeyedPost, parsePostUrl } from "../mvp/urls";
import { buildSnap } from "./snapshot";

test("buildSnap uses JSON fields and ignores oembed html", async () => {
    const parsed = parsePostUrl("https://x.com/i/status/1234567890123456789");
    assert.ok(isKeyedPost(parsed));
    const row = await buildSnap(parsed, parsed.canonical, {
        html: "<p>steal me</p><script>alert(1)</script>",
        author_name: "Alice",
        author_url: "https://x.com/alice",
    });
    assert.equal(row.text, undefined);
    assert.equal(row.name, "Alice");
    assert.equal(row.handle, "alice");
});

test("buildSnap rejects JSON strings that contain markup", async () => {
    const parsed = parsePostUrl("https://www.tiktok.com/@vote_map/video/6718335390845095173");
    assert.ok(isKeyedPost(parsed) && parsed.network === "tiktok");
    const row = await buildSnap(parsed, parsed.canonical, {
        author_unique_id: "other",
        author_name: "x<script>y",
        title: "hello",
        thumbnail_url: "https://evil.example/x.jpg",
        html: "<blockquote>nope</blockquote>",
    });
    assert.equal(row.name, undefined);
    assert.equal(row.text, "hello");
    assert.equal(row.mediaUrl, undefined);
    assert.equal(row.handle, "vote_map");
});
