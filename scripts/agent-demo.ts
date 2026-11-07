/**
 * AI Agent Address Verification Demo
 * Demonstrates an autonomous payment agent querying Known's Agent API before moving funds.
 *
 * Track: Best Use of Agent Payments
 */

import { getDb, payees, users } from "../apps/web/src/db/index.js";
import { runMigrations } from "../apps/web/src/db/migrate.js";
import { normalizeAddress } from "../packages/core/src/address.js";
import { evaluateVerdict } from "../packages/core/src/verdict.js";
import { CheckVerdictResult } from "../packages/core/src/types.js";

async function runAgentPaymentWorkflow() {
  console.log("===============================================================");
  console.log("🤖  KNOWN — AI AGENT PAYMENT PRE-FLIGHT VERIFICATION");
  console.log("    Protecting autonomous agents from address poisoning attacks");
  console.log("===============================================================\n");

  const db = getDb();
  await runMigrations();

  const testUserId = "00000000-0000-0000-0000-000000000001";
  await db
    .insert(users)
    .values({
      id: testUserId,
      suiAddress: "0x0000000000000000000000000000000000000000000000000000000000000001",
    })
    .onConflictDoNothing();

  // Setup: Ensure a confirmed payee "Ada Sister" exists
  const realAdaAddress = "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38";
  await db
    .insert(payees)
    .values({
      id: "payee-ada-real",
      userId: testUserId,
      chain: "sui",
      address: realAdaAddress,
      normalized: normalizeAddress("sui", realAdaAddress).normalized,
      label: "Ada Sister",
      sendCount: 14,
      typicalLowRaw: "50000000",
      typicalHighRaw: "200000000",
      decimals: 9,
      assetSymbol: "SUI",
      status: "confirmed",
      confirmedAt: new Date(),
    })
    .onConflictDoNothing();

  // Lookalike address crafted by an attacker (matching "565..." and "...a38")
  const poisonedLookalike = "0x5653a65331a67445085860b6759887f097122aa9960645989ba37a3a43d733be";

  console.log("📋 Agent Task: Pay 50 SUI to recipient labeled 'Ada Sister'");
  console.log(`   Real Payee Address:     ${realAdaAddress}`);
  console.log(`   Copied From History:    ${poisonedLookalike} (Poisoned lookalike!)\n`);

  // --- SCENARIO 1: Agent checks the poisoned lookalike address ---
  console.log("---------------------------------------------------------------");
  console.log("🛑 STEP 1: Agent checks copied address with Known Agent API...");
  console.log(`   Target: ${poisonedLookalike}`);

  const confirmedList = await db.select().from(payees);
  const coreConfirmed = confirmedList.map((p) => ({
    id: p.id,
    userId: p.userId,
    chain: p.chain as any,
    address: p.address,
    normalized: p.normalized,
    label: p.label,
    confirmedAt: p.confirmedAt.toISOString(),
    status: p.status as any,
    sendCount: p.sendCount,
    typicalLowRaw: p.typicalLowRaw || undefined,
    typicalHighRaw: p.typicalHighRaw || undefined,
    decimals: p.decimals,
    assetSymbol: p.assetSymbol,
  }));

  const badVerdict = evaluateVerdict(
    {
      chain: "sui",
      address: poisonedLookalike,
      amountRaw: "50000000000",
    },
    coreConfirmed,
    [],
    []
  );

  console.log(`   API Response: [Verdict: ${badVerdict.verdict.toUpperCase()}]`);
  console.log(`   Reason:       ${badVerdict.explanation}`);

  if (badVerdict.verdict !== "green") {
    console.log("   ❌ AGENT ACTION: TRANSACTION BLOCKED!");
    console.log(`   🚨 Security alert: Attack detected imitating '${badVerdict.imitates?.label}'.`);
    console.log("   🛡️  Agent preserved 50 SUI from theft.\n");
  } else {
    throw new Error("Security failure: Agent approved lookalike address!");
  }

  // --- SCENARIO 2: Agent checks the genuine confirmed payee address ---
  console.log("---------------------------------------------------------------");
  console.log("✅ STEP 2: Agent checks genuine address from Walrus Memory...");
  console.log(`   Target: ${realAdaAddress}`);

  const goodVerdict = evaluateVerdict(
    {
      chain: "sui",
      address: realAdaAddress,
      amountRaw: "50000000000",
    },
    coreConfirmed,
    [],
    []
  );

  console.log(`   API Response: [Verdict: ${goodVerdict.verdict.toUpperCase()}]`);
  console.log(`   Reason:       ${goodVerdict.explanation}`);

  if (goodVerdict.verdict === "green") {
    console.log("   ✅ AGENT ACTION: TRANSACTION APPROVED!");
    console.log(`   💸 Agent successfully broadcasted 50 SUI to ${goodVerdict.matchedPayee?.label}.\n`);
  } else {
    throw new Error("Failure: Agent rejected genuine payee address!");
  }

  console.log("===============================================================");
  console.log("🎉  AGENT PRE-FLIGHT VERIFICATION DEMO COMPLETED SUCCESSFULLY");
  console.log("===============================================================");
}

runAgentPaymentWorkflow().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
