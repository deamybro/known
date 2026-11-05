import { describe, expect, it } from "vitest";
import { TATUM_CHAIN_MAP } from "../src/tatum-data.js";
import { RequestPacer } from "../src/pacer.js";

describe("Tatum Chain Configuration & Pacer", () => {
  it("has valid mappings for supported chains", () => {
    expect(TATUM_CHAIN_MAP["ethereum"]).toBe("ethereum-mainnet");
    expect(TATUM_CHAIN_MAP["bsc"]).toBe("bsc-mainnet");
    expect(TATUM_CHAIN_MAP["base"]).toBe("base-mainnet");
  });

  it("throttles requests to respect rate limits", async () => {
    const pacer = new RequestPacer(10); // 100ms interval
    const start = Date.now();
    await pacer.throttle();
    await pacer.throttle();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(80);
  });
});
