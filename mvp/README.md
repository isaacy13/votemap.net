# votemap MVP

One factory on **Base**, native **USDC**, issues keyed by a **canonical x.com or Threads post URL**. Landing page is unchanged.

`/mvp` talks to the **real contract**. There is no mock mode. Missing env is an error.

## What it does

- First **1 USDC** stake on a post URL creates the issue; the same URL joins.
- Each staker **must** set their **own expiry**.
- On **their** USDC: pay a solver **1.5%** fee, early withdraw **10%**, expiry **5%**.
- **Treasury** is a required constructor argument. No dummy address.
- **Coinbase Verified Country** (EAS) is checked in the app. No mock checkbox.
- **Handles:** first wallet to call `registerHandle` owns that @. No attester key. X/Threads OAuth is optional login UX that prefills the handle; it does not sign on chain.
- **URLs:** `x.com` only for X posts. `twitter.com` is rejected. Threads posts are allowed.
- Embeds (`react-tweet` / Threads) and **Basescan** on txs.

Not in v0: vesting/clawback, custom inspector.

## Files

| Path | Why |
| --- | --- |
| `mvp/VoteMap.sol` | Factory |
| `mvp/App.tsx` | `/mvp` UI |
| `mvp/chain.ts` | RPC + txs |
| `mvp/urls.ts` | x.com / Threads parse |
| `mvp/oauth.mjs` | Portable OAuth login (no attester) |
| `app/mvp/` | Thin Next route. Issue view is `/mvp?url=…` (static export has no dynamic `[id]`). |

## Required env (static app)

`.env.local`, not committed:

```env
NEXT_PUBLIC_VOTEMAP_CHAIN=base-sepolia
NEXT_PUBLIC_VOTEMAP_CONTRACT=0x...
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
NEXT_PUBLIC_OAUTH_CALLBACK_URL=http://127.0.0.1:8787
```

`CHAIN` and `CONTRACT` are required. RPC override and OAuth URL are optional. USDC and treasury are read from the contract.

```bash
npm install
npm run dev
```

Open http://localhost:3000/mvp — you should see an env error until `CHAIN` and `CONTRACT` are set.

## Deploy

Remix-compile `mvp/VoteMap.sol`. Constructor:

- `usdc_` — Base Sepolia `0x036CbD53842c5426634e7929541eC2318f3dCF7e` or mainnet `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- `treasury_` — **your** treasury. Required. Not a placeholder.

Users need ETH for gas and USDC to stake. Isaac does not front gas.

Mainnet: `NEXT_PUBLIC_VOTEMAP_CHAIN=base`.

## OAuth (optional UX)

```bash
npm run oauth
```

| Secret | Purpose |
| --- | --- |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | X OAuth 2.0 |
| `THREADS_CLIENT_ID` / `THREADS_CLIENT_SECRET` | Threads |
| `OAUTH_REDIRECT_URI` | Must match the app setting |
| `OAUTH_STATE_SECRET` | Encrypts PKCE/state |
| `APP_ORIGIN` | Static site, e.g. `http://localhost:3000` |
| `PORT` | Default `8787` |

No `OAUTH_ATTESTER_PRIVATE_KEY`. After login the app prefills `registerHandle`; the user sends that tx from their wallet. First come, first served. `handleRequest(request, env)` is vanilla HTTP (Workers / Lambda later).

## Static export

`output: 'export'` is unchanged. Do not add `app/api/*`. Host `out/`; run OAuth as a separate process if you want the login buttons.
