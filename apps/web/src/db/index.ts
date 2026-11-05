import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema.js";
import path from "node:path";
import fs from "node:fs";

let dbInstance: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzlePglite>;

export function getDb() {
  if (dbInstance) return dbInstance;

  const url = process.env.DATABASE_URL;

  // If a live remote PostgreSQL URL is provided (Neon / Supabase), use node-postgres
  if (url && (url.startsWith("postgres://") || url.startsWith("postgresql://")) && !url.includes("localhost:5432")) {
    const pool = new pg.Pool({ connectionString: url });
    dbInstance = drizzlePg(pool, { schema });
    return dbInstance;
  }

  // Otherwise, use zero-config embedded PGlite stored in .data/known.pglite
  const dataDir = path.resolve(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const pglitePath = path.join(dataDir, "known.pglite");
  const client = new PGlite(pglitePath);
  dbInstance = drizzlePglite(client, { schema });
  return dbInstance;
}

export * from "./schema.js";
