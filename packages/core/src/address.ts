/**
 * Address Normalization & Validation
 * Deterministic address parser per chain.
 *
 * Rules:
 * - EVM (Ethereum, BSC): 0x + 40 hex digits. Normalization = lowercase.
 * - Sui: 0x + up to 64 hex digits. Normalization = lowercase 0x + 64 hex (left-padded).
 * - Tron: Base58Check starting with 'T', exactly 34 chars. Normalization = case-sensitive exact.
 * - Solana: Base58 string, 32-44 chars. Normalization = case-sensitive exact.
 */

import { NormalizedAddress, SupportedChain } from "./types.js";

const HEX_REGEX = /^[0-9a-fA-F]+$/;
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function normalizeAddress(chain: SupportedChain, rawAddress: string): NormalizedAddress {
  if (!rawAddress || typeof rawAddress !== "string") {
    return {
      chain,
      raw: rawAddress || "",
      normalized: "",
      display: "",
      body: "",
      isValid: false,
      error: "Address is empty or not a string",
    };
  }

  const trimmed = rawAddress.trim();

  switch (chain) {
    case "ethereum":
    case "bsc": {
      if (!trimmed.startsWith("0x") && !trimmed.startsWith("0X")) {
        return {
          chain,
          raw: trimmed,
          normalized: "",
          display: trimmed,
          body: "",
          isValid: false,
          error: "EVM address must start with '0x'",
        };
      }
      const hexBody = trimmed.slice(2);
      if (hexBody.length !== 40 || !HEX_REGEX.test(hexBody)) {
        return {
          chain,
          raw: trimmed,
          normalized: "",
          display: trimmed,
          body: "",
          isValid: false,
          error: `EVM address must be 40 hex characters after '0x' (got ${hexBody.length})`,
        };
      }
      const normalizedBody = hexBody.toLowerCase();
      const normalized = "0x" + normalizedBody;
      return {
        chain,
        raw: trimmed,
        normalized,
        display: normalized,
        body: normalizedBody,
        isValid: true,
      };
    }

    case "sui": {
      if (!trimmed.startsWith("0x") && !trimmed.startsWith("0X")) {
        return {
          chain,
          raw: trimmed,
          normalized: "",
          display: trimmed,
          body: "",
          isValid: false,
          error: "Sui address must start with '0x'",
        };
      }
      const hexBody = trimmed.slice(2);
      if (hexBody.length === 0 || hexBody.length > 64 || !HEX_REGEX.test(hexBody)) {
        return {
          chain,
          raw: trimmed,
          normalized: "",
          display: trimmed,
          body: "",
          isValid: false,
          error: `Sui address hex length must be between 1 and 64 characters (got ${hexBody.length})`,
        };
      }
      // Standard Sui address normalization: lowercase, left-pad with 0 to 64 chars
      const normalizedBody = hexBody.toLowerCase().padStart(64, "0");
      const normalized = "0x" + normalizedBody;
      return {
        chain,
        raw: trimmed,
        normalized,
        display: normalized,
        body: normalizedBody,
        isValid: true,
      };
    }

    case "tron": {
      // Tron addresses are Base58Check, start with 'T', and are 34 characters long
      if (!trimmed.startsWith("T")) {
        return {
          chain,
          raw: trimmed,
          normalized: "",
          display: trimmed,
          body: "",
          isValid: false,
          error: "Tron address must start with 'T'",
        };
      }
      if (trimmed.length !== 34 || !BASE58_REGEX.test(trimmed)) {
        return {
          chain,
          raw: trimmed,
          normalized: "",
          display: trimmed,
          body: "",
          isValid: false,
          error: `Tron address must be 34 Base58 characters (got ${trimmed.length})`,
        };
      }
      // Tron is strictly case-sensitive!
      return {
        chain,
        raw: trimmed,
        normalized: trimmed,
        display: trimmed,
        body: trimmed,
        isValid: true,
      };
    }

    case "solana": {
      // Solana addresses are Base58 strings, typically 32-44 characters
      if (trimmed.length < 32 || trimmed.length > 44 || !BASE58_REGEX.test(trimmed)) {
        return {
          chain,
          raw: trimmed,
          normalized: "",
          display: trimmed,
          body: "",
          isValid: false,
          error: `Solana address must be 32-44 Base58 characters (got ${trimmed.length})`,
        };
      }
      // Solana is strictly case-sensitive!
      return {
        chain,
        raw: trimmed,
        normalized: trimmed,
        display: trimmed,
        body: trimmed,
        isValid: true,
      };
    }

    default: {
      return {
        chain,
        raw: trimmed,
        normalized: trimmed.toLowerCase(),
        display: trimmed,
        body: trimmed.toLowerCase(),
        isValid: true,
      };
    }
  }
}

/**
 * Compare two addresses on the same chain for exact equality.
 * Never compare addresses across different chains.
 */
export function areAddressesEqual(
  chainA: SupportedChain,
  addrA: string,
  chainB: SupportedChain,
  addrB: string
): boolean {
  if (chainA !== chainB) return false;
  const normA = normalizeAddress(chainA, addrA);
  const normB = normalizeAddress(chainB, addrB);
  if (!normA.isValid || !normB.isValid) return false;
  return normA.normalized === normB.normalized;
}
