import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { alerts, apiKeys, blocklist, getDb, outbox, payees, transfers, users } from "@/db/index";
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
    const db = getDb();
    const apiKeyHeader = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");

    let userId: string | null = null;

    if (apiKeyHeader) {
      const hashed = crypto.createHash("sha256").update(apiKeyHeader.trim()).digest("hex");
      const keyRow = await db.select().from(apiKeys).where(eq(apiKeys.hashedKey, hashed)).limit(1);

      if (keyRow.length > 0) {
        userId = keyRow[0].userId;
        await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyRow[0].id));
      } else if (apiKeyHeader === "known_agent_demo_key") {
        // Built-in demo key for hackathon evaluation and agent testing
        const allUsers = await db.select().from(users).limit(1);
        if (allUsers.length > 0) {
          userId = allUsers[0].id;
        }
      }
    }

    // If no key provided, fallback to the default/first user in local dev/demo
    if (!userId) {
      const allUsers = await db.select().from(users).limit(1);
      if (allUsers.length > 0) {
        userId = allUsers[0].id;
      } else {
        return NextResponse.json(
          { error: "Unauthorized: Invalid or missing x-api-key header." },
          { status: 401 }
        );
      }
    }

    const body = (await req.json()) as CheckAddressRequest;
    if (!body.chain || !body.address) {
      return NextResponse.json(
        { error: "Bad Request: 'chain' and 'address' are required." },
        { status: 400 }
      );
    }

    // 1. Fetch confirmed payees
    const payeeRows = await db.select().from(payees).where(eq(payees.userId, userId));
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
    const blockRows = await db.select().from(blocklist).where(eq(blocklist.userId, userId));
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
    const txRows = await db.select().from(transfers).where(eq(transfers.userId, userId));
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

    // 4. Deterministic security check
    const verdict = evaluateVerdict(body, confirmedPayees, userBlocklist, userTransfers);

    // 5. Query Walrus Memory for context
    let memoryContext: string | null = null;
    try {
      const query = verdict.matchedPayee?.label || verdict.imitates?.label || body.address;
      const recallRes = await recallPayeeContext({
        userId,
        query,
        limit: 3,
      });
      if (recallRes?.summary) {
        memoryContext = recallRes.summary;
      }
    } catch {
      // Memory context is additive
    }

    // 6. Record lookalike block if red alert
    if (verdict.verdict === "red" && verdict.imitates) {
      try {
        const norm = normalizeAddress(body.chain, body.address);
        await db
          .insert(blocklist)
          .values({
            id: `blk_agent_${Date.now()}`,
            userId,
            chain: body.chain,
            address: body.address,
            normalized: norm.normalized,
            imitatesPayeeId: verdict.imitates.address,
            reason: `Agent check flagged lookalike imitating ${verdict.imitates.label}`,
            firstSeenAt: new Date(),
          })
          .onConflictDoNothing();

        const memoryPayload = {
          v: 1,
          kind: "lookalike_caught",
          userId,
          chain: body.chain,
          address: norm.normalized,
          imitatesPayeeAddress: verdict.imitates.address,
          imitatesLabel: verdict.imitates.label,
          occurredAt: new Date().toISOString(),
          summary: `AI Agent blocked lookalike imitating ${verdict.imitates.label} on ${body.chain.toUpperCase()}.`,
        };

        await db
          .insert(outbox)
          .values({
            id: `out_agent_${Date.now()}`,
            userId,
            namespace: `known:${userId}:blocklist`,
            content: JSON.stringify(memoryPayload),
            status: "pending",
            attempts: 0,
            createdAt: new Date(),
          })
          .onConflictDoNothing();
      } catch (err) {
        console.error("Agent alert logging error:", err);
      }
    }

    // Strict boolean safety policy for autonomous agents:
    // Only "green" verdicts are permitted. "red" and "amber" (unknown) are rejected.
    const allowed = verdict.verdict === "green";

    return NextResponse.json({
      allowed,
      verdict: verdict.verdict,
      reason: verdict.explanation,
      reasons: verdict.reasons,
      chain: verdict.chain,
      targetAddress: verdict.displayAddress,
      matchedPayee: verdict.matchedPayee,
      imitates: verdict.imitates,
      memoryContext,
      checkedAt: verdict.checkedAt,
    });
  } catch (error: any) {
    console.error("Agent check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
