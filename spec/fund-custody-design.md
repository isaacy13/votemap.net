# How votemap should store funds

**As of:** 2026-09-25  
**Status:** Design recommendation, not a spec or roadmap.  
**Locked v0 money:** [requirements.md](./requirements.md). v0 has **no custody** (2026-10-19): pledges are wallet-signed promises, pays go straight from the voter’s wallet to the payee through a PayRouter that holds nothing, **1.5% on pay, 0% on pledge / cancel / lapse**, no escrow, no shop credit, no vest. Pots show backed USDC and each account shows follow-through. Public officials cannot be paid. Nothing personal goes on-chain. This note argued for escrow; v0 chose option B (no custody) instead. The escrow design below is research, **not** v0. [Fees vs behavior](./open.md) is open. [cheats-and-fixes.md](./cheats-and-fixes.md).  
**Product context:** [x-thread-product-ideas.md](./x-thread-product-ideas.md)  
**Companion:** who a wallet is — [wallet-identity-design.md](./wallet-identity-design.md)

---

## Recommendation (one paragraph)

Do **not** pick Isaac’s Approach 1 (votemap holds the money in a company account) or Approach 2 (everyone just connects a wallet and votemap never touches funds) as the whole design.

Pinned pattern:

- **Identity wallets are self-custodial.** Users keep keys. votemap never has spending access.
- **Bounty pots sit in USDC escrow** — a public smart contract and/or a regulated custodian with the same allowlist. **Timeout refunds payers.** votemap **cannot drain** the pot to itself.
- **“Charge later for the product” is only for commercial pilots** (a shop SKU, a drop). It is **not** the custody model for public goods or politicians.

votemap can *judge the condition* (“work is done” / majority wants out). Destinations are hardcoded: KYC-bound solver, **pro-rata back to payers**, or a **charity the payer named up front**. That is how you get “only pay when done” without Approach 1 theft or Approach 2’s empty pledge.

---

## The two approaches, and why neither is the product

**Approach 1 — votemap manages the money.** Matches the thread’s escrow instinct (Japan-import down payment so the shop cannot take it and ghost; politicians don’t get paid until the bill exists). It also creates the failure the thread is scared of: someone at votemap (or a hacker with their keys) steals the pool, or a time bomb expires and the platform sits on the funds. Offloading to “a custodian / escrow / broker” **does** reduce *key-theft* risk. It does **not** reduce *policy* risk unless the destination list is hardcoded.

**Approach 2 — people connect wallets; votemap has no access.** Matches privacy and “on-chain trail.” It cannot implement the spine of the idea pile: money held until the thing is done. A pledge in a spreadsheet is not a bounty. If votemap is not a middleman, it cannot be a fair judge *with a purse*. Solvers will not bet months of work on “voters promised they’d pay later.”

The locked-pot objection is real: **an expiry that never releases is a rug**, whether the rug is votemap, a “charity we pick,” or a contract that freezes. The fix is not “no escrow.” The fix is **escrow whose default on failure is refund**.

The charge-for-the-thing alternative is also real — for a **different job**. If @onexengineering actually imports the part, or the donut exists, the buyer has a reason to complete the purchase. Public goods (potholes, a bill, child labor in chocolate) have no checkout. Those need a pot.

So: **one custody architecture, two settlement modes** on the same USDC rails. Not two products.

| Mode | When | Who is in the middle | What “done” means |
| --- | --- | --- | --- |
| **Bounty escrow** | Public goods, politician/entity outcomes, “pay only when done” | Constrained escrow (below) | Voters / stated rule mark complete → pay solver; else refund |
| **Pledge-to-purchase** | **Commercial pilots only** (shops, SKUs). **Not** public goods or politicians | Short checkout lock or no lock | Consumer pays the solver’s invoice for the actual good |

---

## Recommended design: constrained-destination escrow

### Split the objects

From the identity note: **vote/payout wallets are self-custodial.** Users sign SIWE. votemap never has their spending keys.

**Do not “attach” a normal wallet so both votemap and the user can spend it.** If the user still holds the key, they can withdraw the stake. If both hold the key, either can. Hiding withdraw in the app is not enforcement. Token *allowance* (votemap may spend my USDC) is also weaker — the user can revoke it.

The existing mechanism is an **Ethereum contract**, not a shared EOA. The user **connects** their wallet, then **deposits USDC into the pot**. Custom rules live in that bytecode: pay solver if done, refund after timeout, optional named charity. Bitcoin L1 has no equivalent general-purpose code; the analogue is **2-of-2 + timelock**, and **USDC does not live on Bitcoin L1**. Dollar pots stay **USDC on Ethereum** (or an Ethereum L2). BTC multisig is only for a later BTC-denominated pot.

**The pot is not those wallets.** Each issue/bounty gets a public USDC address whose bytecode (or custodian policy) enumerates allowed `to:` addresses.

```
voter USDC (self-custody or ramp)
        │
        ▼
  per-issue escrow  ──release──►  solver’s bound wallet
        │
        ├── timeout / fail ──►  original payers, pro-rata
        ├── majority-to-withdraw + 7-day window ──►  payers
        └── optional, payer-chosen ──►  named charity
```

votemap’s operator wallet is **not** on that list, except a **published fee cap** encoded in the same rules (locked v0: **5%** early withdraw and **5%** expiry — [requirements](./requirements.md); the thread once floated ~10% on a failed time-bomb). If a fee exists it must be a constant, not a discretionary sweep.

This is the same idea Circle Research spelled out in April 2025 as **Refund Protocol**: an arbiter who can only route to *recipient or pre-declared refund address*, with a **fixed** lockup so funds cannot be frozen forever, is not an “all-powerful custodian.” Unaudited research code — copy the *constraint*, don’t paste the repo into production.

### Who holds keys (offloading Approach 1’s theft risk)

Two layers. Use both as pots grow; the programming stays the same.

1. **On-chain escrow (default, and the public trail).** USDC on a cheap L2 (Base is the practical fit if Coinbase Verifications are a badge). Anyone can see the balance. Release/refund functions are narrow. **Timeout is permissionless** (`refundAfterDeadline`) so votemap cannot “set an expiry and never release.” Pause, if it exists, must not pause refunds.
2. **Regulated custodian for large / fiat-adjacent pots.** Qualified US custodians as of 2026 include names like **BitGo Bank & Trust, N.A.** (OCC), **Anchorage Digital Bank, N.A.**, **Coinbase Custody** (NY trust today; OCC preliminary conditional approval April 2026 for a national trust, multi-year migration). **Fireblocks** is orchestration; pair it with a licensed custodian rather than treating the dashboard as the vault. NYDFS (30 Sep 2025) expects customer assets **segregated** on-chain and on the books, F/B/O titling, no using customer coins as the company’s collateral. That is how you offload *theft of the seed* without giving votemap a god-account at a retail brokerage.

Policy engine at the custodian must mirror the contract: allowlisted destinations, dual control, no employee can add “send to treasur-y.”

**Do not** park pots in a Coinbase *retail* user account, Stripe balance, or votemap LLC checking account labeled “escrow.” Those commingle, hide the trail, and put the corpus in bankruptcy with the company.

### Release rules (the thread’s knobs, pinned to this architecture)

The idea pile left the knobs open. Custody design only needs the *allowed actions*:

- **Pay when done.** An authorized signal (voter threshold, named oracle, or votemap-as-arbiter) releases to the solver address that already passed [KYC + wallet bind](./wallet-identity-design.md) (**v0 dest** is a Coinbase-US **claimed wallet**, not vendor KYC — [requirements](./requirements.md)). The contract does not care *how* you decided; it cares that the destination is the bound wallet.
- **Majority-to-withdraw.** ≥50% of users **or** ≥50% of dollars (thread: pick later) starts a **7-day** public window, then refunds to payers. Solvers can see the risk; they are not surprised by a silent drain.
- **Timeout / “time bomb.”** Calendar date is fine. On expiry: **refund payers by default**. Optional payer-chosen charity. **Rejected:** unretrievable funds; remainder to votemap beyond the posted fee; expiry with no one able to call refund.
- **No silent yield.** The thread already flags that staking/idle yield turns the crowd into yield farmers. Idle USDC in escrow stays USDC until the rule fires.

**Monetize with a published fee, not by staking pots.** Native ETH staking does not apply to USDC bounties. “USDC staking” is lending or T-bill wrappers — extra hack/depeg/lockup risk, and you may be unable to refund on timeout. Yield on **customer** pots also fights the mission (APY instead of outcomes) and fights custody rules against using customer assets as collateral. Take a small hardcoded cut of payout (v0: **1.5% disperse**; leftover **move** is **5% shop / 1.5% public**) or of leftover leave (**5%** early and **5%** expire). Earn yield only on **votemap’s own fee balance**.

### Pledge-to-purchase — commercial pilots only

**Scope: shops and products. Out of scope: public goods, bills, politicians, non-excludable outcomes.**

Use this mode only when the solver is selling a **thing a consumer can refuse** (e.g. @onexengineering import, cactus donuts). Voters **signal demand**; money is not locked for months; the solver charges when the SKU exists. Optional: a **short** checkout escrow (days, not seasons) with auto-release unless disputed.

This **does not** replace bounty escrow. A pothole, a passed bill, or “stop child labor in chocolate” has no cart — those pots stay in USDC escrow with refund-on-timeout. Do not run a political or public-goods issue as “pay us later if you feel like it.”

Isaac’s expire-and-keep worry is a bounty-escrow problem; commercial pledge-to-purchase sidesteps it by **not locking**. Both modes can share USDC, KYC’d wallets, and the public explorer — they must not share the same settlement rule.

### Everyday $1–$10/month

People without a wallet use a licensed **on-ramp** (Stripe crypto onramp, Coinbase, etc.) that drops USDC into *their* wallet or straight into the pot with a recorded refund address. The ramp’s KYC is **not** votemap’s identity (see identity note). Refunds must have a `refundTo` set **at deposit time** or the arbiter becomes custodial again (Circle’s own caveat).

---

## What this still cannot do (and high-level US caveats)

**Not solved**

- Smart-contract bugs and custodian operational failure. Reduce by audits, caps, segregation — not by “trust us.”
- A captured **judge**. Constrained destinations stop theft; they do not stop votemap from falsely marking “done” and paying a friendly solver. That is a *governance* problem (voter thresholds, shamers / A–F voter grades in the thread), not a vault problem.
- Subjective “is the work done?” There is no price-feed for potholes. Someone has to attest; the chain only enforces *where the USDC may go*.
- Approach 2’s privacy: deposits to a public pot are visible. Identity is name-optional; amounts are not secret.
- A politician claiming a payout for an official act is open ([open.md](./open.md)). v0 does not yet forbid that payee. Not a PEP form and not a lobbying filing.

**US / regulatory (not legal advice)**

- If votemap **accepts and transmits** customer USDC, FinCEN’s CVC guidance (FIN-2019-G001) generally treats hosted/control models as **money transmitters**. A 2014 FinCEN escrow ruling found a goods/services escrow *not* a transmitter when moving money was “necessary and integral” to managing that sale — **fact-specific, old, fiat, not a crypto bounty platform blessing.** State money-transmitter licenses are a second layer. Assume you need counsel before holding other people’s pots; do not assume a smart contract makes you invisible.
- Using USDC does **not** make votemap a **GENIUS Act** permitted payment-stablecoin *issuer* (Pub. L. 119-27, 18 Jul 2025). That statute is about who may *issue* payment stablecoins, plus AML on those issuers.
- Qualified custody **offloads safekeeping**. It does not offload “are we a transmitter” or 1099s to solvers. VoteMap does not run its own sanctions list. Coinbase screens those customers.
- NYDFS-style segregation (customer vs corporate, F/B/O) is the standard to copy even outside NY.

---

## Alternatives rejected

| Idea | Why not |
| --- | --- |
| Approach 1 as stated (votemap LLC wallet / retail brokerage account) | Theft, insolvency commingling, opaque trail, expiry-and-keep temptation |
| Approach 2 as stated (connect wallet, no pot) | Cannot guarantee “only pay when done”; solvers won’t show up; spam pledges |
| Shared/attached EOA both parties can spend | Whoever has the key can withdraw; app UI cannot lock a stake |
| ERC-20 allowance instead of deposit | User can revoke; solvers cannot trust the pot is real |
| Time-bomb that makes money **unretrievable** or defaults to votemap | The exact objection Isaac raised; also looks like conversion |
| Solver-charges-only for every issue | Fine as a **commercial pilot**; fails for public goods / politicians — the core bounty |
| Fully non-custodial “code is law” with no arbiter | “Work is done” is not an on-chain fact; you still need a judge, just a powerless one |
| Per-issue lawyer escrow / traditional title company | No public trail, doesn’t scale to $1 votes |
| Yield on idle pots | Thread already: people optimize for yield, not outcomes |
| Omnibus Stripe/fiat balance as the “escrow” | Hidden ledger; opposite of the transparency score idea |

---

## How this sits next to identity

[Wallet identity](./wallet-identity-design.md): KYC + signed challenge binds a **person** to a **wallet**. This note: that wallet is where **payouts** land; it is not where **pots** live. Voters can deposit from a ramp; they still refund to a declared address. Solvers cannot be paid to an unbound key.

---

## Sources (primary, 2024–2026)

- Circle Research, [Refund Protocol](https://www.circle.com/blog/refund-protocol-non-custodial-dispute-resolution-for-stablecoin-payments) (17 Apr 2025) — arbiter limited to recipient vs pre-set refund; fixed lockup.
- NYDFS [Industry Letter, 30 Sep 2025](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20250930-updated-guidance-custodial-structures) — on-chain + books segregation, F/B/O, no customer assets as collateral.
- BitGo [qualified custody](https://bitgo.com/products/qualified-custody/) / [disclosures](https://bitgo.com/legal/disclosures) (OCC-chartered bank & trust); Anchorage Digital Bank N.A.; Coinbase Custody / Fireblocks comparison (orchestration vs qualified custody).
- FinCEN [FIN-2019-G001](https://www.fincen.gov/sites/default/files/2019-05/FinCEN%20CVC%20Guidance%20FINAL.pdf) (CVC / hosted wallets); [2014 internet escrow ruling](https://fincen.gov/resources/statutes-regulations/administrative-rulings/application-money-services-business-1) (narrow, fact-specific).
- GENIUS Act, [Pub. L. 119-27](https://www.congress.gov/119/plaws/publ27/PLAW-119publ27.htm).
- Product tensions (escrow vs handing entities cash, time bombs, majority-to-withdraw, only-pay-when-done): [x-thread-product-ideas.md](./x-thread-product-ideas.md).
