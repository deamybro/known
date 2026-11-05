/**
 * Phase 0 Check: Lookalike Grinder Benchmark & Test
 * Measures Sui Ed25519 generation speed and tests lookalike generation for target Sui address.
 */
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

async function benchmark() {
  console.log("=== Phase 0: Lookalike Grinder Benchmark ===");
  const target = "0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38";
  const targetBody = target.slice(2).toLowerCase();
  const targetPrefix3 = targetBody.slice(0, 3);
  const targetSuffix3 = targetBody.slice(-3);
  const targetPrefix4 = targetBody.slice(0, 4);

  console.log("Target:", target);
  console.log(`Target prefix (3): "${targetPrefix3}", suffix (3): "${targetSuffix3}"`);
  console.log(`Target prefix (4 with dust rule): "${targetPrefix4}"`);

  // Measure single-thread rate
  console.log("\nMeasuring single-thread speed for 2 seconds...");
  const start = Date.now();
  let count = 0;
  while (Date.now() - start < 2000) {
    const kp = new Ed25519Keypair();
    kp.toSuiAddress();
    count++;
  }
  const elapsedSec = (Date.now() - start) / 1000;
  const rate = Math.round(count / elapsedSec);
  console.log(`Speed: ${rate.toLocaleString()} keys/sec`);

  // Time estimate
  // 16^4 = 65,536 (4-prefix lookalike)
  const est4Sec = (65536 / rate).toFixed(2);
  console.log(`Estimated time for 4-prefix lookalike (65,536 expected tries): ~${est4Sec}s`);

  // 16^6 = 16,777,216 (3-prefix + 3-suffix lookalike)
  const est6Sec = (16777216 / rate).toFixed(1);
  const est6Min = (16777216 / rate / 60).toFixed(1);
  console.log(`Estimated time for 3+3 lookalike (16.7M tries, 1 core): ~${est6Sec}s (${est6Min} min)`);
  console.log(`With 8 parallel worker threads: ~${(16777216 / (rate * 7.5) / 60).toFixed(1)} min`);

  // Run a quick live test: grind for 3-prefix lookalike right now
  console.log(`\nGrinding live 3-prefix lookalike matching "${targetPrefix3}"...`);
  const grindStart = Date.now();
  let tries = 0;
  let foundAddress = "";
  let lookalikeKp: Ed25519Keypair | null = null;
  while (true) {
    tries++;
    const kp = new Ed25519Keypair();
    const addr = kp.toSuiAddress();
    const body = addr.slice(2).toLowerCase();
    if (body.startsWith(targetPrefix3)) {
      foundAddress = addr;
      lookalikeKp = kp;
      break;
    }
  }
  const grindTime = ((Date.now() - grindStart) / 1000).toFixed(3);
  console.log(`Found 3-prefix lookalike in ${tries.toLocaleString()} tries (${grindTime}s)!`);
  console.log("Lookalike address:", foundAddress);
  console.log("Target address:   ", target);
  console.log("Exportable private key secret:", lookalikeKp?.getSecretKey().slice(0, 15) + "...");
  console.log("✓ Lookalike grinder PASSED");
}

benchmark().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
