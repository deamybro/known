import { getDb, outbox, payees, users } from "@/db/index";
import { runMigrations } from "@/db/migrate";
import { normalizeAddress } from "@known/core";
import { eq } from "drizzle-orm";

export const DEMO_USER_ID = "usr_known_demo_default";
export const DEMO_SUI_ADDRESS = "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38";

let migrationRan = false;

/**
 * Ensures the default active user and seed demo payees exist in the database.
 */
export async function getOrCreateCurrentUser(): Promise<{ id: string; suiAddress: string }> {
  if (!migrationRan) {
    try {
      await runMigrations();
      migrationRan = true;
    } catch (e) {
      console.error("Migration error:", e);
    }
  }

  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.id, DEMO_USER_ID)).limit(1);

  if (existing.length === 0) {
    // Create default user record
    await db.insert(users).values({
      id: DEMO_USER_ID,
      suiAddress: DEMO_SUI_ADDRESS,
    }).onConflictDoNothing();
  }

  // Ensure default demo payee (Ada Sister) is pre-populated for instant testing
  const existingPayees = await db.select().from(payees).where(eq(payees.userId, DEMO_USER_ID)).limit(1);
  if (existingPayees.length === 0) {
    const realAda = "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38";
    await db.insert(payees).values({
      id: "payee_ada_sister",
      userId: DEMO_USER_ID,
      chain: "sui",
      address: realAda,
      normalized: normalizeAddress("sui", realAda).normalized,
      label: "Ada Sister",
      status: "confirmed",
      sendCount: 14,
      typicalLowRaw: "50000000000",
      typicalHighRaw: "200000000000",
      decimals: 9,
      assetSymbol: "SUI",
      confirmedAt: new Date(),
    }).onConflictDoNothing();

    await db.insert(outbox).values({
      id: `out_seed_${Date.now()}`,
      userId: DEMO_USER_ID,
      namespace: `known:${DEMO_USER_ID}:payees`,
      content: JSON.stringify({
        v: 1,
        kind: "payee_confirmed",
        userId: DEMO_USER_ID,
        chain: "sui",
        address: realAda,
        label: "Ada Sister",
        sendCount: 14,
        occurredAt: new Date().toISOString(),
        summary: "Ada Sister on SUI: confirmed payee (14 sends).",
      }),
      status: "pending",
      attempts: 0,
    }).onConflictDoNothing();
  }

  return { id: DEMO_USER_ID, suiAddress: DEMO_SUI_ADDRESS };
}
