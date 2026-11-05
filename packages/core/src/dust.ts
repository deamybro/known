/**
 * Dust & Zero-Value Detection Engine
 * Uses pure BigInt arithmetic — no floating point math.
 */

import { SupportedChain } from "./types.js";

// Native dust thresholds expressed in token's smallest unit (wei, mist, sun, lamports)
export const NATIVE_DUST_THRESHOLDS: Record<SupportedChain, { thresholdRaw: bigint; decimals: number }> = {
  // ETH < 0.0001 ETH (10^14 wei)
  ethereum: { thresholdRaw: 100_000_000_000_000n, decimals: 18 },
  // SUI < 0.001 SUI (10^6 mist)
  sui: { thresholdRaw: 1_000_000n, decimals: 9 },
  // TRX < 1 TRX (10^6 sun)
  tron: { thresholdRaw: 1_000_000n, decimals: 6 },
  // BNB < 0.0005 BNB (5 * 10^14 wei)
  bsc: { thresholdRaw: 500_000_000_000_000n, decimals: 18 },
  // SOL < 0.0001 SOL (10^5 lamports)
  solana: { thresholdRaw: 100_000n, decimals: 9 },
};

/**
 * Checks if a transfer raw amount is zero.
 */
export function isZeroValueTransfer(amountRaw: string): boolean {
  if (!amountRaw) return true;
  try {
    const val = BigInt(amountRaw.trim());
    return val === 0n;
  } catch {
    return false;
  }
}

/**
 * Checks if a transfer is a dust transfer.
 * For native currencies, uses per-chain thresholds.
 * For tokens, if decimals provided, defines dust as < 0.01 units.
 */
export function isDustTransfer(
  chain: SupportedChain,
  amountRaw: string,
  asset: string, // "native" or contract address
  decimals?: number
): boolean {
  if (!amountRaw) return false;
  let val: bigint;
  try {
    val = BigInt(amountRaw.trim());
  } catch {
    return false;
  }

  // 0 value is handled by isZeroValueTransfer, but is also considered dust-level
  if (val === 0n) return true;

  if (asset.toLowerCase() === "native") {
    const config = NATIVE_DUST_THRESHOLDS[chain];
    if (config) {
      return val < config.thresholdRaw;
    }
  }

  // If token with known decimals (default to 6 if not provided)
  const tokenDecimals = decimals ?? 6;
  // 0.01 token units = 10^(decimals - 2)
  if (tokenDecimals >= 2) {
    const dustTokenThreshold = 10n ** BigInt(tokenDecimals - 2);
    return val < dustTokenThreshold;
  }

  return false;
}
