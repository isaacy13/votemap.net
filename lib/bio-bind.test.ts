import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bioHasHandleToken,
  profileBioMatches,
  type ProfileFetchClient,
  type ProfileFetchResponse,
} from "./bio-bind.ts";

describe("bioHasHandleToken", () => {
  it("matches exact votemap/@ed", () => {
    assert.equal(bioHasHandleToken("votemap/@ed", "ed"), true);
  });

  it("matches exact votemap.net/ed", () => {
    assert.equal(bioHasHandleToken("votemap.net/ed", "ed"), true);
  });

  it("does not match @ed inside @edward", () => {
    assert.equal(bioHasHandleToken("votemap/@edward", "ed"), false);
  });

  it("does not match votemap.net/ed inside votemap.net/edward", () => {
    assert.equal(bioHasHandleToken("votemap.net/edward", "ed"), false);
  });

  it("allows surrounding text", () => {
    assert.equal(
      bioHasHandleToken("bio says votemap/@ed, thanks", "ed"),
      true,
    );
    assert.equal(bioHasHandleToken("see votemap.net/ed.", "ed"), true);
  });

  it("does not match @ed2 as @ed", () => {
    assert.equal(bioHasHandleToken("votemap/@ed2", "ed"), false);
    assert.equal(bioHasHandleToken("votemap.net/ed2", "ed"), false);
  });

  it("is case-sensitive", () => {
    assert.equal(bioHasHandleToken("VoteMap/@ed", "ed"), false);
    assert.equal(bioHasHandleToken("votemap/@Ed", "ed"), false);
  });

  it("still matches a token inside markup", () => {
    const hidden = [
      "<!-- votemap/@ed -->",
      '<span style="display:none">votemap.net/ed</span>',
      '<script>var s = "votemap/@ed";</script>',
    ];
    for (const text of hidden) {
      assert.equal(bioHasHandleToken(text, "ed"), true);
    }
  });
});

function client(
  response: ProfileFetchResponse & { claimedFinalUrl?: string },
): ProfileFetchClient {
  return () => response;
}

describe("profileBioMatches", () => {
  it("fails when the body has the exact handle but the final host is off the allowlist", async () => {
    const ok = await profileBioMatches({
      profileUrl: "https://instagram.com/ed",
      handle: "ed",
      fetchProfile: client({
        responseUrl: "https://evil.example/ed",
        body: "votemap/@ed",
        claimedFinalUrl: "https://instagram.com/ed",
      }),
    });
    assert.equal(ok, false);
  });

  it("passes when the final host is allowlisted and the handle is exact", async () => {
    const ok = await profileBioMatches({
      profileUrl: "https://instagram.com/ed",
      handle: "ed",
      fetchProfile: client({
        responseUrl: "https://instagram.com/ed",
        body: "hello votemap/@ed",
      }),
    });
    assert.equal(ok, true);
  });

  it("fails a lookalike host before fetch", async () => {
    const calls: string[] = [];
    const fetchProfile: ProfileFetchClient = (url) => {
      calls.push(url);
      return { responseUrl: url, body: "votemap/@ed" };
    };
    const lookalikes = [
      "https://instagram.com.evil.com/ed",
      "https://instagram.com@evil.com/ed",
      "https://іnstagram.com/ed",
      "https://instagram.com%2eevil.com/ed",
    ];
    for (const profileUrl of lookalikes) {
      const ok = await profileBioMatches({
        profileUrl,
        handle: "ed",
        fetchProfile,
      });
      assert.equal(ok, false, profileUrl);
    }
    assert.deepEqual(calls, []);
  });

  it("still rejects a prefix handle on an allowlisted host", async () => {
    const ok = await profileBioMatches({
      profileUrl: "https://x.com/ed",
      handle: "ed",
      fetchProfile: client({
        responseUrl: "https://x.com/edward",
        body: "votemap/@edward",
      }),
    });
    assert.equal(ok, false);
  });

  it("does not let an HTTP redirect off the allowlist validate", async () => {
    const calls: string[] = [];
    const fetchProfile: ProfileFetchClient = (url) => {
      calls.push(url);
      if (calls.length > 1) {
        return {
          responseUrl: "https://instagram.com/ed",
          body: "votemap/@ed",
        };
      }
      return {
        responseUrl: "https://evil.example/phish",
        body: 'votemap/@ed <meta http-equiv="refresh" content="0;url=https://instagram.com/ed">',
      };
    };
    const ok = await profileBioMatches({
      profileUrl: "https://instagram.com/ed",
      handle: "ed",
      fetchProfile,
    });
    assert.equal(ok, false);
    assert.deepEqual(calls, ["https://instagram.com/ed"]);
  });

  it("does not follow an HTML or JavaScript redirect to find the token", async () => {
    const calls: string[] = [];
    const fetchProfile: ProfileFetchClient = (url) => {
      calls.push(url);
      if (url.startsWith("https://evil.example")) {
        return { responseUrl: url, body: "votemap/@ed" };
      }
      return {
        responseUrl: "https://instagram.com/ed",
        body: '<script>location.href="https://evil.example/secret"</script><meta http-equiv="refresh" content="0;url=https://evil.example/secret">',
      };
    };
    const ok = await profileBioMatches({
      profileUrl: "https://instagram.com/ed",
      handle: "ed",
      fetchProfile,
    });
    assert.equal(ok, false);
    assert.deepEqual(calls, ["https://instagram.com/ed"]);
  });

  it("passes a redirect that stays on the same network allowlist", async () => {
    const ok = await profileBioMatches({
      profileUrl: "https://twitter.com/ed",
      handle: "ed",
      fetchProfile: client({
        responseUrl: "https://x.com/ed",
        body: "votemap.net/ed",
      }),
    });
    assert.equal(ok, true);
  });

  it("fails a redirect onto a different network", async () => {
    const ok = await profileBioMatches({
      profileUrl: "https://instagram.com/ed",
      handle: "ed",
      fetchProfile: client({
        responseUrl: "https://x.com/ed",
        body: "votemap/@ed",
      }),
    });
    assert.equal(ok, false);
  });
});
