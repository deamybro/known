/**
 * Lookalike Detection Engine
 * Deterministically checks whether an address imitates a confirmed payee.
 *
 * Rules:
 * 1. Compare body of the address (strip '0x' for hex chains; full string for Base58 chains).
 * 2. Lookalike if: NOT exact match AND commonPrefix >= 3 AND commonSuffix >= 3.
 * 3. Also flag if: (prefix >= 4 OR suffix >= 4) AND address has inbound dust/zero-value transfer.
 * 4. Highlights differing characters/ranges so UI can show the visual scam.
 */

import { normalizeAddress } from "./address.js";
import { LookalikeMatch, PayeeRecord, SupportedChain } from "./types.js";

export function getCommonPrefixLength(a: string, b: string): number {
  const minLen = Math.min(a.length, b.length);
  let len = 0;
  while (len < minLen && a[len] === b[len]) {
    len++;
  }
  return len;
}

export function getCommonSuffixLength(a: string, b: string): number {
  const minLen = Math.min(a.length, b.length);
  let len = 0;
  while (len < minLen && a[a.length - 1 - len] === b[b.length - 1 - len]) {
    len++;
  }
  return len;
}

/**
 * Calculates differing ranges between candidate address body and target payee address body.
 */
export function getDifferingRanges(
  candidateBody: string,
  payeeBody: string
): { differingRanges: Array<{ start: number; end: number }>; differingCount: number } {
  const prefix = getCommonPrefixLength(candidateBody, payeeBody);
  const suffix = getCommonSuffixLength(candidateBody, payeeBody);

  const startDiff = prefix;
  const endDiff = Math.max(prefix, candidateBody.length - suffix);

  const ranges = startDiff < endDiff ? [{ start: startDiff, end: endDiff }] : [];
  const differingCount = Math.max(0, endDiff - startDiff);

  return { differingRanges: ranges, differingCount };
}

/**
 * Checks a candidate address against a single confirmed payee for lookalike imitation.
 */
export function checkLookalikeAgainstPayee(
  chain: SupportedChain,
  candidateAddress: string,
  payee: PayeeRecord,
  hasInboundDustFromCandidate: boolean = false
): LookalikeMatch | null {
  if (payee.chain !== chain) return null;

  const candidateNorm = normalizeAddress(chain, candidateAddress);
  const payeeNorm = normalizeAddress(chain, payee.address);

  if (!candidateNorm.isValid || !payeeNorm.isValid) return null;

  // Exact match is NOT a lookalike (it's the actual payee)
  if (candidateNorm.normalized === payeeNorm.normalized) {
    return null;
  }

  // Compare on bodies:
  // For hex chains (ethereum, sui, bsc), bodies are already lowercase hex without 0x.
  // For Base58 chains (tron, solana), bodies are case-sensitive.
  const candBody = candidateNorm.body;
  const targetBody = payeeNorm.body;

  const prefixLen = getCommonPrefixLength(candBody, targetBody);
  const suffixLen = getCommonSuffixLength(candBody, targetBody);

  const { differingRanges, differingCount } = getDifferingRanges(candBody, targetBody);

  // Rule 1: commonPrefix >= 3 AND commonSuffix >= 3
  const is3Plus3 = prefixLen >= 3 && suffixLen >= 3;

  // Rule 2: (prefix >= 4 OR suffix >= 4) combined with inbound dust/zero-value history
  const isPrefixOrSuffix4WithDust = (prefixLen >= 4 || suffixLen >= 4) && hasInboundDustFromCandidate;

  if (is3Plus3 || isPrefixOrSuffix4WithDust) {
    return {
      imitatesPayeeId: payee.id,
      imitatesLabel: payee.label,
      imitatesAddress: payee.address,
      commonPrefixLen: prefixLen,
      commonSuffixLen: suffixLen,
      differingCharsCount: differingCount,
      differingRanges,
      hasDustHistory: hasInboundDustFromCandidate,
    };
  }

  return null;
}

/**
 * Checks a candidate address against all confirmed payees of the user.
 * Returns the best/highest-scoring lookalike match if any.
 */
export function findLookalikeOfPayees(
  chain: SupportedChain,
  candidateAddress: string,
  payees: PayeeRecord[],
  hasInboundDustFromCandidate: boolean = false
): LookalikeMatch | null {
  let bestMatch: LookalikeMatch | null = null;
  let maxScore = 0;

  for (const payee of payees) {
    if (payee.status === "removed") continue;

    const match = checkLookalikeAgainstPayee(
      chain,
      candidateAddress,
      payee,
      hasInboundDustFromCandidate
    );

    if (match) {
      // Score by prefix + suffix match depth
      const score = match.commonPrefixLen + match.commonSuffixLen;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = match;
      }
    }
  }

  return bestMatch;
}
