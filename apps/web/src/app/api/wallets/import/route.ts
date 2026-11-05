import { NextResponse } from "next/server";
import { getDb, transfers, watchedAddresses } from "@/db/index";
import { getOrCreateCurrentUser } from "@/lib/user";
import { importWalletHistory } from "@known/chain";
import { SupportedChain } from "@known/core";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getOrCreateCurrentUser();
    const body = await req.json();
    const { chain, address } = body as { chain: SupportedChain; address: string };

    if (!chain || !address) {
      return NextResponse.json({ error: "chain and address required" }, { status: 400 });
    }

    const apiKey = process.env.TATUM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "TATUM_API_KEY is not configured" }, { status: 500 });
    }

    // Call Tatum Multi-Chain Importer
    const imported = await importWalletHistory({
      chain,
      address,
      userId: user.id,
      apiKey,
      dataApiUrl: process.env.TATUM_DATA_API_URL,
      suiGatewayUrl: process.env.TATUM_SUI_GATEWAY_URL,
      pageSize: 25,
    });

    const db = getDb();
    let newCount = 0;

    for (const tx of imported) {
      try {
        await db
          .insert(transfers)
          .values({
            id: tx.id,
            userId: user.id,
            chain: tx.chain,
            txHash: tx.txHash,
            direction: tx.direction,
            counterparty: tx.counterparty,
            counterpartyNormalized: tx.counterpartyNormalized,
            asset: tx.asset,
            assetSymbol: tx.assetSymbol,
            amountRaw: tx.amountRaw,
            decimals: tx.decimals,
            timestamp: new Date(tx.timestamp),
            isZeroValue: tx.isZeroValue,
            isDust: tx.isDust,
            source: "tatum",
          })
          .onConflictDoNothing();
        newCount++;
      } catch (e) {
        // Duplicate key or conflict ignored
      }
    }

    return NextResponse.json({
      success: true,
      chain,
      address,
      importedCount: imported.length,
      savedNewCount: newCount,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
