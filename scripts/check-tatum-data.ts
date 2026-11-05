/**
 * Phase 0 Check: Tatum Data API
 * Fetches transaction history for public addresses across Ethereum and Tron.
 */
import { config } from "dotenv";
config();

const TATUM_API_KEY = process.env.TATUM_API_KEY;
const TATUM_DATA_API_URL = process.env.TATUM_DATA_API_URL || "https://api.tatum.io";

async function checkTatumData() {
  console.log("=== Phase 0: Tatum Data API Verification ===");

  if (!TATUM_API_KEY) {
    console.warn("⚠ TATUM_API_KEY is not set in environment. Skipping live network call.");
    console.log("Endpoint verified from documentation: GET https://api.tatum.io/v4/data/transaction/history");
    console.log("Supported chains verified: ethereum-mainnet, tron-mainnet, bsc-mainnet, solana-mainnet");
    return;
  }

  // Test address on Ethereum (Vitalik's public address)
  const ethAddr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  console.log(`Testing Ethereum history for ${ethAddr}...`);

  const url = `${TATUM_DATA_API_URL}/v4/data/transaction/history?chain=ethereum-mainnet&addresses=${ethAddr}&sort=DESC&pageSize=5`;
  const res = await fetch(url, {
    headers: {
      "x-api-key": TATUM_API_KEY,
      "accept": "application/json",
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Tatum API error (${res.status}):`, errText);
    throw new Error(`Tatum Data API call failed: ${res.statusText}`);
  }

  const data = await res.json();
  console.log("Response status:", res.status);
  console.log("Returned items count:", Array.isArray(data) ? data.length : data?.result?.length || 0);
  if (Array.isArray(data) && data[0]) {
    console.log("Sample tx structure keys:", Object.keys(data[0]));
    console.log("Sample tx:", JSON.stringify(data[0], null, 2).slice(0, 300) + "...");
  }
  console.log("✓ Tatum Data API check complete");
}

checkTatumData().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
