# Where people cheat, and what to do

Locked v0: [requirements](./requirements.md). Diagrams: [flows](./flows.md). Later (not solved, unfinished): [later](./later.md). Open questions: [open.md](./open.md).

**No custody** (2026-10-19): VoteMap never holds USDC, so there is no pot balance, credit, or exit to cheat. What is left to cheat is the pledge (a promise) and the pay (a direct transfer). Coinbase: one personal account per person.

## Picker is the social @; chain dest is the wallet

User pays by **verified** IG / X / Threads / TikTok handle, **not** votemap @. Reverse lookup: social → votemap account → claimed wallet. **Confirm before send:** social @, muted votemap @, wallet, Coinbase country. USDC goes from the voter’s wallet straight to the **payout wallet**. Unbound / unverified social **cannot** be a pay dest. One social @ → one votemap account.

**Bind:** all four (personal IG too): **`votemap/@handle` or `votemap.net/handle` in bio**. Paste profile URL; we read the bio while they’re logged in. **No comment fallback.** **No social OAuth. No cold-DM. No paid X API.**

| | |
| --- | --- |
| Bind (all four, personal IG too) | Bio must contain **`votemap/@handle` or `votemap.net/handle` as a whole token** ([requirements](./requirements.md)). Either string → that social is **verified for 60 days**, until the next check. Paste profile URL. We check while they’re logged in as that votemap account. **One social @ → one votemap account.** |
| Not bind | Social OAuth, cold-DM, paid X API, comment on `@vote_map`, any other fallback |
| Re-check | **Daily job** selects only binds whose 60 days are up (bio and a bound website). Re-fetches those only. Still there → another 60 days, no user action. Gone → bind lapses. Does not scan every account. Does not re-fetch early. Does not verify every URL. The lag until the next check is accepted v0, not open. |
| FCFS votemap name | Squat-the-name is **v0-ok**. Squat-the-real-social still needs the bio. Not the pay picker. |
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
| Squat the real social | **Bio** `votemap/@handle` or `votemap.net/handle`. Then they can be a **pay picker**. One social @ → one votemap account. No comment fallback. |
| Pay picker vs chain dest | Picker **is** the verified social @. Chain dest is the **claimed wallet**. Unbound / unverified cannot be picked. |
| Fake pot size | Pots show **backed** USDC: each wallet’s pledges count only up to what it holds on Base, pro rata across its open pledges. One $100 balance cannot back $100 on 50 pots. Revoked badge backs $0. |
| Pledge and walk away | Free to do, and public. Follow-through shows paid ÷ pledged on pots where someone else paid a claimant. Silence costs reputation, not money. |
| Friend pass-through | No exit fee exists, so there is nothing to dodge. A round trip to a friend just costs 1.5% and shows on the trail. Wash pays to fake agreement are in [open](./open.md). |
| Signature replay | A pay sig names payer (`msg.sender`), nonce, deadline, chainId, and router. Works once. A stolen votemap key cannot move anyone else’s USDC. |
| Stuck exits | Nothing is held, so nothing can be stuck. One payee per pay; a blacklisted payee fails only that pay. |
| Unverified shop link | **Solved / v0.** A shop cannot be paid as a shop unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot. A street address is not a link and does not by itself disqualify a shop. The public payee picker is unchanged. |
| `$5` bakery | Pay **$5** for a **listed product**: $4.925 to the bakery’s payout wallet, $0.075 fee, one tx from the voter’s wallet. Pay is final. Do not tokenize the listing. |
| Self-pay | `to != msg.sender`, and the signer refuses this account’s own mapped wallets. |
| Malicious / fake embed URL | **Solved / v0.** Fetcher snapshot from **exact-host** allowlist. Never trust client handle/text/date. At first pledge: private / deleted / not embeddable → **no pot**. New URL = new pot; cannot overwrite another row. After pledges are in: [open](./open.md). |
| Public page | `votemap.net/@handle`. Verified marks in v0 are only TikTok, X, Threads, and Instagram, via the bio rule (`votemap/@handle` or `votemap.net/handle` in that account bio, 60 days, daily job on due binds only), and a website only if that site itself shows `votemap/@handle` or `votemap.net/handle` (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it. Pay picker still uses bio bind. **Shop is a catalog** (products: name, USDC price, physical or not, short text; off-chain; not a token). Not shipping / tax / themes / inventory / staff. License later. |
| Where the money went | **v0.** Rows are **pledge** / **cancel** (signed messages) and **pay** (router `Paid` events, only once on Base): action, from handle, to handle, amount, pot, tx hash. Page **shows the action label**. Names at that moment. Hash → **Basescan**. No-account hop is **unknown hands** (address, never a fake name). **Score** (visible only): share of these rows whose wallets are votemap accounts. No fee discount / rank prize / new fee. Off-platform hops not in the score. Bound socials from the pay lookup. Reads **`@isaac` paid `@grok`**. No archive node, no general USDC indexer, no hop explorer. No privacy hide. |
| Stolen self-custody key | The thief has the wallet’s USDC, as with any wallet. Votemap pays still need the phone and biometrics. |

---

## $100 pledge

| You do | Result |
| --- | --- |
| Pledge $100 on a post, 180-day expiry | Signed, no gas, USDC stays in your wallet. Pot shows up to $100 backed if you hold it |
| Pay $50 to A day 1, $25 to B day 2 | Two txs from your wallet. A gets $49.25, B gets $24.625, treasury the rest. Your open pledge drops to $25 |
| Buy a $20 listed product at shop C | One tx: C gets $19.70. Final |
| Cancel the rest, or let it lapse | $0. Shows on your follow-through if others paid a claimant on that pot |
| Spend the USDC elsewhere | Your backed amount drops; pot shows less backed |

Do **not** add an exit fee back. Do **not** hold USDC to enforce a pledge. Do **not** loop over payees in one call.
