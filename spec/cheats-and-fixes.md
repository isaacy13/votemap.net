# Where people cheat, and what to do

Locked v0: [requirements](./requirements.md). Diagrams: [flows](./flows.md). Later (not solved, unfinished): [later](./later.md). Open questions: [open.md](./open.md).

**No custody** (2026-10-19): VoteMap never holds USDC, so there is no pot balance, credit, or exit to cheat. What is left to cheat is the pledge (a promise) and the pay (a direct transfer). Coinbase: one personal account per person.

## Picker is the social @; chain dest is the wallet

User pays by **verified** IG / X / Threads / TikTok handle, **not** votemap @. Reverse lookup: social → votemap account → claimed wallet. **Confirm before send:** social @, muted votemap @, wallet, Coinbase country. USDC goes from the voter’s wallet straight to the **payout wallet**. Unbound / unverified social **cannot** be a pay dest. One social @ → one votemap account.

**Bind (hybrid, 2026-10-19):** X: a post carrying **`votemap/@handle` or `votemap.net/handle`**, read through free oEmbed. TikTok and Threads: OAuth (TikTok Login Kit, Threads API). Instagram (personal too): that token in the **bio**. **No comment fallback.** **No other social OAuth. No cold-DM. No paid X API.**

| | |
| --- | --- |
| Bind | X post text or Instagram bio must contain **`votemap/@handle` or `votemap.net/handle` as a whole token**; TikTok and Threads sign in with OAuth ([requirements](./requirements.md)). → that social is **verified for 60 days**, until the next check. Paste the post (X) or profile (Instagram) URL. We check while they’re logged in as that votemap account. **One social @ → one votemap account.** |
| Not bind | OAuth other than TikTok and Threads, cold-DM, paid X API, comment on `@vote_map`, any other fallback |
| Re-check | **Daily job** selects only binds whose 60 days are up (social binds and a bound website). Re-fetches those only. Still there → another 60 days, no user action. Gone → bind lapses. Does not scan every account. Does not re-fetch early. Does not verify every URL. The lag until the next check is accepted v0, not open. |
| FCFS votemap name | Squat-the-name is **v0-ok**. Squat-the-real-social still needs the bind. Not the pay picker. |
| Picker | **Verified social @** of that pot’s network. Not votemap @. Unbound / unverified cannot be picked. |
| Confirm | Social @, muted votemap @, wallet, Coinbase country |
| Chain dest | **Payout wallet** (`to` is the address). Lookup is off-chain. The router also checks a live Coinbase US badge on `to`. |
| Public official | Cannot be paid, through any account, shop, or wallet ([requirements](./requirements.md) item 27). |

Do **not** reopen fees for this.

---

## Locked

| Gap | Fix |
| --- | --- |
| Squat votemap `@nike` | FCFS. It’s their handle. Does **not** confer IG `@nike`. Not the pay picker. |
| Squat the real social | The bind: X post or Instagram bio with `votemap/@handle` or `votemap.net/handle`, or TikTok / Threads OAuth. Then they can be a **pay picker**. One social @ → one votemap account. No comment fallback. |
| Pay picker vs chain dest | Picker **is** the verified social @. Chain dest is the **claimed wallet**. Unbound / unverified cannot be picked. |
| Fake pot size | Pots show **backed** USDC: each wallet’s pledges count only up to what it holds on Base, pro rata across its open pledges. One $100 balance cannot back $100 on 50 pots. Revoked badge backs $0. |
| Pledge and walk away | Free to do, and public. Follow-through shows paid / disputed / silent on pots with an **accepted** claim (pledgers holding ⅓ of backed paid it). Silence costs reputation, not money. Expected payout weights each pledge by its pledger’s record. |
| Fake claim to shame pledgers | A claim only counts once pledgers with ⅓ of the pot’s backed dollars paid it, and any pledger can dispute it publicly. |
| Friend pass-through | No exit fee exists, so there is nothing to dodge. A round trip back to the payer’s wallets within 30 days is marked **returned** and does not count anywhere. Faking an accepted claim needs a third of the pot’s real backed money. |
| Signature replay | A pay sig names payer (`msg.sender`), nonce, deadline, chainId, and router. Works once. A stolen votemap key cannot move anyone else’s USDC. |
| Stuck exits | Nothing is held, so nothing can be stuck. One payee per pay; a blacklisted payee fails only that pay. |
| Unverified shop link | **Solved / v0.** A shop cannot be paid as a shop unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot. A street address is not a link and does not by itself disqualify a shop. The public payee picker is unchanged. |
| `$5` bakery | Pay **$5** for a **listed product**: $5 to the bakery’s payout wallet, one tx from the voter’s wallet, no fee. Pay is final. Do not tokenize the listing. |
| Self-pay | `to != msg.sender`, and the signer refuses this account’s own mapped wallets. |
| Malicious / fake embed URL | **Solved / v0.** Fetcher snapshot from **exact-host** allowlist. Never trust client handle/text/date. At first pledge: private / deleted / not embeddable → **no pot**. New URL = new pot; cannot overwrite another row. After pledges are in: [requirements](./requirements.md) item 25. |
| Public page | `votemap.net/@handle`. Verified marks in v0 are only TikTok, X, Threads, and Instagram, via the bind rule (X: a post carrying `votemap/@handle` or `votemap.net/handle`; TikTok and Threads: OAuth; Instagram: that token in the bio; 60 days, daily job on due binds only), and a website only if that site itself shows `votemap/@handle` or `votemap.net/handle` (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it. Pay picker still uses bio bind. **Shop is a catalog** (products: name, USDC price, physical or not, short text; off-chain; not a token). Not shipping / tax / themes / inventory / staff. License later. |
| Where the money went | **v0.** Rows are **pledge** / **cancel** (signed messages) and **pay** (router `Paid` events, only once on Base): action, from handle, to handle, amount, pot, tx hash. Page **shows the action label**. Names at that moment. Hash → **Basescan**. No-account hop is **unknown hands** (address, never a fake name). No trail score. Off-platform hops not shown. Bound socials from the pay lookup. Reads **`@isaac` paid `@grok`**. No archive node, no general USDC indexer, no hop explorer. No privacy hide. |
| Stolen self-custody key | The thief has the wallet’s USDC, as with any wallet. Votemap pays still need the phone and biometrics. |

---

## $100 pledge

| You do | Result |
| --- | --- |
| Pledge $100 on a post, 180-day expiry | Signed, no gas, USDC stays in your wallet. Pot shows up to $100 backed if you hold it |
| Pay $50 to A day 1, $25 to B day 2 | Two txs from your wallet. A gets $50, B gets $25. Your open pledge drops to $25 |
| Buy a $20 listed product at shop C | One tx: C gets $20. Final |
| Cancel the rest, or let it lapse | $0. Counts as silent on your follow-through if that pot has an accepted claim you did not dispute |
| Spend the USDC elsewhere | Your backed amount drops; pot shows less backed |

Do **not** add an exit fee back. Do **not** use a percentage to steer behavior. Do **not** hold USDC to enforce a pledge. Do **not** loop over payees in one call.
