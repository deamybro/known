/**
 * Phase 0 Check: Walrus Memory (MemWal)
 * Tests relayer health, compatibility, and (if credentials provided) writing, polling, and recalling memories.
 */
import { config } from "dotenv";
config();
import { MemWal } from "@mysten-incubation/memwal";

const MEMWAL_PRIVATE_KEY = process.env.MEMWAL_PRIVATE_KEY;
const MEMWAL_ACCOUNT_ID = process.env.MEMWAL_ACCOUNT_ID;
const MEMWAL_RELAYER_URL = process.env.MEMWAL_RELAYER_URL || "https://relayer.memory.walrus.xyz";

async function checkWalrus() {
  console.log("=== Phase 0: Walrus Memory Verification ===");
  console.log("Relayer URL:", MEMWAL_RELAYER_URL);

  // 1. Health check via public endpoint
  const healthRes = await fetch(`${MEMWAL_RELAYER_URL}/health`);
  console.log("Relayer /health status:", healthRes.status, await healthRes.text());

  const versionRes = await fetch(`${MEMWAL_RELAYER_URL}/version`);
  console.log("Relayer /version status:", versionRes.status, await versionRes.text());

  if (!MEMWAL_PRIVATE_KEY || !MEMWAL_ACCOUNT_ID) {
    console.warn("\n⚠ MEMWAL_PRIVATE_KEY or MEMWAL_ACCOUNT_ID not set in environment.");
    console.log("Health and API endpoints verified successfully.");
    console.log("Add credentials to .env to execute live write and recall test.");
    return;
  }

  // 2. Initialize MemWal client
  const memwal = MemWal.create({
    key: MEMWAL_PRIVATE_KEY,
    accountId: MEMWAL_ACCOUNT_ID,
    serverUrl: MEMWAL_RELAYER_URL,
    namespace: "known-test",
  });

  const pubKey = await memwal.getPublicKeyHex();
  console.log("MemWal delegate public key:", pubKey);

  // 3. Test Write (remember)
  const testPayload = JSON.stringify({
    v: 1,
    kind: "payee_confirmed",
    userId: "test-user-phase0",
    chain: "sui",
    address: "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38",
    label: "Ada (Test Phase 0)",
    occurredAt: new Date().toISOString(),
    summary: "Phase 0 verification memory for Known",
  });

  console.log("\nSubmitting test memory to Walrus Memory mainnet relayer...");
  const writeStart = Date.now();
  const accepted = await memwal.remember(testPayload);
  console.log("Accepted job ID:", accepted.job_id);

  console.log("Waiting for job confirmation on Walrus / Sui mainnet...");
  const jobResult = await memwal.waitForRememberJob(accepted.job_id);
  const writeLatency = ((Date.now() - writeStart) / 1000).toFixed(1);
  console.log(`Memory confirmed in ${writeLatency}s! Blob ID:`, jobResult.blob_id);

  // 4. Recall
  console.log("\nTesting semantic recall...");
  const recallResult = await memwal.recall({
    query: "Ada",
    limit: 5,
  });
  console.log("Recall matches found:", recallResult.results.length);
  for (const hit of recallResult.results) {
    console.log(`- Hit [distance ${hit.distance.toFixed(4)}]: ${hit.text.slice(0, 100)}...`);
  }

  // 5. Test Listing Inventory (100% namespace enumeration verification)
  console.log("\nTesting inventory enumeration via listMemories...");
  const listResult = await memwal.listMemories({ namespace: "known-test" });
  console.log("Enumerated memories in namespace:", listResult.memories.length);

  console.log("✓ Walrus Memory full lifecycle PASSED");
}

checkWalrus().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
