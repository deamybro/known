import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryClient, processOutbox, OutboxStorageAdapter, OutboxRow, recallPayeeContext } from "../src/index.js";

describe("@known/memory", () => {
  let mockClient: ReturnType<typeof createMemoryClient>;

  beforeEach(() => {
    mockClient = createMemoryClient({ forceMock: true });
  });

  it("initializes mock memory client and health returns ok", async () => {
    expect(mockClient.isMock).toBe(true);
    const health = await mockClient.health();
    expect(health.featureFlags?.offlineMock).toBe(true);
  });

  it("remembers and recalls a payee payload", async () => {
    const namespace = "known:user_123:payees";
    const payload = {
      v: 1,
      kind: "payee_confirmed",
      userId: "user_123",
      chain: "ethereum",
      address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      label: "Ada Sister",
      sendCount: 14,
      typicalLowRaw: "50000000",
      typicalHighRaw: "200000000",
      decimals: 6,
      assetSymbol: "USDC",
      occurredAt: new Date().toISOString(),
      summary: "Ada Sister on Ethereum: confirmed payee.",
    };

    const writeResult = await mockClient.rememberAndWait(JSON.stringify(payload), namespace);
    expect(writeResult).toBeDefined();

    const recalled = await recallPayeeContext({
      client: mockClient,
      userId: "user_123",
      query: "Ada Sister",
    });

    expect(recalled).not.toBeNull();
    expect(recalled?.items.length).toBeGreaterThan(0);
    expect(recalled?.summary).toContain("Ada Sister on Ethereum");
  });

  it("processes outbox items and marks them confirmed", async () => {
    const memoryRecords: OutboxRow[] = [
      {
        id: "out_1",
        userId: "user_abc",
        namespace: "known:user_abc:payees",
        content: JSON.stringify({ label: "Alice", chain: "ethereum", address: "0x123" }),
        status: "pending",
        attempts: 0,
      },
      {
        id: "out_2",
        userId: "user_abc",
        namespace: "known:user_abc:payees",
        content: JSON.stringify({ label: "Bob", chain: "sui", address: "0x456" }),
        status: "pending",
        attempts: 0,
      },
    ];

    const confirmed: Record<string, { jobId?: string; blobId?: string }> = {};

    const adapter: OutboxStorageAdapter = {
      async getPending() {
        return memoryRecords.filter((r) => r.status === "pending");
      },
      async markSuccess(id, result) {
        const item = memoryRecords.find((r) => r.id === id);
        if (item) {
          item.status = "confirmed";
          item.blobId = result.blobId;
          item.jobId = result.jobId;
        }
        confirmed[id] = result;
      },
      async markFailure(id, attempts, error) {
        const item = memoryRecords.find((r) => r.id === id);
        if (item) {
          item.attempts = attempts;
          item.lastError = error;
        }
      },
    };

    const syncResult = await processOutbox(adapter, mockClient);

    expect(syncResult.processed).toBe(2);
    expect(syncResult.succeeded).toBe(2);
    expect(syncResult.failed).toBe(0);
    expect(confirmed["out_1"]?.blobId).toBeDefined();
    expect(confirmed["out_2"]?.blobId).toBeDefined();
    expect(memoryRecords[0].status).toBe("confirmed");
    expect(memoryRecords[1].status).toBe("confirmed");
  });

  it("stops retrying after 5 attempts", async () => {
    const memoryRecords: OutboxRow[] = [
      {
        id: "out_fail",
        userId: "user_abc",
        namespace: "known:user_abc:payees",
        content: "invalid",
        status: "pending",
        attempts: 5,
      },
    ];

    const adapter: OutboxStorageAdapter = {
      async getPending() {
        return memoryRecords;
      },
      async markSuccess() {},
      async markFailure(id, attempts, error) {
        const item = memoryRecords.find((r) => r.id === id);
        if (item) {
          item.status = "failed";
          item.lastError = error;
        }
      },
    };

    const syncResult = await processOutbox(adapter, mockClient);
    expect(syncResult.processed).toBe(1);
    expect(syncResult.succeeded).toBe(0);
    expect(syncResult.failed).toBe(1);
    expect(memoryRecords[0].status).toBe("failed");
  });
});
