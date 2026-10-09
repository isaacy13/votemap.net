import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isLoginOrChallenge,
  profileBioText,
  type BioNetwork,
} from "./bio-bind.ts";

/**
 * CI always runs this file. Do not skip it and do not mock the GET.
 * A missing bio, an empty bio, a login shell, a challenge, or a non-200 fails the build.
 * These accounts do not carry a votemap token. A real bio string is enough.
 */
const LIVE_PROFILES: { name: string; url: string; network: BioNetwork }[] = [
  { name: "X", url: "https://x.com/XDevelopers", network: "x" },
  { name: "Threads", url: "https://www.threads.net/@zuck", network: "threads" },
  { name: "Instagram", url: "https://www.instagram.com/instagram/", network: "instagram" },
  { name: "TikTok", url: "https://www.tiktok.com/@tiktok", network: "tiktok" },
];

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml",
  "accept-language": "en-US,en;q=0.9",
};

describe("live profile bios", () => {
  for (const profile of LIVE_PROFILES) {
    it(`GET ${profile.name} and read the bio field`, { timeout: 30_000 }, async () => {
      const response = await fetch(profile.url, {
        headers: HEADERS,
        redirect: "follow",
      });
      const body = await response.text();
      const where = `${profile.name} status ${response.status} final ${response.url}`;
      assert.equal(response.status, 200, where);
      assert.equal(isLoginOrChallenge(body, response.url), false, `${where} is a login shell or challenge`);
      const bio = profileBioText(profile.network, body);
      assert.ok(bio !== null && bio.trim() !== "", `${where} bio field missing or empty`);
    });
  }
});
