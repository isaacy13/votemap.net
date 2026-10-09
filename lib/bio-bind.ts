/**
 * Profile bio read: exact token, allowlisted host, and a paced recheck schedule.
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

export type BioReadResult = "success" | "tag_missing" | "retrieve_failed";

export type ProfileFetchResponse = {
  /** Final URL after HTTP redirects, from the HTTP client. */
  responseUrl: string;
  status: number;
  body: string;
};

export type ProfileFetchClient = (
  url: string,
) => ProfileFetchResponse | Promise<ProfileFetchResponse>;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
};

export function decodeHtmlEntities(text: string): string {
  let prev = "";
  let cur = text;
  for (let pass = 0; pass < 3 && cur !== prev; pass++) {
    prev = cur;
    cur = cur.replace(
      /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]+);/g,
      (all, body: string) => {
        if (body.startsWith("#")) {
          const hex = body[1] === "x" || body[1] === "X";
          const cp = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
          if (!Number.isInteger(cp) || cp < 0 || cp > 0x10ffff) return all;
          return String.fromCodePoint(cp);
        }
        return NAMED_ENTITIES[body] ?? all;
      },
    );
  }
  return cur;
}

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

/** A recheck lapses the bind only when the bio was read and the token was absent. */
export function recheckLapsesBind(result: BioReadResult): boolean {
  return result === "tag_missing";
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const key = match[1].toLowerCase();
    attrs[key] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function metaContent(html: string, metaName: string): string | null {
  const re = /<meta\b([^>]*)>/gi;
  const want = metaName.toLowerCase();
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const attrs = parseAttrs(match[1]);
    const name = attrs.name ?? attrs.property ?? "";
    if (name.toLowerCase() !== want || attrs.content === undefined) continue;
    return decodeHtmlEntities(attrs.content);
  }
  return null;
}

function balancedObject(text: string, start: number): string | null {
  if (text[start] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function shareMetaDesc(html: string): string | null {
  const key = '"shareMeta"';
  let from = 0;
  while (from < html.length) {
    const at = html.indexOf(key, from);
    if (at === -1) return null;
    const brace = html.indexOf("{", at + key.length);
    if (brace === -1) return null;
    const raw = balancedObject(html, brace);
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && "desc" in parsed) {
          const desc = (parsed as { desc?: unknown }).desc;
          if (typeof desc === "string") return decodeHtmlEntities(desc);
          return null;
        }
      } catch {
        // Keep scanning. A later shareMeta object may be real JSON.
      }
    }
    from = at + key.length;
  }
  return null;
}

/** Bio text from a profile page, or null when the platform field is missing. */
export function profileBioText(network: BioNetwork, html: string): string | null {
  if (network === "x") return metaContent(html, "twitter:description");
  if (network === "threads" || network === "instagram") {
    return metaContent(html, "description");
  }
  return shareMetaDesc(html);
}

export function isLoginOrChallenge(html: string, pageUrl?: string): boolean {
  if (pageUrl) {
    const url = parsedHttpUrl(pageUrl);
    if (url && /\/accounts\/login\b|\/i\/flow\/login\b|\/login\b/i.test(url.pathname)) {
      return true;
    }
  }
  if (/<input\b[^>]*\btype\s*=\s*["']?password\b/i.test(html)) return true;
  if (
    /cf-browser-verification|cf-challenge|challenge-platform|cdn-cgi\/challenge-platform|verify you are human|just a moment\.\.\./i.test(
      html,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Pasted host must be allowlisted before fetch. The final HTTP response host
 * must stay on that same network. HTML and JavaScript redirects are not followed.
 * A caller-supplied "where it ended" URL is not an input.
 */
export async function readProfileBio(args: {
  profileUrl: string;
  handle: string;
  fetchProfile: ProfileFetchClient;
}): Promise<BioReadResult> {
  const pasted = parsedHttpUrl(args.profileUrl);
  if (!pasted) return "retrieve_failed";
  const network = networkForHost(pasted.hostname);
  if (!network) return "retrieve_failed";

  let response: ProfileFetchResponse;
  try {
    response = await args.fetchProfile(pasted.href);
  } catch {
    return "retrieve_failed";
  }

  if (response.status !== 200) return "retrieve_failed";
  const finalUrl = parsedHttpUrl(response.responseUrl);
  if (!finalUrl) return "retrieve_failed";
  if (networkForHost(finalUrl.hostname) !== network) return "retrieve_failed";
  if (!response.body.trim()) return "retrieve_failed";
  if (isLoginOrChallenge(response.body, finalUrl.href)) return "retrieve_failed";

  const bio = profileBioText(network, response.body);
  if (bio === null) return "retrieve_failed";
  return bioHasHandleToken(bio, args.handle) ? "success" : "tag_missing";
}

export type ScheduledBioRead = { id: string; host: string; at: number };

/**
 * Spread due bio reads across the rest of the day.
 * Times are fake-clock milliseconds. Nothing sleeps here.
 */
export function scheduleBioReads(args: {
  binds: { id: string; host: string }[];
  now: number;
  endOfDay: number;
  gapMs: number;
  /** Earliest next start for a host: previous request finished, plus the gap. */
  hostReadyAt?: Readonly<Record<string, number>>;
}): ScheduledBioRead[] {
  const { binds, now, endOfDay, gapMs } = args;
  const ready = args.hostReadyAt ?? {};
  if (binds.length === 0) return [];
  const span = Math.max(endOfDay - now, gapMs, 1);
  const count = binds.length;
  const lastAt = new Map<string, number>();
  return binds.map((bind, index) => {
    const spreadAt = now + Math.round(((index + 1) / (count + 1)) * span);
    const afterSameHost = (lastAt.get(bind.host) ?? Number.NEGATIVE_INFINITY) + gapMs;
    const at = Math.max(spreadAt, ready[bind.host] ?? now + 1, afterSameHost, now + 1);
    lastAt.set(bind.host, at);
    return { id: bind.id, host: bind.host, at };
  });
}

/** A retrieve_failed retry is later the same day, not an immediate second hit. */
export function nextRetrieveFailedRetry(args: {
  now: number;
  endOfDay: number;
  gapMs: number;
}): number {
  const waited = args.now + Math.max(args.gapMs, 1);
  if (args.endOfDay > args.now && waited >= args.endOfDay) {
    return args.now + Math.max(1, Math.floor((args.endOfDay - args.now) / 2));
  }
  return waited;
}
