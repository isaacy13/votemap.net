# votemap v0 flows

Checked against [requirements](./requirements.md) — **v0 only**. Later (not solved, unfinished): [later.md](./later.md). Open questions: [open.md](./open.md). Home is the **current landing** (*vote for the future you want to see*), not a `/mvp` clone.

- User flow diagram: the PNG is not in this repo. The mermaid under section 1 is the text.
- System flow diagram: the PNG is not in this repo. The mermaid under section 2 is the text.
- [where shop USDC goes](#where-shop-usdc-goes)

**No custody.** VoteMap never holds USDC. **Fees:** **1.5% on pay · 0% pledge, cancel, lapse**. A pledge is a wallet-signed promise (no gas, no USDC moves). A pay goes from the voter’s wallet straight to the payee’s wallet in one transaction. **Pay picker** = verified social @ → confirm → **payout wallet**. Public officials cannot be paid ([requirements](./requirements.md) item 27).

## 1. User flow

**Sign in:** Google or Apple (OIDC) → gender, birth year, SMS OTP → unique votemap handle (**FCFS**) + unique E.164.

**Bio bind (v0, all four, personal IG too):** put **`votemap/@handle` or `votemap.net/handle`** in that account’s **bio**. **No comment on `@vote_map`. No other fallback.** **No social OAuth, no cold-DM, no paid X API.** One social @ → one votemap account. Cards / pay UI: **verified social @ primary**, votemap handle **muted**. No bind → votemap handle only (not fake-verified) and **cannot be paid**.

**Public page (v0):** `votemap.net/@handle`. Linktree-like. They customize which links show (labels, order, listed). Verified marks in v0 are only TikTok, X, Threads, and Instagram, via the bio rule (`votemap/@handle` or `votemap.net/handle` in that account bio, 60 days, daily job on due binds only), and a website only if that site itself shows `votemap/@handle` or `votemap.net/handle` (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it. **Shop is a catalog**, not only an address: they list products they sell (name, USDC price, physical or not, short text; off-chain, like links; not a token). Not shipping labels, tax, themes, inventory sync, or staff accounts. License stays later. Hiding a social does **not** unbind it. Pay picker still uses the bio bind. Bio text stays `votemap/@handle` or `votemap.net/handle`.

**Shop register:** Coinbase US on the payout wallet + merchant flag (off-chain). Address and/or website required. Street shown **unverified**. Website verified only as stated above. Verified social is the bio bind. Does not prove they control the street. A shop cannot be paid as a shop unless it has at least one verified link and zero unverified links. An address-only shop or any unverified link cannot. A street address is not a link and does not by itself disqualify a shop. The public payee picker is unchanged. Products live on the public page (item 6).

**Browse:** fetcher snapshot at first pledge (canonical permalink; exact-host allowlist; never trust client handle/text/date). A post that is private, deleted, or not embeddable **at first pledge** does not get through. **No pot.** Live embed is iframe-opaque — filters never read it. After pledges are in, private/deleted is [open](./open.md). Browse sorts on **backed** USDC, not pledged.

**Web/desktop:** readonly + QR / share sheet. **Pledge and pay only on iOS/Android** after Face ID / Class 3 (no PIN). Wallet optional until pledge; **max 3**, one payout. Coinbase Onchain Verify **EAS US** on the paying wallet and on the payee wallet. Paste a public canonical permalink (X / Threads / IG / TikTok).

**Pledge:** pick a post → amount (≥ 1 USDC) and expiry → wallet signs → published with **backed** amount (up to what the wallet holds). Cancel anytime, free. Lapses at expiry.

**Claim:** a verified-bind account posts “I did this” on a pot, with a link.

**Pay:** pick a claimant or a **verified social @** (not votemap @) → reverse lookup votemap account → **confirm** (social @, muted votemap @, wallet, Coinbase country) → one transaction from the voter’s wallet: 98.5% to the **payout wallet**, 1.5% to the treasury. Unbound / unverified social cannot be a dest. Pays count toward the voter’s **follow-through**.

**Where the money went (v0):** rows are **pledge** / **cancel** (from the stored signed messages) and **pay** (from the router’s `Paid` events, only once on Base): action, from votemap handle, to votemap handle, amount, pot, tx hash. Handles are the names at that moment. The page lists those rows and **shows the action label**. Hash links **Basescan**. No-account hop is **unknown hands** (address, never a fake name). No trail score. Off-platform hops are not shown (general explorer, later). Bound IG / X / Threads / TikTok from the pay lookup. Reads **`@isaac` paid `@grok`**. No archive node, no general USDC indexer. No privacy hide.

Pay is final. VoteMap cannot refund, reverse, or freeze a pay, because VoteMap never held it.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Inter, system-ui, sans-serif","primaryColor":"#eef2ff","primaryTextColor":"#111827","lineColor":"#64748b","clusterBkg":"#f8fafc","clusterBorder":"#cbd5e1"}}}%%
flowchart TB
  You([You]) --> Home
  Home["HOME — current landing, not /mvp<br/>vote for the future you want to see<br/>no wordmark · no top-right nav"]

  Home --> Google["Sign in with Google"]
  Home --> Apple["Sign in with Apple"]
  Home --> Divider["── divider ──"]
  Divider --> Browse["Browse — sign in or browse"]

  Google --> Form["Gender, birth year, SMS OTP"]
  Apple --> Form
  Form --> Handle["votemap handle — FCFS"]
  Handle --> Bind["Bio bind all four · personal IG too<br/>votemap/@handle or votemap.net/handle<br/>verified for 60 days until next check"]
  Bind --> Page["Public · votemap.net/@handle<br/>bio socials verified · website if string on site<br/>street + other links unverified · hide ≠ unbind<br/>shop can show in v0"]
  Page --> Browse

  subgraph browsePage ["Browse — fetcher snapshot, not live iframe"]
    Catalog["Catalog of issues / pots<br/>canonical permalinks"]
    OpenPost["Open a post"]
    URLs["X · Threads · Instagram · TikTok"]
    Catalog --> OpenPost --> URLs
  end
  Browse --> Catalog

  subgraph webcol ["Web / desktop"]
    Readonly["Readonly — cannot pledge or pay"]
    QR["QR / share sheet to phone"]
    Readonly --> QR
  end

  subgraph phonecol ["iOS / Android — pledge and pay only here"]
    Face["Face ID / Android Class 3 · no PIN"]
    Wallet["Wallet optional until pledge<br/>max 3 · one payout · Coinbase EAS US"]
    Pledge["Pledge ≥ 1 USDC · expiry<br/>wallet-signed · no gas · USDC stays in wallet"]
    Face --> Wallet --> Pledge
  end

  URLs --> Readonly
  URLs --> Face
  QR --> Pledge

  subgraph after ["After the pledge"]
    Cancel["Cancel or lapse — 0%"]
    Claim["Claim — someone posts I did this"]
    Pay["Pay 1.5% · one tx from your wallet<br/>picker = claimant or verified social @<br/>confirm: social · muted votemap<br/>wallet · Coinbase country<br/>USDC → payout wallet"]
  end

  Pledge --> Cancel
  Pledge --> Claim --> Pay
  Pledge --> Pay

  classDef home fill:#ffedd5,stroke:#ea580c,color:#9a3412
  classDef google fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef apple fill:#e5e7eb,stroke:#6b7280,color:#111827
  classDef ok fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef info fill:#e0e7ff,stroke:#4f46e5,color:#312e81
  classDef grey fill:#f3f4f6,stroke:#9ca3af,color:#374151
  classDef warn fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
  class Home home
  class Google google
  class Apple apple
  class Form,Handle,Bind,Page,Face,Wallet,Pledge info
  class Browse,Catalog,OpenPost,URLs,Claim,Pay ok
  class Readonly,QR,Divider,Cancel grey
```

User flow diagram PNG is not in this repo.

**UI:** bound social @ is the **name**; votemap handle muted. Public page: shop is a **catalog**. Verified marks are bio-bound socials and a website that shows the string; street and other links stay unverified.

## 2. System

Web JS is untrusted: `sendOk()` is ignored. Native plugin does Face ID / Class 3, signs with Secure Enclave / Keystore, HTTPS to the votemap API. The **API** stores wallet-signed pledges and claims and **looks up** verified social @ → votemap account → payout wallet, refusing listed public officials. The **signer** (key in KMS, no outbound fetches) EIP-712-signs each pay with payer, nonce, deadline, chainId and router. The **fetcher** (no secrets, public addresses only) **snapshots the post** from exact-host allowlisted oEmbed/permalink hosts and reads bios and websites. The **indexer** reads the router’s `Paid` events and pledgers’ USDC balances for trail rows (no-account hop is **unknown hands**), backed amounts, and follow-through. Never trust client handle/text/date. Official embeds are **cross-origin iframes after hydrate**. The PayRouter holds no USDC, so there is nothing to withdraw or freeze.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Inter, system-ui, sans-serif","primaryColor":"#eef2ff","primaryTextColor":"#111827","lineColor":"#64748b","clusterBkg":"#f8fafc","clusterBorder":"#cbd5e1"}}}%%
flowchart TB
  You([You]) --> WebJS
  You --> Plugin

  subgraph web ["Web / desktop — JS untrusted"]
    WebJS["Web JS"]
    SendOk["sendOk() ignored — cannot pledge or pay"]
    QR["QR / share sheet to phone"]
    WebJS --> SendOk
    WebJS --> QR
  end

  subgraph native ["iOS / Android native plugin"]
    Plugin["VoteMap.pay(...) is a request only"]
    Face["Face ID / Android Class 3 · no PIN"]
    HW["Secure Enclave / Keystore signs challenge"]
    HTTPS["Native HTTPS to votemap signer"]
    Plugin --> Face --> HW --> HTTPS
  end

  QR -->|open on phone| Plugin

  subgraph server ["votemap services"]
    API["API · pledges · claims · lookup<br/>verified social @ → account → payout wallet<br/>refuses public officials"]
    Signer["Signer · KMS key · signs only<br/>payer · nonce · deadline · chainId · router"]
    Fetcher["Fetcher · no secrets · public IPs only<br/>first-pledge snapshot · bio · website"]
    Indexer["Indexer · Paid events · wallet balances<br/>trail · backed · follow-through"]
    API --> Signer
    API --> Fetcher
    Indexer --> API
  end

  HTTPS -->|native HTTPS| API

  subgraph base ["Base"]
    EAS["Coinbase EAS US · payer and payee"]
    Router["PayRouter · holds no USDC<br/>98.5% → payee · 1.5% → treasury<br/>emits Paid"]
    EAS --> Router
  end

  Signer -->|EIP-712 pay sig| Wallet["Voter wallet"]
  Wallet -->|one pay tx| Router
  Router -->|Paid events| Indexer
  Fees["1.5% pay · 0% pledge / cancel / lapse"]

  classDef grey fill:#f3f4f6,stroke:#9ca3af,color:#374151
  classDef warn fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
  classDef info fill:#e0e7ff,stroke:#4f46e5,color:#312e81
  classDef ok fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef cyan fill:#cffafe,stroke:#0891b2,color:#155e75
  classDef peach fill:#ffedd5,stroke:#ea580c,color:#9a3412
  class WebJS,QR,Readonly grey
  class SendOk warn
  class Plugin,Face,HW,HTTPS info
  class API,Signer,Fetcher,Indexer ok
  class EAS,Router cyan
  class Wallet,Fees peach
```

System flow diagram PNG is not in this repo.

## Where shop USDC goes

VoteMap never holds it. There is no factory, no credit row, and no redeem step.

```mermaid
flowchart TB
  VW["Voter wallet<br/>USDC they still hold"]
  R["PayRouter on Base<br/>holds nothing"]
  TR["Treasury wallet"]
  SH["Shop payout wallet"]

  VW -->|"1. Pledge<br/>signed message, USDC stays"| VW
  VW -->|"2. Pay for a listed product<br/>one tx"| R
  R -->|"1.5% fee"| TR
  R -->|"98.5%, same tx"| SH
```

1. **Pledge.** The voter signs a promise toward the post’s outcome. USDC stays in the voter’s wallet.
2. **Pay the shop.** When the voter buys a listed product, one transaction from the voter’s wallet pays the shop’s payout wallet and the 1.5% fee. The signed pay names the product and price. The shop can show the confirmed tx at the till.

Pay is final. VoteMap cannot refund, reverse, or freeze it, because VoteMap never held it.

Shop pay diagram PNG is not in this repo.
