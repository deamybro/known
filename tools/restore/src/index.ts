#!/usr/bin/env node
/**
 * Standalone Walrus Memory Restore CLI
 * Reconstructs a user's verified payee address book and caught lookalikes directly from Walrus Memory.
 * Zero database connection required.
 *
 * Usage:
 *   pnpm tsx tools/restore/src/index.ts --namespace known:00000000-0000-0000-0000-000000000001:payees
 *   pnpm tsx tools/restore/src/index.ts --user-id 00000000-0000-0000-0000-000000000001
 */

import { getMemoryClient, PayeeConfirmedPayload, LookalikeCaughtPayload } from "@known/memory";
import fs from "node:fs";

interface RestoredPayee {
  chain: string;
  address: string;
  label: string;
  sendCount: number;
  typicalRange: string;
  confirmedAt: string;
}

interface RestoredBlock {
  chain: string;
  address: string;
  imitatesLabel: string;
  imitatesAddress: string;
  caughtAt: string;
}

export async function restoreFromWalrus(options: {
  userId?: string;
  namespace?: string;
  outFile?: string;
}) {
  console.log("===============================================================");
  console.log("🌊   KNOWN — WALRUS MEMORY DIRECT RESTORE TOOL");
  console.log("     Sovereign data recovery without vendor or database dependency");
  console.log("===============================================================\n");

  const userId = options.userId || "00000000-0000-0000-0000-000000000001";
  const payeesNamespace = options.namespace || `known:${userId}:payees`;
  const blocklistNamespace = `known:${userId}:blocklist`;

  const client = getMemoryClient();

  console.log(`📡 Connecting to Walrus Memory...`);
  console.log(`   Namespace (Payees):    ${payeesNamespace}`);
  console.log(`   Namespace (Blocklist): ${blocklistNamespace}\n`);

  const restoredPayees = new Map<string, RestoredPayee>();
  const restoredBlocks = new Map<string, RestoredBlock>();

  // 1. Fetch payees from Walrus
  try {
    console.log(`⏳ Fetching memories from ${payeesNamespace}...`);
    const page = await client.listMemories({ namespace: payeesNamespace });
    const rawMemories = page?.memories || [];

    console.log(`   Found ${rawMemories.length} raw memory records in namespace.`);

    for (const mem of rawMemories) {
      try {
        const parsed = JSON.parse(mem.text || mem.content);
        if (parsed.kind === "payee_confirmed") {
          const p = parsed as PayeeConfirmedPayload;
          const key = `${p.chain}:${p.address.toLowerCase()}`;

          // Keep latest by occurredAt
          const existing = restoredPayees.get(key);
          if (!existing || new Date(p.occurredAt).getTime() > new Date(existing.confirmedAt).getTime()) {
            restoredPayees.set(key, {
              chain: p.chain.toUpperCase(),
              address: p.address,
              label: p.label,
              sendCount: p.sendCount,
              typicalRange:
                p.typicalLowRaw && p.typicalHighRaw
                  ? `${p.typicalLowRaw} - ${p.typicalHighRaw}`
                  : "N/A",
              confirmedAt: p.occurredAt,
            });
          }
        }
      } catch {
        // Not a structured JSON memory, skip
      }
    }
  } catch (err: any) {
    console.warn(`   Notice: Could not list memories for ${payeesNamespace}: ${err.message}`);
  }

  // 2. Fetch blocklist from Walrus
  try {
    console.log(`⏳ Fetching memories from ${blocklistNamespace}...`);
    const page = await client.listMemories({ namespace: blocklistNamespace });
    const rawMemories = page?.memories || [];

    console.log(`   Found ${rawMemories.length} raw memory records in namespace.`);

    for (const mem of rawMemories) {
      try {
        const parsed = JSON.parse(mem.text || mem.content);
        if (parsed.kind === "lookalike_caught") {
          const b = parsed as LookalikeCaughtPayload;
          const key = `${b.chain}:${b.address.toLowerCase()}`;
          restoredBlocks.set(key, {
            chain: b.chain.toUpperCase(),
            address: b.address,
            imitatesLabel: b.imitatesLabel,
            imitatesAddress: b.imitatesPayeeAddress,
            caughtAt: b.occurredAt,
          });
        }
      } catch {
        // Skip
      }
    }
  } catch (err: any) {
    console.warn(`   Notice: Could not list memories for ${blocklistNamespace}: ${err.message}`);
  }

  const payeesList = Array.from(restoredPayees.values());
  const blocksList = Array.from(restoredBlocks.values());

  console.log("\n===============================================================");
  console.log(`📋 RESTORED PAYEE DIRECTORY (${payeesList.length} verified payees)`);
  console.log("===============================================================");
  if (payeesList.length === 0) {
    console.log("No confirmed payees found in this Walrus namespace.");
  } else {
    for (const p of payeesList) {
      console.log(`• [${p.chain}] ${p.label}`);
      console.log(`  Address:      ${p.address}`);
      console.log(`  Sends:        ${p.sendCount} times`);
      console.log(`  Confirmed At: ${p.confirmedAt}`);
      console.log("---------------------------------------------------------------");
    }
  }

  if (blocksList.length > 0) {
    console.log(`\n🚫 RESTORED CAUGHT LOOKALIKES (${blocksList.length} attacker addresses)`);
    console.log("===============================================================");
    for (const b of blocksList) {
      console.log(`• [${b.chain}] Imitating: ${b.imitatesLabel} (${b.imitatesAddress})`);
      console.log(`  Attacker Addr: ${b.address}`);
      console.log(`  Caught At:     ${b.caughtAt}`);
      console.log("---------------------------------------------------------------");
    }
  }

  if (options.outFile) {
    const exported = {
      version: 1,
      source: "Walrus Memory Direct Restoration",
      restoredAt: new Date().toISOString(),
      payees: payeesList,
      blocklist: blocksList,
    };
    fs.writeFileSync(options.outFile, JSON.stringify(exported, null, 2));
    console.log(`\n💾 Saved restored backup to ${options.outFile}`);
  }

  console.log("\n✅ DIRECT RESTORATION SUCCESSFUL — ZERO DATABASE REQUIRED.");
  console.log("===============================================================\n");

  return { payees: payeesList, blocklist: blocksList };
}

// CLI execution
const args = process.argv.slice(2);
let userId: string | undefined;
let namespace: string | undefined;
let outFile: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--user-id" && args[i + 1]) userId = args[++i];
  if (args[i] === "--namespace" && args[i + 1]) namespace = args[++i];
  if (args[i] === "--out" && args[i + 1]) outFile = args[++i];
}

restoreFromWalrus({ userId, namespace, outFile })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Restore failed:", err);
    process.exit(1);
  });
