import "dotenv/config";

async function main() {
  const target = "0x965a8406327f5367cc41bbcff97aefbf0126ad87692a1c3b075c5915459a4c1a";
  const suiGatewayUrl = process.env.TATUM_SUI_GATEWAY_URL!;
  const apiKey = process.env.TATUM_API_KEY!;

  const query = `
    query CheckObjects($addr: SuiAddress!) {
      address(address: $addr) {
        objects {
          nodes {
            address
            contents {
              type {
                repr
              }
            }
          }
        }
      }
    }
  `;

  const resp = await fetch(suiGatewayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      variables: { addr: target },
    }),
  });

  const json = await resp.json();
  console.log("Objects owned by address:", JSON.stringify(json, null, 2));
}

main().catch(console.error);
