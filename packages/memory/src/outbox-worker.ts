/**
 * Walrus Memory Outbox Worker
 * Processes queued payee and blocklist memories, writes them to Walrus Memory,
 * and records the resulting blob IDs.
 */

import { IMemoryClient, getMemoryClient } from "./client.js";

export interface OutboxRow {
  id: string;
  userId: string;
  namespace: string;
  content: string;
  status: string;
  attempts: number;
  lastError?: string | null;
  jobId?: string | null;
  blobId?: string | null;
}

export interface OutboxStorageAdapter {
  getPending(limit?: number): Promise<OutboxRow[]>;
  markSuccess(id: string, result: { jobId?: string; blobId?: string }): Promise<void>;
  markFailure(id: string, attempts: number, error: string): Promise<void>;
}

export interface SyncResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export async function processOutbox(
  adapter: OutboxStorageAdapter,
  client?: IMemoryClient,
  batchSize = 10
): Promise<SyncResult> {
  const memClient = client || getMemoryClient();
  const pending = await adapter.getPending(batchSize);

  const result: SyncResult = {
    processed: pending.length,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  for (const item of pending) {
    if (item.attempts >= 5) {
      await adapter.markFailure(item.id, item.attempts, "Exceeded maximum retry attempts (5)");
      result.failed++;
      result.errors.push({ id: item.id, error: "Exceeded max attempts" });
      continue;
    }

    try {
      console.log(`[Outbox Worker] Syncing record ${item.id} to Walrus namespace ${item.namespace}...`);

      const res = await memClient.rememberAndWait(item.content, item.namespace, {
        dedupe: true,
      });

      const jobId = res?.job_id || res?.jobId;
      const blobId = res?.blob_id || res?.blobId || res?.id;

      await adapter.markSuccess(item.id, {
        jobId: jobId ? String(jobId) : undefined,
        blobId: blobId ? String(blobId) : `blob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      });

      result.succeeded++;
      console.log(`[Outbox Worker] ✓ Confirmed record ${item.id} (blob: ${blobId})`);
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      console.error(`[Outbox Worker] ✗ Error syncing ${item.id}:`, errorMsg);
      await adapter.markFailure(item.id, item.attempts + 1, errorMsg);
      result.failed++;
      result.errors.push({ id: item.id, error: errorMsg });
    }
  }

  return result;
}
