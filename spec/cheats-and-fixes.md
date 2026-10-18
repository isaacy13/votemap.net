# Where people cheat, and what to do

Locked v0: [requirements](./requirements.md). Diagrams: [flows](./flows.md). Later (not solved, unfinished): [later](./later.md). Open questions: [open.md](./open.md).

Shop **credits are v0**. Coinbase: one personal account per person.

## Picker is the social @; chain dest is the wallet

User pays by **verified** IG / X / Threads / TikTok handle, **not** votemap @. Reverse lookup: social → votemap account → claimed wallet. **Confirm before send:** social @, muted votemap @, wallet, Coinbase country. USDC still to **claimed wallet**. Unbound / unverified social **cannot** be a pay dest. One social @ → one votemap account.

**Bind:** all four (personal IG too): **`votemap/@handle` or `votemap.net/handle` in bio**. Paste profile URL; we read the bio while they’re logged in. **No comment fallback.** **No social OAuth. No cold-DM. No paid X API.**

| | |
| --- | --- |
| Bind (all four, personal IG too) | Bio must contain **`votemap/@handle` or `votemap.net/handle` as a whole token** ([requirements](./requirements.md)). Either string → that social is **verified for 60 days**, until the next check. Paste profile URL. We check while they’re logged in as that votemap account. **One social @ → one votemap account.** |
| Not bind | Social OAuth, cold-DM, paid X API, comment on `@vote_map`, any other fallback |
| Re-check | **Daily job** selects only binds whose 60 days are up (bio and a bound website). Re-fetches those only. Still there → another 60 days, no user action. Gone → bind lapses. Does not scan every account. Does not re-fetch early. Does not verify every URL. The lag until the next check is accepted v0, not open. |
| FCFS votemap name | Squat-the-name is **v0-ok**. Squat-the-real-social still needs the bio. Not the pay picker. |
| Picker | **Verified social @** of that pot’s network. Not votemap @. Unbound / unverified cannot be picked. |
| Confirm | Social @, muted votemap @, wallet, Coinbase country |
| Chain dest | **Claimed wallet** (`to` is the address). Lookup is off-chain. |

Do **not** reopen fees for this.

---

## Locked

| Gap | Fix |
| --- | --- |
| Squat votemap `@nike` | FCFS. It’s their handle. Does **not** confer IG `@nike`. Not the pay picker. |
| Squat the real social | **Bio** `votemap/@handle` or `votemap.net/handle`. Then they can be a **pay picker**. One social @ → one votemap account. No comment fallback. |
| Pay picker vs chain dest | Picker **is** the verified social @. Chain dest is the **claimed wallet**. Unbound / unverified cannot be picked. |
| Shop vs bill same `pay` | First stake sets `shop` \| `public`. Shop: credit in the factory until that voter redeems. Public: EOA disperse. |
| `$5` bakery | Disperse **$5 → $5 credit** at that merchant. Spend on a **listed product**. Redeem can name the product and the price. Do not tokenize the listing. Redeem releases that price to that merchant (0%). Solved v0: Redeem is final. Once the voter taps redeem, the shop credit USDC leaves the VoteMap factory and is paid to that merchant’s payout wallet. No VoteMap refund, no chargeback, no second hold, no two-step escrow after redeem. Redeem is the purchase, and it is final. |
| Unverified shop link | **Solved / v0.** A shop cannot receive a bounty (shop disperse / redeem) unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot. A street address is not a link and does not by itself disqualify a shop. The public payee picker is unchanged. |
| Instant self-pay EOA | Shop: merchant cannot pull unspent credit. Same-account still blocked. |
| Cheap `move` off a shop | Shop leftover move = **5%**. Issued credit **cannot** move. No class hop. |
| Which baker on leftover cut | Picked list + wash guard. Shop cut = **extra credit**, not cash to an EOA. |
| Partial disperse | Already: $50 A day 1, $25 B day 2, before stake expiry |
| Instant dump to a solver | Each slice **vest 0–365 days**. 0 = now. Unvested stays in factory. |
| Malicious / fake embed URL | **Solved / v0.** Signer snapshot from **exact-host** allowlist. Never trust client handle/text/date. At stake time: private / deleted / not embeddable → **no pot**. New URL = new pot; cannot overwrite another row. After money is in: [open](./open.md). |
| Public page | `votemap.net/@handle`. Verified marks in v0 are only TikTok, X, Threads, and Instagram, via the bio rule (`votemap/@handle` or `votemap.net/handle` in that account bio, 60 days, daily job on due binds only), and a website only if that site itself shows `votemap/@handle` or `votemap.net/handle` (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it. Pay picker still uses bio bind. **Shop is a catalog** (products: name, USDC price, physical or not, short text; off-chain; not a token). Not shipping / tax / themes / inventory / staff. License later. |
| Where the money went | **v0.** Signer appends **one row** on stake / disperse / move / redeem: action (`stake` / `disperse` / `move` / `redeem`), from handle, to handle, amount, pot, tx hash. Page **shows the action label**. Names at that moment. Hash → **Basescan**. No-account hop is **unknown hands** (address, never a fake name). **Score** (visible only): share of these rows whose wallets are votemap accounts. No fee discount / rank prize / new fee. Off-platform hops not in the score. Bound socials from the pay lookup. Reads **`@isaac` paid `@grok`**. No archive node, no general USDC indexer, no hop explorer. No privacy hide. |
| Stolen self-custody key | leftover `withdrawEarly` only, not redeem |

---

## $100 shop

| You do | Result |
| --- | --- |
| Restake leftover | stays, $0 |
| Disperse $50 A day 1, $25 B day 2, vest 180d | credit/face locked to them; **unlocks linearly**; leftover still yours |
| Spend $20 on a listed product at A | A gets $20 USDC. You have $30 credit at A left |
| Leave leftover (never credited) | you −5%. Cut → extra credit at picked shops if `dispersed ≥ leftover`, else treasury |
| Try to cash issued credit | **no** |
| Friend’s shop | they get USDC only when **you** redeem |

Public pots: still 98.5% to the claimed wallet (same 1.5% tax).

Do **not** raise disperse to 5%. Do **not** EIP-712 leftover withdraw. Do **not** let the merchant drain unspent credit.
