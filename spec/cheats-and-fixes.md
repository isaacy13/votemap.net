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
| Pledge, claim, and pay abuse | See [Incentive scenarios](#incentive-scenarios) below. |
| Signature replay | A pay sig names payer (`msg.sender`), nonce, deadline, chainId, and router. Works once. A stolen votemap key cannot move anyone else’s USDC. |
| Stuck exits | Nothing is held, so nothing can be stuck. One payee per pay; a blacklisted payee fails only that pay. |
| Unverified shop link | **Solved / v0.** A shop cannot be paid as a shop unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot. A street address is not a link and does not by itself disqualify a shop. The public payee picker is unchanged. |
| `$5` bakery | Pay **$5** for a **listed product**: $5 to the bakery’s payout wallet, one tx from the voter’s wallet, no fee. Pay is final. Do not tokenize the listing. |
| Self-pay | `to != msg.sender`; the signer refuses this account’s own and its linked accounts’ wallets; one account per Coinbase user ([requirements](./requirements.md) item 5). |
| Malicious / fake embed URL | **Solved / v0.** Fetcher snapshot from **exact-host** allowlist. Never trust client handle/text/date. At first pledge: private / deleted / not embeddable → **no pot**. New URL = new pot; cannot overwrite another row. After pledges are in: [requirements](./requirements.md) item 25. |
| Public page | `votemap.net/@handle`. Verified marks in v0 are only TikTok, X, Threads, and Instagram, via the bind rule (X: a post carrying `votemap/@handle` or `votemap.net/handle`; TikTok and Threads: OAuth; Instagram: that token in the bio; 60 days, daily job on due binds only), and a website only if that site’s owner puts `votemap/@handle` or `votemap.net/handle` in its DNS TXT record or `/.well-known/votemap.txt` (requirements item 6) (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it. Pay picker still uses bio bind. **Shop is a catalog** (products: name, USDC price, physical or not, short text; off-chain; not a token). Not shipping / tax / themes / inventory / staff. License later. |
| Where the money went | **v0.** Rows are **pledge** / **cancel** (signed messages) and **pay** (router `Paid` events, only once on Base): action, from handle, to handle, amount, pot, tx hash. Page **shows the action label**. Names at that moment. Hash → **Basescan**. No-account hop is **unknown hands** (address, never a fake name). No trail score. Off-platform hops not shown. Bound socials from the pay lookup. Reads **`@isaac` paid `@grok`**. No archive node, no general USDC indexer, no hop explorer. No privacy hide. |
| Stolen self-custody key | The thief has the wallet’s USDC, as with any wallet. Votemap pays still need the phone and biometrics. |

---

## $100 pledge

| You do | Result |
| --- | --- |
| Pledge $100 on a post, 180-day expiry | Signed, no gas, USDC stays in your wallet. Pot shows up to $100 backed if you hold it |
| Pay $50 to A day 1, $25 to B day 2 | Two txs from your wallet. A gets $50, B gets $25. Your open pledge drops to $25 |
| Buy a $20 listed product at shop C | One tx: C gets $20. Final |
| Cancel the rest, or let it lapse | $0. If someone else claimed that pot (up to 30 days later), the $25 counts as silent unless you give a decline reason. Cutting the pledge within 30 days before the claim does not shrink what counts |
| Spend the USDC elsewhere | Your backed amount drops; pot shows less backed |

Do **not** add an exit fee back. Do **not** use a percentage to steer behavior. Do **not** hold USDC to enforce a pledge. Do **not** loop over payees in one call.

---

## Incentive scenarios

Swept 2026-10-22. Rules: [requirements](./requirements.md) item 10. **Solved** = the attack does not work. **Bounded** = it works but buys little and is visible. **No fix** = no design can stop it; why is stated.

| # | Scenario | Verdict | How |
| --- | --- | --- | --- |
| 1 | Pledge more than you hold, or one balance on many pots | Solved | Backed = balance-capped, pro rata. |
| 2 | Move USDC between your wallets while the indexer reads, to count it twice | Solved | All balances in one refresh are read at one block. |
| 3 | Borrow USDC to look backed | Bounded | Costs interest, shows as concentration, drops when repaid. |
| 4 | One whale looks like a crowd | Solved | Concentration (top person’s share of backed) on every pot. |
| 5 | Whale decides the outcome for everyone | Solved | No pot-level vote. Each record depends only on that pledger’s own acts. |
| 6 | Pledge for the look, then ghost | Solved | Silent shows on the record and cuts reliability in expected payout. |
| 7 | Cancel or cut the pledge just before or after the work lands | Solved | Counted amount = highest amount from 30 days before the first claim. |
| 8 | Honest “not done” or “not what I wanted” looks like ghosting | Solved | Decline with a preset reason; shown as declined, not silent. Taste is respected. |
| 9 | Paid in cash or off-platform, looks silent | Solved | Decline reason “paid outside votemap”: shown honestly, not counted as paid. |
| 10 | Pay $1 of $1,000 to look paid | Solved | Everything is in dollars: $1 paid, $999 silent or declined. |
| 11 | Pay yourself through a second account | Solved | One account per Coinbase user; linked phone, login, or wallet; signer refuses. If Coinbase refuses the OAuth app: Bounded (needs a second phone, login, and Coinbase account). |
| 12 | Pay a friend, get it back on-chain | Solved | Returned pays (to any linked wallet within 30 days) count nowhere. |
| 13 | Pay a friend, get it back in cash or via other wallets | **No fix** | While each pledger freely picks the payee, a sham pay to a real, separate person looks exactly like a real pay. Escrow, KYC, and fees all fail here too. Bounded: half weight until the payee has 3 other payers, record vouches only at the scale earned (k = pledge size), payee age and payer count shown. |
| 14 | Friend ring (4+ KYC’d people) paying each other to look reliable | **No fix**, bounded | Beats the 3-payer rule. Costs four real identities, real money moved, and trust. Visible on the trail. |
| 15 | Fake generosity (“I gave $10k to the cause”) via a friend | **No fix**, bounded | Trail names the payee, shows no claim / payer count / account age. Readers judge. |
| 16 | Build a small honest record, then pledge big and ghost | Solved | k = max($100, pledge size): $100 of history barely moves a $10k pledge off the average. |
| 17 | Brand-new account looks as reliable as a veteran | Solved | Shrinkage toward the average. |
| 18 | Fake claim to make pledgers look silent | Solved | One end-of-pledge prompt; any decline reason means not silent. Claims by linked accounts never count. |
| 19 | Claim spam / notification flood | Solved | One claim per account per pot, 20 open per account, daily digest. |
| 20 | Claimant’s friends pay them to look popular (herding) | Bounded | Claim split shows payer count and share of backed; information only. |
| 21 | Abusive decline text | Solved | Preset reasons, 140-char text under the stop rule. |
| 22 | VoteMap edits records quietly | Solved | Daily Merkle root of signed pledges, cancels, declines, claims, and stops on Base; anyone can recompute except private account links. |
| 23 | Fee avoidance | Solved | No fee; tip optional. |
| 24 | A fee to deter sham pays | Rejected | A fee charges an honest pay exactly as much as a sham one. At 1.5% faking $10k costs $150; it would need ~20% to bite, which kills honest use. |
| 25 | Lost Google/Apple login makes a new account | Solved | Coinbase sign-in recovers the old account after 72 hours with email notice. |
| 26 | Two shops, one person | Later | One account per person in v0; multi-shop via Coinbase Business later. |
