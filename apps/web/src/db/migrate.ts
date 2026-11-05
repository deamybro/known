import { getDb } from "./index.js";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  const db = getDb();
  console.log("Running Drizzle database table migrations...");

  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      sui_address TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS watched_addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      chain TEXT NOT NULL,
      address TEXT NOT NULL,
      normalized TEXT NOT NULL,
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS watched_addr_user_chain_idx ON watched_addresses(user_id, chain, normalized);`,

    `CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      chain TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      direction TEXT NOT NULL,
      counterparty TEXT NOT NULL,
      counterparty_normalized TEXT NOT NULL,
      asset TEXT NOT NULL,
      asset_symbol TEXT NOT NULL,
      amount_raw TEXT NOT NULL,
      decimals INTEGER NOT NULL DEFAULT 6,
      timestamp TIMESTAMPTZ NOT NULL,
      is_zero_value BOOLEAN NOT NULL DEFAULT FALSE,
      is_dust BOOLEAN NOT NULL DEFAULT FALSE,
      source TEXT NOT NULL DEFAULT 'tatum'
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS transfers_unique_tx_idx ON transfers(chain, tx_hash, counterparty_normalized, asset, direction);`,

    `CREATE TABLE IF NOT EXISTS payees (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      chain TEXT NOT NULL,
      address TEXT NOT NULL,
      normalized TEXT NOT NULL,
      label TEXT NOT NULL,
      confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'confirmed',
      send_count INTEGER NOT NULL DEFAULT 1,
      first_sent_at TIMESTAMPTZ,
      last_sent_at TIMESTAMPTZ,
      typical_low_raw TEXT,
      typical_high_raw TEXT,
      decimals INTEGER NOT NULL DEFAULT 6,
      asset_symbol TEXT NOT NULL DEFAULT 'USDC'
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS payees_user_chain_norm_idx ON payees(user_id, chain, normalized);`,

    `CREATE TABLE IF NOT EXISTS blocklist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      chain TEXT NOT NULL,
      address TEXT NOT NULL,
      normalized TEXT NOT NULL,
      imitates_payee_id TEXT,
      reason TEXT NOT NULL,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS blocklist_user_chain_norm_idx ON blocklist(user_id, chain, normalized);`,

    `CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      chain TEXT NOT NULL,
      address TEXT NOT NULL,
      verdict TEXT NOT NULL,
      reasons JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      feedback TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      namespace TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      job_id TEXT,
      blob_id TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      confirmed_at TIMESTAMPTZ
    );`,

    `CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      hashed_key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL DEFAULT 'Default Key',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ
    );`,
  ];

  for (const stmt of statements) {
    await db.execute(sql.raw(stmt));
  }

  console.log("✓ Drizzle migrations completed successfully.");
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes("migrate")) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
