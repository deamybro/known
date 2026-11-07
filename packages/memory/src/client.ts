/**
 * Walrus Memory Client
 * Wraps @mysten-incubation/memwal with support for live mainnet and deterministic in-memory mock fallback.
 */

import { MemWal, MemWalMock } from "@mysten-incubation/memwal";

export interface MemoryClientConfig {
  serverUrl?: string;
  key?: string;
  accountId?: string;
  forceMock?: boolean;
}

export interface IMemoryClient {
  rememberAndWait(
    text: string,
    namespace?: string,
    options?: { idempotencyKey?: string; dedupe?: boolean }
  ): Promise<any>;
  recall(
    query: string,
    options?: { limit?: number; namespace?: string; maxTokens?: number }
  ): Promise<any>;
  listMemories(options?: { namespace?: string; cursor?: string; limit?: number }): Promise<any>;
  health(): Promise<any>;
  isMock: boolean;
}

let activeClient: IMemoryClient | null = null;

function wrapMockWithList(mock: any): IMemoryClient {
  mock.isMock = true;
  if (!mock.listMemories) {
    mock.listMemories = async (options?: { namespace?: string }) => {
      const items = (mock.memories || []).filter(
        (m: any) => !options?.namespace || m.namespace === options.namespace || m.namespace_id === options.namespace
      );
      return {
        memories: items.map((m: any) => ({
          text: m.text,
          blob_id: m.blobId || m.blob_id || "blob_mock",
          namespace_id: m.namespace || m.namespace_id,
          timestamp: m.timestamp || Date.now(),
        })),
        deleted: [],
        must_resync: false,
      };
    };
  }
  return mock;
}

export function createMemoryClient(config?: MemoryClientConfig): IMemoryClient {
  const serverUrl = config?.serverUrl || process.env.MEMWAL_RELAYER_URL || "https://relayer.memory.walrus.xyz";
  const key = config?.key || process.env.MEMWAL_PRIVATE_KEY;
  const accountId = config?.accountId || process.env.MEMWAL_ACCOUNT_ID;
  const forceMock = config?.forceMock || process.env.MEMWAL_MOCK === "true";

  if (forceMock || !key || !accountId) {
    console.log("[Walrus Memory] Initializing with MemWalMock (in-memory mock mode).");
    const mock = MemWalMock.create() as any;
    return wrapMockWithList(mock);
  }

  try {
    const memwal = MemWal.create({
      serverUrl,
      key,
      accountId,
    }) as any;
    memwal.isMock = false;
    return memwal;
  } catch (err: any) {
    console.warn(`[Walrus Memory] Failed to initialize live MemWal client (${err.message}). Falling back to MemWalMock.`);
    const mock = MemWalMock.create() as any;
    return wrapMockWithList(mock);
  }
}

export function getMemoryClient(): IMemoryClient {
  if (!activeClient) {
    activeClient = createMemoryClient();
  }
  return activeClient;
}

export function resetMemoryClientForTest(client?: IMemoryClient) {
  activeClient = client || null;
}
