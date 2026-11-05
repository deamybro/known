/**
 * Verdict Engine
 * Deterministic security decision engine.
 *
 * Rules:
 * 1. Invalid address format -> amber ("invalid_address")
 * 2. Blocklisted (exact normalized match) -> red ("blocklisted")
 * 3. Exact confirmed payee -> green ("confirmed_payee")
 *    - If amountRaw outside [0.5 * low, 3 * high] -> stay green + reason "unusual_amount"
 * 4. Lookalike of a confirmed payee -> red ("imitates_payee" or "imitates_payee_with_dust")
 * 5. Seen only as a dust/zero-value sender -> red ("dust_sender")
 * 6. Otherwise -> amber ("never_paid" or "paid_but_unconfirmed")
 */

import { normalizeAddress } from "./address.js";
import { findLookalikeOfPayees } from "./lookalike.js";
import { isAmountAnomaly } from "./payee.js";
import {
  BlocklistRecord,
  CheckAddressRequest,
  CheckVerdictResult,
  PayeeRecord,
  TransferRecord,
  VerdictReason,
} from "./types.js";

export function evaluateVerdict(
  request: CheckAddressRequest,
  confirmedPayees: PayeeRecord[],
  blocklist: BlocklistRecord[] = [],
  transfers: TransferRecord[] = []
): CheckVerdictResult {
  const { chain, address, amountRaw } = request;
  const now = new Date().toISOString();

  // Rule 1: Check address format
  const norm = normalizeAddress(chain, address);
  if (!norm.isValid) {
    return {
      verdict: "amber",
      reasons: ["invalid_address"],
      normalizedAddress: "",
      displayAddress: address,
      chain,
      explanation: `Invalid ${chain.toUpperCase()} address format: ${norm.error || "Malformed address"}`,
      checkedAt: now,
    };
  }

  // Rule 2: Check blocklist (exact normalized match on same chain)
  const blocklistEntry = blocklist.find(
    (b) => b.chain === chain && b.normalized === norm.normalized
  );
  if (blocklistEntry) {
    return {
      verdict: "red",
      reasons: ["blocklisted"],
      normalizedAddress: norm.normalized,
      displayAddress: norm.display,
      chain,
      explanation: `This address is on your blocklist${
        blocklistEntry.imitatesLabel ? ` (imitates ${blocklistEntry.imitatesLabel})` : ""
      }: ${blocklistEntry.reason || "Blocked suspicious address"}.`,
      checkedAt: now,
    };
  }

  // Rule 3: Check exact confirmed payee
  const matchedPayee = confirmedPayees.find(
    (p) => p.status === "confirmed" && p.chain === chain && p.normalized === norm.normalized
  );

  if (matchedPayee) {
    const reasons: VerdictReason[] = ["confirmed_payee"];
    let isAnomaly = false;

    if (amountRaw && matchedPayee.typicalLowRaw && matchedPayee.typicalHighRaw) {
      isAnomaly = isAmountAnomaly(
        amountRaw,
        matchedPayee.typicalLowRaw,
        matchedPayee.typicalHighRaw
      );
      if (isAnomaly) {
        reasons.push("unusual_amount");
      }
    }

    const explanation = isAnomaly
      ? `This is ${matchedPayee.label}. You have paid them ${matchedPayee.sendCount} times, but this amount is outside your typical pattern.`
      : `This is ${matchedPayee.label}. You have paid them ${matchedPayee.sendCount} times.`;

    return {
      verdict: "green",
      reasons,
      normalizedAddress: norm.normalized,
      displayAddress: norm.display,
      chain,
      matchedPayee: {
        id: matchedPayee.id,
        label: matchedPayee.label,
        sendCount: matchedPayee.sendCount,
        typicalLowRaw: matchedPayee.typicalLowRaw,
        typicalHighRaw: matchedPayee.typicalHighRaw,
        decimals: matchedPayee.decimals,
        assetSymbol: matchedPayee.assetSymbol,
      },
      explanation,
      checkedAt: now,
    };
  }

  // Rule 4: Lookalike check against confirmed payees
  // First check if the candidate address ever sent dust/zero-value to the user
  const hasInboundDust = transfers.some(
    (t) =>
      t.chain === chain &&
      t.direction === "in" &&
      t.counterpartyNormalized === norm.normalized &&
      (t.isZeroValue || t.isDust)
  );

  const lookalike = findLookalikeOfPayees(
    chain,
    address,
    confirmedPayees,
    hasInboundDust
  );

  if (lookalike) {
    const reason: VerdictReason = lookalike.hasDustHistory
      ? "imitates_payee_with_dust"
      : "imitates_payee";

    const explanation = lookalike.hasDustHistory
      ? `WARNING: This address imitates ${lookalike.imitatesLabel}! It matches the first ${lookalike.commonPrefixLen} and last ${lookalike.commonSuffixLen} characters, and sent you a dust transaction in your history.`
      : `WARNING: This address imitates ${lookalike.imitatesLabel}! Matches first ${lookalike.commonPrefixLen} and last ${lookalike.commonSuffixLen} characters, but the middle characters differ.`;

    return {
      verdict: "red",
      reasons: [reason],
      normalizedAddress: norm.normalized,
      displayAddress: norm.display,
      chain,
      imitates: {
        payeeId: lookalike.imitatesPayeeId,
        label: lookalike.imitatesLabel,
        address: lookalike.imitatesAddress,
        prefixLen: lookalike.commonPrefixLen,
        suffixLen: lookalike.commonSuffixLen,
        hasDustHistory: lookalike.hasDustHistory,
        differingRanges: lookalike.differingRanges,
      },
      explanation,
      checkedAt: now,
    };
  }

  // Rule 5: Seen ONLY as an inbound dust or zero-value sender
  const inboundTransfers = transfers.filter(
    (t) => t.chain === chain && t.direction === "in" && t.counterpartyNormalized === norm.normalized
  );
  const outboundTransfers = transfers.filter(
    (t) => t.chain === chain && t.direction === "out" && t.counterpartyNormalized === norm.normalized
  );

  if (inboundTransfers.length > 0 && outboundTransfers.length === 0) {
    const allInboundAreDustOrZero = inboundTransfers.every((t) => t.isZeroValue || t.isDust);
    if (allInboundAreDustOrZero) {
      return {
        verdict: "red",
        reasons: ["dust_sender"],
        normalizedAddress: norm.normalized,
        displayAddress: norm.display,
        chain,
        explanation: `Suspicious address: This address only ever sent you dust or zero-value transactions, a common sign of address poisoning.`,
        checkedAt: now,
      };
    }
  }

  // Rule 6: Amber (never paid, or sent to before but never confirmed)
  if (outboundTransfers.length > 0) {
    return {
      verdict: "amber",
      reasons: ["paid_but_unconfirmed"],
      normalizedAddress: norm.normalized,
      displayAddress: norm.display,
      chain,
      explanation: `You have sent ${outboundTransfers.length} transactions to this address before, but have not confirmed it as a payee. Double-check before sending.`,
      checkedAt: now,
    };
  }

  return {
    verdict: "amber",
    reasons: ["never_paid"],
    normalizedAddress: norm.normalized,
    displayAddress: norm.display,
    chain,
    explanation: `You have never paid this address before. Always double-check it with the recipient directly.`,
    checkedAt: now,
  };
}
