/** Canonical site URL — used for absolute Open Graph / Twitter / sitemap URLs. */
export const SITE_URL = "https://votemap.net" as const;

export const SITE_NAME = "votemap" as const;

export const SITE_TAGLINE = "democratize everything" as const;

export const SITE_DESCRIPTION =
  "votemap is an open-source platform to democratize everything — vote for the future you want to see, reward problem-solvers, and put power back in the hands of the people." as const;

export const SITE_KEYWORDS = [
  "votemap",
  "democratize everything",
  "voting",
  "democracy",
  "collective decision making",
  "open source",
  "problem solvers",
  "on-chain transparency",
  "civic tech",
  "future of voting",
] as const;

/** Primary share image — 1200×630 (Open Graph / Twitter large card). */
export const OG_IMAGE = {
  url: `${SITE_URL}/images/og-image.png`,
  width: 1200,
  height: 630,
  alt: "votemap — democratize everything",
  type: "image/png",
} as const;

export const TWITTER_HANDLE = "@vote_map" as const;

export const SOCIAL_LINKS = [
  "https://x.com/vote_map",
  "https://threads.com/@vote_map",
  "https://instagram.com/vote_map",
  "https://github.com/isaacy13/votemap.net",
] as const;

export const ORGANIZATION_NAME = "OneX Engineering" as const;
