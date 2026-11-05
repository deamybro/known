import { config } from "dotenv";
config();

async function checkOwned() {
  const addr = process.env.MEMWAL_ACCOUNT_ID;
  const apiKey = process.env.TATUM_API_KEY;

  const query = `
    query {
      address(address: "${addr}") {
        objects {
          nodes {
            address
            hasPublicTransfer
          }
        }
      }
    }
  `;

  const res = await fetch("https://sui-mainnet.gateway.tatum.io/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey || "",
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  console.log("Owned objects:", JSON.stringify(data, null, 2));
}

checkOwned().catch(console.error);
