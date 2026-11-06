/**
 * Walrus Memory Semantic Recall
 * Retrieves contextual memory for addresses or queries from Walrus Memory.
 */

import { IMemoryClient, getMemoryClient } from "./client.js";
import { RecallItem, MemoryPayload } from "./types.js";

export interface RecallContextOptions {
  client?: IMemoryClient;
  userId: string;
  query: string;
  limit?: number;
}

export interface RecallResult {
  summary: string;
  items: RecallItem[];
}

export async function recallPayeeContext(options: RecallContextOptions): Promise<RecallResult | null> {
  const { userId, query, limit = 5 } = options;
  const client = options.client || getMemoryClient();

  const namespace = `known:${userId}:payees`;

  try {
    const response = await client.recall(query, {
      namespace,
      limit,
    });

    const results = response?.results || [];
    if (results.length === 0) {
      return null;
    }

    const items: RecallItem[] = results.map((r: any) => {
      let payload: MemoryPayload | undefined;
      try {
        payload = JSON.parse(r.text);
      } catch {
        // Text is not JSON, keep as raw text
      }

      return {
        text: r.text,
        distance: r.distance,
        blobId: r.blob_id,
        timestamp: r.timestamp,
        payload,
      };
    });

    // Extract human-friendly summaries if available
    const summaries = items
      .map((item) => {
        if (item.payload?.summary) return item.payload.summary;
        if (item.payload && "label" in item.payload) {
          return `${item.payload.label} on ${item.payload.chain.toUpperCase()}: confirmed payee (${item.payload.sendCount} sends).`;
        }
        return item.text.slice(0, 80);
      })
      .filter(Boolean);

    return {
      summary: summaries.join(" | ") || `${items.length} relevant memories found.`,
      items,
    };
  } catch (error: any) {
    console.warn(`[Walrus Recall] Failed to recall context for "${query}":`, error.message);
    return null;
  }
}
