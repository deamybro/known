/**
 * Walrus Memory Schemas & Types
 */

import { SupportedChain } from "@known/core";

export interface PayeeConfirmedPayload {
  v: 1;
  kind: "payee_confirmed";
  userId: string;
  chain: SupportedChain;
  address: string;
  label: string;
  sendCount: number;
  typicalLowRaw: string;
  typicalHighRaw: string;
  decimals: number;
  assetSymbol: string;
  occurredAt: string;
  summary?: string;
}

export interface LookalikeCaughtPayload {
  v: 1;
  kind: "lookalike_caught";
  userId: string;
  chain: SupportedChain;
  address: string;
  imitatesPayeeAddress: string;
  imitatesLabel: string;
  dustTxHash?: string;
  occurredAt: string;
  summary?: string;
}

export type MemoryPayload = PayeeConfirmedPayload | LookalikeCaughtPayload;

export interface WalrusMemoryResult {
  jobId?: string;
  blobId?: string;
  status: "pending" | "submitted" | "confirmed" | "failed";
  error?: string;
}

export interface RecallItem {
  text: string;
  distance?: number;
  blobId?: string;
  timestamp?: number;
  payload?: MemoryPayload;
}
