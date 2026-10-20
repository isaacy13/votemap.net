# What v0 does not solve

Solved (v0 only): [requirements.md](./requirements.md). Later (not solved, unfinished): [later.md](./later.md). Open questions: [open.md](./open.md). Diagrams: [flows](./flows.md). Cheats (locked): [cheats-and-fixes.md](./cheats-and-fixes.md). This note is the gap between that slice and the [idea pile](./x-thread-product-ideas.md) / [custody](./fund-custody-design.md) / [identity](./wallet-identity-design.md) notes — not a second open list.

## Pledges, not a pool

v0 is **one pot per allowlisted URL** (X, Threads, Instagram, or TikTok), shown as **pledged** and **backed** USDC. VoteMap holds nothing (2026-10-19). Each pledge is a wallet-signed promise with a personal expiry. Each pay is one transaction from the voter’s wallet to one payee.

So v0 does not implement:

- Pay-only-when-done enforced by escrow (it is enforced by reputation: follow-through)
- Pay-only-when-done as a **group** decision
- Majority-to-withdraw + 7-day window
- Solver certainty that pledged money will arrive (backed amount and follow-through are the signal)
- Pro-rata refund of a pool (there is no pool to refund)
- Payer-named charity on timeout
- Time-bomb / unretrievable funds

## Identity is a badge, not the seat

v0: Coinbase **Verified Country on chain** (EAS `countryOk`) + unique votemap handle (FCFS; squat-the-name ok) + **hybrid bind** (X post with `votemap/@handle` or `votemap.net/handle` via free oEmbed; TikTok and Threads OAuth; Instagram bio; no comment fallback; **no other social OAuth, no cold-DM, no paid X API**). Verified marks in v0 are only TikTok, X, Threads, and Instagram, via the bind rule (X: a post carrying `votemap/@handle` or `votemap.net/handle`; TikTok and Threads: OAuth; Instagram: that token in the bio; 60 days, daily job on due binds only), and a website only if that site itself shows `votemap/@handle` or `votemap.net/handle` (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it. The 60-day lag is accepted v0, not open. **Public page** `votemap.net/@handle` (custom links **and shop catalog**). Shop register: Coinbase US on the payout wallet + merchant flag + address and/or website. A shop cannot be paid as a shop unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot. Shop lists products (name, USDC price, physical or not, short text; off-chain; not a token). Not shipping, tax, themes, inventory sync, or staff accounts. **Pay picker** = verified social @ (not votemap @). Reverse lookup → claimed wallet. Unbound / unverified cannot be picked. One social @ → one votemap account. Legal name is not a signup field.

Picker is the @; **chain dest** is the payout wallet (no social string in calldata). Public officials cannot be paid ([requirements](./requirements.md) item 27).

Later, unfinished (not solved) — license: [later.md](./later.md). Open: [open.md](./open.md).

## Custody / money movement

v0 has **no custody**. USDC stays in voters’ wallets until they pay. A pay goes through the PayRouter, which holds nothing: 98.5% to the payee’s **payout wallet** on a votemap account (not a social @), 1.5% to the treasury (address required at deploy), in one transaction. That matches “published fee, not a discretionary sweep,” with nothing for VoteMap to sweep.

v0 does not use escrow, a qualified custodian, fiat on-ramp, 1099 pipeline, yield, or YouTube / Facebook hosts (issue keys are **X, Threads, Instagram, TikTok**). Shop pays are pledge-to-purchase: pledge toward the outcome, pay the shop when you buy.

## Product surfaces from the pile that are absent

**Categories stay off v0** (solved). No entity hubs, no voter grades / shaming, no AI “what did you get done,” no transparency score, no shipping labels / tax / themes / inventory sync / staff accounts / a general Shopify clone, no sports/tax-credit skins, no free/low-price vote seat vs paid seat as two products. v0 **does** have a Linktree-like **public page** (`votemap.net/@handle`, links **and shop catalog**). Grouping is **allowlisted post URL** (X / Threads / Instagram / TikTok).

Pretty UI, vendor KYC / license, **general hop explorer** (beyond votemap’s own hops): [later.md](./later.md) (not solved). **Shop catalog on the public page is v0.** **Named who-paid-whom trail is v0.** **No custody, no vest (2026-10-19).**

## What v0 *does* lock so this list stays honest

Issue = canonical allowlisted URL (X, Threads, Instagram, TikTok). **No custody.** One immutable PayRouter on Base that holds nothing. Native USDC, min 1. Pledge = wallet-signed, personal expiry, no gas. Pot shows pledged and **backed**. **1.5% on pay, 0% on pledge / cancel / lapse**, to a **required** treasury. One payee per pay. User pays Base gas on pay. Pay sig binds payer, nonce, deadline, chainId, router. Coinbase US EAS on payer and payee, read by the router. Nothing personal on-chain. Signer key in KMS; fetcher isolated, public addresses only. No payouts to public officials. Bio bind (**verified for 60 days**; **daily job** re-fetches only due binds, bio and website; no comment fallback; no social OAuth / cold-DM / paid X API) + FCFS votemap handle; **public page** `votemap.net/@handle` (links **and shop catalog**); **pay picker = verified social @**; **chain dest = payout wallet**. Street **unverified**; website verified only under the rule above. Fetcher browse snapshot. **Named trail:** pledge / cancel rows from signed messages, pay rows from `Paid` events; page lists rows and shows the action label; hash → **Basescan**; no-account hop is **unknown hands** (address, never a fake name); no trail score; **follow-through** (visible only) per account; off-platform hops not shown; no archive node / USDC indexer / hop explorer. Bound socials from the pay lookup. No attester; no mock. Embeds. Static export. No seeded issues.
