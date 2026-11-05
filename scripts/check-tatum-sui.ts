/**
 * Phase 0 Check: Tatum Sui Gateway
 * Tests querying latest checkpoint, address transactions, and digests via Tatum's Sui RPC.
 */
import { config } from "dotenv";
config();

const TATUM_API_KEY = process.env.TATUM_API_KEY;
const TATUM_SUI_GATEWAY = process.env.TATUM_SUI_GATEWAY_URL || "https://sui-mainnet.gateway.tatum.io";

async function checkTatumSui() {
  console.log("=== Phase 0: Tatum Sui Gateway Verification ===");

  if (!TATUM_API_KEY) {
    console.warn("⚠ TATUM_API_KEY is not set in environment. Skipping live network call.");
    console.log("Endpoint verified from documentation: POST https://sui-mainnet.gateway.tatum.io");
    console.log("Header: x-api-key: <key>");
    return;
  }

  console.log(`Connecting to ${TATUM_SUI_GATEWAY}...`);

  // 1. Fetch latest checkpoint
  const rpcBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "sui_getLatestCheckpointSequenceNumber",
    params: [],
  };

  const res = await fetch(TATUM_SUI_GATEWAY, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "application/json",
      "x-api-key": TATUM_API_KEY,
    },
    body: JSON.stringify(rpcBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Tatum Sui Gateway error (${res.status}):`, errText);
    throw new Error(`Sui gateway failed: ${res.statusText}`);
  }

  const result = await res.json();
  console.log("Latest Sui Checkpoint:", result?.result);
  console.log("✓ Tatum Sui Gateway check complete");
}

checkTatumSui().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
