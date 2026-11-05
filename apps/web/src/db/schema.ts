import { boolean, integer, json, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // ULID or nano-id
  suiAddress: text("sui_address").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const watchedAddresses = pgTable(
  "watched_addresses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    chain: text("chain").notNull(), // "sui" | "ethereum" | "tron" | "bsc" | "solana"
    address: text("address").notNull(),
    normalized: text("normalized").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("watched_addr_user_chain_idx").on(table.userId, table.chain, table.normalized),
  ]
);

export const transfers = pgTable(
  "transfers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    chain: text("chain").notNull(),
    txHash: text("tx_hash").notNull(),
    direction: text("direction").notNull(), // "in" | "out"
    counterparty: text("counterparty").notNull(),
    counterpartyNormalized: text("counterparty_normalized").notNull(),
    asset: text("asset").notNull(), // "native" or contract address / type
    assetSymbol: text("asset_symbol").notNull(),
    amountRaw: text("amount_raw").notNull(), // raw integer string
    decimals: integer("decimals").notNull().default(6),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    isZeroValue: boolean("is_zero_value").notNull().default(false),
    isDust: boolean("is_dust").notNull().default(false),
    source: text("source").notNull().default("tatum"),
  },
  (table) => [
    uniqueIndex("transfers_unique_tx_idx").on(
      table.chain,
      table.txHash,
      table.counterpartyNormalized,
      table.asset,
      table.direction
    ),
  ]
);

export const payees = pgTable(
  "payees",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    chain: text("chain").notNull(),
    address: text("address").notNull(),
    normalized: text("normalized").notNull(),
    label: text("label").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").notNull().default("confirmed"), // "confirmed" | "removed"
    sendCount: integer("send_count").notNull().default(1),
    firstSentAt: timestamp("first_sent_at", { withTimezone: true }),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
    typicalLowRaw: text("typical_low_raw"),
    typicalHighRaw: text("typical_high_raw"),
    decimals: integer("decimals").notNull().default(6),
    assetSymbol: text("asset_symbol").notNull().default("USDC"),
  },
  (table) => [
    uniqueIndex("payees_user_chain_norm_idx").on(table.userId, table.chain, table.normalized),
  ]
);

export const blocklist = pgTable(
  "blocklist",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    chain: text("chain").notNull(),
    address: text("address").notNull(),
    normalized: text("normalized").notNull(),
    imitatesPayeeId: text("imitates_payee_id"),
    reason: text("reason").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("blocklist_user_chain_norm_idx").on(table.userId, table.chain, table.normalized),
  ]
);

export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  chain: text("chain").notNull(),
  address: text("address").notNull(),
  verdict: text("verdict").notNull(), // "green" | "red" | "amber"
  reasons: json("reasons").notNull().$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  feedback: text("feedback"), // null | "ok" | "block"
});

export const outbox = pgTable("outbox", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  namespace: text("namespace").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "submitted" | "confirmed" | "failed"
  jobId: text("job_id"),
  blobId: text("blob_id"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
});

export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hashedKey: text("hashed_key").notNull().unique(),
  label: text("label").notNull().default("Default Key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});
