import path from "node:path";
import { products } from "./schema";
import type { DB } from "./client";

export const MIGRATIONS = {
  migrationsFolder: path.join(process.cwd(), "drizzle"),
  migrationsSchema: "jacket",
  migrationsTable: "__migrations",
};

const STARTING_PRODUCTS = [
  { name: "Real Madrid", color: "#C9A227" },
  { name: "Brazil", color: "#159447" },
  { name: "Argentina", color: "#5AA9E6" },
  { name: "Spain", color: "#C8102E" },
];

export async function seedIfEmpty(db: DB) {
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length > 0) return;
  await db.insert(products).values(
    STARTING_PRODUCTS.map((p) => ({
      ...p,
      buyPrice: 1050,
      sellPrices: [1500, 1550, 1600, 1650],
    })),
  );
}
