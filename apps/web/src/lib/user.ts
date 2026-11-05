import { getDb, users } from "@/db/index";
import { eq } from "drizzle-orm";

export const DEMO_USER_ID = "usr_known_demo_default";
export const DEMO_SUI_ADDRESS = "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38";

/**
 * Ensures the default active user exists in the database.
 */
export async function getOrCreateCurrentUser(): Promise<{ id: string; suiAddress: string }> {
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.id, DEMO_USER_ID)).limit(1);

  if (existing.length > 0) {
    return { id: existing[0].id, suiAddress: existing[0].suiAddress };
  }

  // Create default user record
  await db.insert(users).values({
    id: DEMO_USER_ID,
    suiAddress: DEMO_SUI_ADDRESS,
  });

  return { id: DEMO_USER_ID, suiAddress: DEMO_SUI_ADDRESS };
}
