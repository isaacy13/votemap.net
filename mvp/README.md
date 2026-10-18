# votemap MVP

One factory on **Base**, native **USDC**, issues keyed by a **canonical x.com post URL**. Landing page is unchanged.

`/mvp` talks to the **real contract**. There is no mock mode. Missing env is an error.

## What it does

- First **1 USDC** stake on an x.com URL creates the pot; the same URL joins.
- Each staker **must** set their **own expiry**. UI shows **unexpired** USDC (live bounty). Expired lines leave the live pot until that wallet withdraws.
- `pay` / early / expire move **only your remaining stake** (1.5% / 10% / 5% to treasury). One wallet cannot drain the pool.
- **Treasury** is a required constructor argument. No dummy address.
- **Coinbase Verified Country** (EAS) is required **on chain** for money txs. The app calls `countryOk` first. Empty country fails.
- **Handles:** first wallet to call `registerHandle` owns that @. No attester key. X/Threads OAuth is optional login UX. Threads **posts** are not pots.
- **URLs:** `x.com` only. `twitter.com` and `threads.net` are rejected.
- Embeds: `react-tweet`. **Basescan** on txs.

Not in v0: vesting/clawback, custom inspector.

## Files

| Path | Why |
| --- | --- |
| `mvp/VoteMap.sol` | Factory |
| `mvp/App.tsx` | `/mvp` UI |
| `mvp/chain.ts` | RPC + txs |
| `mvp/urls.ts` | x.com parse |
| `mvp/oauth.mjs` | Portable OAuth login (no attester) |
| `app/mvp/` | Thin Next route. Issue view is `/mvp?url=…` |

## Required env (static app)

```env
NEXT_PUBLIC_VOTEMAP_CHAIN=base-sepolia
NEXT_PUBLIC_VOTEMAP_CONTRACT=0x...
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
NEXT_PUBLIC_OAUTH_CALLBACK_URL=http://127.0.0.1:8787
```

`CHAIN` and `CONTRACT` are required. RPC override and OAuth URL are optional. USDC and treasury are read from the contract.

## Deploy

Remix-compile `mvp/VoteMap.sol`. Constructor:

- `usdc_` — Base Sepolia `0x036CbD53842c5426634e7929541eC2318f3dCF7e` or mainnet `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- `treasury_` — **your** treasury. Required.
- `indexer_` / `countryAttester_` / `countrySchema_` — Coinbase Verifications (see below)

EAS itself is the OP Stack predeploy `0x4200000000000000000000000000000000000021` (hardcoded).

### Coinbase Verified Country (from [coinbase/verifications](https://github.com/coinbase/verifications))

Schema is `string verifiedCountry` (ISO 3166-1 alpha-2). Missing/empty country fails `countryOk`.

| | Base mainnet | Base Sepolia |
| --- | --- | --- |
| Country schema UID | `0x1801901fabd0e6189356b4fb52bb0ab855276d84f7ec140839fbd1f6801ca065` | `0xef54ae90f47a187acc050ce631c55584fd4273c0ca9456ab21750921c3a84028` |
| Indexer | `0x2c7eE1E5f416dfF40054c27A62f7B357C4E8619C` | `0xd147a19c3B085Fb9B0c15D2EAAFC6CB086ea849B` |
| Attester | `0x357458739F90461b99789350868CD7CF330Dd7EE` | `0xB5644397a9733f86Cacd928478B29b4cD6041C45` |

Claim: https://www.coinbase.com/onchain-verify

Users need ETH for gas and USDC to stake.

Mainnet: `NEXT_PUBLIC_VOTEMAP_CHAIN=base`.

## OAuth (optional UX)

```bash
npm run oauth
```

| Secret | Purpose |
| --- | --- |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | X OAuth 2.0 |
| `THREADS_CLIENT_ID` / `THREADS_CLIENT_SECRET` | Threads (handle login only) |
| `OAUTH_REDIRECT_URI` | Must match the app setting |
| `OAUTH_STATE_SECRET` | Encrypts PKCE/state |
| `APP_ORIGIN` | Static site, e.g. `http://localhost:3000` |
| `PORT` | Default `8787` |

No `OAUTH_ATTESTER_PRIVATE_KEY`. After login the app prefills `registerHandle`. First come, first served.

## Static export

`output: 'export'` is unchanged. Do not add `app/api/*`.
