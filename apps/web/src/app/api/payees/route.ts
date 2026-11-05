import { NextResponse } from "next/server";
import { getDb, payees, transfers } from "@/db/index";
import { getOrCreateCurrentUser } from "@/lib/user";
import { deriveSuggestedPayees, PayeeRecord, SupportedChain, TransferRecord } from "@known/core";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const db = getDb();

    // 1. Fetch confirmed payees
    const confirmedRows = await db
      .select()
      .from(payees)
      .where(eq(payees.userId, user.id));

    const confirmed: PayeeRecord[] = confirmedRows.map((r) => ({
      id: r.id,
      userId: r.userId,
      chain: r.chain as SupportedChain,
      address: r.address,
      normalized: r.normalized,
      label: r.label,
      confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : new Date().toISOString(),
      status: r.status as "confirmed" | "removed",
      sendCount: r.sendCount,
      firstSentAt: r.firstSentAt ? r.firstSentAt.toISOString() : undefined,
      lastSentAt: r.lastSentAt ? r.lastSentAt.toISOString() : undefined,
      typicalLowRaw: r.typicalLowRaw || undefined,
      typicalHighRaw: r.typicalHighRaw || undefined,
      decimals: r.decimals,
      assetSymbol: r.assetSymbol,
    }));

    // 2. Fetch transfers to derive suggestions
    const transferRows = await db
      .select()
      .from(transfers)
      .where(eq(transfers.userId, user.id));

    const userTransfers: TransferRecord[] = transferRows.map((t) => ({
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

    // 3. Derive suggested payees
    const suggestions = deriveSuggestedPayees(userTransfers, confirmed);

    return NextResponse.json({
      confirmed,
      suggestions,
      totalTransfers: userTransfers.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
