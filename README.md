# Known

> **Your transaction history can be poisoned. Your memory can't.**
>
> A personal payment memory that protects crypto users and AI payment agents from address poisoning scams.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Walrus Memory](https://img.shields.io/badge/Walrus%20Memory-Mainnet-purple.svg)](https://walrus.xyz)
[![Tatum](https://img.shields.io/badge/Tatum-Data%20API%20%26%20Sui%20Gateway-blue.svg)](https://tatum.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🏆 Hackathon Submissions

* **Primary Track:** Track 03 — Consumer Finance Apps
* **Target Bounty 1:** Best Walrus Memory ($10,000)
* **Target Bounty 2:** Best Use of Agent Payments ($5,000)

---

## 🛑 The Problem: The $500M+ Memory Failure

Most people copy wallet addresses from their own transaction history when paying someone again. Address poisoning exploits exactly that habit:

1. An attacker identifies who you pay often on Ethereum, BNB Chain, Tron, or Sui.
2. The attacker uses a vanity key generator to grind an address matching the **first few and last few characters** of your real payee.
3. The attacker sends you a tiny **dust transfer** (e.g. 1 MIST or 0.0001 USDT) from that fake address.
4. The scam address now sits in your transaction history, looking visually identical to the real one.
5. The next time you copy your counterparty's address from your history, **you copy the attacker's lookalike address**.

### Real-World Attack Scale
* **Trust Wallet:** Over **225 million poisoning attacks** detected and more than **$500 million confirmed stolen** (~34,000 attacks/hour).
* **Cyvers Security:** Detects over **1,000,000 poisoning preparations per day** on Ethereum alone.
* **$50,000,000 Stolen in a Single Click:** In December 2025, a prominent trader lost nearly $50M in USDT after copying an address from their own history. Another lost $12.25M in January 2026.
* **USENIX Security Study:** Documented over **$83.8M lost across 6,633 confirmed incidents** on Ethereum and BSC.
* **Tron Everyday USDT Exploitation:** One attacker stole **$9.4M from 15 victims in four weeks** across everyday peer-to-peer USDT transfers.

**The root cause is an architectural memory failure:** Blockchain transaction history was never designed to be an address book. Anyone can write into your history by sending you an unsolicited dust transaction. **Your transaction history can be poisoned. Your memory can't.**

---

## 💡 The Solution

Known creates a personal, tamper-proof payment memory owned by the user:

1. **Learns Who You Actually Pay:** Known pulls your historical transfer history across **Ethereum, BSC, Base, Polygon, and Sui** via Tatum. It isolates genuine **outgoing** transfers and prompts you to confirm payees ("Ada Sister", "My Binance Deposit"). **Inbound-only addresses are strictly quarantined and never trusted.**
2. **Deterministic Check Before You Send:** Before signing a transfer or copying an address, paste it into Known:
   * 🟢 **GREEN (Safe):** *"This is Ada Sister. You've paid her 14 times, usually 50–200 USDC."*
   * 🔴 **RED (Alert):** *"Address Poisoning Detected! This imitates Ada Sister. Same start and end characters, fake middle. It sent you a dust transaction on Nov 7."*
   * 🟡 **AMBER (Warning):** *"You have never paid this address before. Double-check with the recipient directly."*
3. **Decentralized Walrus Memory:** Every confirmed payee and caught lookalike is cryptographically recorded in a decentralized Walrus Memory account (`@mysten-incubation/memwal`).
4. **Autonomous AI Agent Protection:** Autonomous AI payment agents query Known via `POST /api/agent/check` before executing automated on-chain payouts, eliminating the risk of agents sending funds to spoofed lookalikes.
5. **Survives Any Wallet Loss (Zero Vendor Lock-in):** Switch wallets, lose your phone, or delete the app—your payee memory is stored on Walrus and can be reconstructed completely offline using our standalone restore tool.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph MultiChain ["Multi-Chain Data Sources (Tatum)"]
        ETH["Ethereum / BSC / Base"] -->|Tatum v4 Data API| Importer
        SUI["Sui Mainnet"] -->|Tatum Sui GraphQL Gateway| Importer
    end

    subgraph CoreEngine ["Deterministic Security Engine (@known/core)"]
        Importer["History Importer\n(Outgoing Filter)"] --> PayeeStats["Payee & Anomaly Engine\n(Percentiles & Volume)"]
        PayeeStats --> VerdictEngine["Deterministic Verdict Engine\n(3+3 Rule & Dust Escalation)"]
    end

    subgraph DecentralizedStore ["Decentralized Memory (@known/memory)"]
        VerdictEngine -->|Caught Lookalike| OutboxQueue["Outbox Queue\n(SQLite / PGlite)"]
        UserUI["Web App (Next.js 15)"] -->|Confirm Payee| OutboxQueue
        OutboxQueue --> OutboxWorker["Walrus Outbox Worker\n(Retry & Deduplication)"]
        OutboxWorker -->|memwal.remember| WalrusRelayer["Walrus Memory Mainnet\n(TEE Relayer)"]
        WalrusRelayer -->|Blob IDs & Proofs| ProofDashboard["Proof Dashboard\n(/proof)"]
    end

    subgraph Consumers ["Consumers & Integrations"]
        WalrusRelayer -.->|memwal.recall| CheckScreen["Check Screen (/)\n(Plain-Language Recall)"]
        WalrusRelayer -.->|memwal.listMemories| RestoreCLI["Standalone Restore CLI\n(Zero-DB Recovery)"]
        AIAgent["Autonomous AI Payment Agents"] -->|POST /api/agent/check| AgentAPI["Agent Pre-Flight API"]
        AgentAPI --> VerdictEngine
    end
```

---

## 🔬 Built Honestly (Strict Engineering Principles)

* **Deterministic Code for Safety, Memory for Context:** LLMs and generative models **never** decide safety verdicts. All verdicts are calculated using pure, deterministic algorithms in `@known/core`. Walrus Memory supplies plain-language context, not the security decision.
* **Inbound-Only Addresses Never Trusted:** Addresses that have only sent funds into a wallet can be attackers. They are strictly quarantined and never suggested as payees.
* **Exact String Matching for Green:** A Green verdict requires an exact character-by-character match against a confirmed payee.
* **Zero Floating-Point Math:** All token and native cryptocurrency amounts are handled using integer strings and `BigInt` (base units / MIST / wei), preventing rounding vulnerabilities.
* **Read-Only App:** Known never requests private keys to your wallet and never initiates transactions. It evaluates addresses and leaves the execution decision to the user.

---

## 📦 Monorepo Architecture

```
WALRUS/
├── apps/
│   └── web/                   # Next.js 15 App Router web application
│       ├── src/app/           # Check (/), Payees (/payees), Wallets (/wallets), Proof (/proof)
│       ├── src/app/api/       # REST APIs: /api/check, /api/agent/check, /api/sync, /api/proof
│       └── src/db/            # Drizzle ORM schema with embedded PGlite & PostgreSQL support
├── packages/
│   ├── core/                  # Pure deterministic logic (verdicts, lookalikes, 3+3 rule, dust)
│   ├── chain/                 # Multi-chain ingestion: Tatum v4 Data API & Tatum Sui Gateway
│   └── memory/                # Walrus Memory client, outbox queue worker, semantic recall
├── tools/
│   └── restore/               # Standalone Walrus Memory payee recovery CLI (Zero DB needed)
└── scripts/
    ├── agent-demo.ts          # AI Agent pre-flight payment verification demo
    ├── make-lookalike.ts      # Lookalike address generator (vanity grinder for demo)
    ├── send-dust.ts           # History poisoning simulator (1 MIST dust injector)
    └── introspect-sui.ts      # Tatum Sui GraphQL gateway introspection
```

---

## 🚀 Quickstart

### Prerequisites
* Node.js >= 20
* `pnpm` >= 9 (`npm install -g pnpm`)

### 1. Installation
```bash
git clone https://github.com/Stella112/WALRUS.git
cd WALRUS
pnpm install
```

### 2. Environment Setup
Create a `.env` file in the project root:
```env
# Tatum API Credentials
TATUM_API_KEY=your_tatum_api_key
TATUM_DATA_API_URL=https://api.tatum.io
TATUM_SUI_GATEWAY_URL=https://sui-mainnet.gateway.tatum.io/graphql

# Walrus Memory Credentials
MEMWAL_RELAYER_URL=https://relayer.memory.walrus.xyz
MEMWAL_PRIVATE_KEY=your_walrus_delegate_private_key
MEMWAL_ACCOUNT_ID=0x_your_walrus_memory_account_id

# Optional: Remote Postgres (defaults to embedded zero-config PGlite)
# DATABASE_URL=postgresql://user:password@localhost:5432/known
```

### 3. Run Test Suite
```bash
pnpm test
```
*Runs 35 unit tests across `@known/core`, `@known/chain`, and `@known/memory`.*

### 4. Start the Web App
```bash
pnpm --filter @known/web run dev
```
Open [http://localhost:3000](http://localhost:3000) to access:
* **`/` (Check Screen):** Real-time address check with visual lookalike diff highlighting and Walrus Memory context.
* **`/wallets`:** Manage watched wallets and trigger multi-chain transfer imports via Tatum.
* **`/payees`:** Review outgoing transfer candidates and confirm payees into Walrus Memory.
* **`/proof`:** Live telemetry dashboard showing Tatum checkpoints, Walrus relayer health, and outbox blob IDs.

---

## 🤖 AI Agent Integration (Best Use of Agent Payments)

Autonomous AI agents can verify recipient addresses before broadcasting payments:

```bash
curl -X POST http://localhost:3000/api/agent/check \
  -H "Content-Type: application/json" \
  -H "x-api-key: known_agent_demo_key" \
  -d '{
    "chain": "sui",
    "address": "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38",
    "amountRaw": "50000000000"
  }'
```

### Response
```json
{
  "allowed": true,
  "verdict": "green",
  "reason": "This is Ada Sister. You have paid them 14 times, usually 50-200 USDC.",
  "targetAddress": "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38",
  "matchedPayee": {
    "label": "Ada Sister",
    "sendCount": 14,
    "assetSymbol": "SUI"
  },
  "memoryContext": "Ada Sister on SUI: confirmed payee (14 sends)."
}
```

### Run the Agent Payment Demo Script
```bash
pnpm tsx scripts/agent-demo.ts
```
*Demonstrates an autonomous agent aborting a transaction to a poisoned lookalike and safely approving payment to the genuine recipient.*

---

## 🌊 Standalone Walrus Restore CLI (Best Walrus Memory)

Demonstrates sovereign data portability: rebuilds your entire payee directory and blocklist directly from Walrus Memory with **zero database connection**:

```bash
pnpm tsx tools/restore/src/index.ts --user-id 00000000-0000-0000-0000-000000000001
```

Or export directly to a JSON backup:
```bash
pnpm tsx tools/restore/src/index.ts --user-id 00000000-0000-0000-0000-000000000001 --out backup.json
```

---

## ⚔️ Demo Attack Kit

For live demonstration and video recording:

1. **Generate a Lookalike Keypair:**
   ```bash
   pnpm tsx scripts/make-lookalike.ts 0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38 3 1
   ```
2. **Inject a 1 MIST Dust Transaction:**
   ```bash
   pnpm tsx scripts/send-dust.ts
   ```
3. **Verify Alert:** Paste the lookalike into Known (`http://localhost:3000`) and observe the screen flash **RED** highlighting the attacker's fake middle characters.

---

## 📄 License

MIT © Maris (`@Stella112`). Built for the **Total Recall: Tatum × Walrus Hackathon**.
