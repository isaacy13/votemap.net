import assert from "node:assert/strict";
import { test } from "node:test";
import {
    BIND_TTL_MS,
    asPublicLinks,
    bindLive,
    handleFromPathname,
    handleFromSearch,
    httpsHref,
    profilePath,
    socialProfileUrl,
    type Bind,
    type ProfileLink,
} from "./profile";

test("public path is /@handle on the votemap handle", () => {
    assert.equal(profilePath("Isaac_yeang"), "/@isaac_yeang");
    assert.equal(handleFromPathname("/@isaac_yeang"), "isaac_yeang");
    assert.equal(handleFromPathname("/isaac_yeang"), null);
    assert.equal(handleFromPathname("/browse"), null);
    assert.equal(handleFromSearch(new URLSearchParams("h=@Isaac_yeang")), "isaac_yeang");
});

test("bio bind ttl is 60 days, not 90", () => {
    assert.equal(BIND_TTL_MS, 60 * 24 * 60 * 60 * 1000);
    assert.notEqual(BIND_TTL_MS, 90 * 24 * 60 * 60 * 1000);
});

test("verified only when the shown URL is the live bio-bound canonical profile", () => {
    const now = 1_000_000;
    const binds = {
        x: { network: "x", handle: "isaac_yeang", at: now, until: now + BIND_TTL_MS } satisfies Bind,
    };
    const links: ProfileLink[] = [
        { id: "1", label: "X", url: socialProfileUrl("x", "isaac_yeang"), order: 0, hidden: false, bindNetwork: "x" },
        { id: "2", label: "site", url: "https://onexengineering.com/", order: 1, hidden: false },
        { id: "3", label: "fake", url: "https://evil.example/x", order: 2, hidden: false, bindNetwork: "x" },
        { id: "4", label: "hidden x", url: socialProfileUrl("x", "isaac_yeang"), order: 3, hidden: true, bindNetwork: "x" },
    ];
    const pub = asPublicLinks({ binds, links }, now + 1);
    assert.deepEqual(pub, [
        { label: "X", url: "https://x.com/isaac_yeang", verified: true },
        { label: "site", url: "https://onexengineering.com/", verified: false },
        { label: "fake", url: "https://evil.example/x", verified: false },
    ]);
});

test("hiding a social does not drop the bind; expired bind is not verified", () => {
    const now = 5_000;
    const binds = {
        instagram: { network: "instagram", handle: "vote_map", at: 1, until: now - 1 } satisfies Bind,
        tiktok: { network: "tiktok", handle: "vote_map", at: 1, until: now + BIND_TTL_MS } satisfies Bind,
    };
    assert.equal(bindLive(binds.instagram, now), false);
    assert.equal(bindLive(binds.tiktok, now), true);
    const pub = asPublicLinks(
        {
            binds,
            links: [
                {
                    id: "ig",
                    label: "Instagram",
                    url: socialProfileUrl("instagram", "vote_map"),
                    order: 0,
                    hidden: true,
                    bindNetwork: "instagram",
                },
                {
                    id: "tt",
                    label: "TikTok",
                    url: socialProfileUrl("tiktok", "vote_map"),
                    order: 1,
                    hidden: false,
                    bindNetwork: "tiktok",
                },
            ],
        },
        now,
    );
    assert.equal(pub.length, 1);
    assert.equal(pub[0].verified, true);
    assert.ok(binds.instagram);
});

test("httpsHref rejects non-https and credentials", () => {
    assert.equal(httpsHref("https://x.com/a"), "https://x.com/a");
    assert.equal(httpsHref("http://x.com/a"), null);
    assert.equal(httpsHref("javascript:alert(1)"), null);
    assert.equal(httpsHref("https://user:pass@evil.example/"), null);
});
