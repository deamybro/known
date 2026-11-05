/**
 * Multi-Chain History Importer
 * Pulls transfer history across chains via Tatum and normalizes them.
 */

import { SupportedChain, TransferRecord } from "@known/core";
import { fetchTatumEvmHistory } from "./tatum-data.js";
import { fetchTatumSuiHistory } from "./tatum-sui.js";

export interface ImportOptions {
  chain: SupportedChain;
  address: string;
  userId: string;
  apiKey: string;
  dataApiUrl?: string;
  suiGatewayUrl?: string;
  pageSize?: number;
}

export async function importWalletHistory(options: ImportOptions): Promise<TransferRecord[]> {
  const { chain, address, userId, apiKey, dataApiUrl, suiGatewayUrl, pageSize } = options;

  let transfers: TransferRecord[] = [];

  if (chain === "sui") {
    transfers = await fetchTatumSuiHistory(address, apiKey, suiGatewayUrl, pageSize || 20);
  } else if (chain === "ethereum" || chain === "bsc") {
    transfers = await fetchTatumEvmHistory(chain, address, apiKey, dataApiUrl, pageSize || 20);
  } else {
    console.warn(`Chain ${chain} history import not supported yet; returning empty list.`);
    return [];
  }

  // Stamp userId on every record
  return transfers.map((tx) => ({
    ...tx,
    userId,
  }));
}
