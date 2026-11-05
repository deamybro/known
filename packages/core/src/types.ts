/**
 * @known/core types
 * Pure TypeScript types for address validation, lookalike analysis, payee stats, and verdicts.
 */

export type SupportedChain = "ethereum" | "sui" | "tron" | "bsc" | "solana";

export type Verdict = "green" | "red" | "amber";

export type VerdictReason =
  | "invalid_address"
  | "blocklisted"
  | "confirmed_payee"
  | "unusual_amount"
  | "imitates_payee"
  | "imitates_payee_with_dust"
  | "dust_sender"
  | "paid_but_unconfirmed"
  | "never_paid";

export interface NormalizedAddress {
  chain: SupportedChain;
  raw: string;
  normalized: string;
  display: string;
  body: string; // Hex body without 0x or full base58
  isValid: boolean;
  error?: string;
}

export interface LookalikeMatch {
  imitatesPayeeId: string;
  imitatesLabel: string;
  imitatesAddress: string;
  commonPrefixLen: number;
  commonSuffixLen: number;
  differingCharsCount: number;
  differingRanges: Array<{ start: number; end: number }>;
  hasDustHistory: boolean;
}

export interface PayeeRecord {
  id: string;
  userId: string;
  chain: SupportedChain;
  address: string;
  normalized: string;
  label: string;
  confirmedAt: string;
  status: "confirmed" | "removed";
  sendCount: number;
  firstSentAt?: string;
  lastSentAt?: string;
  typicalLowRaw?: string; // Smallest unit as integer string
  typicalHighRaw?: string;
  decimals: number;
  assetSymbol: string;
}

export interface BlocklistRecord {
  id: string;
  userId: string;
  chain: SupportedChain;
  address: string;
  normalized: string;
  imitatesPayeeId?: string;
  imitatesLabel?: string;
  reason: string;
  firstSeenAt: string;
}

export interface TransferRecord {
  id: string;
  userId: string;
  chain: SupportedChain;
  txHash: string;
  direction: "in" | "out";
  counterparty: string;
  counterpartyNormalized: string;
  asset: string; // "native" or contract/coin type address
  assetSymbol: string;
  amountRaw: string; // Integer string in token's smallest unit
  decimals: number;
  timestamp: string; // ISO 8601
  isZeroValue: boolean;
  isDust: boolean;
  source: string;
}

export interface CheckAddressRequest {
  chain: SupportedChain;
  address: string;
  amountRaw?: string;
  asset?: string; // contract or coin type
}

export interface CheckVerdictResult {
  verdict: Verdict;
  reasons: VerdictReason[];
  normalizedAddress: string;
  displayAddress: string;
  chain: SupportedChain;
  matchedPayee?: {
    id: string;
    label: string;
    sendCount: number;
    typicalLowRaw?: string;
    typicalHighRaw?: string;
    decimals: number;
    assetSymbol: string;
  };
  imitates?: {
    payeeId: string;
    label: string;
    address: string;
    prefixLen: number;
    suffixLen: number;
    hasDustHistory: boolean;
    differingRanges: Array<{ start: number; end: number }>;
  };
  explanation: string;
  checkedAt: string;
}

export interface SuggestedPayee {
  chain: SupportedChain;
  address: string;
  normalized: string;
  sendCount: number;
  firstSentAt: string;
  lastSentAt: string;
  typicalLowRaw: string;
  typicalHighRaw: string;
  decimals: number;
  assetSymbol: string;
  isLookalikeOfConfirmed?: LookalikeMatch;
}
