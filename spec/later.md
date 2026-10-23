# Later (not solved)

Unfinished deferred list. Not v0. Not the open questions. Not a known accepted risk.

v0 (solved): [requirements](./requirements.md). Open questions: [open.md](./open.md). Known accepted risks: [accepted-risks.md](./accepted-risks.md).

## Bio and website re-check

Solved v0 in [requirements](./requirements.md). The lag until the next check is a [known accepted risk](./accepted-risks.md), not later and not open. Website verification is solved v0, not an accepted skip.

## Vendor KYC / license

Later: vendor KYC / license. That is not a PEP screen and not a lobbying filing. v0 screens payees against public officials ([requirements](./requirements.md) item 27); a wider PEP screen is not a later build. v0 shop is a **catalog** on the public page (products they sell: name, USDC price, physical or not, short text; off-chain, like links; not a token). Not shipping labels, tax, themes, inventory sync, or staff accounts. Coinbase US + `registerMerchant` + a street address (shown **unverified**; [accepted risk](./accepted-risks.md), not later). Website verification is solved v0, not later. Shop eligibility is solved v0, not later: a shop cannot be paid as a shop unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot.

## Escrow, vest, and clawback

v0 locks pledges in the PotVault until the pledger’s expiry (2026-10-23), with no VoteMap control: money goes only to payees the pledger picks or back to the pledger. No shop credit, no vest, no clawback. A voter who wants to pay in stages sends several pays from the deposit.

## General hop explorer

v0: named who-paid-whom ([requirements](./requirements.md) item 26). Rows are **pledge**, **pay**, and **refund** (from the vault’s events, only after the tx is on Base) and **decline** (from signed messages), with the **action label**. Handles are the names at that moment. Hash links **Basescan**. No-account hop is **unknown hands** (address, never a fake name). No trail score. Off-platform hops are not shown. Bound IG / X / Threads / TikTok from the pay lookup. No archive node, no general USDC indexer. That named view is **v0**, not later.

Later: a general in-app hop explorer **beyond** those hops (USDC that left votemap). Not solved.
