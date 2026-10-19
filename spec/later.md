# Later (not solved)

Unfinished deferred list. Not v0. Not the open questions. Not a known accepted risk.

v0 (solved): [requirements](./requirements.md). Open questions: [open.md](./open.md). Known accepted risks: [accepted-risks.md](./accepted-risks.md).

## Bio and website re-check

Solved v0 in [requirements](./requirements.md). The lag until the next check is a [known accepted risk](./accepted-risks.md), not later and not open. Website verification is solved v0, not an accepted skip.

## Vendor KYC / license

Later: vendor KYC / license. That is not a PEP screen and not a lobbying filing. v0 screens payees against public officials ([requirements](./requirements.md) item 27); a wider PEP screen is not a later build. v0 shop is a **catalog** on the public page (products they sell: name, USDC price, physical or not, short text; off-chain, like links; not a token). Not shipping labels, tax, themes, inventory sync, or staff accounts. Coinbase US + `registerMerchant` + a street address (shown **unverified**; [accepted risk](./accepted-risks.md), not later). Website verification is solved v0, not later. Shop eligibility is solved v0, not later: a shop cannot be paid as a shop unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot.

## Escrow, vest, and clawback

Not v0, and not later work either. v0 has no custody (2026-10-19): no escrow, no shop credit, no vest, so there is nothing to claw back. A voter who wants to pay in stages sends several pays. Bringing escrow back would bring back custody, and that is a new decision, not an unfinished item.

## General hop explorer

v0: named who-paid-whom ([requirements](./requirements.md) item 26). Rows are **pledge** and **cancel** (from the stored wallet-signed messages) and **pay** (from the router’s `Paid` events, only after the tx is on Base), with the **action label**. Handles are the names at that moment. Hash links **Basescan**. No-account hop is **unknown hands** (address, never a fake name). **Score** (visible only): share of these rows whose wallets are votemap accounts. No fee discount / rank prize / new fee. Off-platform hops are **not** in this score. Bound IG / X / Threads / TikTok from the pay lookup. No archive node, no general USDC indexer. That named view is **v0**, not later.

Later: a general in-app hop explorer **beyond** those hops (USDC that left votemap). Not solved.
