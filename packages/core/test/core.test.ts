import { describe, expect, it } from "vitest";
import {
  areAddressesEqual,
  normalizeAddress,
} from "../src/address.js";
import { isDustTransfer, isZeroValueTransfer } from "../src/dust.js";
import {
  checkLookalikeAgainstPayee,
  getCommonPrefixLength,
  getCommonSuffixLength,
} from "../src/lookalike.js";
import {
  computeTypicalRange,
  deriveSuggestedPayees,
  isAmountAnomaly,
} from "../src/payee.js";
import { isFakeToken } from "../src/tokens.js";
import {
  BlocklistRecord,
  PayeeRecord,
  TransferRecord,
} from "../src/types.js";
import { evaluateVerdict } from "../src/verdict.js";

describe("Address Normalization & Validation", () => {
  it("normalizes EVM lowercase and preserves validity", () => {
    const raw = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
    const res = normalizeAddress("ethereum", raw);
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
    expect(res.body).toBe("d8da6bf26964af9d7eed9e03e53415d37aa96045");
  });

  it("handles EVM checksum vs lowercase as identical", () => {
    const checksum = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    const lower = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
    expect(areAddressesEqual("ethereum", checksum, "ethereum", lower)).toBe(true);
  });

  it("pads short Sui addresses to 64 hex digits", () => {
    const shortSui = "0x2";
    const norm = normalizeAddress("sui", shortSui);
    expect(norm.isValid).toBe(true);
    expect(norm.normalized.length).toBe(66); // 0x + 64 hex
    expect(norm.normalized.endsWith("2")).toBe(true);
    expect(norm.body.length).toBe(64);
  });

  it("treats short Sui address and 64-hex padded Sui address as equal", () => {
    const short = "0x565c";
    const full = "0x000000000000000000000000000000000000000000000000000000000000565c";
    expect(areAddressesEqual("sui", short, "sui", full)).toBe(true);
  });

  it("enforces strict case sensitivity for Tron Base58 addresses", () => {
    const tronA = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    const tronB = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6T"; // Last char uppercase T
    expect(areAddressesEqual("tron", tronA, "tron", tronB)).toBe(false);
  });

  it("enforces strict case sensitivity for Solana addresses", () => {
    const solA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const solB = "epjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    expect(areAddressesEqual("solana", solA, "solana", solB)).toBe(false);
  });

  it("never matches addresses across different chains", () => {
    const addr = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
    expect(areAddressesEqual("ethereum", addr, "sui", addr)).toBe(false);
  });

  it("rejects invalid addresses with clear error", () => {
    const invalidEth = normalizeAddress("ethereum", "0x1234");
    expect(invalidEth.isValid).toBe(false);
    expect(invalidEth.error).toContain("40 hex characters");

    const invalidTron = normalizeAddress("tron", "0x1234");
    expect(invalidTron.isValid).toBe(false);
    expect(invalidTron.error).toContain("must start with 'T'");
  });
});

describe("Lookalike Detection Algorithm", () => {
  const adaPayee: PayeeRecord = {
    id: "payee-ada",
    userId: "user-1",
    chain: "sui",
    address: "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38",
    normalized: "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38",
    label: "Ada (sister)",
    confirmedAt: "2026-11-01T00:00:00Z",
    status: "confirmed",
    sendCount: 14,
    typicalLowRaw: "50000000",
    typicalHighRaw: "200000000",
    decimals: 6,
    assetSymbol: "USDC",
  };

  it("computes prefix and suffix lengths accurately", () => {
    expect(getCommonPrefixLength("abcdef", "abcxyz")).toBe(3);
    expect(getCommonSuffixLength("123def", "999def")).toBe(3);
  });

  it("catches 3+3 lookalike address imitating confirmed payee", () => {
    // 565...a38 (starts with 565, ends with a38, different middle)
    const fakeAda = "0x5650000000000000000000000000000000000000000000000000000000000a38";
    const match = checkLookalikeAgainstPayee("sui", fakeAda, adaPayee);
    expect(match).not.toBeNull();
    expect(match?.imitatesLabel).toBe("Ada (sister)");
    expect(match?.commonPrefixLen).toBe(3);
    expect(match?.commonSuffixLen).toBe(3);
  });

  it("catches 4+4 lookalike address", () => {
    // 565c...4a38
    const fakeAda = "0x565c999999999999999999999999999999999999999999999999999999994a38";
    const match = checkLookalikeAgainstPayee("sui", fakeAda, adaPayee);
    expect(match).not.toBeNull();
    expect(match?.commonPrefixLen).toBe(4);
    expect(match?.commonSuffixLen).toBe(4);
  });

  it("does NOT flag prefix-only or suffix-only as lookalike without dust", () => {
    // Only prefix matches (565c), suffix differs completely
    const prefixOnly = "0x565c000000000000000000000000000000000000000000000000000000000000";
    const match = checkLookalikeAgainstPayee("sui", prefixOnly, adaPayee, false);
    expect(match).toBeNull();
  });

  it("flags prefix >= 4 as lookalike WHEN inbound dust history exists", () => {
    const prefixOnly = "0x565c000000000000000000000000000000000000000000000000000000000000";
    const matchWithDust = checkLookalikeAgainstPayee("sui", prefixOnly, adaPayee, true);
    expect(matchWithDust).not.toBeNull();
    expect(matchWithDust?.hasDustHistory).toBe(true);
  });

  it("does not flag exact payee address as lookalike", () => {
    const exact = adaPayee.address;
    const match = checkLookalikeAgainstPayee("sui", exact, adaPayee);
    expect(match).toBeNull();
  });
});

describe("Dust & Fake Token Detection", () => {
  it("detects zero-value transfers", () => {
    expect(isZeroValueTransfer("0")).toBe(true);
    expect(isZeroValueTransfer("000")).toBe(true);
    expect(isZeroValueTransfer("100")).toBe(false);
  });

  it("detects native dust according to per-chain thresholds", () => {
    // SUI threshold is 1_000_000 mist (0.001 SUI)
    expect(isDustTransfer("sui", "500000", "native")).toBe(true);
    expect(isDustTransfer("sui", "1500000", "native")).toBe(false);

    // ETH threshold is 10^14 wei (0.0001 ETH)
    expect(isDustTransfer("ethereum", "50000000000000", "native")).toBe(true);
    expect(isDustTransfer("ethereum", "200000000000000", "native")).toBe(false);
  });

  it("detects fake stablecoin tokens", () => {
    // Legitimate Ethereum USDT
    expect(isFakeToken("ethereum", "USDT", "0xdac17f958d2ee523a2206206994597c13d831ec7")).toBe(false);
    // Fake Ethereum USDT (different contract)
    expect(isFakeToken("ethereum", "USDT", "0x1111111111111111111111111111111111111111")).toBe(true);
    // Legitimate Sui Native USDC
    expect(isFakeToken("sui", "USDC", "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC")).toBe(false);
    // Fake Sui USDC
    expect(isFakeToken("sui", "USDC", "0xbadbad::usdc::USDC")).toBe(true);
  });
});

describe("Payee Typical Range & Anomaly Arithmetic", () => {
  it("computes 10th-90th percentiles using pure BigInt integer math", () => {
    const amounts = [
      100n, 200n, 300n, 400n, 500n,
      600n, 700n, 800n, 900n, 1000n,
    ];
    const { low, high } = computeTypicalRange(amounts);
    expect(low).toBe(100n);
    expect(high).toBe(1000n);
  });

  it("handles fewer than 3 sends by taking min and max", () => {
    const amounts = [50n, 200n];
    const { low, high } = computeTypicalRange(amounts);
    expect(low).toBe(50n);
    expect(high).toBe(200n);
  });

  it("detects amount anomalies outside [0.5 * low, 3 * high]", () => {
    const low = "100";
    const high = "200";

    // Normal amounts in [50, 600]
    expect(isAmountAnomaly("50", low, high)).toBe(false);
    expect(isAmountAnomaly("150", low, high)).toBe(false);
    expect(isAmountAnomaly("600", low, high)).toBe(false);

    // Anomalies
    expect(isAmountAnomaly("49", low, high)).toBe(true); // < 50
    expect(isAmountAnomaly("601", low, high)).toBe(true); // > 600
    expect(isAmountAnomaly("5000", low, high)).toBe(true); // Far above normal
  });
});

describe("Suggested Payees Aggregation", () => {
  it("aggregates outgoing transfers and NEVER includes inbound-only addresses", () => {
    const transfers: TransferRecord[] = [
      // Inbound transfer from stranger (e.g. dust or real)
      {
        id: "tx-1",
        userId: "u1",
        chain: "ethereum",
        txHash: "0x111",
        direction: "in",
        counterparty: "0x9999999999999999999999999999999999999999",
        counterpartyNormalized: "0x9999999999999999999999999999999999999999",
        asset: "native",
        assetSymbol: "ETH",
        amountRaw: "1000000000000000000",
        decimals: 18,
        timestamp: "2026-11-01T10:00:00Z",
        isZeroValue: false,
        isDust: false,
        source: "tatum",
      },
      // Outgoing transfer to Bob
      {
        id: "tx-2",
        userId: "u1",
        chain: "ethereum",
        txHash: "0x222",
        direction: "out",
        counterparty: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        counterpartyNormalized: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        asset: "native",
        assetSymbol: "ETH",
        amountRaw: "500000000000000000",
        decimals: 18,
        timestamp: "2026-11-02T10:00:00Z",
        isZeroValue: false,
        isDust: false,
        source: "tatum",
      },
    ];

    const suggestions = deriveSuggestedPayees(transfers, []);
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].address).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(suggestions[0].sendCount).toBe(1);
  });
});

describe("Verdict Engine (Deterministic Decisions)", () => {
  const confirmedAda: PayeeRecord = {
    id: "p-ada",
    userId: "user-1",
    chain: "ethereum",
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    normalized: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    label: "Ada",
    confirmedAt: "2026-11-01T00:00:00Z",
    status: "confirmed",
    sendCount: 10,
    typicalLowRaw: "100000000000000000", // 0.1 ETH
    typicalHighRaw: "1000000000000000000", // 1.0 ETH
    decimals: 18,
    assetSymbol: "ETH",
  };

  const blocklistedScam: BlocklistRecord = {
    id: "bl-1",
    userId: "user-1",
    chain: "ethereum",
    address: "0xbad0000000000000000000000000000000000bad",
    normalized: "0xbad0000000000000000000000000000000000bad",
    reason: "Known malicious phishing drainer",
    firstSeenAt: "2026-11-01T00:00:00Z",
  };

  it("verdict: exact confirmed payee returns GREEN", () => {
    const res = evaluateVerdict(
      {
        chain: "ethereum",
        address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        amountRaw: "500000000000000000", // 0.5 ETH (within typical range)
      },
      [confirmedAda],
      [blocklistedScam],
      []
    );

    expect(res.verdict).toBe("green");
    expect(res.reasons).toEqual(["confirmed_payee"]);
    expect(res.matchedPayee?.label).toBe("Ada");
  });

  it("verdict: exact confirmed payee with unusual amount stays GREEN with note", () => {
    const res = evaluateVerdict(
      {
        chain: "ethereum",
        address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        amountRaw: "10000000000000000000", // 10 ETH (much higher than typical 1 ETH)
      },
      [confirmedAda],
      [],
      []
    );

    expect(res.verdict).toBe("green");
    expect(res.reasons).toContain("confirmed_payee");
    expect(res.reasons).toContain("unusual_amount");
  });

  it("verdict: blocklisted address returns RED with reason", () => {
    const res = evaluateVerdict(
      {
        chain: "ethereum",
        address: "0xbad0000000000000000000000000000000000bad",
      },
      [confirmedAda],
      [blocklistedScam],
      []
    );

    expect(res.verdict).toBe("red");
    expect(res.reasons).toEqual(["blocklisted"]);
  });

  it("verdict: lookalike of confirmed payee returns RED", () => {
    // Lookalike matching first 3 (d8d) and last 3 (045)
    const fakeAda = "0xd8d0000000000000000000000000000000000045";
    const res = evaluateVerdict(
      {
        chain: "ethereum",
        address: fakeAda,
      },
      [confirmedAda],
      [],
      []
    );

    expect(res.verdict).toBe("red");
    expect(res.reasons).toEqual(["imitates_payee"]);
    expect(res.imitates?.label).toBe("Ada");
  });

  it("verdict: address seen only as dust sender returns RED", () => {
    const dustSender = "0x5555555555555555555555555555555555555555";
    const history: TransferRecord[] = [
      {
        id: "tx-dust",
        userId: "user-1",
        chain: "ethereum",
        txHash: "0xabc",
        direction: "in",
        counterparty: dustSender,
        counterpartyNormalized: dustSender,
        asset: "native",
        assetSymbol: "ETH",
        amountRaw: "10000",
        decimals: 18,
        timestamp: "2026-11-01T00:00:00Z",
        isZeroValue: false,
        isDust: true,
        source: "tatum",
      },
    ];

    const res = evaluateVerdict(
      { chain: "ethereum", address: dustSender },
      [],
      [],
      history
    );

    expect(res.verdict).toBe("red");
    expect(res.reasons).toEqual(["dust_sender"]);
  });

  it("verdict: paid but unconfirmed address returns AMBER with paid_but_unconfirmed", () => {
    const unconfirmed = "0x7777777777777777777777777777777777777777";
    const history: TransferRecord[] = [
      {
        id: "tx-out",
        userId: "user-1",
        chain: "ethereum",
        txHash: "0xabc",
        direction: "out",
        counterparty: unconfirmed,
        counterpartyNormalized: unconfirmed,
        asset: "native",
        assetSymbol: "ETH",
        amountRaw: "1000000000000000000",
        decimals: 18,
        timestamp: "2026-11-01T00:00:00Z",
        isZeroValue: false,
        isDust: false,
        source: "tatum",
      },
    ];

    const res = evaluateVerdict(
      { chain: "ethereum", address: unconfirmed },
      [],
      [],
      history
    );

    expect(res.verdict).toBe("amber");
    expect(res.reasons).toEqual(["paid_but_unconfirmed"]);
  });

  it("verdict: completely unknown address returns AMBER with never_paid", () => {
    const unknown = "0x8888888888888888888888888888888888888888";
    const res = evaluateVerdict(
      { chain: "ethereum", address: unknown },
      [confirmedAda],
      [],
      []
    );

    expect(res.verdict).toBe("amber");
    expect(res.reasons).toEqual(["never_paid"]);
  });

  it("verdict: invalid address format returns AMBER with invalid_address", () => {
    const res = evaluateVerdict(
      { chain: "ethereum", address: "invalid-not-an-address" },
      [confirmedAda],
      [],
      []
    );

    expect(res.verdict).toBe("amber");
    expect(res.reasons).toEqual(["invalid_address"]);
  });
});
