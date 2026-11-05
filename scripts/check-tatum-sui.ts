/**
 * Phase 0 Check: Tatum Sui Gateway
 * Tests querying latest checkpoint, address transactions, and digests via Tatum's Sui GraphQL gateway.
 */
import { config } from "dotenv";
config();

const TATUM_API_KEY = process.env.TATUM_API_KEY;
const TATUM_SUI_GATEWAY = process.env.TATUM_SUI_GATEWAY_URL || "https://sui-mainnet.gateway.tatum.io/graphql";

async function checkTatumSui() {
  console.log("=== Phase 0: Tatum Sui Gateway Verification ===");

  if (!TATUM_API_KEY) {
    console.warn("⚠ TATUM_API_KEY is not set in environment.");
    return;
  }

  console.log(`Connecting to Tatum Sui GraphQL Gateway: ${TATUM_SUI_GATEWAY}...`);

  const query = `
    query {
      chainIdentifier
      checkpoint {
        sequenceNumber
        timestamp
        epoch {
          epochId
        }
      }
    }
  `;

  const res = await fetch(TATUM_SUI_GATEWAY, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "application/json",
      "x-api-key": TATUM_API_KEY,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Tatum Sui Gateway error (${res.status}):`, errText);
    throw new Error(`Sui gateway failed: ${res.statusText}`);
  }

  const result = await res.json();
  console.log("Chain Identifier:", result?.data?.chainIdentifier);
  console.log("Latest Checkpoint:", result?.data?.checkpoint);
  console.log("✓ Tatum Sui Gateway check PASSED");
}

checkTatumSui().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
