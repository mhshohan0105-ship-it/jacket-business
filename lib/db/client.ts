import { mkdir } from "node:fs/promises";
import path from "node:path";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { assertOwnDatabase } from "./guard";
import * as schema from "./schema";
import { MIGRATIONS, seedIfEmpty } from "./setup";

export type DB = NodePgDatabase<typeof schema>;

const cache = globalThis as unknown as { __jacketDb?: Promise<DB> };

export function getDb(): Promise<DB> {
  if (!cache.__jacketDb) {
    cache.__jacketDb = open().catch((error) => {
      cache.__jacketDb = undefined;
      throw error;
    });
  }
  return cache.__jacketDb;
}

async function open(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    assertOwnDatabase(url, "DATABASE_URL");
    return drizzle(new Pool({ connectionString: url, max: 3 }), { schema });
  }
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set on Vercel");
  }
  return openLocal();
}

// No DATABASE_URL: run real Postgres in-process, stored in .data/pglite.
async function openLocal(): Promise<DB> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzleLite } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");

  const dir = path.join(process.cwd(), ".data", "pglite");
  await mkdir(dir, { recursive: true });
  const db = drizzleLite(new PGlite(dir), { schema });
  await migrate(db, MIGRATIONS);

  // Both drivers expose the same query API.
  const shared = db as unknown as DB;
  await seedIfEmpty(shared);
  return shared;
}
