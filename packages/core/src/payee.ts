/**
 * Payee Statistics & Suggestion Engine
 * Pure logic for aggregating outgoing transfers, computing typical amount percentiles,
 * and checking for unusual amount anomalies.
 */

import { normalizeAddress } from "./address.js";
import { findLookalikeOfPayees } from "./lookalike.js";
import { PayeeRecord, SuggestedPayee, SupportedChain, TransferRecord } from "./types.js";

/**
 * Computes the 10th and 90th percentile of an array of BigInt amounts.
 * If fewer than 3 sends, returns the exact minimum and maximum.
 */
export function computeTypicalRange(amountsRaw: bigint[]): { low: bigint; high: bigint } {
  if (amountsRaw.length === 0) {
    return { low: 0n, high: 0n };
  }

  const sorted = [...amountsRaw].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  if (sorted.length < 3) {
    return { low: sorted[0], high: sorted[sorted.length - 1] };
  }

  // 10th percentile index
  const p10Index = Math.floor((sorted.length - 1) * 0.1);
  // 90th percentile index
  const p90Index = Math.ceil((sorted.length - 1) * 0.9);

  return {
    low: sorted[p10Index],
    high: sorted[p90Index],
  };
}

/**
 * Checks if a proposed send amount is an anomaly compared to the typical range.
 * Rule: Outside [0.5 * low, 3 * high].
 * Uses pure BigInt integer math: (low / 2n) and (high * 3n).
 */
export function isAmountAnomaly(amountRaw: string, typicalLowRaw?: string, typicalHighRaw?: string): boolean {
  if (!amountRaw || !typicalLowRaw || !typicalHighRaw) {
    return false;
  }

  try {
    const amount = BigInt(amountRaw.trim());
    const low = BigInt(typicalLowRaw.trim());
    const high = BigInt(typicalHighRaw.trim());

    if (amount === 0n && low === 0n) return false;

    // Thresholds
    const minThreshold = low / 2n;
    const maxThreshold = high * 3n;

    return amount < minThreshold || amount > maxThreshold;
  } catch {
    return false;
  }
}

/**
 * Derives suggested payees from a user's transfer history.
 *
 * Rules:
 * - Only OUTGOING transfers (direction === "out").
 * - Inbound-only addresses are NEVER suggested.
 * - Excludes zero-value and dust outgoing transfers.
 * - Groups by (chain, counterpartyNormalized).
 * - Sorts by count descending, then by lastSentAt descending.
 * - Checks each suggestion against confirmed payees to flag any poisoned lookalikes.
 */
export function deriveSuggestedPayees(
  transfers: TransferRecord[],
  confirmedPayees: PayeeRecord[] = []
): SuggestedPayee[] {
  // Collect outgoing valid transfers grouped by (chain:counterpartyNormalized)
  const outgoingGroups = new Map<
    string,
    {
      chain: SupportedChain;
      counterpartyRaw: string;
      counterpartyNormalized: string;
      transfers: TransferRecord[];
      amountsRaw: bigint[];
      decimals: number;
      assetSymbol: string;
    }
  >();

  for (const tx of transfers) {
    if (tx.direction !== "out") continue;
    if (tx.isZeroValue || tx.isDust) continue;

    const norm = normalizeAddress(tx.chain, tx.counterparty);
    if (!norm.isValid) continue;

    const key = `${tx.chain}:${norm.normalized}`;
    let group = outgoingGroups.get(key);

    if (!group) {
      group = {
        chain: tx.chain,
        counterpartyRaw: tx.counterparty,
        counterpartyNormalized: norm.normalized,
        transfers: [],
        amountsRaw: [],
        decimals: tx.decimals || 6,
        assetSymbol: tx.assetSymbol || "NATIVE",
      };
      outgoingGroups.set(key, group);
    }

    group.transfers.push(tx);
    try {
      group.amountsRaw.push(BigInt(tx.amountRaw));
    } catch {
      // Ignore unparseable raw amounts
    }
  }

  const suggestions: SuggestedPayee[] = [];

  for (const group of outgoingGroups.values()) {
    // If already confirmed by the user, don't show as unconfirmed suggestion
    const isAlreadyConfirmed = confirmedPayees.some(
      (p) =>
        p.status === "confirmed" &&
        p.chain === group.chain &&
        p.normalized === group.counterpartyNormalized
    );
    if (isAlreadyConfirmed) continue;

    // Sort group transfers by timestamp
    group.transfers.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstSentAt = group.transfers[0].timestamp;
    const lastSentAt = group.transfers[group.transfers.length - 1].timestamp;
    const { low, high } = computeTypicalRange(group.amountsRaw);

    // Run lookalike check against confirmed payees
    const lookalikeMatch = findLookalikeOfPayees(
      group.chain,
      group.counterpartyRaw,
      confirmedPayees,
      false
    );

    suggestions.push({
      chain: group.chain,
      address: group.counterpartyRaw,
      normalized: group.counterpartyNormalized,
      sendCount: group.transfers.length,
      firstSentAt,
      lastSentAt,
      typicalLowRaw: low.toString(),
      typicalHighRaw: high.toString(),
      decimals: group.decimals,
      assetSymbol: group.assetSymbol,
      isLookalikeOfConfirmed: lookalikeMatch || undefined,
    });
  }

  // Sort by send count descending, then last sent recency
  return suggestions.sort((a, b) => {
    if (b.sendCount !== a.sendCount) {
      return b.sendCount - a.sendCount;
    }
    return new Date(b.lastSentAt).getTime() - new Date(a.lastSentAt).getTime();
  });
}
