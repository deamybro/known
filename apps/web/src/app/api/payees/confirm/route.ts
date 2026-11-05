import { NextResponse } from "next/server";
import { getDb, outbox, payees } from "@/db/index";
import { getOrCreateCurrentUser } from "@/lib/user";
import { normalizeAddress, SupportedChain } from "@known/core";

export async function POST(req: Request) {
  try {
    const user = await getOrCreateCurrentUser();
    const body = await req.json();
    const {
      chain,
      address,
      label,
      sendCount,
      typicalLowRaw,
      typicalHighRaw,
      decimals,
      assetSymbol,
    } = body as {
      chain: SupportedChain;
      address: string;
      label: string;
      sendCount?: number;
      typicalLowRaw?: string;
      typicalHighRaw?: string;
      decimals?: number;
      assetSymbol?: string;
    };

    if (!chain || !address || !label) {
      return NextResponse.json({ error: "chain, address, and label are required" }, { status: 400 });
    }

    const norm = normalizeAddress(chain, address);
    if (!norm.isValid) {
      return NextResponse.json({ error: `Invalid ${chain} address: ${norm.error}` }, { status: 400 });
    }

    const db = getDb();
    const payeeId = `pay_${chain}_${Date.now()}`;
    const confirmedAt = new Date();

    const payeeRecord = {
      id: payeeId,
      userId: user.id,
      chain,
      address: norm.display,
      normalized: norm.normalized,
      label: label.trim(),
      confirmedAt,
      status: "confirmed",
      sendCount: sendCount || 1,
      typicalLowRaw: typicalLowRaw || "0",
      typicalHighRaw: typicalHighRaw || "0",
      decimals: decimals || 6,
      assetSymbol: assetSymbol || "USDC",
    };

    await db.insert(payees).values(payeeRecord);

    // Queue in outbox for Walrus Memory mainnet sync
    const memoryPayload = {
      v: 1,
      kind: "payee_confirmed",
      userId: user.id,
      chain,
      address: norm.normalized,
      label: label.trim(),
      sendCount: sendCount || 1,
      typicalLowRaw: typicalLowRaw || "0",
      typicalHighRaw: typicalHighRaw || "0",
      decimals: decimals || 6,
      assetSymbol: assetSymbol || "USDC",
      occurredAt: confirmedAt.toISOString(),
      summary: `${label.trim()} on ${chain.toUpperCase()}: confirmed payee.`,
    };

    const outboxId = `out_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await db.insert(outbox).values({
      id: outboxId,
      userId: user.id,
      namespace: `known:${user.id}:payees`,
      content: JSON.stringify(memoryPayload),
      status: "pending",
      attempts: 0,
      createdAt: confirmedAt,
    });

    return NextResponse.json({
      success: true,
      payee: payeeRecord,
      outboxQueued: true,
    });
  } catch (error: any) {
    console.error("Confirm payee error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
