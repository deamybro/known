import { NextResponse } from "next/server";
import { getDb, outbox, payees, transfers, watchedAddresses } from "@/db/index";
import { getOrCreateCurrentUser } from "@/lib/user";
import { count, eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const db = getDb();

    // 1. Walrus relayer status
    let relayerHealth = "offline";
    try {
      const hRes = await fetch("https://relayer.memory.walrus.xyz/health");
      if (hRes.ok) {
        const hJson = await hRes.json();
        relayerHealth = hJson.status === "ok" ? "online" : "degraded";
      }
    } catch {
      relayerHealth = "offline";
    }

    // 2. Tatum Sui Gateway status & latest checkpoint
    let suiCheckpoint: any = null;
    let suiGatewayStatus = "offline";
    try {
      const apiKey = process.env.TATUM_API_KEY || "";
      const sRes = await fetch("https://sui-mainnet.gateway.tatum.io/graphql", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ query: "{ checkpoint { sequenceNumber timestamp epoch { epochId } } }" }),
      });
      if (sRes.ok) {
        const sJson = await sRes.json();
        suiCheckpoint = sJson?.data?.checkpoint;
        suiGatewayStatus = "online";
      }
    } catch {
      suiGatewayStatus = "offline";
    }

    // 3. Database counts
    const watchedRows = await db.select().from(watchedAddresses).where(eq(watchedAddresses.userId, user.id));
    const payeeRows = await db.select().from(payees).where(eq(payees.userId, user.id));
    const transferRows = await db.select().from(transfers).where(eq(transfers.userId, user.id));
    const outboxRows = await db.select().from(outbox).where(eq(outbox.userId, user.id));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      integrations: {
        walrusMemory: {
          relayerUrl: "https://relayer.memory.walrus.xyz",
          status: relayerHealth,
          accountId: process.env.MEMWAL_ACCOUNT_ID || "0x...",
        },
        tatumSuiGateway: {
          endpoint: "https://sui-mainnet.gateway.tatum.io/graphql",
          status: suiGatewayStatus,
          latestCheckpoint: suiCheckpoint,
        },
        tatumDataApi: {
          status: process.env.TATUM_API_KEY ? "configured" : "unconfigured",
          supportedChains: ["ethereum-mainnet", "bsc-mainnet", "base-mainnet"],
        },
      },
      counts: {
        watchedWallets: watchedRows.length,
        confirmedPayees: payeeRows.length,
        cachedTransfers: transferRows.length,
        walrusOutboxTotal: outboxRows.length,
        walrusConfirmedBlobs: outboxRows.filter((o) => o.status === "confirmed").length,
      },
      memories: outboxRows.map((o) => ({
        id: o.id,
        namespace: o.namespace,
        status: o.status,
        blobId: o.blobId,
        createdAt: o.createdAt,
        confirmedAt: o.confirmedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
