import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bioHasHandleToken,
  isLoginOrChallenge,
  nextRetrieveFailedRetry,
  profileBioText,
  readProfileBio,
  recheckLapsesBind,
  scheduleBioReads,
  type BioNetwork,
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
    assert.equal(bioHasHandleToken("bio says votemap/@ed, thanks", "ed"), true);
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
});

function page(network: BioNetwork, bio: string): string {
  if (network === "x") {
    return `<!doctype html><meta name="twitter:description" content="${bio}">`;
  }
  if (network === "tiktok") {
    return `<!doctype html><script type="application/json">{"user":{"shareMeta":{"desc":${JSON.stringify(bio)}}}}</script>`;
  }
  return `<!doctype html><meta name="description" content="${bio}">`;
}

function client(
  response: ProfileFetchResponse & { claimedFinalUrl?: string },
): ProfileFetchClient {
  return () => response;
}

const PLATFORMS: { network: BioNetwork; url: string }[] = [
  { network: "x", url: "https://x.com/ed" },
  { network: "threads", url: "https://threads.net/@ed" },
  { network: "instagram", url: "https://instagram.com/ed" },
  { network: "tiktok", url: "https://tiktok.com/@ed" },
];

describe("readProfileBio", () => {
  for (const { network, url } of PLATFORMS) {
    it(`${network} success when the bio field has the exact token`, async () => {
      const result = await readProfileBio({
        profileUrl: url,
        handle: "ed",
        fetchProfile: client({
          status: 200,
          responseUrl: url,
          body: page(network, "hello votemap/@ed"),
        }),
      });
      assert.equal(result, "success");
    });

    it(`${network} tag_missing when the bio field was read without the token`, async () => {
      const result = await readProfileBio({
        profileUrl: url,
        handle: "ed",
        fetchProfile: client({
          status: 200,
          responseUrl: url,
          body: page(network, "just a person"),
        }),
      });
      assert.equal(result, "tag_missing");
      assert.equal(recheckLapsesBind(result), true);
    });

    it(`${network} retrieve_failed when the bio field is missing`, async () => {
      const result = await readProfileBio({
        profileUrl: url,
        handle: "ed",
        fetchProfile: client({
          status: 200,
          responseUrl: url,
          body: "<!doctype html><title>Profile</title><p>no bio field</p>",
        }),
      });
      assert.equal(result, "retrieve_failed");
      assert.equal(recheckLapsesBind(result), false);
    });
  }

  it("decodes HTML entities before the token match", async () => {
    const result = await readProfileBio({
      profileUrl: "https://x.com/ed",
      handle: "ed",
      fetchProfile: client({
        status: 200,
        responseUrl: "https://x.com/ed",
        body: '<meta name="twitter:description" content="votemap&#47;@ed &amp; friends">',
      }),
    });
    assert.equal(result, "success");
    assert.equal(
      profileBioText("x", '<meta name="twitter:description" content="votemap&#47;@ed">'),
      "votemap/@ed",
    );
  });

  it("tag_missing when @ed is only a prefix inside @edward", async () => {
    const result = await readProfileBio({
      profileUrl: "https://x.com/ed",
      handle: "ed",
      fetchProfile: client({
        status: 200,
        responseUrl: "https://x.com/ed",
        body: page("x", "votemap/@edward"),
      }),
    });
    assert.equal(result, "tag_missing");
  });

  it("retrieve_failed on an off-host redirect even when the body has the token", async () => {
    const result = await readProfileBio({
      profileUrl: "https://instagram.com/ed",
      handle: "ed",
      fetchProfile: client({
        status: 200,
        responseUrl: "https://evil.example/ed",
        body: page("instagram", "votemap/@ed"),
        claimedFinalUrl: "https://instagram.com/ed",
      }),
    });
    assert.equal(result, "retrieve_failed");
  });

  it("retrieve_failed for a login shell that still has a description", async () => {
    const body =
      '<title>Log in</title><meta name="description" content="votemap/@ed"><input type="password">';
    assert.equal(isLoginOrChallenge(body), true);
    const result = await readProfileBio({
      profileUrl: "https://instagram.com/ed",
      handle: "ed",
      fetchProfile: client({
        status: 200,
        responseUrl: "https://instagram.com/accounts/login/",
        body,
      }),
    });
    assert.equal(result, "retrieve_failed");
  });

  it("retrieve_failed for non-200, empty body, and a network error", async () => {
    const denied = await readProfileBio({
      profileUrl: "https://threads.net/@ed",
      handle: "ed",
      fetchProfile: client({
        status: 403,
        responseUrl: "https://threads.net/@ed",
        body: page("threads", "votemap/@ed"),
      }),
    });
    const empty = await readProfileBio({
      profileUrl: "https://tiktok.com/@ed",
      handle: "ed",
      fetchProfile: client({
        status: 200,
        responseUrl: "https://tiktok.com/@ed",
        body: "   ",
      }),
    });
    const thrown = await readProfileBio({
      profileUrl: "https://x.com/ed",
      handle: "ed",
      fetchProfile: () => {
        throw new Error("offline");
      },
    });
    assert.equal(denied, "retrieve_failed");
    assert.equal(empty, "retrieve_failed");
    assert.equal(thrown, "retrieve_failed");
  });

  it("does not call fetch for a lookalike host", async () => {
    const calls: string[] = [];
    const fetchProfile: ProfileFetchClient = (url) => {
      calls.push(url);
      return { status: 200, responseUrl: url, body: page("instagram", "votemap/@ed") };
    };
    for (const profileUrl of [
      "https://instagram.com.evil.com/ed",
      "https://instagram.com@evil.com/ed",
      "https://іnstagram.com/ed",
    ]) {
      const result = await readProfileBio({ profileUrl, handle: "ed", fetchProfile });
      assert.equal(result, "retrieve_failed", profileUrl);
    }
    assert.deepEqual(calls, []);
  });

  it("does not follow an HTML redirect to find the token", async () => {
    const calls: string[] = [];
    const fetchProfile: ProfileFetchClient = (url) => {
      calls.push(url);
      return {
        status: 200,
        responseUrl: "https://instagram.com/ed",
        body: '<script>location.href="https://evil.example/secret"</script>',
      };
    };
    const result = await readProfileBio({
      profileUrl: "https://instagram.com/ed",
      handle: "ed",
      fetchProfile,
    });
    assert.equal(result, "retrieve_failed");
    assert.deepEqual(calls, ["https://instagram.com/ed"]);
  });

  it("passes a redirect that stays on the same network allowlist", async () => {
    const result = await readProfileBio({
      profileUrl: "https://twitter.com/ed",
      handle: "ed",
      fetchProfile: client({
        status: 200,
        responseUrl: "https://x.com/ed",
        body: page("x", "votemap.net/ed"),
      }),
    });
    assert.equal(result, "success");
  });

  it("X ignores a description meta that is not twitter:description", async () => {
    const result = await readProfileBio({
      profileUrl: "https://x.com/ed",
      handle: "ed",
      fetchProfile: client({
        status: 200,
        responseUrl: "https://x.com/ed",
        body: '<meta name="description" content="votemap/@ed">',
      }),
    });
    assert.equal(result, "retrieve_failed");
  });
});

describe("scheduleBioReads", () => {
  it("spaces a batch later on a fake clock instead of firing immediately", () => {
    const now = 1_000_000;
    const endOfDay = now + 86_400_000;
    const gapMs = 60_000;
    const slots = scheduleBioReads({
      binds: [
        { id: "a", host: "instagram.com" },
        { id: "b", host: "instagram.com" },
        { id: "c", host: "x.com" },
      ],
      now,
      endOfDay,
      gapMs,
    });
    const times = slots.map((slot) => slot.at);
    assert.equal(times.length, 3);
    for (const at of times) assert.ok(at > now);
    const sorted = [...times].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i] > sorted[i - 1]);
    }
    const sameHost = slots.filter((slot) => slot.host === "instagram.com");
    assert.ok(Math.abs(sameHost[1].at - sameHost[0].at) >= gapMs);
  });

  it("waits out the host gap and retries retrieve_failed later", () => {
    const now = 0;
    const gapMs = 10_000;
    const slots = scheduleBioReads({
      binds: [
        { id: "a", host: "tiktok.com" },
        { id: "b", host: "tiktok.com" },
      ],
      now,
      endOfDay: 40_000,
      gapMs,
      hostReadyAt: { "tiktok.com": 25_000 },
    });
    assert.ok(slots[0].at > now);
    assert.ok(slots[0].at >= 25_000);
    assert.ok(slots[1].at >= slots[0].at + gapMs);
    const retry = nextRetrieveFailedRetry({
      now,
      endOfDay: now + 3_600_000,
      gapMs,
    });
    assert.ok(retry > now);
    assert.ok(retry - now >= gapMs);
  });
});
