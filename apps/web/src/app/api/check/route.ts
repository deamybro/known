import { NextResponse } from "next/server";
import { alerts, blocklist, getDb, outbox, payees, transfers } from "@/db/index";
import { getOrCreateCurrentUser } from "@/lib/user";
import {
  BlocklistRecord,
  CheckAddressRequest,
  evaluateVerdict,
  normalizeAddress,
  PayeeRecord,
  SupportedChain,
  TransferRecord,
} from "@known/core";
import { recallPayeeContext } from "@known/memory";
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

    // 4. Run deterministic security evaluation (Strictly pure code, no LLM / heuristics)
    const result = evaluateVerdict(body, confirmedPayees, userBlocklist, userTransfers);

    // 5. Query Walrus Memory semantic recall for rich human-language context
    let memorySummary: string | null = null;
    try {
      const recallQuery = result.matchedPayee?.label || result.imitates?.label || body.address;
      const recallResult = await recallPayeeContext({
        userId: user.id,
        query: recallQuery,
        limit: 3,
      });
      if (recallResult?.summary) {
        memorySummary = recallResult.summary;
      }
    } catch {
      // Memory recall is purely additive; failures must never block security checks
    }

    // 6. If lookalike caught (Red alert), record in alerts and queue memory
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

        // If it's a caught lookalike, add to blocklist & outbox for Walrus memory persistence
        if (result.imitates) {
          const norm = normalizeAddress(body.chain, body.address);
          const blockId = `blk_${Date.now()}`;
          await db
            .insert(blocklist)
            .values({
              id: blockId,
              userId: user.id,
              chain: body.chain,
              address: body.address,
              normalized: norm.normalized,
              imitatesPayeeId: result.imitates.address,
              reason: `Lookalike imitating ${result.imitates.label}`,
              firstSeenAt: new Date(),
            })
            .onConflictDoNothing();

          const memoryPayload = {
            v: 1,
            kind: "lookalike_caught",
            userId: user.id,
            chain: body.chain,
            address: norm.normalized,
            imitatesPayeeAddress: result.imitates.address,
            imitatesLabel: result.imitates.label,
            occurredAt: new Date().toISOString(),
            summary: `Caught lookalike imitating ${result.imitates.label} on ${body.chain.toUpperCase()}.`,
          };

          await db
            .insert(outbox)
            .values({
              id: `out_lookalike_${Date.now()}`,
              userId: user.id,
              namespace: `known:${user.id}:blocklist`,
              content: JSON.stringify(memoryPayload),
              status: "pending",
              attempts: 0,
              createdAt: new Date(),
            })
            .onConflictDoNothing();
        }
      } catch (err) {
        console.error("Alert / blocklist logging error:", err);
      }
    }

    return NextResponse.json({
      ...result,
      memoryContext: memorySummary,
    });
  } catch (error: any) {
    console.error("Check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
