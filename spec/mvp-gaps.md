# What v0 does not solve

Solved (v0 only): [requirements.md](./requirements.md). Later (not solved, unfinished): [later.md](./later.md). Open questions: [open.md](./open.md). Diagrams: [flows](./flows.md). Cheats (locked): [cheats-and-fixes.md](./cheats-and-fixes.md). This note is the gap between that slice and the [idea pile](./x-thread-product-ideas.md) / [custody](./fund-custody-design.md) / [identity](./wallet-identity-design.md) notes — not a second open list.

## Pooled total, not majority drain

v0 is **one pot per allowlisted URL** (X, Threads, Instagram, or TikTok), shown as **unexpired remaining USDC**. Each deposit still has a **personal expiry**. `pay` (disperse) / withdraw / expire apply only to **that wallet’s remaining stake**. Disperse can be **partial** to many claimed wallets.

So v0 does not implement (locked v0 is own-line, not the thread’s pool):

- Pay-only-when-done as a **group** decision
- Majority-to-withdraw + 7-day window
- Solver confidence that nobody will pull their own line early (they can, with the 5% fee)
- Pro-rata refund of a pool
- Payer-named charity on timeout
- Time-bomb / unretrievable funds (rejected in custody; also not in v0)

Expiry in v0 is a **personal** clock with a **5%** treasury cut. Expired lines leave the live bounty until that staker withdraws.

## Identity is a badge, not the seat

v0: Coinbase **Verified Country on chain** (EAS `countryOk`) + unique votemap handle (FCFS; squat-the-name ok) + **bio bind** (either `votemap/@handle` or `votemap.net/handle` in bio on all four; **bio only**, no comment fallback; **no social OAuth, no cold-DM, no paid X API**). Verified marks in v0 are only TikTok, X, Threads, and Instagram, via the bio rule (`votemap/@handle` or `votemap.net/handle` in that account bio, 60 days, daily job on due binds only), and a website only if that site itself shows `votemap/@handle` or `votemap.net/handle` (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it. The 60-day lag is accepted v0, not open. **Public page** `votemap.net/@handle` (custom links **and shop catalog**). Shop register: Coinbase US + `registerMerchant` + address and/or website. A shop cannot receive a bounty unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot. Shop lists products (name, USDC price, physical or not, short text; off-chain; not a token). Not shipping, tax, themes, inventory sync, or staff accounts. **Pay picker** = verified social @ (not votemap @). Reverse lookup → claimed wallet. Unbound / unverified cannot be picked. One social @ → one votemap account. Legal name is not a signup field.

Picker is the @; **chain dest** is the claimed wallet (no social string in calldata).

Later, unfinished (not solved) — license: [later.md](./later.md). Open: [open.md](./open.md).

## Custody / money movement

v0 escrow is the factory holding each stake. Destinations are: **claimed wallet** on a votemap account (not a social @), staker (withdraw leftover), treasury (fixed bps, address required at deploy). That matches “published fee, not a discretionary sweep.”

v0 does not use a qualified custodian, fiat on-ramp, 1099 pipeline, commercial pledge-to-purchase, yield on idle USDC, or YouTube / Facebook hosts (issue keys are **X, Threads, Instagram, TikTok**).

## Product surfaces from the pile that are absent

**Categories stay off v0** (solved). No entity hubs, no voter grades / shaming, no AI “what did you get done,” no transparency score, no shipping labels / tax / themes / inventory sync / staff accounts / a general Shopify clone, no sports/tax-credit skins, no free/low-price vote seat vs paid seat as two products. v0 **does** have a Linktree-like **public page** (`votemap.net/@handle`, links **and shop catalog**). Grouping is **allowlisted post URL** (X / Threads / Instagram / TikTok).

Pretty UI, **clawback**, vendor KYC / license, **general hop explorer** (beyond votemap’s own hops): [later.md](./later.md) (not solved). **Shop catalog on the public page is v0.** **Named who-paid-whom trail is v0.** **Vest 0–365d is v0.**

## What v0 *does* lock so this list stays honest

Issue = canonical allowlisted URL (X, Threads, Instagram, TikTok). One factory on Base. Native USDC, min 1. Personal expiry. Live bounty = unexpired total. Pay/withdraw = own line only. **0% restake / 1.5% pay / shop move 5% · public 1.5% / 5% early / 5% expiry** to a **required** treasury. User pays Base gas. Coinbase country **bytecode + app**. Bio bind (**verified for 60 days**; **daily job** re-fetches only due binds, bio and website; no comment fallback; no social OAuth / cold-DM / paid X API) + FCFS votemap handle; **public page** `votemap.net/@handle` (links **and shop catalog**); **pay picker = verified social @**; **chain dest = claimed wallet**. Street **unverified**; website verified only under the rule above. Signer browse snapshot. **Named trail:** signer appends **one row** on stake / disperse / move / redeem (action: `stake` / `disperse` / `move` / `redeem`, from handle, to handle, amount, pot, tx hash); page lists rows and shows the action label; hash → **Basescan**; no-account hop is **unknown hands** (address, never a fake name); **score** (visible only) = share of these rows whose wallets are votemap accounts; off-platform hops not in the score; no archive node / USDC indexer / hop explorer. Bound socials from the pay lookup. No attester; no mock. Embeds. Static export. No seeded issues.
