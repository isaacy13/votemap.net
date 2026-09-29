# votemap app

Production product at `/` (`/browse`, `/signup`, `/me`, `/issue`). Old `/mvp?view=` URLs redirect.

There is **no mock mode**. Missing chain, treasury, OAuth, SMS, or signer env is an error — not a fake login or fake chain.

## What it is

Stake **USDC** on an **X, Threads, Instagram, or TikTok** post. You only move your own line (tip-your-share). Live bounty = unexpired lines, rolled up by the **country snapped into storage** at stake time (Coinbase EAS for `msg.sender` — **no country argument**).

| Who | What |
| --- | --- |
| Web / desktop | Readonly. Browse, profile, QR / share to the phone app. No stake, pay, or claim. |
| iOS / Android | After **Face ID / Android Class 3** (no PIN fallback), native plugin → HTTPS signer → EIP-712. Then the wallet submits the tx. |
| Any wallet | `withdrawEarly` / `withdrawExpired` — **no votemap sig**, so USDC is not frozen if we are down. |

## Layout

| Path | Why |
| --- | --- |
| `mvp/VoteMap.sol` | One factory. Remix without a votemap sig reverts on stake/pay/claim. URL allowlist: X, Threads, Instagram, TikTok. |
| `mvp/screens/` | App Router UI (`/`, `/browse`, `/signup`, `/me`, `/issue`) |
| `server/index.ts` | Portable HTTP: Google/Apple, SMS, user store, signer, post snapshots |
| `plugins/votemap/` | Capacitor plugin (Secure Enclave / Keystore + native HTTPS) |

## Required env (static app)

```env
NEXT_PUBLIC_VOTEMAP_CHAIN=base-sepolia
NEXT_PUBLIC_VOTEMAP_CONTRACT=0x...
NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# optional
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
```

`CHAIN` and `CONTRACT` are required or stake/issue views error. USDC and treasury are read from the contract.

## API env (never git)

```env
SESSION_SECRET=
SIGNER_PRIVATE_KEY=0x...          # secp256k1; address = VoteMap votemapSigner
APP_ORIGIN=http://localhost:3000
VOTEMAP_DATA=./data/votemap.json
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=                      # or TWILIO_VERIFY_SERVICE_SID
PORT=8787
```

```bash
npm run api
```

`GET /health` reports which of Google / Apple / SMS / signer are configured. The signer **ignores** `sendOk`, `biometricOk`, and `jsOk`. It only accepts a **P-256 hardware signature** over a one-time challenge from a registered device key.

## How native biometrics talk to the signer

1. HTML **Stake** in the WebView calls `VoteMap.stake({ apiUrl, sessionToken, url, amount, expiry, staker })`. That is “please start,” not “biometrics passed.”
2. Native plugin checks **strong** biometrics (`LAPolicy.deviceOwnerAuthenticationWithBiometrics` / `BIOMETRIC_STRONG`). **No device PIN/passcode.** Unenrolled → cannot sign.
3. Plugin `POST /sign/challenge` (session cookie/bearer).
4. Secure Enclave / Android Keystore key (P-256, biometric-bound, no passcode flag) signs the challenge. Android uses `BiometricPrompt` **CryptoObject** so the key cannot be used without Class 3 biometrics.
5. Plugin `POST /sign/stake` with `{ challengeId, deviceSig, … }`. Native HTTPS — not the WebView.
6. Signer verifies session, enrolled device pubkey, one-time challenge, then EIP-712-signs with `SIGNER_PRIVATE_KEY`. It never trusts JS.
7. Plugin returns `{ signature, nonce, deadline }` to JS. JS submits `stake` on-chain. Console can call the plugin; it still cannot skip Face ID or fake the hardware signature.

`VoteMap.sendOk()` exists only to throw. There is no signer route for it.

iOS `Info.plist`: `NSFaceIDUsageDescription` = `votemap uses Face ID to authorize stake, pay, and claim. A device passcode is not accepted.`

```bash
npx cap add ios
npx cap add android
npx cap sync
```

`capacitor.config.json` uses `webDir: "out"` (static export).

## Deploy VoteMap.sol

Remix-compile `mvp/VoteMap.sol`. Constructor:

- `usdc_` — Base `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` or Sepolia `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- `treasury_` — **your** treasury. Required. No dummy.
- `signer_` — address of `SIGNER_PRIVATE_KEY`
- `indexer_` / `countryAttester_` / `countrySchema_` — Coinbase Verifications

EAS is the OP Stack predeploy `0x4200000000000000000000000000000000000021` (hardcoded).

| | Base mainnet | Base Sepolia |
| --- | --- | --- |
| Country schema UID | `0x1801901fabd0e6189356b4fb52bb0ab855276d84f7ec140839fbd1f6801ca065` | `0xef54ae90f47a187acc050ce631c55584fd4273c0ca9456ab21750921c3a84028` |
| Indexer | `0x2c7eE1E5f416dfF40054c27A62f7B357C4E8619C` | `0xd147a19c3B085Fb9B0c15D2EAAFC6CB086ea849B` |
| Attester | `0x357458739F90461b99789350868CD7CF330Dd7EE` | `0xB5644397a9733f86Cacd928478B29b4cD6041C45` |

Allowlist starts with `US`. Owner or treasury can `setAllowedCountry`. Country is **snapshotted** on the stake line.

Owner can `setSigner` to rotate the env key.

Claim on-chain: Google/Apple `sub` hash, email, name, gender, birth year, `phoneVerified` / phone hash — **never raw phone**. Pay goes to a **claimed wallet**, not a social handle.

## Fees (bytecode)

1.5% pay · 10% early withdraw · 5% expiry. User pays Base gas.

## Tests

```bash
npm run test:mvp
npm run lint
npm run build
```
