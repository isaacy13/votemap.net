# Open questions

Not locked. Solved (v0 only): [requirements.md](./requirements.md). Known accepted risks: [accepted-risks.md](./accepted-risks.md). Later (not solved, unfinished): [later.md](./later.md).

| | | Proposed solutions (not locked) |
| --- | --- | --- |
| No taxpayer | Proposed mechanism if counsel says a form is owed: the signer tracks each payee’s calendar-year total and asks for a W-9 (through a vendor, never stored raw) before signing a pay that crosses the threshold. A pay moves USDC from the voter’s wallet to a person. Legal name is not collected. The trail has a handle and a wallet. With no custody, the voter is the payer, and whether votemap settles anything is weaker than under the old factory, but votemap still signs each pay. Research on what the law may require: [legal-reporting.md](./legal-reporting.md), written for the old factory. |  |
| Gas sponsorship | Users pay Base gas on each pay, so a new user needs ETH on Base as well as USDC. A paymaster could pay that gas for smart-wallet users (cents per pay, our cost). | 1. Users pay their own gas. 2. votemap sponsors pay gas through a paymaster, capped per account per month. |
| Treasury key and audit | Tips go to the treasury wallet. If one key controls it, losing or leaking that key loses every tip. The PayRouter moves real USDC and has had no outside review. | 1. Treasury is a 2-of-3 multisig (Safe on Base); one outside audit or public bug bounty on the router before launch. 2. Single-key treasury; no outside review. |
| Social rename | A bind stores the network handle. If someone renames on X, Instagram, TikTok, or Threads and another person takes the old handle, payers who pick that handle reach the old owner until the next check, and the new owner cannot bind it. | 1. Bind to the platform’s permanent account id (oEmbed author id, OAuth user id, Instagram page id); the handle is display only. 2. Bind to the handle string. |
| Named trail privacy | The trail names who paid whom and links each social account to a wallet, which exposes that wallet’s whole on-chain history. For political pledges that can mean harassment or safety risk, and it may deter donors. | 1. Keep it fully named; warn at wallet link and suggest a fresh wallet. 2. Payers can show as “anonymous pledger” on the page; the wallet stays visible on Basescan; payees stay named. |

v0 pricing is in [requirements](./requirements.md) item 10. No percentage is used to steer behavior.
