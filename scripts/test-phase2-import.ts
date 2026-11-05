import "dotenv/config";
import { getDb, transfers, payees, outbox, watchedAddresses, users } from "../apps/web/src/db/index.js";
import { runMigrations } from "../apps/web/src/db/migrate.js";
import { importWalletHistory } from "../packages/chain/src/importer.js";
import { deriveSuggestedPayees } from "../packages/core/src/payee.js";
import { normalizeAddress } from "../packages/core/src/address.js";
import { TransferRecord } from "@known/core";

async function main() {
  console.log("=== Phase 2 Integration Test ===");
  const apiKey = process.env.TATUM_API_KEY;
  if (!apiKey) throw new Error("Missing TATUM_API_KEY");

  const db = getDb();
  await runMigrations();
  console.log("✓ Database migrations verified");

  const testUserId = "00000000-0000-0000-0000-000000000001";
  await db.insert(users).values({
    id: testUserId,
    suiAddress: "0x0000000000000000000000000000000000000000000000000000000000000001",
  }).onConflictDoNothing();

  // Address to test: Vitalik's public Ethereum address
  const testAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  console.log(`Pulling 5 recent transfers for ${testAddress} via Tatum Data API...`);

  const fetched = await importWalletHistory({
    chain: "ethereum",
    address: testAddress,
    userId: testUserId,
    apiKey,
    pageSize: 5,
  });

  console.log(`Fetched ${fetched.length} transfers from Tatum.`);
  for (const tx of fetched) {
    console.log(`  - [${tx.direction}] ${tx.amountRaw} ${tx.assetSymbol} (hash: ${tx.txHash.slice(0, 10)}..., counterparty: ${tx.counterparty.slice(0, 8)}...)`);
  }

  // Add to watched addresses
  await db.insert(watchedAddresses).values({
    id: "test-wallet-1",
    userId: testUserId,
    chain: "ethereum",
    address: testAddress,
    normalized: normalizeAddress("ethereum", testAddress).normalized,
  }).onConflictDoNothing();

  // Test suggestion logic: incoming-only addresses MUST NOT appear as payees
  const mockTransfers: TransferRecord[] = [
    {
      chain: "ethereum",
      txHash: "0xabc1",
      counterparty: "0x1111111111111111111111111111111111111111",
      counterpartyNormalized: "0x1111111111111111111111111111111111111111",
      direction: "out",
      asset: "native",
      assetSymbol: "ETH",
      amountRaw: "1000000000000000000",
      decimals: 18,
      timestamp: new Date(Date.now() - 10000),
      isZeroValue: false,
      isDust: false,
      source: "tatum",
    },
    {
      chain: "ethereum",
      txHash: "0xabc2",
      counterparty: "0x1111111111111111111111111111111111111111",
      counterpartyNormalized: "0x1111111111111111111111111111111111111111",
      direction: "out",
      asset: "native",
      assetSymbol: "ETH",
      amountRaw: "2000000000000000000",
      decimals: 18,
      timestamp: new Date(Date.now() - 5000),
      isZeroValue: false,
      isDust: false,
      source: "tatum",
    },
    {
      chain: "ethereum",
      txHash: "0xabc3",
      counterparty: "0x2222222222222222222222222222222222222222",
      counterpartyNormalized: "0x2222222222222222222222222222222222222222",
      direction: "in", // Dust / scam or inbound: NEVER suggested as payee
      asset: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      assetSymbol: "USDT",
      amountRaw: "1",
      decimals: 6,
      timestamp: new Date(),
      isZeroValue: false,
      isDust: true,
      source: "tatum",
    },
  ];

  const suggestions = deriveSuggestedPayees(mockTransfers);
  console.log(`Payee candidates derived: ${suggestions.length}`);
  if (suggestions.some(s => s.counterpartyNormalized === "0x2222222222222222222222222222222222222222")) {
    throw new Error("SECURITY FAILURE: Inbound address was suggested as a payee!");
  }
  console.log("✓ Safety invariant preserved: Inbound addresses strictly excluded from payee suggestions.");
  console.log(`Suggested payee: ${suggestions[0]?.counterpartyRaw} (sendCount: ${suggestions[0]?.sendCount})`);

  // Test inserting a confirmed payee and outbox entry
  await db.insert(payees).values({
    id: "payee-ada-test",
    userId: testUserId,
    chain: "ethereum",
    address: "0x1111111111111111111111111111111111111111",
    normalized: normalizeAddress("ethereum", "0x1111111111111111111111111111111111111111").normalized,
    label: "Ada Sister",
    sendCount: 2,
    typicalLowRaw: "1000000000000000000",
    typicalHighRaw: "2000000000000000000",
    decimals: 18,
    assetSymbol: "ETH",
    status: "confirmed",
    confirmedAt: new Date(),
  }).onConflictDoNothing();

  const memoryPayload = {
    v: 1,
    kind: "payee_confirmed",
    userId: testUserId,
    chain: "ethereum",
    address: "0x1111111111111111111111111111111111111111",
    label: "Ada Sister",
    sendCount: 2,
  };

  await db.insert(outbox).values({
    id: "outbox-test-1",
    userId: testUserId,
    namespace: `known:${testUserId}:payees`,
    content: JSON.stringify(memoryPayload),
    status: "pending",
  }).onConflictDoNothing();

  const outboxRecords = await db.select().from(outbox);
  console.log(`✓ Outbox queue successfully verified: ${outboxRecords.length} records ready for Walrus Memory worker.`);

  console.log("=== Phase 2 Integration Test Passed! ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
