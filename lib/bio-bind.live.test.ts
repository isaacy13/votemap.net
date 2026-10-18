import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isLoginOrChallenge,
  profileBioText,
  type BioNetwork,
} from "./bio-bind.ts";

/**
 * CI always runs this file. Do not skip it and do not mock the GET.
 * This is the scheduled server fetch, not a browser client.
 * A missing bio, an empty bio, a login shell, a challenge, or a non-200 fails the build.
 * These accounts do not carry a votemap token. A real bio string is enough.
 */
const LIVE_PROFILES: { name: string; url: string; network: BioNetwork }[] = [
  { name: "X", url: "https://x.com/XDevelopers", network: "x" },
  { name: "Threads", url: "https://www.threads.net/@zuck", network: "threads" },
  { name: "Instagram", url: "https://www.instagram.com/instagram/", network: "instagram" },
  { name: "TikTok", url: "https://www.tiktok.com/@tiktok", network: "tiktok" },
];

describe("live profile bios", () => {
  for (const profile of LIVE_PROFILES) {
    it(`GET ${profile.name} and read the bio field`, { timeout: 30_000 }, async () => {
      const response = await fetch(profile.url, { redirect: "follow" });
      const body = await response.text();
      const where = `${profile.name} status ${response.status} final ${response.url}`;
      assert.equal(response.status, 200, where);
      assert.equal(isLoginOrChallenge(body, response.url), false, `${where} is a login shell or challenge`);
      const bio = profileBioText(profile.network, body);
      assert.ok(bio !== null && bio.trim() !== "", `${where} bio field missing or empty`);
    });
  }
});
