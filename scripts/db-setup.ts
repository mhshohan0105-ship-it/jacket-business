// Creates the tables and starting products in the jacket_business database.
// Migrations run over the direct URL; the app itself uses the pooled one.
// Refuses to connect unless both URLs point to jacket_business. Safe to run again.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { assertOwnDatabase, checkDatabaseEnv } from "../lib/db/guard";
import * as schema from "../lib/db/schema";
import { MIGRATIONS, seedIfEmpty } from "../lib/db/setup";

async function main() {
  const { report, problems } = checkDatabaseEnv(process.env);
  console.log(report.join("\n"));
  if (problems.length > 0) throw new Error(`Not ready:\n- ${problems.join("\n- ")}`);

  const url = process.env.DATABASE_URL_UNPOOLED as string;
  assertOwnDatabase(url, "DATABASE_URL_UNPOOLED");

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const db = drizzle(pool, { schema });
    await migrate(db, MIGRATIONS);
    await seedIfEmpty(db);
    console.log("Database is ready.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Database setup failed");
  process.exit(1);
});
