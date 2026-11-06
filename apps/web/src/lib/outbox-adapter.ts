import { getDb, outbox } from "@/db/index";
import { OutboxRow, OutboxStorageAdapter } from "@known/memory";
import { eq, asc } from "drizzle-orm";

export function createDrizzleOutboxAdapter(): OutboxStorageAdapter {
  const db = getDb();

  return {
    async getPending(limit = 10): Promise<OutboxRow[]> {
      const rows = await db
        .select()
        .from(outbox)
        .where(eq(outbox.status, "pending"))
        .orderBy(asc(outbox.createdAt))
        .limit(limit);

      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        namespace: r.namespace,
        content: r.content,
        status: r.status,
        attempts: r.attempts,
        lastError: r.lastError,
        jobId: r.jobId,
        blobId: r.blobId,
      }));
    },

    async markSuccess(id: string, result: { jobId?: string; blobId?: string }) {
      await db
        .update(outbox)
        .set({
          status: "confirmed",
          jobId: result.jobId || null,
          blobId: result.blobId || null,
          confirmedAt: new Date(),
        })
        .where(eq(outbox.id, id));
    },

    async markFailure(id: string, attempts: number, error: string) {
      const status = attempts >= 5 ? "failed" : "pending";
      await db
        .update(outbox)
        .set({
          status,
          attempts,
          lastError: error.slice(0, 500),
        })
        .where(eq(outbox.id, id));
    },
  };
}
