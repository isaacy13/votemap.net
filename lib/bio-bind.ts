/**
 * Exact bio-token match and profile-host check.
 * No bind path exists in this app yet, so nothing else calls this.
 */

const HANDLE_CHAR = /[A-Za-z0-9_]/;

/** Hosts the bio fetch may use. x.com and twitter.com are one network. */
export const BIO_NETWORK_HOSTS = {
  instagram: ["instagram.com"],
  x: ["x.com", "twitter.com"],
  threads: ["threads.net"],
  tiktok: ["tiktok.com"],
} as const;

export type BioNetwork = keyof typeof BIO_NETWORK_HOSTS;

export type ProfileFetchResponse = {
  /** Final URL after HTTP redirects, from the HTTP client. */
  responseUrl: string;
  body: string;
};

export type ProfileFetchClient = (
  url: string,
) => ProfileFetchResponse | Promise<ProfileFetchResponse>;

function networkForHost(hostname: string): BioNetwork | null {
  const host = hostname.toLowerCase();
  if (host.split(".").some((label) => label.startsWith("xn--"))) return null;
  for (const network of Object.keys(BIO_NETWORK_HOSTS) as BioNetwork[]) {
    const hosts: readonly string[] = BIO_NETWORK_HOSTS[network];
    if (hosts.includes(host)) return network;
  }
  return null;
}

function parsedHttpUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return url;
}

function hasWholeToken(text: string, token: string): boolean {
  let from = 0;
  while (from < text.length) {
    const at = text.indexOf(token, from);
    if (at === -1) return false;
    const next = text.charAt(at + token.length);
    if (!HANDLE_CHAR.test(next)) return true;
    from = at + 1;
  }
  return false;
}

/** True when `text` contains `votemap/@handle` or `votemap.net/handle` as a whole token. */
export function bioHasHandleToken(text: string, handle: string): boolean {
  if (!/^[A-Za-z0-9_]+$/.test(handle)) return false;
  return (
    hasWholeToken(text, `votemap/@${handle}`) ||
    hasWholeToken(text, `votemap.net/${handle}`)
  );
}

/**
 * Pasted host must be allowlisted before fetch. The final HTTP response host
 * must stay on that same network. HTML and JavaScript redirects are not followed.
 * A caller-supplied "where it ended" URL is not an input.
 */
export async function profileBioMatches(args: {
  profileUrl: string;
  handle: string;
  fetchProfile: ProfileFetchClient;
}): Promise<boolean> {
  const pasted = parsedHttpUrl(args.profileUrl);
  if (!pasted) return false;
  const network = networkForHost(pasted.hostname);
  if (!network) return false;

  let response: ProfileFetchResponse;
  try {
    response = await args.fetchProfile(pasted.href);
  } catch {
    return false;
  }

  const finalUrl = parsedHttpUrl(response.responseUrl);
  if (!finalUrl) return false;
  if (networkForHost(finalUrl.hostname) !== network) return false;
  return bioHasHandleToken(response.body, args.handle);
}
