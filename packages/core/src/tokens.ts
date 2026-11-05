/**
 * Official Token Registries & Verified Contract Allowlist
 * Used to detect fake tokens imitating USDT/USDC.
 */

import { SupportedChain } from "./types.js";

export interface OfficialToken {
  chain: SupportedChain;
  symbol: string;
  name: string;
  addressOrType: string;
  decimals: number;
}

export const OFFICIAL_TOKENS: OfficialToken[] = [
  // Ethereum
  {
    chain: "ethereum",
    symbol: "USDT",
    name: "Tether USD",
    addressOrType: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    decimals: 6,
  },
  {
    chain: "ethereum",
    symbol: "USDC",
    name: "USD Coin",
    addressOrType: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    decimals: 6,
  },
  // Tron
  {
    chain: "tron",
    symbol: "USDT",
    name: "Tether USD (TRC20)",
    addressOrType: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    decimals: 6,
  },
  {
    chain: "tron",
    symbol: "USDC",
    name: "USD Coin (TRC20)",
    addressOrType: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
    decimals: 6,
  },
  // Sui
  {
    chain: "sui",
    symbol: "USDC",
    name: "Native USDC (Circle)",
    addressOrType: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    decimals: 6,
  },
  {
    chain: "sui",
    symbol: "USDT",
    name: "Wormhole Bridged USDT",
    addressOrType: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    decimals: 6,
  },
  {
    chain: "sui",
    symbol: "USDC",
    name: "Wormhole Bridged USDC",
    addressOrType: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d257a93ab::coin::COIN",
    decimals: 6,
  },
  // BSC
  {
    chain: "bsc",
    symbol: "USDT",
    name: "Tether USD (BEP20)",
    addressOrType: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
  },
  {
    chain: "bsc",
    symbol: "USDC",
    name: "USD Coin (BEP20)",
    addressOrType: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
  },
];

/**
 * Checks if a token claim is authentic or an imposter fake token.
 */
export function isFakeToken(chain: SupportedChain, symbol: string, contractOrCoinType: string): boolean {
  const upperSymbol = symbol.toUpperCase().trim();
  const knownTokens = OFFICIAL_TOKENS.filter((t) => t.chain === chain && t.symbol === upperSymbol);

  // If this symbol isn't one of the major protected tokens, don't flag as fake token
  if (knownTokens.length === 0) {
    return false;
  }

  // If it claims to be USDT/USDC, it must match one of the verified official contract addresses
  const match = knownTokens.some((t) => {
    if (chain === "sui" || chain === "tron") {
      return t.addressOrType === contractOrCoinType;
    }
    return t.addressOrType.toLowerCase() === contractOrCoinType.toLowerCase();
  });

  return !match;
}
