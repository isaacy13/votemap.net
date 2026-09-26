# votemap MVP

Smallest click-through of the locked v0: **one factory on Base**, **native USDC**, issues keyed by a **canonical X or Threads post URL**. Landing page is unchanged.

Open **`/mvp`**. Default is **mock mode** (no contract, no seeded issues) so you can click through. Pretty UI is later.

## What it does

- First **1 USDC** stake on a post URL creates the issue; the same URL joins.
- Each staker **must** set their **own expiry**.
- On **their** USDC: pay a solver **1.5%** fee, early withdraw **10%**, expiry **5%**. Treasury is a **placeholder**.
- **Coinbase residence** required (real Verified Country on Base mainnet; **mocked on testnet/mock**).
- **X or Threads OAuth** (at least one; may link both). Posts are independent of which network they logged in with. Pay only to handles that OAuth’d here.
- After OAuth, handle↔wallet is bound **on chain** (attester signature). **No database.**
- Embeds: `react-tweet` for X, Threads embed.js for Threads. **Basescan** links on txs (when not mock).

Not in v0: vesting/clawback, custom inspector.

## Layout

| Path | Why |
| --- | --- |
| `mvp/` | All MVP logic (contract, OAuth, UI) |
| `app/mvp/` | Thin Next.js route so `/mvp` exists. Static export cannot use App Router dynamic `[id]` without build-time paths, so the issue view is `/mvp?url=…` |
| `mvp/oauth/callback.mjs` | Portable HTTP callback **beside** the static app — not a Next server route |

## Mock click-through (no keys)

```bash
npm install
npm run dev
```

Open http://localhost:3000/mvp

1. Mock Coinbase residence.
2. Bind a mock X or Threads handle (Wallet A).
3. Paste a real X or Threads post URL, set expiry, stake ≥ 1 USDC.
4. Open the issue (embed + stakes). Switch to Wallet B, bind a solver handle, switch back, pay `@that-handle`.

Nothing is pre-seeded.

## Real Base Sepolia

1. Remix-compile `mvp/contracts/VoteMap.sol` (and optionally `MockUSDC.sol` if you are not using Circle test USDC).
2. Deploy `VoteMap` with:
   - `usdc_` — Base Sepolia native USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (or your MockUSDC)
   - `treasury_` — **replace the placeholder** `0x0000000000000000000000000000000000000001`
   - `attester_` — address of `OAUTH_ATTESTER_PRIVATE_KEY`
3. Env for the static app (`.env.local`, not committed):

```env
NEXT_PUBLIC_VOTEMAP_CHAIN=base-sepolia
NEXT_PUBLIC_VOTEMAP_CONTRACT=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_TREASURY_ADDRESS=0x...          # your treasury; placeholder if unset
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org  # optional override of public RPC
NEXT_PUBLIC_OAUTH_CALLBACK_URL=http://127.0.0.1:8787
NEXT_PUBLIC_X_CLIENT_ID=                       # optional if you only ship Threads
NEXT_PUBLIC_THREADS_CLIENT_ID=                 # optional if you only ship X
```

Users need a little **ETH** on Base Sepolia for gas, plus **USDC**. Isaac does not front gas.

Mainnet: `NEXT_PUBLIC_VOTEMAP_CHAIN=base` and native USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`. Residence is no longer mocked.

## OAuth function (Isaac fills these)

Run **from the repo root** (so `viem` resolves):

```bash
npm run oauth
```

| Secret (server only) | Purpose |
| --- | --- |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | X OAuth 2.0 app |
| `THREADS_CLIENT_ID` / `THREADS_CLIENT_SECRET` | Threads app |
| `OAUTH_REDIRECT_URI` | Must match the app setting, e.g. `http://127.0.0.1:8787` |
| `OAUTH_STATE_SECRET` | Encrypts PKCE/state (no DB) |
| `OAUTH_ATTESTER_PRIVATE_KEY` | Signs handle↔wallet binds |
| `VOTEMAP_CONTRACT` | Same factory the UI uses |
| `CHAIN_ID` | `84532` Sepolia / `8453` Base |
| `APP_ORIGIN` | Static site, e.g. `http://localhost:3000` |
| `PORT` | Default `8787` |

Register **at least one** of X or Threads. Same callback URL for both. The handler is vanilla `Request`/`Response` (`handleRequest`) so it can later sit on Workers/Lambda **without Cloudflare-specific APIs**.

X callback URL allowlist + Threads redirect must equal `OAUTH_REDIRECT_URI`.

## Static export

`output: 'export'` is unchanged. Do not add `app/api/*` routes. Host `out/` as today; run the OAuth function as a separate tiny HTTP service.
