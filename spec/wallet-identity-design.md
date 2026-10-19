# Wallet control vs legal identity (votemap)

**As of:** 2026-09-25  
**Status:** Design recommendation, not a spec or roadmap.  
**Locked v0 is [requirements.md](./requirements.md), not this note.** v0 money path is **Coinbase Onchain Verify EAS US** (required, not optional). v0 social is **bio** `votemap/@handle` or `votemap.net/handle` on all four (**bio only**, no comment fallback; **no social OAuth, no cold-DM, no paid X API**). **Pay picker** = verified social @ → confirm → claimed wallet. **Public page** is `votemap.net/@username` (links **and shop catalog**). Verified marks in v0 are only TikTok, X, Threads, and Instagram, via the bio rule (`votemap/@handle` or `votemap.net/handle` in that account bio, 60 days, daily job on due binds only), and a website only if that site itself shows `votemap/@handle` or `votemap.net/handle` (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it. The 60-day lag is accepted v0, not open. Vendor KYC / license is **later**. Shop products are off-chain (name, USDC price, physical or not, short text; not a token). Not shipping, tax, themes, inventory sync, or staff accounts. Legal name is not collected and is not a signup field. Since 2026-10-19 v0 has no custody: pays go straight from the voter’s wallet to the payee’s payout wallet, both Coinbase US, and nothing personal goes on-chain ([requirements](./requirements.md)).
**Product context:** [x-thread-product-ideas.md](./x-thread-product-ideas.md)  
**Companion:** how pots are stored — [fund-custody-design.md](./fund-custody-design.md)

---

## Recommendation (one paragraph)

votemap should **not** try to look up “who owns this wallet” at a US brokerage. That lookup does not exist for third parties. **v0** uses Coinbase Onchain Verify **EAS US on the signing wallet** (required for the money path) plus **bio bind** and a **claimed wallet** — [requirements](./requirements.md). The rest of this note is research for **later** vendor KYC / license: (1) a licensed **ID vendor** checks a government ID (the thread’s “license required” half — name stays optional on a public profile); (2) the same session requires a **signed wallet challenge**; (3) Coinbase is **not** a name/nationality API. Identity wallets stay self-custodial. Pooled bounty money does not sit in those wallets — see the companion note. v0 public page is `votemap.net/@username` (links **and shop catalog**), not a KYC profile board.

---

## 1. Two different proofs

| Proof | What it answers | How you get it | What it does **not** answer |
| --- | --- | --- | --- |
| **Wallet control** | Can this session move funds / vote as `0xabc…`? | User signs a nonce bound to votemap’s domain (SIWE or chain-native equivalent). Optional: a tiny on-chain tx. | Who they are. Whether the key was borrowed, stolen, or held by an exchange. |
| **Legal identity** | Is there a real person, roughly this age / place, not an obvious bot farm? | Government-ID + liveness via a KYC/IDV vendor (Persona, Stripe Identity, Sumsub, etc.). | That they control any particular wallet. Citizenship vs residence. That they are the beneficial owner of the funds. |

Isaac’s lo-fi thread line — **name optional, license required** — is this split. **It is later, not v0.** v0 public page does not show a KYC board.

Binding the two proofs is a **session rule**, not a blockchain miracle: KYC applicant ID ↔ signed challenge ↔ wallet address, with a cap on how many wallets one identity may bind (Coinbase’s own attestation product caps at three; votemap should cap too).

---

## 2. KYC: what you give, what you get

Plain language for Isaac’s follow-up: *“OK so for KYC what is it provide you and what information do you give?”*

**Short answer:** the user gives a government ID and a selfie (US users may also type an SSN). The vendor checks “is this a real document, and does the face match.” votemap can choose to receive either a **pass/fail plus a few attributes** (age, country, verified-at) or a dump of the full file. For “name optional / license required,” collect the license through the vendor, **do not put the legal name on the site**, and **do not copy ID photos or SSNs onto votemap’s servers**.

“KYC” here is used the way product people use it (identity verification). Bank-grade **CIP** (name + date of birth + address + TIN, plus watching the account over time) is a heavier stack you only owe if you are in the flow of funds — see [fund-custody-design.md](./fund-custody-design.md). Voting-seat anti-spam does not require an SSN. Paying a solver $10k might.

### What the user typically has to provide

The photos and numbers go **to the KYC vendor’s hosted flow** (Persona Inquiry, Stripe Identity, Sumsub WebSDK, etc.), not into a votemap upload form. Typical packages:

| | **Lighter (enough for “license required”)** | **Heavier US (CIP / payouts / on-ramp)** |
| --- | --- | --- |
| Government photo ID | Yes — US driver’s license, state ID, or passport (vendors accept IDs from 100+ countries) | Same |
| Selfie / liveness | Yes — face match to the ID photo; often a blink/turn so it isn’t a still | Same |
| Typed name, DOB, address | Sometimes pre-filled from the ID; sometimes the user types them so they can be checked against the document | Yes — US CIP quartet is **name, DOB, address, TIN** |
| SSN / TIN | **No**, unless you turn that check on | Often last-4 SSN or full SSN, validated against SSA-style databases. Stripe Identity’s `id_number` check, if enabled, returns **only last-4** for a US SSN to the platform |
| Nationality / citizenship | **Usually not asked as such.** Passport may list nationality; a US license does not. Vendors typically give you **issuing country of the document** and **address country** (residence) | Same gap. Do not treat “US license” as “US citizen” |
| Phone / email | Common as the account login, not as the ID proof | Same |
| Proof of address | Rare for a vote seat | Utility bill / bank statement if the ID address is weak |

A user who already completed **reusable KYC** with that same vendor (e.g. Sumsub ID) may only have to consent to share the existing file, not re-photograph. That is still *votemap’s* vendor. It is **not** Coinbase or Fidelity handing over their KYC.

Expect 2–5 minutes on a phone camera. Failures are usually glare, cropped cards, or a selfie that doesn’t match.

### What the platform actually receives (and can keep)

This is a **configuration choice**, not a law of physics. The vendor always sees the raw images. votemap can be set up anywhere on this spectrum:

1. **Token + result (recommended default).** You store `inquiry_id` / `verification_session_id`, status (`verified` / `failed` / `needs_retry`), timestamps, and a small attribute set: **age or DOB year, country (and US state if present), document type** (license vs passport), vendor duplicate-person id if they offer one. Persona’s default is close to this: **name, birthdate, and address are not exposed on the API until you enable those attributes.** Stripe can keep images on Stripe so they “never touch your systems,” while still letting you pull a report if you ask.
2. **Extracted PII, no images.** Legal name, full DOB, address, document number, issuing country. Stripe VerificationReport can return exactly that (`first_name`, `last_name`, `address`, `type: driving_license`, `issuing_country`, file IDs). You become a holder of that PII the moment you pull it.
3. **Full file.** ID front/back images, selfie, and (if collected) SSN. Retrievable via vendor API/dashboard. This is what you need for a *subpoena pack* or a stubborn 1099 dispute. It is also the thing you do **not** want sitting in the votemap Postgres.

**Allowed to keep:** as the vendor’s customer you are typically the **data controller**. You may retrieve and retain what your contract and privacy policy say you will. That is permission, not a good idea. Law still applies (GLBA-ish expectations if you are a financial institution, state privacy, GDPR if you have EU users, retention limits). Passing KYC does **not** give votemap a license to publish the name.

What you *use* day to day is not the JPEG of the license. It is: **this account is a unique verified person, about this age, in this place, last checked on this date.**

### What KYC does *not* give you

- **Not wallet ownership.** A passed license does not mean they control `0xabc`. That is the separate signed challenge in §1.
- **Not a brokerage lookup.** You still cannot ask Coinbase/Schwab “who is this wallet.” You ran *your own* check. See §3.
- **Not nationality.** You get document country and usually residence. Citizenship is a different fact.
- **Not “this human is unique forever.”** Stolen IDs, synthetic IDs, and family-shared licenses exist. Liveness + vendor duplicate detection + paid votes reduce that; they don’t delete it.
- **Not source of funds, tax residency, or clean sanctions forever.** A screen is a snapshot. OFAC lists change.
- **Not permission to show the name.** “License required” is a *check*. “Name optional” is a *display* rule.

### What votemap should store vs leave with the vendor

Given the thread: **name optional / license required**, plus later 1099s if solvers get paid. **This table is later/research**, not the v0 public page (`votemap.net/@username`, links and shop catalog).

| Leave with the KYC vendor (retrieve only if legally forced) | votemap **private** DB | votemap **public** profile |
| --- | --- | --- |
| ID photos, selfie, biometric templates | Vendor session/inquiry id | — |
| Full SSN / TIN, document number | Pass/fail, verified-at, next-refresh-at | Last verified date |
| Full street address | Country + US state (from ID or CIP) | State / country |
| Legal name (voters) | Optional private legal name **only for solvers you must 1099** | Display name **only if the user types one** |
| Raw vendor JSON / images | Age or DOB year; document type; sanctions snapshot result | Age (or age band) |
| — | Bound wallet address(es) + SIWE timestamps (not a KYC field) | Optional X/IG/Threads |

Refresh ID on a cadence (e.g. yearly, or when the document expiry the vendor recorded has passed). Do not re-collect SSN for a vote. Re-challenge the **wallet** whenever the payout address changes — that is cheaper and is the actual control proof.

---

## 3. Can a third party query US brokerage/exchange KYC for a wallet?

**No.** US brokers and exchanges must know *their own customers* (CIP/KYC, BSA, tax reporting). They do **not** expose a public or partner “give me name and nationality for this address” API.

What actually exists in 2026:

- **IRS Form 1099-DA.** Custodial brokers report sales/exchanges of digital assets to the IRS and to the customer. The “account number” on the form is the broker’s internal account, **not** the customer’s wallet address. Final 2024 regs (transactions from 2025, basis from 2026) cover hosted-wallet brokers, kiosks, and some payment processors; they **deferred** unhosted-wallet / non-custodial platform reporting. The IRS does not publish a wallet→person directory, and third parties cannot query it.
- **Travel Rule (TRUST and similar).** VASPs share originator/beneficiary PII with *the other VASP on a qualifying transfer*, after proving they own the deposit address. It is encrypted peer-to-peer among members. It is not a lookup for “random app wants to know who `0xabc` is.”
- **Legal process.** Exchanges produce customer files to governments under subpoena/order. Coinbase’s 2025 transparency report is explicit: no government gets direct system access; they review each request. That is not a product votemap can call.
- **On-chain forensics.** Clustering can guess that an address *touched* an exchange deposit. It cannot lawfully or reliably return a legal name to votemap.

**Exchange attestation products (real, and limited):**

**Coinbase Verifications / Onchain Verify** (live on Base, Ethereum Attestation Service):

- User-initiated. User must already have an active, unrestricted Coinbase trading account that completed Coinbase’s ID checks.
- User connects a self-custodial EVM wallet and claims a **non-transferable** attestation.
- On-chain payload: (a) boolean “verified Coinbase trading account,” (b) **optional** ISO 3166-1 alpha-2 **country of residence**, (c) optional Coinbase One membership boolean.
- Coinbase’s own copy: personal info is **not** shared; verification “only shows you have a verified Coinbase trading account.” Country is residence on Coinbase, **not** legal name, **not** nationality/citizenship.
- Up to **three** wallets. Revocable; historical EAS records remain.
- Coinbase’s GitHub disclaimer says the attestation is informational, **should not be relied on for legal, compliance, or contractual purposes**, may lag account-status changes, and KYC processes differ by jurisdiction.

That is useful as a *badge* (“this wallet is tied to some Coinbase-KYC’d human, maybe in `US`”). It is **not** “access US-based identification for a given wallet.”

Other ecosystem pieces to not overclaim:

- **BNB Attestation Service / BNB Passport** markets composable KYC-ish attestations (including sources described as Binance KYC). These are still **user-claimed proofs of having been checked somewhere**, not a third-party name query, and they are not a US brokerage identity feed.
- **Sumsub × Chainlink ACE (2026):** after Sumsub KYC + a wallet signature, a reusable on-chain credential can carry claims like “age > 18” without putting raw PII on-chain. That is the same *pattern* as “vendor KYC + signed wallet,” not an exchange dump.
- **World ID / Gitcoin Passport / similar:** personhood or Sybil resistance. Not a driver’s license, not a name.

So: tax KYC at US brokers is real; **votemap cannot tap it**. The honest path is to run (or buy) identity checks, or accept coarse, user-opt-in attestations that omit the name.

---

## 4. Recommended later pattern (vendor KYC — **not v0**)

Grounded in the idea pile. **Do not ship this as v0.** v0 is [requirements.md](./requirements.md).

1. **Create a votemap account** with an IDV vendor. **Later, not v0.** Collect government ID + liveness **in the vendor’s widget** (see §2 for give/get). votemap stores the vendor reference, pass/fail, age, place, document type, verified-at — not ID photos or SSNs. This sketch of a KYC “public profile” (age, state, last verified) is **not** v0. **v0 public page** is `votemap.net/@username`: custom **links and shop catalog**; verified marks are in the header above (bio socials, and a website only if the site shows the string). Street and other links stay unverified. Legal name stays off the board. v0 does not collect one.
2. **Bind a wallet in the same flow.** SIWE (or Solana/equivalent if that chain is chosen later) with a server nonce, domain binding, and short expiry. Persist `user_id → address → bound_at`. Re-challenge on payout-address change. Cap addresses per identity (start at 1 payout wallet + 1 vote wallet, hard cap ~3).
3. **Coinbase vs vendor license.** **v0 money path requires** Coinbase Onchain Verify EAS **US** on the signing wallet ([requirements](./requirements.md) items 12–15). Do not display Coinbase as “we know your legal name.” **Later** vendor license is a different check; do not read this research as “skip Coinbase” or as “v0 already has vendor KYC.”
4. **Lobbying disclosures stay out. PEP screening is open.** v0 does not file lobbying disclosures. VoteMap does not run its own sanctions list. Coinbase screens those customers ([requirements](./requirements.md)). Whether to screen politically exposed persons is open ([open.md](./open.md)): v0 does not screen them today, and Coinbase country is not a PEP screen. Do not read this note as a promise to build a PEP screen. A politician claiming a payout for an official act is a separate open question: v0 does not yet forbid that payee.
5. **Stablecoin payouts** go only to a bound, challenged address for a KYC’d user (see companion custody note). Incoming voter deposits can be from a ramp (Stripe onramp, Coinbase, etc.) *or* a self-custody transfer; the *vote identity* is still the IDV person, not “whoever paid from this exchange.”
6. **Reuse where the user already has it.** If the IDV vendor offers reusable KYC (Sumsub Reusable, etc.), use it so people are not photographed every month. That is still votemap’s vendor relationship — it is not Coinbase handing over a W-9.

Paid votes still do the economic anti-spam work. Identity stops sock-puppet farms and makes “A-tier vs F-tier voter” mean something.

**Social vs vendor vs self-roll (what to actually ship):**

- **X / Threads / Instagram / TikTok** — **v0 bind is bio only** `votemap/@handle` or `votemap.net/handle` on all four including personal IG. **No comment on `@vote_map`. No other fallback.** Either string → that social is **verified for 60 days**. A **daily job** re-fetches only binds whose 60 days are up ([requirements](./requirements.md) item 6). **No social OAuth, no cold-DM, no paid X API.** Then they can be a **pay picker**. Public page is `votemap.net/@handle` (links **and shop catalog**; verified marks per the header above; hide ≠ unbind).
- **Identity they used at Coinbase/etc.** — still no name/nationality API. **v0:** Coinbase EAS US is **required** for the money path, not an optional badge.
- **Self-rolled driver’s license / passport upload** — reject. You lose to fake docs and then you store the images. Recent vendor breaches (e.g. IDScan, 2026, 150M+ licenses) are an argument to **not keep images**, not to become the database yourself.
- **Open-source IDV** — fine as libraries; you still own fraud ops and PII. Not a substitute for a vendor, and not safer in a breach if you retain documents.
- **Paid IDV (Stripe Identity, Persona, Sumsub)** — **later** vendor KYC / license, not v0. v0 receiving a public claim is Coinbase US + claimed wallet. A shop cannot receive a bounty (shop disperse / redeem) unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot. The public payee picker is unchanged. Re-check on document expiry, large payout, or ~yearly is a later cadence, not the v0 bio **verified for 60 days** window.

---

## 5. Custody / fund tracking (summary)

Identity wallets are **self-custodial**. votemap should not hold users’ spending keys.

Pooled pots are a **different** object: constrained escrow with a public USDC trail, refund-on-timeout, and destinations the contract (or custodian policy) will actually allow. That design lives in [fund-custody-design.md](./fund-custody-design.md). Mixing “connect your wallet” with “we hold the bounty” without that split is how Approach 1 and Approach 2 in the thread talk past each other.

Tracking: every pot has a public address; every inflow/outflow is a tx anyone can see; votemap’s private ledger maps tx → KYC’d user_id. Transparency score = share of flow that hit that public trail vs off-ramped.

---

## 6. What this still cannot prove (and high-level US caveats)

**Not proven**

- The signer is the **beneficial owner** (keys can be handed over, coerced, or held by a helper).
- **Nationality / citizenship.** IDV usually proves a document and often a place of residence. Coinbase attests residence on Coinbase. Neither is a passport nationality API.
- That funds in the wallet were **earned, not stolen**, or that the person on the license will be the tax payer.
- That an **exchange deposit address** is “their” wallet — those are the exchange’s.
- Ongoing uniqueness: one human can still acquire multiple IDs; one ID can still try many wallets (hence caps + paid votes).
- That a politician or entity “is on-chain” in any moral sense — only that *this* account/wallet pair was verified at a date.

**US / regulatory (not legal advice)**

- Running ID checks and storing licenses makes votemap a holder of sensitive PII (and likely a consumer reporting / privacy / state-law problem set). Minimize what is public; keep names off the board.
- If votemap accepts and transmits customer value (even USDC escrow), **MSB / money-transmitter / BSA** analysis is fact-specific and separate from identity design — see the custody note. Using USDC does not make votemap a **GENIUS Act** permitted payment-stablecoin *issuer* (that law, Pub. L. 119-27, July 18, 2025, regulates issuers and offer/sale of payment stablecoins).
- Paying solvers may create **information-reporting** (1099) obligations for votemap even when voters paid in crypto.
- VoteMap does not run its own sanctions list. Coinbase screens those customers. A delay on Coinbase’s side is an accepted risk. VoteMap still must not knowingly pay a sanctioned person.
- A politician, or a wallet they control, claiming a payout for an official act is open. v0 does not yet forbid that payee. Not a PEP form and not a lobbying filing.
- Coinbase Verifications’ own terms tell integrators not to treat the badge as a compliance sign-off. Don’t.

---

## Alternatives rejected

| Idea | Why not (for votemap) |
| --- | --- |
| Query Coinbase/Kraken/Fidelity for name + nationality of a wallet | No such third-party API. Tax KYC is for the IRS and the broker’s own CIP, not for apps. |
| Coinbase Verifications as the only ID | No name, optional residence only, Coinbase customers only, Base-centric, contractual disclaimer against compliance reliance. Fine as a **badge**. |
| On-chain clustering / “we’ll identify the wallet” | Guesswork; often wrong; not a legal identity; hostile to the “paycheck to paycheck” user who on-ramps once. |
| Custodial-only accounts (everyone lives on Coinbase) | Kills self-custody and a public trail; excludes anyone the exchange rejects; votemap still cannot read Coinbase’s KYC file. |
| World ID / passport-style personhood alone | Stops some bots; does not implement “license required.” |
| User uploads a selfie of a license next to a handwritten address | No cryptographic bind; Photoshop; no liveness vendor audit trail. |
| Trust social handles (X/IG) as legal ID | **v0 pay picker** is verified social @ (bio bind) → claimed wallet. That is the dest lookup, not a driver’s license. Vendor license stays **later**. |

---

## Sources (primary, 2024–2026)

- Coinbase [Onchain Verify](https://www.coinbase.com/onchain-verify) and [help: Onchain verification](https://help.coinbase.com/en/coinbase/getting-started/verify-my-account/onchain-verification); [coinbase/verifications](https://github.com/coinbase/verifications) (schemas + disclaimer).
- IRS [Instructions for Form 1099-DA (2026)](https://www.irs.gov/instructions/i1099da); [final broker-reporting regs](https://www.irs.gov/newsroom/final-regulations-and-related-irs-guidance-for-reporting-by-brokers-on-sales-and-exchanges-of-digital-assets) (custodial brokers; wallet addresses dropped from the form).
- Coinbase [TRUST / Travel Rule](https://www.coinbase.com/travelrule); [CDP Travel Rule withdrawals](https://docs.cdp.coinbase.com/exchange/travel-rule/withdrawals) (VASP-to-VASP, not public lookup).
- Sumsub [unhosted wallet verification](https://docs.sumsub.com/docs/unhosted-wallet-verification); Sumsub/Chainlink ACE reusable credentials (2026).
- Stripe [Identity](https://docs.stripe.com/identity) and [VerificationReport](https://docs.stripe.com/api/identity/verification_reports/object) (extracted name/address/DOB/document; SSN last-4 if `id_number` enabled; images live as File ids). Stripe Identity marketing: verification data can stay on Stripe.
- Persona [Inquiries](https://help.withpersona.com/articles/2BerKqpgNIRG81jX0goCMU.md) (collects IDs, selfies, SSNs) and [security/privacy](https://help.withpersona.com/articles/4SxXLtuLwYAWSkxWbHQtoo/index.html) (PII not on API by default; customer is controller; redaction leaves the inquiry record).
- Stripe crypto onramp: KYC tiers + EU Travel Rule `getWalletOwnershipChallenge` / signed challenge (illustrates the industry pattern, not a votemap dependency).
- GENIUS Act, [Pub. L. 119-27](https://www.congress.gov/119/plaws/publ27/PLAW-119publ27.htm) (stablecoin *issuers*).
