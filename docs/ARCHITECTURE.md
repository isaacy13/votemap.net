# VoteMap Architecture

## Stack

| Layer | Choice |
|---|---|
| Marketing site | Next.js static export → Cloudflare Pages (`app/`, `components/landing/`) |
| Product app | Expo Router (iOS / Android / web) in `platform/frontend` |
| API | Express + Prisma + PostgreSQL in `platform/backend` |
| Realtime | Socket.io (optional Redis adapter) |
| Money (MVP) | Platform **ledger** (demo escrow). Solana USDC Phase 2 (`platform/contracts`) |
| Passport identity | **ZKPassport** — free, open-source ZK proofs ([zkpassport.id](https://zkpassport.id)) |
| Per-vote auth | Face ID / biometrics via `expo-local-authentication` + `VoteSession` bridge |

## Trust model

1. **ZKPassport (one-time)** — user proves passport authenticity on-device; server verifies the ZK proof and stores a scoped `uniqueIdentifier` (nullifier). No passport PII needed on VoteMap servers when using minimal disclosures.  
   - Dev/CI: `ZKPASSPORT_DEV_MODE=true` accepts mock verification ($0, no app).  
   - Alternate (not wired): Self Protocol / former OpenPassport.

2. **Face ID (every vote)** — stake / donate / resolve / deliverable require a short-lived `VoteSession` confirmed after successful local biometrics on the phone. Web clients create a session, show QR/deep link (`PhoneConfirmModal`), wait until the phone confirms, then submit with `voteSessionId`.

3. **ZKPassport UI** — web verify screen mounts `@zkpassport/ui` QR (`age >= 18`, scope `votemap-personhood`); proofs POST to `/auth/zkpassport/verify`. Native shows app install instructions + mock/dev path. Backend recreates the expected query via `createQuery()` when `@zkpassport/sdk` is installed.

4. **Ledger** — every `stake_lock`, `release`, `refund`, `deadline_refund`, and `donation` is an immutable `LedgerEntry` exposed at `GET /ledger`.

## Domain

- `Outcome` — measurable goal/bounty  
- `Stake` — escrowed amount + personal `deadlineAt`  
- `Donation` — direct gift to `Entity`  
- `Deliverable` / `ResolutionDecision` — proof + per-stake approve/reject  
- `Entity` / `EntityLink` — Linktree-style profiles  
- `VoteSession` — Face ID bridge  

Pullout votes are **removed**.

## Cost posture

- No paid KYC SaaS in MVP (ZKPassport self-serve is free).  
- No biometric SaaS (on-device Face ID only).  
- Minimal ZK disclosures (personhood + age).
