import assert from "node:assert/strict";
import { test } from "node:test";
import { BIND_TTL_MS, socialProfileUrl } from "../mvp/profile";
import { applyLinkPatch, publicCard, withProfile, type User } from "./store";

function user(partial: Partial<User> = {}): User {
    return withProfile({
        id: "u1",
        provider: "google",
        sub: "s",
        email: "a@b.c",
        name: "a",
        gender: 0,
        birthYear: 1990,
        phone: "+1",
        phoneVerified: true,
        handle: "isaac",
        payout: null,
        wallets: [],
        socials: { x: "", threads: "", instagram: "", tiktok: "" },
        binds: {
            x: { network: "x", handle: "isaac_yeang", at: 1, until: Date.now() + BIND_TTL_MS },
        },
        links: [],
        device: null,
        createdAt: 1,
        ...partial,
    });
}

test("applyLinkPatch cannot badge a raw URL as the bound social", () => {
    const u = user();
    applyLinkPatch(u, [
        { label: "X", url: "https://evil.example/steal", bindNetwork: "x", hidden: false },
        { label: "site", url: "https://onexengineering.com", hidden: false },
    ]);
    const x = u.links.find((l) => l.bindNetwork === "x");
    assert.equal(x?.url, socialProfileUrl("x", "isaac_yeang"));
    const card = publicCard(u);
    assert.ok(card);
    assert.equal(card.links[0].verified, true);
    assert.equal(card.links[0].url, "https://x.com/isaac_yeang");
    assert.equal(card.links[1].verified, false);
    assert.equal(card.links[1].url, "https://onexengineering.com/");
});

test("omitting a bind slot hides it and keeps the bind", () => {
    const u = user();
    applyLinkPatch(u, [{ label: "blog", url: "https://example.com/x", hidden: false }]);
    assert.ok(u.binds.x);
    const slot = u.links.find((l) => l.bindNetwork === "x");
    assert.equal(slot?.hidden, true);
    const card = publicCard(u);
    assert.ok(card);
    assert.equal(card.links.some((l) => l.verified), false);
    assert.equal(card.links[0].label, "blog");
});
