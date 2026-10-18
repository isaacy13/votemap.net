# votemap v0 requirements

Open questions: [open.md](./open.md). Known accepted risks: [accepted-risks.md](./accepted-risks.md). Later (not solved, unfinished): [later.md](./later.md).

Locked with Isaac, 2026-09-26 (credits + vest ≤365d 2026-09-28; bio bind 2026-10-02; shop place + public page 2026-10-02; named money trail 2026-10-03; shop catalog 2026-10-03; redeem is final 2026-10-03; legal name not collected, website verification, and the 60-day lag 2026-10-03; outcome payee and OFAC via Coinbase 2026-10-03; shop bounty eligibility 2026-10-09; exact bio token, bio URL host, and cloaked website string 2026-10-09; profile bio read and paced daily job 2026-10-09; secure phone confirm 2026-10-09; shop website URL https and same host 2026-10-09; already claimed and failed tag check 2026-10-09; client-then-server URL check and 24-hour same-URL limit 2026-10-09). PEP screening is not part of this lock ([open.md](./open.md)). This is the **solved v0** page. Production: [PR #102](https://github.com/isaacy13/votemap.net/pull/102). [PR #101](https://github.com/isaacy13/votemap.net/pull/101) is **stopped**. Diagrams: [flows](./flows.md). The user-flow and system-flow PNGs are not in this repo. Cheats that are locked: [cheats-and-fixes.md](./cheats-and-fixes.md).

**Vote** = stake USDC on an **X, Threads, Instagram, or TikTok** post. Stakes are for an outcome. The reward goes to the person who did the work (builder, writer, shop, advocate). v0 does not file lobbying disclosures (LDA or otherwise). No lobbying-filing product. Whether to screen politically exposed persons is open ([open.md](./open.md)): v0 does not screen them today, and Coinbase country is not a PEP screen. A politician, or a wallet they control, claiming a payout for an official act is open: v0 does not yet forbid that payee ([open.md](./open.md)). **Tip-your-share:** you only move your own line. Live bounty = unexpired **remaining** (not yet dispersed). Disperse **partial, anytime before that line’s expiry** (e.g. $100, then $50 to A day 1, $25 to B day 2). Each slice may **vest 0–365 days** (0 = now). **Shop:** $5 → $5 credit, spend vested amount on a listed product. **Public:** 98.5% to a claimed wallet as it unlocks. Quit-tax on leftover = bakers you already picked, wash guard.

“Stake” means a votemap pot stake: USDC moved into the VoteMap contract against a public post. It is not DeFi / yield / validator staking. No interest. While it is a pot stake, it sits until that pot’s expiry, or until disperse / move / early exit under the existing fee rules. While it is shop credit (after disperse), there is no expiry clock in v0. It sits in the factory until that voter redeems. Redeem is final.

Solved v0: Redeem is final. Once the voter taps redeem, the shop credit USDC leaves the VoteMap factory and is paid to that merchant’s payout wallet. No VoteMap refund, no chargeback, no second hold, no two-step escrow after redeem. Redeem is the purchase, and it is final.

---

## Account (Google / Apple)

1. Sign in with **Google** or **Apple** (Isaac already pays Apple Developer).
2. Save OIDC **`sub`**, **email**, **name**. Key by `sub`, not email. Apple **name only on first Allow** — must save then. Email may be Hide My Email. **Legal name is not collected and is not a signup field.** v0 does not require a legal name to sign up. The OIDC `name` is the provider display name, not a legal name.
3. Then a votemap form: **gender**, **birth year**, **phone + SMS OTP**. Google/Apple do **not** provide gender/age. No handle until OTP succeeds.
4. Unique votemap **handle** (first-come) **and unique E.164**. One phone → one account, kept if they change handle. SMS vendor: reject VoIP when flagged. Handles are **FCFS**. Squat-the-name is **v0-ok** (votemap `@nike` is theirs). It does **not** confer Instagram `@nike`. **Pay picker is verified social @, not votemap @.**
5. **Wallet is optional.** No wallet = **readonly** (browse, edit own profile). Cannot post, stake, or vote until a wallet is linked.
6. **Public page** at **`votemap.net/@username`** (votemap handle). Linktree-like. They customize which links show (labels, order, what is listed). They can **show their shop** on this page as well as links. **v0 shop is a catalog**, not only an address on the profile. Shops list products they sell. A product can be physical or not. Each listed product: **name**, **price in USDC**, **physical or not**, **short text**. Off-chain, like links. Not a token. Not shipping labels, tax, themes, inventory sync, or staff accounts. License stays **later**. Hiding a social on this page does **not** unbind it. Pay picker still uses the bio bind. Bio text stays **`votemap/@handle` or `votemap.net/handle`**. This page is the public URL. Credit and redeem: item 9.

    **Verified marks (v0):** only TikTok, X, Threads, and Instagram, via the bio rule (`votemap/@handle` or `votemap.net/handle` in that account bio, 60 days, daily job on due binds only), and a website only if that site itself shows `votemap/@handle` or `votemap.net/handle` (same two strings, same 60-day window, same daily job: re-check when due, string still there → another 60 days, gone → lapses; do not fetch early; do not verify every URL). If they can edit the site’s code, the website is verified. A hidden element, an HTML comment, a script, or a response shown only to our checker still counts. The string does not have to be visible to other visitors. The badge means they control the host. A street address and any other link stay unverified. Showing the website on the public page is optional. Hiding it does not unbind it.

    **Website URL:** For a shop website verification URL, the URL must be https. http is rejected. A shop may enter an IP as their website. If it is https, the final host is that same IP, and the page has the votemap tag, accept it. The host they entered and the final response host must be the same host. A redirect that changes the host fails, including an IP that redirects to a hostname, and a hostname that redirects to a different host. A redirect that stays on that same host may pass. The signer fetches that URL on save only after the client check succeeded, and again when the 60 days are up. That 60-day check is server-only. The shop only learns whether the votemap tag was there. A same-host https URL is still fetched when that host is an address only the signer can reach. That is solved, not an open problem.

    **v0 bind is bio only, all four, including personal IG.** They put **`votemap/@handle` or `votemap.net/handle`** in that account’s **bio**, paste the social profile URL here. We check that profile’s bio while they are logged in as that votemap account. The bio must contain `votemap/@handle` or `votemap.net/handle` as a whole token. Handle characters are letters, digits, and underscore. The match fails if another handle character is glued on the end (`@ed` inside `@edward`, `@ed2`, `votemap.net/edward`). Text before it, and a non-handle character after it, is fine. Case-sensitive. Same rule for both strings. Before the fetch, the pasted profile URL host must be an allowlisted host for that network (`instagram.com`, `x.com`, `twitter.com`, `threads.net`, `tiktok.com`; `x.com` and `twitter.com` are the same network). After redirects, the final response URL host must still be on that same network’s allowlist. If the final host is anything else, the bind fails even when the body contains an exact token. Do not trust the URL the client says it ended on. Do not follow HTML or JavaScript redirects. A lookalike host (`instagram.com.evil.com`, punycode, userinfo like `instagram.com@evil.com`) fails. A redirect that stays on the allowlisted host may pass. **No comment on `@vote_map`. No other fallback.** Either string counts.

    **Already claimed:** A social profile URL or shop website URL that is already claimed is rejected, whether the existing claim is someone else’s or this same account. This is a validation step before a new bind. Comparison is case-insensitive. x.com and twitter.com are the same network, so the same handle on either is the same claim. A different handle, or the same handle on a different network, is not the same claim. The bio token match stays case-sensitive. Do not fold www to apex.

    **Failed tag check:** If a votemap tag check returns tag_missing, do not recheck until that user manually confirms they have fixed it. That confirmation is what allows the next check. A success still renews 60 days. retrieve_failed is unchanged: retry later the same day, do not lapse, do not wait for a manual confirm.

    **URL check rate:** An immediate check (first bind, or the user confirms they fixed a missing tag) runs on the client first, from the user’s IP. The server fetches that URL only if the client check succeeded (bio or page retrieved and the votemap tag is present). If the client returns tag_missing or retrieve_failed, the server does not fetch. A scheduled check (the 60-day job) is server-only. No client fetch. Immediate rechecks of the same URL by the same account are limited to once per 24 hours. A repeat inside that window is rejected and does not fetch.

    **Profile read:** GET the profile page. After the allowlist and final-host check, take the bio from X `meta name="twitter:description"`, Threads `meta name="description"`, Instagram `meta name="description"`, or TikTok `shareMeta.desc` in the page JSON. Decode HTML entities, then exact token match. The read returns `success` (bio text retrieved and the exact token is in it), `tag_missing` (bio text retrieved and the exact token is not in it), or `retrieve_failed` (no bio text: non-200, off-host redirect, missing field, login shell, empty body, network error). A page that has a bio without the token is `tag_missing`, never `retrieve_failed`. A login shell or a page with no bio field is `retrieve_failed`, never `tag_missing`. On a recheck, `retrieve_failed` does not lapse the bind. `tag_missing` does.

    **Daily job:** selects only binds whose 60 days are up (bio binds and a bound website). It re-fetches those only. String still there → verified for another 60 days, no user action. `tag_missing` lapses the bind. `retrieve_failed` does not. It does **not** scan every account, it does **not** re-fetch early, and it does **not** verify every URL. The bio rechecks have until end of day: spread the due binds across the day, do not fire them in a tight loop, retry `retrieve_failed` later the same day instead of immediately, and do not send another request to the same host until the previous one to that host has finished and a gap has passed.

    **60-day lag (solved v0):** After a check, the bind stays verified until the next check even if they remove the string or sell the account. Pay still goes to the wallet on that bind. The daily job does not re-fetch early. When the 60 days are up, string gone → bind lapses. This lag is accepted, not an open question ([accepted-risks.md](./accepted-risks.md)). It applies to bio binds and to the website check.

    **No social OAuth. No cold-DM. No paid X API.** X API is **not used**. FCFS votemap name is still theirs; squat-the-real-social still needs this bio. **One social @ binds to one votemap account.** **Pay picker** = verified IG / X / Threads / TikTok @ (not votemap @). Reverse lookup: social → votemap account → claimed wallet. Unbound / unverified social **cannot** be a pay dest. **Confirm before send:** social @, muted votemap @, wallet, Coinbase country. Solved v0: The phone shows the verified social @ the user picked, the dollar amount the user entered, and the claimed wallet on its own screen, and those displayed values are what get signed. The signer looks up verified social @ → votemap account → claimed wallet. The page does not supply the payee or the wallet. Web JS is untrusted. A token checked only by the page does not count. Redeem stays final. **Chain dest** = that claimed wallet. **UI (cards / pay):** **primary = verified social @** of that pot’s network. Votemap handle muted. No bind → votemap handle only (**not** fake-verified) — and they cannot be picked as pay dest until bound.

## Wallets and money

7. User **maps at most 3 wallets** they control (sign a message per address). One is the **payout** address. Unmapped addresses stay on this account’s disperse deny-list (tombstone).
8. **Post / stake / disperse / redeem / registerMerchant / claim / restake / move** needs a linked wallet, **≥ 1 USDC** to first-stake, own **expiry** (stake line), Coinbase **US**, and a **phone app** after biometrics. Desktop/web cannot obtain a votemap signature.
9. **First stake on a URL sets class** (`shop` or `public`), **immutable**. No `move` across class. **Disperse** leftover in as many slices as you want, **any time before that stake line’s expiry** (not one lump). Example: stake $100 → **$50 A on day 1**, **$25 B on day 2**, rest later. Each slice ≥ 1 USDC except final dust. `to != msg.sender`. Claim ≥ 24h. Signer refuses this account’s mapped/tombstoned wallets. **Picker:** verified social @ of that pot’s network (not votemap @). Reverse lookup social → votemap account → claimed wallet. Unbound / unverified social cannot be picked. **Confirm screen** before send: social @, muted votemap @, wallet, Coinbase country. **Chain dest** = that claimed wallet (`to` is the address, not a social string).
    - **Vest:** each slice sets `vestDays` **0–365** (integer days). **0** = unlocked now. Else **linear** from that slice’s timestamp: unlocked = face × min(1, daysElapsed / vestDays). Cannot edit after send. Unvested stays in the factory even if leftover is later withdrawn/expired. **No clawback** in v0.
    - **Shop:** payee must be a **merchant**. **Register:** Coinbase US + `registerMerchant`. Must have an **address, a website, or both**. Street address is self-attested, shown **unverified**. Website verification is item 6. Does **not** prove they control the street address. Solved v0: A shop cannot receive a bounty (shop disperse / redeem) unless both are true: it has at least one verified link, and it has zero unverified links. A shop with no verified links is ineligible. A shop with any unverified link is ineligible. To become eligible it adds a verified link and removes every unverified link. Verified links are only TikTok, X, Threads, and Instagram via the bio rule, and a website only when that site shows `votemap/@handle` or `votemap.net/handle`. Any other URL is an unverified link. A street address is not a link. It does not by itself disqualify a shop. An address-only shop has zero verified links, so it cannot receive a bounty. The public payee picker is unchanged. Catalog of products they sell: item 6. Face = amount you type ($5 → **$5 credit**). Remaining -= face + **1.5%** treasury (`floor(face * 15 / 1000)`). **Credit:** disperse to a shop writes credit for **(voter, that merchant)**. Buyer spends that shop’s credit on a **listed product**. Redeem can name the product and the price. Do not tokenize the product listing. Redeem spends **vested** credit only at that merchant and releases **that price** in USDC to that merchant’s payout wallet. Cannot redeem at another shop. Merchant cannot pull. Issued credit does not move or expire with leftover. We do **not** police whether a coffee was handed over. Where that USDC sits: [flows](./flows.md#where-shop-usdc-sits). “Stake” means a votemap pot stake: USDC moved into the VoteMap contract against a public post. It is not DeFi / yield / validator staking. No interest. While it is a pot stake, it sits until that pot’s expiry, or until disperse / move / early exit under the existing fee rules. While it is shop credit (after disperse), there is no expiry clock in v0. It sits in the factory until that voter redeems. Redeem is final. Solved v0: Redeem is final. Once the voter taps redeem, the shop credit USDC leaves the VoteMap factory and is paid to that merchant’s payout wallet. No VoteMap refund, no chargeback, no second hold, no two-step escrow after redeem. Redeem is the purchase, and it is final.
    - **Public:** remaining -= slice; **1.5%** of slice to treasury; **98.5%** is the face that vests to that EOA. Unlocked face: payee **claims** (wallet-only, 0% extra) so votemap down does not freeze unlocked money. Unvested is not claimable.
10. **Leftover only** (not issued credit / not unvested public face). Early **5%**, expire **5%**, move **5% if shop / 1.5% if public**. 95% / 98.5% leftover back to you or dest pot. **Cut:** if `totalDispersed ≥ leftover`, to bakers you already picked, pro-rata — shop: **extra credit** (vestDays **0**); public: USDC to those EOAs (instant). Else **treasury**. `move` dest same class. Restake **0%**. User pays Base gas. Move copies country snapshot.
11. One factory on **Base**. First stake creates the pot; same URL joins. **No new contract per issue.** Store remaining, expiry, class, country, payee weights, per-slice vest (start, days, face, pulled), shop credit pulled. Update state **before** USDC out.

## Country (Coinbase, not a form field)

12. Coinbase **Verified Country** = their **KYC residence** (ID, sometimes proof of address). Not whatever they type in votemap. Coinbase does **not** attest legal name. **v0 money path is Coinbase-only:** stake / disperse / redeem / registerMerchant / claim / restake / move require EAS on that wallet. No other KYC vendor. VoteMap does not run its own sanctions list. Coinbase screens those customers. That is the v0 rule. VoteMap does not re-run the list; a delay on Coinbase’s side is an [accepted risk](./accepted-risks.md). VoteMap still must not knowingly pay a sanctioned person. Browse without Coinbase is fine (readonly). Same-person duplicate Coinbase accounts are **Coinbase’s** problem (one personal account per ID + phone).

    **How MetaMask / hardware fits:** we do **not** take USDC from a Coinbase custodial account. The user keeps a self-custody wallet (MetaMask, Ledger, Coinbase Wallet app, etc.). They must have a **Coinbase.com** account (ID + phone), then **Onchain Verify** that wallet so Coinbase writes an EAS badge on Base: “this address is a KYC’d Coinbase user, country = US.” `VoteMap.sol` reads that badge on `msg.sender`. No badge / not US → stake reverts. That is how we get **location**. Coinbase never holds that seed.

    **Not Coinbase SSO.** Login stays Google/Apple. SSO would not put country in bytecode (Remix could skip it). Do not use OAuth country as the allowlist.
13. **`VoteMap.sol` reads EAS for `msg.sender`** (Coinbase attester, not revoked). **No `country` argument.** Passing `"US"` in calldata is a **security bug**.
14. **MVP: only `US` may stake/vote.** On-chain ISO **allowlist**, starts with `US`. Admin (deployer/treasury) can add countries later. App follows the same list. Browse can be global.
15. **Write that ISO code into stake storage** (and emit). Keep it after revoke so we can still see which countries pushed a bounty. Do not re-query live EAS to label old money.

## Phone-only vote (JS is untrusted)

16. **Web / desktop / other browsers = readonly.** Browse, profiles, QR / share sheet / iOS Share to open that issue on the **phone app**. No stake, disperse, redeem, claim, restake, or move from the website.
17. **Sign / stake only on iOS or Android** after **strong biometrics** (Face ID / Class 3 fingerprint). **No PIN/passcode fallback.** No biometrics enrolled → cannot sign.
18. **Do not trust a JS `sendOk()`.** The Stake **button can be HTML** in the WebView; it may only call a native plugin (`VoteMap.stake(...)`). That call is “please start a stake,” not “biometrics passed.” Native does Face ID, signs with the enclave/keystore, and **HTTPS to the signer**. The signer never accepts an “okay” from the WebView. Console can invoke the plugin; it still cannot skip Face ID or fake the hardware signature.
19. After that device proof, **votemap EIP-712-signs** `stake` / `pay` (disperse: amount + to + **vestDays 0–365**) / `redeem` / `registerMerchant` / `claim` / `restake` / `move`. Contract requires that sig. Remix without it reverts.
20. **Leftover withdraw/expiry and public unlocked-vest claims are wallet-only** (no votemap sig) so we cannot freeze that USDC if we are down. Shop redeem and unvested funds still need the product rules above.
21. Signer key in env, never git. Owner can rotate. This is **not** the country check. Cheap path: thin native shell (Capacitor/plugin) around the same UI — **not** React Native. Native plugin does biometrics + keystore; web JS does not.

## Issues (posts)

22. **Paste / embed must be a public canonical permalink.** Reject private / non-embeddable / wrong host in **app and bytecode**. A post that is private, deleted, or not embeddable **at stake time** does not get through. **No pot.**
    - **X:** `x.com/{user}/status/{id}` (also `twitter.com`). Keep `{user}` for snapshot. Pot key may be `x.com/i/status/{id}` so pots don’t split.
    - **Threads:** `threads.net/@{user}/post/{id}` (also `threads.com`)
    - **Instagram:** `instagram.com/p/{code}` or `/reel/{code}` (or `/{user}/p/` — any content URL, not Reels-only)
    - **TikTok:** `tiktok.com/@{user}/video/{id}` — resolve `vm.` / `vt.` first, **never** key on short links
23. **Signer/app canonicalize before EIP-712:** `twitter.com` → `x.com`, strip `www.`, strip tracking query/fragment, resolve `vm.`/`vt.` to permalink, no trailing slash junk. Pot key = that canonical string. Reject if resolve fails. Bytecode stores the string (cannot HTTP-fetch). **Why not scrape the live embed:** official widgets become **cross-origin iframes after hydrate** — we cannot read handle / date / caption from them. **Snapshot at first stake** for the browse index (item 25). Issue page may still render the embed. No categories (group by URL).
24. No mock chain, no placeholder treasury. Treasury **required at deploy**. `/mvp` errors until chain + contract env are set.
25. **Browse index is v0 (solved).** First stake: the **signer** fetches a snapshot from **exact-host-allowlisted** oEmbed / permalink hosts. **Never trust client-supplied handle / text / date.** Store one row: `network`, `handle`, `postedAt`, pot hash, one-line text. Browse = paged queries on that index (`LIMIT 50`). **Do not refetch 1M posts.** Pot key = canonical URL. Changing the URL = a **different pot**; cannot overwrite another post’s row. Resolve TikTok `vm.`/`vt.` once, then key the permalink. A **malicious URL is solvable this way** (exact host, signer fetch, one row per pot key) — not an open cheat. Live embed **only** on the issue page (filters never read it).

## What we write where

| Data | User store (from login/form) | On-chain |
| --- | --- | --- |
| Google/Apple `sub`, email, name | Yes (source of truth) | Yes on `claim` — **spoofable** if they skip our signer; signer is the bind |
| Gender, birth year | Yes (self-reported) | Yes on `claim` |
| Phone (E.164) | Yes, after SMS | **Never raw.** `phoneVerified` / optional hash only |
| Country | Preview from EAS | **EAS lookup + snapshot on stake** |
| Social handles | Yes. Bound via **bio**; unique @ → one votemap account; **pay picker** when verified | No. **Chain dest is claimed wallet.** Lookup is off-chain. |
| Merchant flag + shop name | Yes (self-attested) | Yes (`registerMerchant`) |
| Shop address and/or website | Yes (at least one). Address shown **unverified**. Website verified only per item 6. | No |
| Shop products | Yes (name, USDC price, physical or not, short text) | No |
| Public page links | Yes (labels, order, listed) | No |
| Shop credits / vest slices | Yes | Yes (per-slice start, days, face, pulled) |
| Named trail | See item 26. | See item 26. |

## Contract must revert (not UI-only)

- ≥ 1 USDC first stake; disperse slice ≥ 1 USDC except final dust leftover  
- Coinbase EAS country for `msg.sender` + allowlist  
- votemap EIP-712 sig on stake / pay (disperse) / redeem / registerMerchant / claim / restake / move  
- Allowlisted **canonical** URL only (X / Threads / Instagram / TikTok, including move dest)  
- URL class `shop` | `public` immutable; no move across class  
- 0% restake · 1.5% per disperse · shop move **5%** / public move **1.5%** · 5% early · 5% expiry · 0% redeem  
- restake/move keep remaining principal in the factory; **issued shop credit stays until redeem**  
- shop disperse: merchant only; redeem **vested** only, that voter → that merchant. Solved v0: Redeem is final. Once the voter taps redeem, the shop credit USDC leaves the VoteMap factory and is paid to that merchant’s payout wallet. No VoteMap refund, no chargeback, no second hold, no two-step escrow after redeem. Redeem is the purchase, and it is final.  
- public disperse: `claim`ed address, `to != msg.sender`, claim age ≥ 24h, before line expiry; unlocked vest claimable wallet-only  
- each disperse `vestDays` ∈ **[0, 365]**; linear; unvested stays in factory  
- leftover haircut → picked bakers **iff** `totalDispersed ≥ leftover` (shop: extra credit vest 0; public: USDC), else treasury  
- per-staker expiry; country + payee weights stored on the stake line  
- treasury `floor` bps; remaining/state update before transfer  

**Cannot live in bytecode:** Google/Apple session, SMS, unique E.164, votemap handle, Face ID, same-account mapped-wallet graph, HTTP canonicalize/oEmbed, shop address/website, **shop products**, public page links, extra “is this a real bakery” vendor, **browse index**, **social → votemap → wallet payee lookup**, **named trail** (wallet → votemap username → bound socials). Direct Remix skips biometrics **and** has no votemap sig, so stake/pay/redeem/registerMerchant/claim/restake/move revert. Leftover withdraw/expiry and **unlocked public vest claims** still work from any wallet. Unvested and shop credit do not.

## Site / cost

- New UI in `mvp/`. Landing page untouched. Static export. Portable **Google/Apple OIDC** + SMS + signer HTTP (not Cloudflare-only). **X API not used.** Browse index lives on the **signer** (or tiny read API), not in the export.
- SMS OTP costs us per code.

## Where the money went

26. **v0:** he can see where the money went. The trail reads as votemap names — **`@isaac` paid `@grok`** — not only tx hashes. Map **wallet → votemap username**, and through that username to **bound Instagram / X / Threads / TikTok**. **Basescan** stays as the raw link. No privacy hide.

    **Minimal (least to operate):** the signer already handles **stake / disperse / move / redeem**. On that path it appends **one row:** action (`stake` / `disperse` / `move` / `redeem`), from votemap handle, to votemap handle, amount, pot, tx hash. Handles are the **names at that moment**. The page lists those rows and **shows the action label**. The hash links to **Basescan**. No archive node, no general USDC indexer, no hop explorer. Bound Instagram / X / Threads / TikTok come from the account lookup we already need for pay.

    If the from or to wallet has no votemap account, that hop is marked **unknown hands** (show the address, never a fake name). The point is scrutiny: the reader can see money passed through hands not registered with votemap.

    **Score** on that same list, **visible only:** share of these rows whose wallets are votemap accounts. Higher when every hop is a votemap-registered wallet. Do **not** invent a fee discount, rank prize, or new fee. Economic reward stays in [open](./open.md) *Fees vs behavior*.

    Off-platform hops (USDC leaves votemap and moves through other wallets) are **not** in this score. Seeing those is the general explorer — later, not solved.

## Later (not solved)

Unfinished deferred list: [later.md](./later.md). Not v0. Not the [open questions](./open.md).
