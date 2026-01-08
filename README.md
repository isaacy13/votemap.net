# votemap 🌐

**votemap** is an open-source experiment with the goal of *democratizing everything*.

(one) problem with our world is we reward *grifters* & *glorified scam artists* far too often, leaving the everyday person with the short straw

**votemap** aims to fix this by rewarding the *problem solvers* of society, not the *problem makers*

---

## 💭 How will votemap work?
The idea is to give power to the people over all entities (other individuals, companies, and government)

For example, politicans are often people funded by wealthy donors, often to bribe with money in exchange for political power

If that isn't enough, politicians are bold enough to collect *MILLIONS of dollars* of **DONATIONS** from the working class and **FAIL** to fulfill their promises (and oftenly misappropriating funds for personal gain)

**votemap** will **FIX** this issue by only delivering funds whenever problems are solved

In this example, **votemap** would only deliver donations to politicians whenever they deliver on their campaign promise. Additionally, these donations would be tracked on-chain, so that people can see where their money is actually going.

Effectively, we want to dangle disgusting amounts of money over these politicians' heads, such that they have no choice but to follow the will of the people.

If the grifters choose to misappropriate funds, they will need to do so publicly.

Aside from politics, think about all the other places this could be applied to stop the grift (churches, companies, )

Our message to the people is: *stop donating directly to **grifters*** that *create problems*. Donate to ***problem-solvers*** that *make the world a better place*.

Our message to entities are: be the **problem-solvers** of the world, not the **problem-makers** / **grifters**, and voters will reward you proportionate to the problem(s) you solve

## 🤔 FAQ + criticisms
#### Will votemap ever replace voting?
No. Definitely not in the USA.

Voting online comes with a billion cans of worms; the tech isn't ready this for yet.

The only exception I'd be willing to think about are countries where corruption is so rampant, online voting may actually be more representative than in-person voting.

Again, tech isn't there and this isn't in the plans, but would be willing to give it a shot one day

---

#### Isn't this bribery in a different font?
Yes.

Like it or not, billionaires already do this behind closed doors. The question is, should *the people* have a seat at the table? 

**votemap** believes YES.

---

#### Isn't this like Jim Crow laws / poll taxes that purposely priced out lower-income black people from voting?
No. 

We'll offer free and low-price voting so that everyone gets a seat at the table

People are put off by the fact you have to pay to vote, but throwing disgusting amounts of money at problems is incentive entities need to get things done

Obviously, the more you pay, the larger your seat at the table. But like it or not, right now you don't have any seat at the table (and billionaires do).

Also, distributed over hundreds of millions of people per country (if not billions), then your opinion is likely to be represented somewhere.

## 🔍 Where will votemap work?
Everywhere.

**votemap** will work best in democratic countries with a strong middle/lower class, but the goal is to roll out to *every country* -- regardless of the governing system, **votemap** will be useful in all countries

---

## 🚀 Goals / Targets

- **Focus on problem-solving, get away from political parties** — reward problem-solvers, kick out grifters. by design, this should move us away from political parties, and get people focused on problem solving
- **Power to the people** — let the people allocate funds and drive real-world outcomes (not just vote in candidates); basically striving towards true democracy, not just representative
- **Incentivized problem-solving** — bounties that pay out to entities when voters agree a task was completed
- **Transparency & accountability** — provide an auditable on-chain trail for donations, payouts, and progress reporting via crypto stablecoins tied to the USD
- **Open & censorship-resistant** — open source forever. even if anyone gag orders or puts a gun to my head, I cannot secretly change anything

I have alot of interesting ideas on this twitter thread (many of which I didn't write down in this README) -- feel free to read thru my mumbo jumbo

https://x.com/isaac_yeang/status/1954029843701805328?s=20

---

## 📦 What you'll find in this repo

- A Next.js (App Router) frontend in `app/` and reusable UI components in `components/`.
- Global styles in `app/globals.css` and simple landing components in `components/landing/`.
- A small codebase designed for rapid iteration and open contribution.

---

## 🛠 Tech stack

- Next.js (App Router) + TypeScript
- React 19
- Chakra UI + Tailwind/PostCSS for styling
- ESLint + TypeScript for linting and type-safety

---

## 🔧 Local development (quick start)

### Prerequisites
- Node.js 18+ (recommended)
- npm, yarn, or pnpm

### Install & run

```bash
# Clone the repo
git clone <repo-url>
cd votemap.net

# Install dependencies (choose one)
npm install
# or
pnpm install
# or
yarn install

# Start dev server
npm run dev
# or
pnpm dev
# or
yarn dev

# Open http://localhost:3000
```

### Build & Serve

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

> Note: There are no automated tests included yet — contributions adding tests are very welcome.

---

## 🔐 Environment & configuration

Create a `.env.local` at the project root for local-only environment variables.

Example `.env.local`:

```env
# Example placeholders — add keys only when needed
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_CIRCLE_API_KEY=pk_live_...
NEXT_PUBLIC_RAMP_API_KEY=...
NEXT_PUBLIC_ANALYTICS_ID=...
```

Be careful not to commit secrets. If integrating on-chain flows or external services, add clear docs on required variables in a new `docs/` folder or the relevant components.

---
## 🧭 Project architecture (high level)

- `app/` — Next.js routes and pages
- `components/` — shared UI (e.g., landing, footer, hero)
- `public/` — static assets
- `postcss.config.mjs` / `tailwind` — styling pipeline

As the project expands we expect to add:
- backend services (serverless functions or a small API)
- on-chain adapters (Solana integrations for USDC/USDT)
- identity and verification flows (KYC/ID providers)

---

## 🤝 Contributing

See `CONTRIBUTING.md` for details on filing issues, branching, tests, and PR process.

---

## 🔐 Security

See `SECURITY.md` for how to responsibly report security vulnerabilities.

---

## 📅 Roadmap (short/mid-term ideas)

- Build the core bounty creation and voting flows
- Integrate USDC/USDT on Solana for payouts
- Proof-of-impact reporting for payouts
- Identity verification integration
- Add automated tests and CI workflows

---

## 🔗 Acknowledgements

Built with Next.js — see the official docs: https://nextjs.org.

---

## 📬 Contact & Governance

Open an issue or PR in this repository to get started. If you're interested in being a maintainer, describe your experience and areas you want to own in a new issue.