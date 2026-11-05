# VERIFIED.md — Ground-Truth Technical Verification Record

This document records the exact, verified behaviors, signatures, endpoints, and benchmarks observed from real package source code, live endpoints, and test executions during **Phase 0**.

---

## 1. Walrus Memory SDK (`@mysten-incubation/memwal` v0.1.13)

### Verified Package & Dependencies
- Package: `@mysten-incubation/memwal@0.1.13`
- Peer Dependencies:
  - `@mysten/sui`: `>=2.5.0` (installed: `2.39.0`)
  - `@mysten/seal`: `>=1.1.0` (installed: `1.5.3`)
  - `@mysten/walrus`: `>=1.0.3` (installed: `1.2.38`)
  - `ai`: `>=4.0.0` (installed: `4.1.0`)
  - `zod`: `^3.23.0 || ^4.0.0` (installed: `3.23.8`)

### Verified Relayer Status
- Live Endpoint: `https://relayer.memory.walrus.xyz`
- `/health` response: `200 OK`
  ```json
  {
    "status": "ok",
    "mode": "production",
    "write_ready": true,
    "writes": "ok",
    "relayerVersion": "0.1.0",
    "apiVersion": "1.0.0"
  }
  ```
- Public metadata confirmed: Server is online and accepting write jobs.

### Verified Client API Methods
- `MemWal.create(config: MemWalConfig)`: Initializes client with Ed25519 delegate private key (`key`), `accountId`, `serverUrl`, and default `namespace`.
- `remember(text, options)`: Returns `202 Accepted` with `job_id`.
- `waitForRememberJob(jobId, opts)`: Polls until terminal state, returning `{ id, blob_id, owner }`.
- `rememberAndWait(text, options)`: Convenience helper combining remember + wait.
- `recall({ query, limit, namespace })`: Semantic vector search returning `RecallResult` with `results: RecallMemory[]` (`text`, `distance`, `blob_id`, `created_at`).
- `listMemories({ namespace, cursor })`: **Key Discovery!** Walks full inventory without semantic query bias. Returns `memories: MemorySummary[]` with `blob_id`, `memory_id`, and `created_at`.
- `restore(namespace, limit)`: Rebuilds local relayer indices from Walrus blobs.

### Discovery Caveat Resolution (Section 6.8)
- Problem: `restore()` rebuilds server indices, but how do we ensure 100% of memories in a namespace are recovered without semantic search dropoff?
- Solution Verified: `memwal.listMemories({ namespace })` returns full keyset pagination over all blobs in the namespace. Together with our custom `occurredAt` timestamp inside the payload, we can deterministically enumerate and restore all payee records.

---

## 2. Tatum APIs

### 2.1 Multi-Chain Data API (v4)
- Endpoint: `GET https://api.tatum.io/v4/data/transaction/history`
- Auth Header: `x-api-key: <TATUM_API_KEY>`
- Query Parameters:
  - `chain`: Verified identifiers:
    - Ethereum: `ethereum-mainnet`
    - Tron: `tron-mainnet`
    - BSC: `bsc-mainnet`
    - Solana: `solana-mainnet`
  - `addresses`: Comma-separated addresses (or single address).
  - `transactionTypes`: Filter options `native`, `fungible`, `nft`, `multitoken`.
  - `transactionSubtype`: Filter options `incoming`, `outgoing`, `zero-transfer`.
    - *Crucial note*: Tatum explicitly supports `zero-transfer` as a transaction subtype, directly powering our zero-value poisoning detection!
  - `sort`: `DESC`
  - `pageSize`: Max per page (default: 10).

### 2.2 Tatum Sui Gateway
- Mainnet Base URL: `https://sui-mainnet.gateway.tatum.io`
- Auth Header: `x-api-key: <TATUM_API_KEY>`
- Protocol: JSON-RPC and GraphQL.
- Verified RPC method: `sui_getLatestCheckpointSequenceNumber` (returns latest sequence number).

---

## 3. Sui Authentication & Cryptography

### Personal Message Verification
- Test script: `scripts/check-sui-signin.ts`
- Verified: `@mysten/sui/verify.verifyPersonalMessageSignature(messageBytes, signature)` recovers the signer's `PublicKey` and verifies the signature matches the message without the server ever handling a private key.
- Tamper detection: Tampered messages or invalid signatures throw errors as expected.
- Address normalization: `@mysten/sui/utils.normalizeSuiAddress` pads short hex addresses to the full 64-hex character Sui standard (0x + 64 hex = 66 chars).

---

## 4. Lookalike Grinder Benchmark & Feasibility

### Measured Performance
- Pure JS SDK (`new Ed25519Keypair() + toSuiAddress()`): **254 keys/sec** on 1 thread.
- Native `node:crypto.generateKeyPairSync("ed25519")`: **10,870 keys/sec** on 1 thread.
- Multi-core potential (8 worker threads): **~80,000 keys/sec**.

### Feasibility for Demo Kit
- Target Rule 1 (Section 6.3): `prefix >= 3 AND suffix >= 3` (16⁶ ≈ 16.7M tries):
  - Pure JS (1 thread): ~18 hours.
  - Native multi-threaded (8 workers): **~3.5 minutes**.
- Target Rule 2 (Section 6.3 with dust): `prefix >= 4` with dust transaction (16⁴ = 65,536 tries):
  - Pure JS (1 thread): **~250 seconds** (~4 minutes).
  - Native multi-threaded: **< 1 second**.
- Verification run: `scripts/check-lookalike-grinder.ts` found a 3-prefix lookalike (`0x5653a6...` matching `0x565c34...`) in **19,579 tries (26.6 seconds)**.

---

## 5. Official Stablecoin Allowlist (Anti-Fake Token Heuristic)

Official mainnet contracts verified against official issuer documentation:

### Ethereum (EVM)
- USDT: `0xdac17f958d2ee523a2206206994597c13d831ec7` (Decimals: 6)
- USDC: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` (Decimals: 6)

### Tron (TRC-20)
- USDT: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` (Decimals: 6)
- USDC: `TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8` (Decimals: 6)

### Sui (Move Coin Types)
- Native USDC (Circle): `0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC` (Decimals: 6)
- Bridged USDT (Wormhole): `0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN` (Decimals: 6)
- Bridged USDC (Wormhole): `0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d257a93ab::coin::COIN` (Decimals: 6)

### BNB Smart Chain (BEP-20)
- USDT: `0x55d398326f99059fF775485246999027B3197955` (Decimals: 18)
- USDC: `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` (Decimals: 18)

---

## 6. Monorepo Structure & Package Integrity

Monorepo scaffolded using `pnpm` workspaces (v12.16.1, Node v24.15.0):
- `packages/core`: Pure TypeScript, zero I/O. Tested with Vitest.
- `packages/chain`: Tatum Data API and Sui Gateway integrations.
- `packages/memory`: Walrus Memory client using `@mysten-incubation/memwal`.
- `tools/restore`: Standalone recovery CLI independent of application DB.
- `apps/web`: Next.js 15 App Router + Tailwind + Drizzle ORM.
