# Legal reporting

Research only. Dated 2026-10-07. Not legal advice. Not a lock. Not solved v0. This note does not change [requirements.md](./requirements.md). The “No taxpayer” row in [open.md](./open.md) stays open. **2026-10-19:** v0 moved to no custody. **2026-10-23:** v0 locks pledges in an immutable vault with no VoteMap key; VoteMap’s signer must approve each pay ([open.md](./open.md) “Locked pot legal review”). The analysis below was written for the old factory, which held USDC; it needs a fresh counsel read against the new facts, especially the money-transmitter and 1099 sections.

Sources are IRS, FinCEN, OFAC, Coinbase, or a state statute or tax letter, read for this note. Where a 2026 figure could not be verified, the figure is omitted.

## The money this is about

Users stake their own USDC into one VoteMap factory on Base. A disperse takes a fee (1.5% to treasury). Shop redeem and a public claim release USDC to a different person. Early leave and expiry can send leftover back to the staker. VoteMap does not collect a legal name or a TIN. The money path is Coinbase-only (EAS, US). Coinbase does not attest legal name. v0 is not a tax product: no sales-tax calculator and no shipping tax. The question is what the law requires anyway.

Two different stories have to stay separate:

- **The staker’s money.** The USDC starts as the staker’s. The fee is the only slice that is VoteMap’s price for the action. A return of leftover to that same staker is the staker’s own USDC leaving.
- **VoteMap settled the payment.** Shop redeem and public claim (and quit-tax, when it pays people already picked) move that USDC to someone else under factory rules. A payment app files on the person who was paid even when the dollars were the customer’s. Coinbase not filing this hop does not answer whether VoteMap must.

## 1. Information returns

### 1099-K — maybe

Form 1099-K is the payment-app and marketplace form. The filer is the payment settlement entity, not the buyer. For a third party settlement organization (TPSO), that is the central organization with the contractual obligation to pay participating payees. A TPSO “makes a payment in settlement” when it submits the instruction to transfer funds to the participating payee. The gross amount is the year’s total for that payee, without subtracting fees, refunds, or shipping. [IRS Instructions for Form 1099-K (rev. 12/2026)](https://www.irs.gov/instructions/i1099k).

A third party payment network, as those instructions state it, has all three of these: accounts at a central organization for a substantial number of providers of goods or services who are unrelated to that organization and who agreed to settle those sales; standards and mechanisms for settling; and a guarantee of payment to the people who provided the goods or services.

**2026 federal threshold, verified.** A TPSO reports a participating payee only if, for the calendar year, the gross amount of reportable payment transactions **exceeds $20,000** and the number of those transactions **exceeds 200**. Both are required. Payment-card settlement has no de minimis; this factory is not a card network, and USDC is not treated here as a payment card. The $20,000 / 200 rule is the pre-2021 threshold, put back by the One, Big, Beautiful Bill. [Same 1099-K instructions](https://www.irs.gov/instructions/i1099k); [IRS Form 1099-K FAQs for third-party filers](https://www.irs.gov/newsroom/form-1099-k-faqs-third-party-filers-of-form-1099-k); [Pub. 1099 (2026)](https://www.irs.gov/publications/p1099). State 1099-K thresholds were not verified, so none are stated.

**Who would be the payor.** If VoteMap is the TPSO, VoteMap is the filer, and the form names the payee (the shop, or the person who was paid for goods or services). The staker is not the filer. “It was the staker’s USDC” is the ordinary 1099-K case.

**Where it fits, and where it is weak.** Shop redeem is the closer case: a merchant provides a listed product, the factory holds the USDC, and redeem releases that price to the merchant’s wallet. Public claim is weaker, because a bounty for an outcome may be a prize rather than settlement for goods or services, and 1099-K is about goods or services. The guarantee element is also weak: the merchant cannot pull, and the release is the funded credit the voter chooses to redeem, not a promise that VoteMap will pay from its own treasury. “Substantial number” is in the instructions and is not a number this note will invent.

Below the federal threshold there is no federal 1099-K filing duty for that payee, unless backup withholding already made a prior year reportable (see below). That threshold is not a conclusion that the factory is outside 6050W.

### 1099-NEC — maybe

Form 1099-NEC reports nonemployee compensation for services. For tax years beginning after 2025, the reporting threshold for that compensation is **$2,000**, indexed for inflation starting in 2027. It was $600. [IRS Instructions for Forms 1099-MISC and 1099-NEC](https://www.irs.gov/instructions/i1099mec); [Pub. 1099 (2026)](https://www.irs.gov/publications/p1099).

The payor is a person engaged in a trade or business who pays that compensation. A staker who is not paying in a trade or business has no duty under this rule. VoteMap is in a trade or business. The open question is whether VoteMap **made the payment**, or only moved the staker’s USDC.

The middleman rule that was verified is [26 CFR 1.6041-1(e)](https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/subject-group-ECFR31749dec6d4756f/section-1.6041-1). A person who pays on behalf of someone else is the payor who must file if, under the facts, it performs management or oversight of the payment, or has a significant economic interest in the payment. Oversight excludes “mere administrative or ministerial functions such as writing checks at another’s direction.” The regulation’s examples of a significant economic interest are a mechanic’s lien or a loss of collateral. A processing fee is not one of those examples, so the 1.5% by itself does not make VoteMap the payor under the text that was read. If two persons both qualify, the one closest to the payee files, unless they agree in writing that another will.

The signer’s rules (who may be paid, vest, merchant registration, same-account block) are more than writing a check at the staker’s direction. That is the oversight argument. It is not settled by a ruling on this factory. This regulation is the section 6041 rule. 1099-NEC is section 6041A. The $2,000 threshold for the NEC form was verified in the 2026 instructions. The full text of 26 CFR 1.6041A-1 was not re-read for this note.

**Goods drop out.** Payments of bills for merchandise are not reported under section 6041. [26 CFR 1.6041-3(c)](https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/subject-group-ECFR31749dec6d4756f/section-1.6041-3). A shop redeem that buys merchandise is a 1099-K question, not a 1099-NEC question. A shop product that is a service, and a public pay that is pay for work, are the NEC candidates. A prize that is not pay for services is 1099-MISC, below.

### 1099-MISC — maybe

Same $2,000 threshold for 2026 for prizes and awards and for other fixed or determinable income of the kinds listed in the instructions (royalties stay at $10; attorney gross proceeds stay at $600). [Same NEC/MISC instructions](https://www.irs.gov/instructions/i1099mec); [Pub. 1099 (2026)](https://www.irs.gov/publications/p1099).

The payor analysis is the section 6041 middleman rule above. A public bounty that is a prize or award, rather than nonemployee compensation, is the MISC case. The same name and TIN gap applies. Merchandise payments are out under 1.6041-3(c).

### 1099-DA — maybe

Form 1099-DA reports a **customer’s sale or disposition** of a digital asset, filed by a broker. It does not report the payee’s income. If it applied here, the form would name the staker who disposed of USDC, not the shop or the public claimant.

**2026 rule, verified.** Brokers report gross proceeds for sales effected after 2025, and basis for covered securities acquired after 2025 in an account where the broker provided custodial services. A broker includes a person who, in the ordinary course of a trade or business, stands ready to effect sales of digital assets to be made by others, including as a digital asset middleman. [IRS Instructions for Form 1099-DA (2026)](https://www.irs.gov/instructions/i1099da); [IRS digital-asset page](https://www.irs.gov/filing/digital-assets).

A **processor of digital asset payments (PDAP)** is a broker who regularly facilitates a payment from one party to a second party by receiving digital assets from the first and paying those digital assets, cash, or different digital assets to the second, when that transaction is not already another kind of sale. A PDAP sale is that payment. The July 2024 broker regulations, which these instructions implement, apply to brokers that **take possession** of the digital assets being sold, and the IRS lists certain PDAPs in that set. They do not include non-custodial brokers that do not take possession. [IRS news release on the final broker regulations](https://www.irs.gov/newsroom/final-regulations-and-related-irs-guidance-for-reporting-by-brokers-on-sales-and-exchanges-of-digital-assets).

The later rule that would have treated trading front-end services as brokers (T.D. 10021, 30 December 2024) has no force or effect. Congress disapproved it. [Public Law 119-5](https://www.congress.gov/119/bills/hjres25/BILLS-119hjres25enr.htm); [Federal Register removal, 11 July 2025](https://www.govinfo.gov/content/pkg/FR-2025-07-11/pdf/2025-13005.pdf). A pure interface that never receives the USDC is outside the 1099-DA rule that survived.

**Thresholds, verified, and they are not the same test.**

- PDAP sales: no 1099-DA if that customer’s PDAP sales are **less than or equal to $600** for the year. If they exceed $600, all of that customer’s remaining PDAP sales are reported. Sales kept off the form under the optional stablecoin or specified-NFT methods are not counted toward the $600. [1099-DA instructions](https://www.irs.gov/instructions/i1099da).
- Qualifying stablecoins, optional method only: no report of designated sales if the customer’s aggregate gross proceeds from those designated sales at that broker do **not exceed $10,000** for the year. A qualifying stablecoin must track a single government currency one-for-one (the dollar qualifies as that kind of currency), use an effective stabilization mechanism under Treas. Reg. 1.6045-1(d)(10)(ii)(B), and be generally accepted as payment by persons other than the issuer. This note does not decide that USDC meets the stabilization-mechanism test. No IRS list naming USDC was verified.

The factory does receive USDC and later pays USDC to a second wallet. That is the PDAP shape. Whether VoteMap “takes possession,” as against a non-custodial arrangement the voided rule would have covered, is the unsettled part. The user’s own wallet and Coinbase’s choice not to custody the seed do not close it, because the USDC leaves that wallet and sits in the factory until a later release.

### Backup withholding and the name / TIN problem — likely, if a form is actually required

Every form above needs the payee’s name and TIN (SSN, EIN, or ITIN), certified on Form W-9 for backup withholding. VoteMap stores a provider display name, a handle, an email, a phone, a wallet, and a Coinbase country. It does not collect a legal name or a TIN. Coinbase Onchain Verify shares that the address is a verified Coinbase account and, if the user opts in, country. It does not share a legal name. [Coinbase Onchain Verify](https://www.coinbase.com/onchain-verify). A handle or a Google or Apple display name is not the name on the tax return. A required form cannot be filled in correctly from data v0 has.

**Rate, verified for 2026: 24%.** Backup withholding is 24% of a reportable payment when the payee does not furnish a TIN in the manner required, or the IRS says the name/TIN pair is wrong. [Pub. 515 (2026)](https://www.irs.gov/publications/p515); [IRS Topic 307](https://www.irs.gov/taxtopics/tc307); [Notice 2025-33](https://www.irs.gov/pub/irs-drop/n-25-33.pdf) (section 3406(a), “currently 24 percent”). If no TIN is provided, withholding starts immediately on reportable payments. The payer then files Form 945 and the information return, including the tax withheld, and must file that return even when the payment is under the normal filing threshold. [IRS backup withholding “B” program](https://www.irs.gov/businesses/small-businesses-self-employed/backup-withholding-b-program); [Pub. 1099 (2026)](https://www.irs.gov/publications/p1099).

**The threshold still gates it.** For the payments whose reporting threshold rose to $2,000, Pub. 1099 states that the $2,000 figure is also the threshold for backup withholding on those payments. For a TPSO’s 1099-K, backup withholding applies only if the payee is over $20,000 and over 200 transactions in the year, or a payment to that payee was already a reportable third party network transaction in the prior year. [Pub. 1099 (2026)](https://www.irs.gov/publications/p1099).

**2026 exception for 1099-DA only.** Notice 2025-33 says backup withholding is not required on any digital asset sale a broker effects during calendar year 2025 or calendar year 2026. That relief does not cover 1099-NEC, 1099-MISC, or 1099-K.

Withholding is a dollar deposit with the IRS. A missing TIN on a required form is a legal problem with the release of USDC, not a dashboard gap. This note does not design how a contract would hold 24% back.

### Coinbase does not file this hop

Coinbase Form 1099-DA covers sales and exchanges inside the Coinbase account. A send to another wallet is not on that form, except crypto sold or used to pay the network fee. Coinbase says DEX trades are not on its IRS forms because they happen in a self-custodial wallet, and Coinbase Taxes does not include Coinbase Wallet. [Coinbase, IRS Form 1099-DA](https://help.coinbase.com/en/coinbase/taxes/forms-reports/1099da); [Coinbase, taxes for US customers](https://help.coinbase.com/en/coinbase/taxes/general-information/tax-info). Onchain Verify is an attestation of account status and optional country, not a tax form. [Onchain Verify](https://www.coinbase.com/onchain-verify).

Coinbase’s 1099-MISC, on that tax-info page, is income Coinbase itself pays (staking rewards and incentives). An older Coinbase glossary still describes a $600 miscellaneous-income threshold for 2025. The legal threshold used in this note is the IRS figure, $2,000 for tax years beginning after 2025, not Coinbase’s marketing pages.

Nothing on those pages is a filing for a VoteMap factory redeem or claim.

## 2. Other duties if the forms do not apply

Lobbying filings, PEP screening, and campaign finance are out of this note. So is any report that is only a product dashboard.

### FinCEN money transmitter / MSB — likely

A money transmitter provides money transmission services: the acceptance of currency, funds, or other value that substitutes for currency **from one person**, and the transmission of that value **to another location or person**, by any means. Convertible virtual currency is value that substitutes for currency. FinCEN reads the exemptions narrowly. [FIN-2019-G001 (9 May 2019)](https://www.fincen.gov/system/files/2019-05/FinCEN%20Guidance%20CVC%20FINAL%20508.pdf), quoting [31 CFR 1010.100(ff)](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-A/section-1010.100).

What FinCEN says about this shape of business:

- A developer who only creates or sells software is not, for that act, a money transmitter. The same person is a money transmitter if they use the application as a business to accept and transmit value. [FIN-2019-G001](https://www.fincen.gov/system/files/2019-05/FinCEN%20Guidance%20CVC%20FINAL%20508.pdf).
- When a DApp accepts and transmits value, the money-transmitter definition applies to the DApp, the owners or operators, or both. FinCEN says that interpretation does not depend on profit. The guidance describes a fee paid to the DApp for the owner or operator. VoteMap’s disperse fee is that kind of fee.
- CVC payment processors, who take CVC from a customer and pass value to a merchant, are money transmitters. They do not get the payment-processor exemption in 31 CFR 1010.100(ff)(5)(ii)(B), because that exemption requires a clearance and settlement system that admits only BSA-regulated institutions. FinCEN says CVC processors do not meet that condition.
- The exemption for acceptance and transmission that is only integral to the **same person’s** sale of goods or services does not cover a platform paying a third party’s shop or a third party’s bounty. [31 CFR 1010.100(ff)(5)(ii)](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-A/section-1010.100), as quoted in the 2019 guidance.
- Hosted-wallet hosts are money transmitters. The test FinCEN states is who owns the value, where it is stored, whether the owner deals with the host or with the payment system, and whether the intermediary has total independent control. An unhosted-wallet user buying goods or services on their own behalf is not a money transmitter. That sentence is about the user, not about the operator of a factory that later pays someone else.

VoteMap’s facts line up with acceptance from one person and transmission to another: the factory holds the USDC, shop redeem and public claim pay a different wallet, and disperse, redeem, and merchant registration need the company’s signature. Wallet-only public claim still pulls USDC the factory is holding. Leftover sent back to the same staker is the weak leg, because it is not transmission to another person.

The counter-facts are real and are why this is not a concluded registration: the user keeps the seed, Coinbase does not custody the USDC, and the company may not have “total independent control” in the hosted-wallet sense. Those facts do not match the software-only example FinCEN exempts.

If this activity is money transmission, MSB status brings FinCEN registration under [31 CFR 1022.380](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1022/subpart-C/section-1022.380), an AML program, and suspicious-activity reports under [31 CFR 1022.320](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1022/subpart-C/section-1022.320). A dollar threshold for registration was not verified, so none is stated. The April 2026 FinCEN/OFAC proposal on permitted payment-stablecoin issuers is about issuers, not about an application that moves someone else’s USDC. [Federal Register, 10 April 2026](https://www.federalregister.gov/documents/2026/04/10/2026-06963/permitted-payment-stablecoin-issuer-anti-money-launderingcountering-the-financing-of-terrorism).

### State money-transmitter licenses — likely, if the activity is money transmission

State licenses are a separate duty from FinCEN registration. This note does not survey 50 statutes and does not state a dollar level below which no state requires a license. No exemption was verified that covers a factory taking one person’s USDC and releasing it to another person.

New York’s virtual-currency regime and each state’s agent-of-payee or goods-payment exemption would be part of a real licensing memo. They were not verified here as a safe harbor.

### Marketplace-facilitator sales tax — maybe

This is a collection and filing duty in states that define a marketplace that way. It is not a request to build a calculator.

Florida, 2026 statute: a marketplace provider lists or advertises tangible personal property and, directly or through others, collects payment from the customer and transmits all or part of it to the marketplace seller. The definition does not care whether the provider is paid for that service. A provider with physical presence in Florida, or that makes or facilitates a “substantial number of remote sales” as defined in section 212.0596(1), is the dealer and must collect and remit. [Fla. Stat. § 212.05965 (2026)](https://www.flsenate.gov/Laws/Statutes/2026/212.05965). This note does not restate the dollar test in section 212.0596(1), because that section was not opened. Florida’s card-payment-processor exclusion is for a business whose sole marketplace activity is processing card payments between parties. A factory that also holds credit and lists a catalog is outside that sentence.

Illinois: the Department’s February 2025 letter says the statute requires both collecting payment from the purchaser and transmitting it to the seller. If the purchaser pays the seller directly, the facilitator definition is not met. [Illinois ST 25-0005-GIL (3 February 2025)](https://tax.illinois.gov/content/dam/soi/en/web/taxarchive/research/legal/letter-rulings/sales-tax/2025/st25-0005-gil.pdf). Shop redeem does not match that direct-payment case. The factory takes the USDC and later pays the merchant.

The live case is a shop sale of tangible personal property. Florida’s section is written for tangible personal property. A non-physical catalog item, and a public bounty, are outside that Florida definition. Other states tax more than tangible goods; those statutes were not verified one by one, so no national list is stated. v0 does not collect a ship-to state. That is a hole in the facts a facilitator would need. It does not erase a duty that otherwise exists. There is no single national dollar threshold to put in this note.

### Statements the payments law itself requires — maybe

Several money-transmitter statutes require a **licensee** to give the sender a receipt for money received for transmission. Verified examples: [Maine title 32, § 6100-N](https://legislature.maine.gov/statutes/32/title32sec6100-N.html), [Arizona Rev. Stat. § 6-1226](https://www.azleg.gov/ars/6/01226.htm), and [Nebraska Rev. Stat. § 8-2728](https://nebraskalegislature.gov/laws/statutes.php?statute=8-2728). The receipt includes the sender’s name, the recipient’s name (Arizona allows a substitute in one case), the date, a transaction id, the licensee’s name and NMLS id, the dollar amount, and the fee. Maine and Nebraska both skip the receipt rule for money taken under a written agreement with the payee to process payments for goods or services the payee provides. v0 merchant registration is not, in the requirements, that written agreement. This receipt duty sits on a licensee. It is not a trail-page feature.

No primary source was found that requires this US-only factory to send Regulation E periodic account statements. The remittance-transfer rule those Maine and Nebraska sections point at (12 CFR part 1005, subpart B) is about transfers to recipients in a foreign country. v0’s money path is Coinbase US. A periodic-statement duty is not stated here.

### OFAC reports — maybe, and only past the accepted Coinbase screen

The accepted risk stays as written: VoteMap does not re-run the sanctions list, a Coinbase delay is accepted, and VoteMap still must not knowingly pay a sanctioned person. [accepted-risks.md](./accepted-risks.md). Coinbase screening the customer does not file a VoteMap report.

Two report duties sit on the U.S. person who takes the action, not only on a bank:

- [31 CFR 501.603](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V/part-501/subpart-C/section-501.603). A U.S. person that holds, unblocks, or transfers blocked property reports that to OFAC. Initial blocking reports are due on the schedule in that section (the rule requires a report; this note does not restate every timing clause).
- [31 CFR 501.604](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V/part-501/subpart-C/section-501.604). A U.S. person that rejects a transaction which is not blocked, but which would violate the sanctions regulations if processed, reports the rejection within 10 business days. The 2024 amendments apply this to U.S. persons, not only to financial institutions, and they include a sale or purchase of goods or services when that sale or purchase is the transaction. [Federal Register, 8 October 2024](https://www.federalregister.gov/documents/2024/10/08/2024-23217/reporting-procedures-and-penalties-regulations).

Those reports happen if VoteMap itself blocks property or rejects a transaction. They do not happen merely because Coinbase already screened the wallet. v0 does not have its own reject step. This is not a second screening product.

## Verdict

- **1099-K:** maybe. Shop redeem is the closer TPSO case. Federal filing starts only above $20,000 and 200 transactions for that payee. The staker’s USDC does not decide who files.
- **1099-NEC:** maybe. Pay for services, $2,000 in 2026, and only if VoteMap is the payor under an oversight theory. Merchandise is out.
- **1099-MISC:** maybe. Prize or other income, same $2,000 and the same payor question.
- **1099-DA:** maybe. It would name the staker’s disposition if VoteMap is a PDAP that takes possession. The non-custodial front-end rule is void. It does not report the payee’s income.
- **Backup withholding:** likely whenever NEC, MISC, or K is actually required and there is no TIN. Rate 24%. Not required on 1099-DA sales effected in 2026.
- **FinCEN money transmitter / MSB:** likely for a release of one person’s USDC to another person through a factory the company operates and charges for.
- **State money-transmitter license:** likely in states that cover that transmission. No exemption was verified for this factory.
- **Marketplace-facilitator sales tax:** maybe for a shop sale of tangible personal property. Public bounties are outside the Florida statute that was read.
- **Receipt to the sender under a money-transmitter statute:** maybe, and only if VoteMap is a licensee under that statute.
- **Regulation E periodic statement:** unlikely. No source found that imposes one on this US-only factory.
- **OFAC blocked-property or rejected-transaction report:** maybe, and only when VoteMap itself blocks or rejects. Coinbase’s screen is not that filing.
