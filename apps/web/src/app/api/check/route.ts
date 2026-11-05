import { NextResponse } from "next/server";
import { alerts, blocklist, getDb, payees, transfers } from "@/db/index";
import { getOrCreateCurrentUser } from "@/lib/user";
import {
  BlocklistRecord,
  CheckAddressRequest,
  evaluateVerdict,
  PayeeRecord,
  SupportedChain,
  TransferRecord,
} from "@known/core";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getOrCreateCurrentUser();
    const body = (await req.json()) as CheckAddressRequest;

    if (!body.chain || !body.address) {
      return NextResponse.json({ error: "chain and address are required" }, { status: 400 });
    }

    const db = getDb();

    // 1. Fetch user's confirmed payees
    const payeeRows = await db.select().from(payees).where(eq(payees.userId, user.id));
    const confirmedPayees: PayeeRecord[] = payeeRows.map((r) => ({
      id: r.id,
      userId: r.userId,
      chain: r.chain as SupportedChain,
      address: r.address,
      normalized: r.normalized,
      label: r.label,
      confirmedAt: r.confirmedAt.toISOString(),
      status: r.status as "confirmed" | "removed",
      sendCount: r.sendCount,
      typicalLowRaw: r.typicalLowRaw || undefined,
      typicalHighRaw: r.typicalHighRaw || undefined,
      decimals: r.decimals,
      assetSymbol: r.assetSymbol,
    }));

    // 2. Fetch blocklist
    const blockRows = await db.select().from(blocklist).where(eq(blocklist.userId, user.id));
    const userBlocklist: BlocklistRecord[] = blockRows.map((b) => ({
      id: b.id,
      userId: b.userId,
      chain: b.chain as SupportedChain,
      address: b.address,
      normalized: b.normalized,
      imitatesPayeeId: b.imitatesPayeeId || undefined,
      reason: b.reason,
      firstSeenAt: b.firstSeenAt.toISOString(),
    }));

    // 3. Fetch transfers
    const txRows = await db.select().from(transfers).where(eq(transfers.userId, user.id));
    const userTransfers: TransferRecord[] = txRows.map((t) => ({
      id: t.id,
      userId: t.userId,
      chain: t.chain as SupportedChain,
      txHash: t.txHash,
      direction: t.direction as "in" | "out",
      counterparty: t.counterparty,
      counterpartyNormalized: t.counterpartyNormalized,
      asset: t.asset,
      assetSymbol: t.assetSymbol,
      amountRaw: t.amountRaw,
      decimals: t.decimals,
      timestamp: t.timestamp.toISOString(),
      isZeroValue: t.isZeroValue,
      isDust: t.isDust,
      source: t.source,
    }));

    // 4. Run deterministic security evaluation
    const result = evaluateVerdict(body, confirmedPayees, userBlocklist, userTransfers);

    // 5. If red alert, log in alerts table
    if (result.verdict === "red") {
      try {
        await db.insert(alerts).values({
          id: `alt_${Date.now()}`,
          userId: user.id,
          chain: body.chain,
          address: result.displayAddress || body.address,
          verdict: result.verdict,
          reasons: result.reasons,
          createdAt: new Date(),
        });
      } catch (err) {
        // Logging error shouldn't fail verdict
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
