# Known accepted risks

Decided. Not open. Not later work.

Solved (v0 only): [requirements.md](./requirements.md). Open questions: [open.md](./open.md). Later (not solved, unfinished): [later.md](./later.md).

| | |
| --- | --- |
| Street address | v0 does not verify that a shop controls its street address. The address stays shown unverified. An address is not a link and does not by itself disqualify a shop. An address-only shop has zero verified links, so it cannot be paid as a shop. Accepted. |
| 60-day stale bind | After a check, the bind stays verified until the next check even if they remove the string or sell the account. Pay still goes to the wallet on that bind. The daily job does not re-fetch early. Accepted, not open. Applies to bio binds and to the website check. |
| Shop URL fetch | The fetcher checks that host’s DNS TXT record and `/.well-known/votemap.txt` when they save it and again when the 60 days are up. The shop only learns whether the votemap tag was there. A URL whose host is or resolves to a non-public address is rejected and never fetched ([requirements](./requirements.md) item 6). Accepted, not open. Until 2026-10-19 this row accepted fetching addresses only the signer could reach; that was a server-side request forgery hole and is no longer accepted. |
| Friend pays | A pledger can pay a friend, who hands the money back in cash or through other wallets. No design that lets each pledger pick the payee can stop this. Bounded: a pay counts half in expected payout until its payee has 3 other payers; a record vouches only at the scale it was earned; payee age, payer count, and “no claim” show on every pay; on-chain returns to linked wallets count nowhere. A ring of four KYC’d friends beats it. Accepted (2026-10-22). Self pays are not in this row: one account per Coinbase user closes them ([requirements](./requirements.md) item 5). |
| Borrowed backing | Backed reads the wallet’s live balance, so borrowed USDC can back pledges while it is held. It costs interest and shows as concentration. Accepted (2026-10-22). |
| OFAC lag | VoteMap does not re-run the sanctions list. A delay on Coinbase’s side is accepted. VoteMap still must not knowingly pay a sanctioned person. |

Website verification is solved v0 in [requirements](./requirements.md), not an accepted skip: a website is verified only when the site’s DNS TXT record or `/.well-known/votemap.txt` has `votemap/@handle` or `votemap.net/handle`. A shop with any unverified link cannot receive a bounty. That is solved v0 in requirements, not in [open.md](./open.md).
