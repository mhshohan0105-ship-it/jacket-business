import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  // Only ever look at our own schema, so other apps sharing a database are never touched.
  schemaFilter: ["jacket"],
});
