/**
 * Lookalike Key Grinder for Sui
 * Generates an attacker lookalike keypair matching the prefix/suffix of a target payee.
 *
 * Usage:
 *   pnpm tsx scripts/make-lookalike.ts [target_address] [prefix_len] [suffix_len]
 */

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromHex, toHex } from "@mysten/sui/utils";

async function grindLookalike() {
  const args = process.argv.slice(2);
  const target = args[0] || "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38";
  const prefixLen = parseInt(args[1] || "3", 10);
  const suffixLen = parseInt(args[2] || "3", 10);

  const cleanTarget = target.startsWith("0x") ? target.slice(2).toLowerCase() : target.toLowerCase();
  const targetPrefix = cleanTarget.slice(0, prefixLen);
  const targetSuffix = cleanTarget.slice(-suffixLen);

  console.log("===============================================================");
  console.log("⚔️   KNOWN — ADDRESS POISONING LOOKALIKE GENERATOR (DEMO TOOL)");
  console.log("===============================================================");
  console.log(`Target Address:  0x${cleanTarget}`);
  console.log(`Target Prefix:   "${targetPrefix}" (${prefixLen} chars)`);
  console.log(`Target Suffix:   "${targetSuffix}" (${suffixLen} chars)`);
  console.log("\nGrinding Ed25519 keypairs...");

  const startTime = Date.now();
  let attempts = 0;
  let matchFound = false;

  // Search loop
  while (!matchFound) {
    attempts++;
    const keypair = new Ed25519Keypair();
    const address = keypair.toSuiAddress().slice(2).toLowerCase();

    const prefixMatch = address.startsWith(targetPrefix);
    const suffixMatch = suffixLen > 0 ? address.endsWith(targetSuffix) : true;

    if (prefixMatch && suffixMatch) {
      matchFound = true;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      const secretKeyHex = toHex(keypair.getSecretKey());

      console.log("\n🎯 MATCH FOUND!");
      console.log(`Attempts:        ${attempts.toLocaleString()}`);
      console.log(`Time elapsed:    ${elapsed}s (${Math.round(attempts / Math.max(0.01, parseFloat(elapsed))).toLocaleString()} keys/sec)`);
      console.log(`Lookalike Addr:  0x${address}`);
      console.log(`Attacker Secret: ${secretKeyHex}`);
      console.log("\nVisual Diff Comparison:");
      console.log(`Real: 0x\x1b[32m${targetPrefix}\x1b[0m${cleanTarget.slice(prefixLen, -suffixLen)}\x1b[32m${targetSuffix}\x1b[0m`);
      console.log(`Fake: 0x\x1b[32m${targetPrefix}\x1b[0m\x1b[31m${address.slice(prefixLen, -suffixLen)}\x1b[0m\x1b[32m${targetSuffix}\x1b[0m`);
      console.log("===============================================================\n");
      process.exit(0);
    }

    if (attempts % 10000 === 0) {
      process.stdout.write(`\rTried ${attempts.toLocaleString()} keypairs...`);
    }
  }
}

grindLookalike().catch((err) => {
  console.error("Grinder error:", err);
  process.exit(1);
});
