/**
 * Phase 0 Check: Sui Sign-In
 * Tests Ed25519 keypair generation, personal message signing, and cryptographic signature verification.
 */
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";

async function main() {
  console.log("=== Phase 0: Sui Sign-In Verification ===");

  // 1. Generate keypair simulating a user's wallet
  const userKeypair = new Ed25519Keypair();
  const userAddress = userKeypair.toSuiAddress();
  console.log("Generated user wallet address:", userAddress);

  // 2. Create personal sign-in message
  const nonce = "test-nonce-" + Date.now();
  const messageText = `Sign in to Known: Nonce ${nonce}`;
  const messageBytes = new TextEncoder().encode(messageText);

  // 3. User wallet signs the personal message
  const signature = await userKeypair.signPersonalMessage(messageBytes);
  console.log("Produced signature length:", signature.signature.length);

  // 4. Server-side verification of signature without having private key
  const recoveredPublicKey = await verifyPersonalMessageSignature(
    messageBytes,
    signature.signature
  );
  const recoveredAddress = recoveredPublicKey.toSuiAddress();
  console.log("Recovered address from signature:", recoveredAddress);

  const isMatch = recoveredAddress === userAddress;
  console.log("Address verification matches:", isMatch);

  if (!isMatch) {
    throw new Error("Sui sign-in verification failed: Address mismatch!");
  }

  // 5. Tampering test: signature should fail if message is modified
  const tamperedBytes = new TextEncoder().encode(messageText + " (tampered)");
  let tamperCaught = false;
  try {
    await verifyPersonalMessageSignature(tamperedBytes, signature.signature);
  } catch {
    tamperCaught = true;
  }
  console.log("Tampering attempt caught:", tamperCaught);

  console.log("✓ Sui Sign-in verification PASSED");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
