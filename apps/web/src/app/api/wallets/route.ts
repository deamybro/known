import { NextResponse } from "next/server";
import { getDb, watchedAddresses } from "@/db/index";
import { getOrCreateCurrentUser } from "@/lib/user";
import { normalizeAddress, SupportedChain } from "@known/core";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const db = getDb();
    const wallets = await db
      .select()
      .from(watchedAddresses)
      .where(eq(watchedAddresses.userId, user.id));

    return NextResponse.json({ wallets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getOrCreateCurrentUser();
    const body = await req.json();
    const { chain, address } = body as { chain: SupportedChain; address: string };

    if (!chain || !address) {
      return NextResponse.json({ error: "chain and address are required" }, { status: 400 });
    }

    const norm = normalizeAddress(chain, address);
    if (!norm.isValid) {
      return NextResponse.json({ error: `Invalid ${chain} address: ${norm.error}` }, { status: 400 });
    }

    const db = getDb();

    // Check if already watched
    const existing = await db
      .select()
      .from(watchedAddresses)
      .where(
        and(
          eq(watchedAddresses.userId, user.id),
          eq(watchedAddresses.chain, chain),
          eq(watchedAddresses.normalized, norm.normalized)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ wallet: existing[0], created: false });
    }

    const id = `wat_${chain}_${Date.now()}`;
    const newWallet = {
      id,
      userId: user.id,
      chain,
      address: norm.display,
      normalized: norm.normalized,
      addedAt: new Date(),
    };

    await db.insert(watchedAddresses).values(newWallet);
    return NextResponse.json({ wallet: newWallet, created: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
