# Where people cheat, and what to do

Locked v0: [requirements](./requirements.md). Diagrams: [flows](./flows.md). Later (not solved, unfinished): [later](./later.md). Open questions: [open.md](./open.md).

**Locked pot** (2026-10-23): a pledge locks USDC in the PotVault, an immutable contract with no owner or admin key. Locked money leaves only to a payee the pledger picks, or back to the pledger at the expiry they chose. What is left to cheat is how that money is directed, and what the records say about it.

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
| Chain dest | **Payout wallet** (`to` is the address). Lookup is off-chain. The vault also checks a live Coinbase US badge on `to`. |
| Public official | Cannot be paid, through any account, shop, or wallet ([requirements](./requirements.md) item 27). |

Do **not** reopen fees for this.

---

## Locked

| Gap | Fix |
| --- | --- |
| Squat votemap `@nike` | FCFS. It’s their handle. Does **not** confer IG `@nike`. Not the pay picker. |
| Squat the real social | The bind: X post or Instagram bio with `votemap/@handle` or `votemap.net/handle`, or TikTok / Threads OAuth. Then they can be a **pay picker**. One social @ → one votemap account. No comment fallback. |
| Pay picker vs chain dest | Picker **is** the verified social @. Chain dest is the **claimed wallet**. Unbound / unverified cannot be picked. |
| Fake pot size | Pots show **locked** USDC: money actually deposited in the vault and not yet paid out, with each deposit’s expiry. |
| Pledge, claim, and pay abuse | See [Incentive scenarios](#incentive-scenarios) below. |
| Signature replay | A deposit or pay sig names payer (`msg.sender`), nonce, deadline, chainId, and vault. Works once. A stolen votemap key cannot move anyone else’s USDC. |
| Stuck exits | Nothing is held, so nothing can be stuck. One payee per pay; a blacklisted payee fails only that pay. |
| Unverified shop link | **Solved / v0.** A shop cannot be paid as a shop unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot. A street address is not a link and does not by itself disqualify a shop. The public payee picker is unchanged. |
| `$5` bakery | Pay **$5** for a **listed product**: $5 to the bakery’s payout wallet, one tx from the voter’s wallet, no fee. Pay is final. Do not tokenize the listing. |
| Self-pay | `to != msg.sender`; the signer refuses this account’s own and its linked accounts’ wallets; one account per Coinbase user ([requirements](./requirements.md) item 5). |
| Malicious / fake embed URL | **Solved / v0.** Fetcher snapshot from **exact-host** allowlist. Never trust client handle/text/date. At first pledge: private / deleted / not embeddable → **no pot**. New URL = new pot; cannot overwrite another row. After pledges are in: [requirements](./requirements.md) item 25. |
| Public page | `votemap.net/@handle`. Verified marks in v0 are only TikTok, X, Threads, and Instagram, via the bind rule (X: a post carrying `votemap/@handle` or `votemap.net/handle`; TikTok and Threads: OAuth; Instagram: that token in the bio; 60 days, daily job on due binds only), and a website only if that site’s owner puts `votemap/@handle` or `votemap.net/handle` in its DNS TXT record or `/.well-known/votemap.txt` (requirements item 6) (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it. Pay picker still uses bio bind. **Shop is a catalog** (products: name, USDC price, physical or not, short text; off-chain; not a token). Not shipping / tax / themes / inventory / staff. License later. |
| Where the money went | **v0.** Rows are **pledge** / **pay** / **refund** (vault events, only once on Base) and **decline** (signed messages): action, from handle, to handle, amount, pot, tx hash. Page **shows the action label**. Names at that moment. Hash → **Basescan**. No-account hop is **unknown hands** (address, never a fake name). No trail score. Off-platform hops not shown. Bound socials from the pay lookup. Reads **`@isaac` paid `@grok`**. No archive node, no general USDC indexer, no hop explorer. No privacy hide. |
| Stolen self-custody key | The thief has the wallet’s USDC, as with any wallet. Votemap pays still need the phone and biometrics. |

---

## $100 pledge

| You do | Result |
| --- | --- |
| Pledge $100 on a post, 180-day expiry | One deposit tx (cents of gas). $100 leaves your wallet and is locked in the vault. Pot shows $100 locked until that date |
| Pay $50 to A day 1, $25 to B day 2 | Two txs from your deposit. A gets $50, B gets $25. $25 stays locked |
| Buy a $20 listed product at shop C | One tx from the deposit (or your wallet): C gets $20. Final |
| Want the $25 back early | Not possible. It returns at day 180 |
| Day 180 | The $25 returns to your wallet automatically, no fee. If someone else claimed that pot, it counts as silent unless you gave a decline reason |

Do **not** add an exit fee back. Do **not** use a percentage to steer behavior. Do **not** give VoteMap any key that moves locked money. Do **not** loop over payees in one call.

---

## Incentive scenarios

Swept 2026-10-22, redone 2026-10-23 for the locked pot. Rules: [requirements](./requirements.md) items 9–11. **Solved** = the attack does not work. **Bounded** = it works but buys little and is visible. **No fix** = no design can stop it; why is stated.

**Money**

| # | Scenario | Verdict | How |
| --- | --- | --- | --- |
| 1 | Pledge money you don’t have, or one balance on many pots | Solved | A pledge is a deposit. The pot shows only money locked in the vault. |
| 2 | Lock money briefly to make a pot look big, then leave | Bounded | 7-day minimum, no early exit, and the pot shows how much unlocks on which date. |
| 3 | Pull money out just as the work lands | Solved | No cancel, lower, or withdraw before the expiry. |
| 4 | VoteMap takes or freezes locked money | Solved | The vault has no owner or admin key. The only exits are a payee the pledger picks or a refund to the pledger. |
| 5 | VoteMap goes down or disappears | Bounded | Pays pause; money waits until its expiry (at most 365 days), then anyone can refund it to the pledger with no VoteMap involved. |
| 6 | Bug in the vault | Bounded | Required outside audit, no upgrade key, caps of $5,000 per deposit and $250,000 total in bytecode. |
| 7 | VoteMap’s signer key stolen | Solved | Every deposit and pay must come from the pledger’s own wallet, so the thief can only bend rules on wallets they already control. |
| 8 | VoteMap’s signer key lost | Solved | Two fixed signers (primary and cold backup); if both are lost, money still refunds at expiry. |
| 9 | Someone else triggers a refund | Solved | Refund reverts before the expiry and only ever pays the depositing wallet. |
| 10 | Copy or front-run someone’s pay | Solved | The signature binds payer, payee, amount, nonce, deadline, chain, and vault; the payer’s wallet must send it. |
| 11 | Pay to a payee Circle blacklists | Solved | Only that pay fails; the money stays in the deposit. |
| 12 | Pledger loses their wallet keys | **No fix** | The refund goes to that wallet, as with any wallet. Nobody, VoteMap included, can redirect it. |
| 13 | Pot stopped for illegal content after money is locked | Solved | No new deposits or pays; locked money returns at each expiry. |

**Behavior**

| # | Scenario | Verdict | How |
| --- | --- | --- | --- |
| 14 | One whale looks like a crowd | Solved | Concentration (top person’s share of locked) on every pot. |
| 15 | Whale decides the outcome for everyone | Solved | No pot-level vote. Each record depends only on that pledger’s own acts. |
| 16 | Lock money, then let it all return without paying anyone | Bounded | Allowed by design (Isaac chose “locked till expiry” over forced payout). The solver knew the money was real until that date; the record shows it as silent and it cuts reliability in expected payout. |
| 17 | Honest “not done” or “not what I wanted” looks like ghosting | Solved | Decline with a preset reason; shown as declined, not silent. Taste is respected. |
| 18 | Paid in cash or off-platform, looks silent | Solved | Decline reason “paid outside votemap”: shown honestly, not counted as paid. |
| 19 | Pay $1 of $1,000 to look paid | Solved | Everything is in dollars: $1 paid, $999 silent or declined. |
| 20 | Pay yourself through a second account | Solved | One account per Coinbase user; linked phone, login, or wallet; signer refuses. If Coinbase refuses the OAuth app: Bounded (needs a second phone, login, and Coinbase account). |
| 21 | Pay a friend, get it back on-chain | Solved | Returned pays (to any linked wallet within 30 days) count nowhere. |
| 22 | Pay a friend, get it back in cash or via other wallets | **No fix** | While each pledger picks the payee, a sham pay to a real, separate person looks exactly like a real pay. Locking does not help: the vault releases to whoever the pledger picks. KYC and fees fail too. Bounded: half weight until the payee has 3 other payers, record vouches only at the scale earned (k = deposit size), payee age and payer count shown. |
| 23 | Friend ring (4+ KYC’d people) paying each other to look reliable | **No fix**, bounded | Beats the 3-payer rule. Costs four real identities, real money moved, and trust. Visible on the trail. |
| 24 | Fake generosity (“I gave $10k to the cause”) via a friend | **No fix**, bounded | Trail names the payee, shows no claim / payer count / account age. Readers judge. |
| 25 | Build a small honest record, then pledge big and ghost | Solved | k = max($100, deposit size): $100 of history barely moves a $10k deposit off the average. |
| 26 | Brand-new account looks as reliable as a veteran | Solved | Shrinkage toward the average. |
| 27 | Fake claim to make pledgers look silent | Solved | One prompt before expiry; any decline reason means not silent. Claims by linked accounts never count. |
| 28 | Claim spam / notification flood | Solved | One claim per account per pot, 20 open per account, daily digest. |
| 29 | Claimant’s friends pay them to look popular (herding) | Bounded | Claim split shows payer count and share of locked; information only. |
| 30 | Abusive decline text | Solved | Preset reasons, 140-char text under the stop rule. |
| 31 | VoteMap edits records quietly | Solved | Deposits, pays, and refunds are on-chain; a daily Merkle root of declines, claims, and stops goes on Base. Private account links are the only part outsiders cannot recompute. |
| 32 | A fee to deter sham pays | Rejected | A fee charges an honest pay exactly as much as a sham one. At 1.5% faking $10k costs $150; it would need ~20% to bite, which kills honest use. |
| 33 | Lost Google/Apple login makes a new account | Solved | Coinbase sign-in recovers the old account after 72 hours with email notice. |
| 34 | Two shops, one person | Later | One account per person in v0; multi-shop via Coinbase Business later. |
