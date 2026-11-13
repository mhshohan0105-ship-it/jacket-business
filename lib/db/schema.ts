import {
  boolean,
  date,
  integer,
  numeric,
  pgSchema,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Every table lives in its own Postgres schema, so this app can never collide
// with another app even if they end up sharing one database.
export const jacket = pgSchema("jacket");

// All money columns are whole taka.

export const products = jacket.table("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#0F5C45"),
  buyPrice: integer("buy_price").notNull(),
  sellPrices: integer("sell_prices").array().notNull(),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchases = jacket.table("purchases", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  supplier: text("supplier").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchaseItems = jacket.table("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  size: text("size").notNull(),
  qty: integer("qty").notNull(),
  unitCost: integer("unit_cost").notNull(),
  // Courier charge for this whole line, not per piece. Four decimals so that
  // 200 taka over 15 pieces comes to the same per-piece cost on every line.
  courier: numeric("courier", { precision: 14, scale: 4, mode: "number" }).notNull().default(0),
});

export const preorders = jacket.table("preorders", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  customer: text("customer").notNull(),
  phone: text("phone").notNull().default(""),
  note: text("note").notNull().default(""),
  status: text("status", { enum: ["pending", "delivered", "cancelled"] })
    .notNull()
    .default("pending"),
  // Most pre-orders are taken before the customer pays.
  paymentStatus: text("payment_status", { enum: ["paid", "due"] })
    .notNull()
    .default("due"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const preorderItems = jacket.table("preorder_items", {
  id: serial("id").primaryKey(),
  preorderId: integer("preorder_id")
    .notNull()
    .references(() => preorders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  size: text("size").notNull(),
  qty: integer("qty").notNull(),
  unitPrice: integer("unit_price").notNull(),
});

export const sales = jacket.table("sales", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  customer: text("customer").notNull(),
  phone: text("phone").notNull().default(""),
  note: text("note").notNull().default(""),
  paymentStatus: text("payment_status", { enum: ["paid", "due"] }).notNull(),
  expectedPayDate: date("expected_pay_date", { mode: "string" }),
  paidDate: date("paid_date", { mode: "string" }),
  preorderId: integer("preorder_id").references(() => preorders.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const saleItems = jacket.table("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  size: text("size").notNull(),
  qty: integer("qty").notNull(),
  unitPrice: integer("unit_price").notNull(),
});

/** History of pieces swapped with the supplier: which batch, what for what, how many. */
export const purchaseExchanges = jacket.table("purchase_exchanges", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  fromProductId: integer("from_product_id")
    .notNull()
    .references(() => products.id),
  fromSize: text("from_size").notNull(),
  toProductId: integer("to_product_id")
    .notNull()
    .references(() => products.id),
  toSize: text("to_size").notNull(),
  qty: integer("qty").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
