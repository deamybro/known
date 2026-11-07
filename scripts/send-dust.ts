/**
 * Dust Transaction Simulator / Sender for Sui
 * Simulates or sends a 1 MIST dust transfer to poison the victim's transaction history.
 *
 * Usage:
 *   pnpm tsx scripts/send-dust.ts [victim_address] [attacker_lookalike_address]
 */

import { getDb, transfers, users } from "../apps/web/src/db/index.js";
import { runMigrations } from "../apps/web/src/db/migrate.js";
import { normalizeAddress } from "../packages/core/src/address.js";

async function main() {
  const args = process.argv.slice(2);
  const victimAddress = args[0] || "0x965a8406327f5367cc41bbcff97aefbf0126ad87692a1c3b075c5915459a4c1a";
  const attackerAddress = args[1] || "0x565efb05defb99e56e9377f0d5e48a93227b24842026a117bcaa6ec422295998";

  console.log("===============================================================");
  console.log("🪤   KNOWN — ADDRESS POISONING DUST TRANSACTION INJECTOR");
  console.log("===============================================================");
  console.log(`Victim Address:   ${victimAddress}`);
  console.log(`Attacker Address: ${attackerAddress}`);
  console.log("Dust Amount:      1 MIST (0.000000001 SUI)");

  const db = getDb();
  await runMigrations();

  const testUserId = "00000000-0000-0000-0000-000000000001";
  await db
    .insert(users)
    .values({
      id: testUserId,
      suiAddress: victimAddress,
    })
    .onConflictDoNothing();

  const txHash = `0x${Math.random().toString(16).slice(2).padStart(64, "0")}`;
  const now = new Date();

  // Insert inbound dust transfer into transfers table (poisoning the history)
  await db.insert(transfers).values({
    id: `dust_${Date.now()}`,
    userId: testUserId,
    chain: "sui",
    txHash,
    direction: "in",
    counterparty: attackerAddress,
    counterpartyNormalized: normalizeAddress("sui", attackerAddress).normalized,
    asset: "0x2::sui::SUI",
    assetSymbol: "SUI",
    amountRaw: "1",
    decimals: 9,
    timestamp: now,
    isZeroValue: false,
    isDust: true,
    source: "tatum",
  });

  console.log("\n💉 Dust transaction injected into victim history!");
  console.log(`Tx Digest: ${txHash}`);
  console.log("Direction: INBOUND (1 MIST from attacker)");
  console.log("\nVictim's wallet history is now poisoned with the attacker's lookalike address.");
  console.log("When victim opens Known or pastes the lookalike address, it will be flagged in RED.");
  console.log("===============================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Dust injector failed:", err);
  process.exit(1);
});
