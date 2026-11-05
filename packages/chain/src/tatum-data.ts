/**
 * Tatum v4 Data API Integration
 * Fetches transaction history for supported EVM chains (Ethereum, BSC, Base, Polygon).
 */

import { isDustTransfer, isZeroValueTransfer, normalizeAddress, SupportedChain, TransferRecord } from "@known/core";
import { defaultPacer } from "./pacer.js";

// Mapping from our SupportedChain to Tatum chain identifier
export const TATUM_CHAIN_MAP: Record<string, string> = {
  ethereum: "ethereum-mainnet",
  bsc: "bsc-mainnet",
  polygon: "polygon-mainnet",
  base: "base-mainnet",
  arbitrum: "arb-one-mainnet",
  optimism: "optimism-mainnet",
};

export interface TatumTxItem {
  chain: string;
  hash: string;
  address: string;
  blockNumber?: number;
  transactionType: "native" | "fungible" | "nft" | "multitoken";
  transactionSubtype: "incoming" | "outgoing" | "zero-transfer";
  amount?: string;
  timestamp: number; // millisecond timestamp
  tokenAddress?: string;
  counterAddress?: string;
}

export interface TatumHistoryResponse {
  result: TatumTxItem[];
  prevPage?: string;
  nextPage?: string;
}

export async function fetchTatumEvmHistory(
  chain: SupportedChain,
  walletAddress: string,
  apiKey: string,
  baseUrl = "https://api.tatum.io",
  pageSize = 20
): Promise<TransferRecord[]> {
  const tatumChain = TATUM_CHAIN_MAP[chain];
  if (!tatumChain) {
    throw new Error(`Chain ${chain} is not supported by Tatum Data API.`);
  }

  const normWatched = normalizeAddress(chain, walletAddress);
  if (!normWatched.isValid) {
    throw new Error(`Invalid address for ${chain}: ${walletAddress}`);
  }

  const url = `${baseUrl}/v4/data/transaction/history?chain=${tatumChain}&addresses=${normWatched.normalized}&pageSize=${pageSize}&sort=DESC`;

  const response = await defaultPacer.fetchWithRetry(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tatum Data API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as TatumHistoryResponse;
  const items = data.result || [];

  const transfers: TransferRecord[] = [];

  for (const item of items) {
    if (!item.counterAddress) continue; // Skip if no counterparty

    const normCounter = normalizeAddress(chain, item.counterAddress);
    if (!normCounter.isValid) continue;

    const direction: "in" | "out" =
      item.transactionSubtype === "incoming" || item.transactionSubtype === "zero-transfer"
        ? "in"
        : "out";

    const isNative = item.transactionType === "native" || !item.tokenAddress;
    const asset = isNative ? "native" : item.tokenAddress!.toLowerCase();
    const assetSymbol = isNative ? (chain === "ethereum" ? "ETH" : "BNB") : "TOKEN";

    const decimals = isNative ? 18 : 6; // Standard EVM default
    const amountRaw = item.amount ? parseAmountToRaw(item.amount, decimals) : "0";

    const isZero = item.transactionSubtype === "zero-transfer" || isZeroValueTransfer(amountRaw);
    const isDust = isDustTransfer(chain, amountRaw, asset, decimals);

    const timestampIso = new Date(item.timestamp).toISOString();

    transfers.push({
      id: `${chain}:${item.hash}:${normCounter.normalized}:${asset}:${direction}`,
      userId: "", // Set by importer
      chain,
      txHash: item.hash,
      direction,
      counterparty: item.counterAddress,
      counterpartyNormalized: normCounter.normalized,
      asset,
      assetSymbol,
      amountRaw,
      decimals,
      timestamp: timestampIso,
      isZeroValue: isZero,
      isDust,
      source: "tatum",
    });
  }

  return transfers;
}

/**
 * Converts decimal amount string (e.g. "1.5") to raw units without floating point loss.
 */
function parseAmountToRaw(amountStr: string, decimals: number): string {
  try {
    const parts = amountStr.trim().split(".");
    const whole = parts[0] || "0";
    let fraction = parts[1] || "";

    if (fraction.length > decimals) {
      fraction = fraction.slice(0, decimals);
    } else {
      fraction = fraction.padEnd(decimals, "0");
    }

    const rawStr = whole + fraction;
    return BigInt(rawStr).toString();
  } catch {
    return "0";
  }
}
