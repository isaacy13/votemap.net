import assert from "node:assert/strict";
import { test } from "node:test";
import { isKeyedPost, parsePostUrl } from "../mvp/urls";
import { potHash } from "../mvp/issueId";
import { buildSnap } from "./snapshot";
import { applySnapWrite, selectIndex, type SnapRow } from "./store";

test("buildSnap uses JSON fields and ignores oembed html", async () => {
    const parsed = parsePostUrl("https://x.com/i/status/1234567890123456789");
    assert.ok(isKeyedPost(parsed));
    const row = await buildSnap(parsed, {
        html: "<p>steal me</p><script>alert(1)</script>",
        author_name: "Alice",
        author_url: "https://x.com/alice",
    });
    assert.equal(row.text, undefined);
    assert.equal(row.name, "Alice");
    assert.equal(row.handle, "alice");
    assert.equal(row.canonical, parsed.canonical);
    assert.equal(row.issueId, potHash(parsed.canonical));
    assert.equal(row.originalUrl, parsed.canonical);
});

test("buildSnap rejects JSON strings that contain markup", async () => {
    const parsed = parsePostUrl("https://www.tiktok.com/@vote_map/video/6718335390845095173");
    assert.ok(isKeyedPost(parsed) && parsed.network === "tiktok");
    const row = await buildSnap(parsed, {
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

test("twitter and x.com paste the same canonical pot key", () => {
    const a = parsePostUrl("https://twitter.com/alice/status/1234567890123456789");
    const b = parsePostUrl("https://x.com/bob/status/1234567890123456789");
    assert.ok(isKeyedPost(a) && isKeyedPost(b));
    assert.equal(a.canonical, "https://x.com/i/status/1234567890123456789");
    assert.equal(a.canonical, b.canonical);
    assert.equal(potHash(a.canonical), potHash(b.canonical));
});

test("X pasted handle is not stored — oEmbed author_url is", async () => {
    const parsed = parsePostUrl("https://twitter.com/mallory/status/1234567890123456789");
    assert.ok(isKeyedPost(parsed));
    assert.equal(parsed.handle, "mallory");
    const row = await buildSnap(parsed, {
        author_name: "Alice",
        author_url: "https://x.com/alice",
        created_at: "2009-01-01",
        date: "yesterday",
        text: "client text",
    });
    assert.equal(row.handle, "alice");
    assert.equal(row.canonical, "https://x.com/i/status/1234567890123456789");
    assert.equal(row.text, undefined);
    assert.notEqual(row.postedAt, Date.parse("2009-01-01"));
});

test("X path handle is dropped when oEmbed has no author", async () => {
    const parsed = parsePostUrl("https://x.com/mallory/status/1234567890123456789");
    assert.ok(isKeyedPost(parsed));
    const row = await buildSnap(parsed, {});
    assert.equal(row.handle, null);
    assert.equal(row.canonical, "https://x.com/i/status/1234567890123456789");
});

test("Instagram /user/p/ is keyed on /p/code — handle from oEmbed, not the paste", async () => {
    const parsed = parsePostUrl("https://www.instagram.com/mallory/p/CxYz0123456");
    assert.ok(isKeyedPost(parsed) && parsed.network === "instagram");
    assert.equal(parsed.canonical, "https://www.instagram.com/p/CxYz0123456");
    const row = await buildSnap(parsed, { author_name: "isaac_yeang", title: "hello from ig" });
    assert.equal(row.handle, "isaac_yeang");
    assert.equal(row.canonical, parsed.canonical);
    assert.equal(row.text, "hello from ig");
});

test("applySnapWrite keys only canonical — swapped originalUrl cannot poison another pot", () => {
    const snaps: Record<string, SnapRow> = {};
    const alice: SnapRow = {
        network: "x",
        postId: "1",
        canonical: "https://x.com/i/status/1",
        issueId: potHash("https://x.com/i/status/1"),
        originalUrl: "https://evil.example/steal",
        handle: "alice",
        postedAt: 10,
        text: "democratize everything",
        at: 1,
    };
    applySnapWrite(snaps, alice);
    assert.equal(Object.keys(snaps).join(), "https://x.com/i/status/1");
    assert.equal(snaps["https://x.com/i/status/1"].originalUrl, "https://x.com/i/status/1");
    assert.equal(snaps["https://evil.example/steal"], undefined);

    applySnapWrite(snaps, {
        ...alice,
        originalUrl: "https://x.com/i/status/1",
        canonical: "https://x.com/i/status/2",
        issueId: potHash("https://x.com/i/status/2"),
        postId: "2",
        handle: "mallory",
        text: "poison",
    });
    assert.equal(snaps["https://x.com/i/status/1"].handle, "alice");
    assert.equal(snaps["https://x.com/i/status/1"].text, "democratize everything");
    assert.equal(snaps["https://x.com/i/status/2"].handle, "mallory");
    assert.equal(snaps["https://x.com/i/status/2"].canonical, "https://x.com/i/status/2");

    applySnapWrite(snaps, {
        ...alice,
        handle: "mallory",
        text: "overwrite me",
        postedAt: 99,
    });
    assert.equal(snaps["https://x.com/i/status/1"].handle, "alice");
    assert.equal(snaps["https://x.com/i/status/1"].text, "democratize everything");
    assert.equal(snaps["https://x.com/i/status/1"].postedAt, 10);
});

test("selectIndex is LIMIT 50, newest postedAt, handle filter", () => {
    const rows: SnapRow[] = Array.from({ length: 60 }, (_, i) => ({
        network: "x",
        postId: String(i),
        canonical: `https://x.com/i/status/${1000 + i}`,
        issueId: potHash(`https://x.com/i/status/${1000 + i}`),
        originalUrl: `https://evil.example/poison/${i}`,
        handle: i % 2 ? "alice" : "bob",
        postedAt: 1_000 + i,
        at: 1,
    }));
    const page = selectIndex(rows, { limit: 50 });
    assert.equal(page.length, 50);
    assert.equal(page[0].postedAt, 1059);
    assert.equal(page[0].canonical, "https://x.com/i/status/1059");
    const alice = selectIndex(rows, { handle: "@Alice" });
    assert.ok(alice.length > 0);
    assert.ok(alice.every((r) => r.handle === "alice"));
    assert.ok(alice.length <= 50);
});
