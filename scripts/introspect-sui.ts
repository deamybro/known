import { config } from "dotenv";
config();

async function run() {
  const query = `
    query {
      __type(name: "TransactionEffects") {
        fields {
          name
        }
      }
    }
  `;
  const res = await fetch("https://sui-mainnet.gateway.tatum.io/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.TATUM_API_KEY || "",
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  console.log("TransactionEffects fields:", data?.data?.__type?.fields?.map((f: any) => f.name));
}

run().catch(console.error);
