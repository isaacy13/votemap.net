# Later (not solved)

Unfinished deferred list. Not v0. Not the open questions. Not a known accepted risk.

v0 (solved): [requirements](./requirements.md). Open questions: [open.md](./open.md). Known accepted risks: [accepted-risks.md](./accepted-risks.md).

## Bio and website re-check

Solved v0 in [requirements](./requirements.md). The lag until the next check is a [known accepted risk](./accepted-risks.md), not later and not open. Website verification is solved v0, not an accepted skip.

## Vendor KYC / license

Later: vendor KYC / license. That is not a PEP screen and not a lobbying filing. Whether to screen politically exposed persons is open ([open.md](./open.md)), not a later build. v0 shop is a **catalog** on the public page (products they sell: name, USDC price, physical or not, short text; off-chain, like links; not a token). Not shipping labels, tax, themes, inventory sync, or staff accounts. Coinbase US + `registerMerchant` + a street address (shown **unverified**; [accepted risk](./accepted-risks.md), not later). Website verification is solved v0, not later. Shop bounty eligibility is solved v0, not later: a shop cannot receive a bounty unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot.

## Clawback of unvested (public)

v0 vest is linear and **not reversible**. Later: clawback of the **unvested** remainder if the work is reversed (legislation yanked, etc.). The chain cannot see Congress — that still needs a human/oracle. Does not apply to shop credits. Shop redeem is not an unfinished item on this list. Solved v0: Redeem is final. Once the voter taps redeem, the shop credit USDC leaves the VoteMap factory and is paid to that merchant’s payout wallet. No VoteMap refund, no chargeback, no second hold, no two-step escrow after redeem. Redeem is the purchase, and it is final.

## General hop explorer

v0: named who-paid-whom. The signer already handles **stake / disperse / move / redeem**; on that path it appends **one row** (action: `stake` / `disperse` / `move` / `redeem`, from votemap handle, to votemap handle, amount, pot, tx hash). Handles are the names at that moment. The page lists those rows and **shows the action label**. Hash links **Basescan**. No-account hop is **unknown hands** (address, never a fake name). **Score** (visible only): share of these rows whose wallets are votemap accounts. No fee discount / rank prize / new fee. Off-platform hops are **not** in this score. Bound IG / X / Threads / TikTok from the pay lookup. No archive node, no general USDC indexer. That named view is **v0**, not later.

Later: a general in-app hop explorer **beyond** those hops (USDC that left votemap). Not solved.
