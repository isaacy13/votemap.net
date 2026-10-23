# Browse filters: X, Threads, Instagram, TikTok

**Solved / v0** — [requirements](./requirements.md) items 22–25. Later (not solved, unfinished): [later.md](./later.md). Open questions: [open.md](./open.md). Save upfront. Don’t re-lookup all posts. Efficient, cheap, secure. **Don’t change the app in this note.**

**First pledge:** the **fetcher** fetches the snapshot from **exact-host-allowlisted** oEmbed / permalink hosts. **Never trust client-supplied handle / text / date.** One row: `network`, `handle`, `postedAt`, pot hash, one-line text. Browse = paged index (`LIMIT 50`). No refetch of 1M posts.

**Pot key** = network + post id ([requirements](./requirements.md) item 23). A different post = a different pot; cannot overwrite another post’s row. Resolve TikTok shorts once, then key the permalink. At first pledge: private / deleted / not embeddable → **no pot** ([requirements](./requirements.md) item 22). After pledges are in: [requirements](./requirements.md) item 25. **Malicious URL is solvable this way** — not an open cheat.

**v0 social bind:** [requirements](./requirements.md) item 6. **Hybrid (2026-10-19): X post with the token via free oEmbed, TikTok and Threads OAuth, Instagram bio. No comment fallback. No other social OAuth, no cold-DM, no paid X API.** **Pay picker** = verified social @ → confirm → payout wallet. **Public page** is `votemap.net/@handle` (links **and shop catalog**). Token text stays `votemap/@handle` or `votemap.net/handle`. Verified marks in v0 are only TikTok, X, Threads, and Instagram, via the bind rule (X: a post carrying `votemap/@handle` or `votemap.net/handle`; TikTok and Threads: OAuth; Instagram: that token in the bio; 60 days, daily job on due binds only), and a website only if that site’s owner puts `votemap/@handle` or `votemap.net/handle` in its DNS TXT record or `/.well-known/votemap.txt` (requirements item 6) (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it. The 60-day lag is accepted v0, not open. Shop on the page is v0: products (name, USDC price, physical or not, short text; off-chain; not a token). Not shipping, tax, themes, inventory sync, or staff accounts. License stays later.

**Why not scrape the live embed:** official widgets become **cross-origin iframes after hydrate**. Parent JS cannot read handle / date / caption from them. Snapshot at first pledge. Issue page may still render the embed.

Checked live 2026-09-29. How IDs decode is below.

---

## One-glance

| | Handle from URL? | Date from ID? | What JS actually gets | Snapshot at first pledge |
| --- | --- | --- | --- | --- |
| **X** | Only if paste still has `/{user}/status/`. Canonical `/i/status/{id}` has **none**. | **Yes** (Snowflake, ms) | **`react-tweet` = native DOM** from JSON. Official `widgets.js` = **iframe**. | Handle (+ text for cards) |
| **Threads** | **Yes** on `/@{user}/post/…`. No on short `/t/{code}`. | **Unofficial** shortcode (~1s) | oEmbed is a “View on Threads” shell → **iframe** | Text (handle already in URL) |
| **Instagram** | Only if paste is `/{user}/p/` or `/{user}/reel/`. Usual `/p/{code}` / `/reel/{code}` has **none**. Any content URL is in-spec, not Reels-only. | **Unofficial** shortcode (same as Threads) | oEmbed is a gray skeleton → **`embed.js` iframe**. No author, no caption in JSON. | Handle + text |
| **TikTok** | **Yes** on `/@{user}/video/` or `/photo/`. Short `vm.` / `vt.` / `/t/` need resolve first. | **Yes** (Snowflake, seconds) | oEmbed JSON has handle + title, then **`embed.js` iframe**. Also a player iframe by id. | Handle + text (oEmbed is enough) |

Pledge **time** (when money showed up) is a different filter from **post date**. Don’t mix them.

---

## Free from the URL (no API)

No network. Works on static export, on-chain URL, and deleted posts (the ID still decodes; it does not prove the post existed).

### X — `x.com/{user}/status/{id}` (also `twitter.com`, `/i/status/`)

- **Id** = the issue.
- **Date:** `(BigInt(id) >> 22n) + 1288834974657n` → ms. Twitter epoch 2010-11-04. Use `BigInt`, not `Number`.
- Live: `2024186960454021466` → `2026-02-18T18:19:13Z`, matches syndication.
- **Handle:** only in `/{user}/status/`. PR #102 stores `/i/status/{id}` so **today’s on-chain X URLs cannot be filtered by handle** unless we saved it elsewhere.
- Handle in the URL is paste-time (people rename). Don’t key pots by handle.

### Threads — `threads.net/@{user}/post/{shortcode}`

- **Handle** in the path. **Shortcode** = identity.
- **Date:** same unofficial Instagram shortcode clock as below.

### Instagram — any `instagram.com` content URL (`/p/`, `/reel/`, `/reels/`, `/tv/`, optional `/{user}/…` prefix)

- **Shortcode** = identity. Prefix (`p` vs `reel`) is cosmetic.
- **Handle** only if the path still has `/{user}/`. Canonical `/p/{code}` does not.
- **Date:** shortcode is Instagram’s media id (base64url). Top 41 bits are ms since `1314220021721` (2011-08-24). Shift `>> 23`. ~second accuracy, unpublished spec. Draft-then-publish can decode earlier than “went public.”
- Live: Threads launch shortcode `CuXFPIeLLod` → `2023-07-06 15:17:53 UTC`.

### TikTok — `tiktok.com/@{user}/video/{id}` or `/photo/{id}`

- **Handle** and **numeric id** in the permalink.
- **Date:** `(BigInt(id) >> 32n)` → Unix **seconds**.
- Live: `6718335390845095173` → `2019-07-27T13:32:33Z`.
- Short links (`vm.tiktok.com`, `vt.tiktok.com`, `/t/`) have **no id**. Resolve to the permalink **before** keying the pot (already in requirements). Never key on the short URL.

---

## What the embed actually gives JS

Official widgets are **iframes**. You cannot read handle / date / caption out of them after hydrate. Parse **before** the script runs, or don’t rely on the live embed for browse.

- **X `react-tweet` (what the landing already uses):** not an iframe. JSON tweet object in our JS: `user.screen_name`, ISO `created_at`, `text`, likes at that moment. Browser cannot hit syndication directly; it uses Vercel’s demo proxy. Fine for the issue page, **bad as the browse index**.
- **X official oEmbed** (`publish.x.com/oembed`, free): restores `author_url` → screen name even from `/i/status/{id}`. HTML has a coarse date. Then `widgets.js` replaces it with an iframe.
- **Threads oEmbed** (`graph.threads.net/oembed`, free, no token): keys are `html`, provider, type, width. **No author, no date, no text.** HTML is “View on Threads” + `embed.js`.
- **Instagram oEmbed** (`graph.facebook.com/instagram_oembed`, **tokenless since June 2026**): same shell as Threads. **`author_name` / caption were removed Nov 2025.** HTML is placeholder bars until `embed.js` builds an iframe. Works for `/p/` and `/reel/`.
- **TikTok oEmbed** (`tiktok.com/oembed`, free, no token): actually useful JSON — `author_unique_id` (`scout2015`), `author_name`, `title` (caption), thumbnail, `embed_product_id`. HTML is a blockquote, then `embed.js` → iframe. Player iframe `tiktok.com/player/v1/{id}` is also opaque.

There is no `react-tweet` equivalent for Threads, IG, or TikTok.

---

## Needs a paid API (or scraping — skip)

Do **not** take a paid X API dependency ([requirements](./requirements.md) item 6: **X API not used**).

| Want | Free? |
| --- | --- |
| Likes, replies, views, “viral,” refresh later | No. X syndication is a **point-in-time** count. IG/Threads/TikTok oEmbed don’t give counts we should trust. |
| Prove this @ is that person | **v0: bio** `votemap/@handle` or `votemap.net/handle` → **verified for 60 days** ([requirements](./requirements.md) item 6). Then they can be a **pay picker**. Chain dest is still the wallet. |
| Search posts we don’t already have | No. |
| Full long / note-tweet text | X syndication truncates. Official API or snapshot at paste. |
| Deleted / private posts | Id date still decodes. Embed/oEmbed just fail. **At first pledge:** no pot. **After pledges are in:** [requirements](./requirements.md) item 25. |
| IG/Threads lookup of **someone else’s** caption as a product API | Graph / Threads APIs are for **the app user’s own** content after Meta review — not “any public URL.” |
| TikTok research / display APIs | Paid / app-review. Unnecessary if we snapshot oEmbed once. |

Unofficial one-shots (X syndication, X oEmbed, TikTok oEmbed, IG public `og:title` / `og:description`) are **$0**. Fine **once per new pot**. Don’t poll them on every browse load. Don’t scrape login-walled HTML as a plan.

---

## Snapshot at first pledge (browse cards) — v0, solved

**Fetcher** fetches from exact-host-allowlisted oEmbed / permalink hosts. **Never trust the client** for handle / text / date. Pot key = network + post id (`keccak256("network:postId")`). A different post = a different pot; cannot overwrite another post’s row.

Write once, on first accepted pledge (API store, keyed by that hash):

| Field | Where it comes from | Why |
| --- | --- | --- |
| `network`, `postId` | URL parse | Identity |
| `canonical` | Same string as chain | Join to pot |
| `originalUrl` | What they pasted | Recover a dropped X/IG handle |
| `handle` | **Fetcher** oEmbed / permalink fetch (**not** client). **X:** keep `{user}` in paste for snapshot; pot key is the status id. **Threads / TikTok:** URL after fetcher fetch. **IG:** `/{user}/…` or public `og:description`, only after fetcher fetch. | Username filter + card |
| `postedAt` | X Snowflake / IG+Threads shortcode / TikTok `id >> 32` (server-parsed, not client) | Date filter with **no live refetch** |
| `text` | **X:** syndication / oEmbed HTML. **TikTok:** oEmbed `title`. **IG:** `og:title` / `og:description`. **Threads:** not in oEmbed — empty text ok if embed proved public. | Card preview if the embed dies |

If the snapshot fetch fails, **reject the pledge** (private / wrong host / failed embed). Do not store a client-typed handle. Do not backfill from the user.

Browse lists read **our** index. Re-render the live embed only on the issue screen. **Do not refetch 1M posts.**

v0 filters: **network, handle, post date**. No likes, no verified-only, no full-text search, no media-type.

---

## Isaac’s question

**Can we filter browse by username, post date, etc., or is that locked inside the embed iframe?**

**Solved / v0.** Snapshot at first pledge (item 25). **Why not scrape the live embed:** official widgets become **cross-origin iframes after hydrate** — parent JS cannot read them (item 23). Date is in the **id**. Handle is in the permalink (or signer snapshot). Caption is never in the URL — snapshot it. Locked paste formats: items 22–25.
