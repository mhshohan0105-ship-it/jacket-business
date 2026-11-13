"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, credentialsMatch, sessionToken } from "./auth";
import { variantKey } from "./constants";
import { getDb, type DB } from "./db/client";
import {
  preorderItems,
  preorders,
  products,
  purchaseExchanges,
  purchaseItems,
  purchases,
  saleItems,
  sales,
} from "./db/schema";
import { applyExchange } from "./exchange";
import { todayInDhaka } from "./format";
import { isLang, LANG_COOKIE, type Lang } from "./i18n/messages";
import { getT } from "./i18n/server";
import { findStockShortage } from "./ledger";
import {
  InputError,
  optionalDate,
  optionalText,
  requireAmount,
  requireDate,
  requireDecimalAmount,
  requireLines,
  requireSize,
  requireText,
} from "./validate";

export type ActionResult = { ok: true } | { ok: false; error: string };

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
type Input = Record<string, unknown>;

async function run(work: (db: DB) => Promise<void>): Promise<ActionResult> {
  try {
    await work(await getDb());
  } catch (error) {
    const t = await getT();
    if (error instanceof InputError) return { ok: false, error: error.render(t) };
    console.error(error);
    return { ok: false, error: t.errors.saveFailed };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

function requireId(value: unknown) {
  return requireAmount(value, "id", 1);
}

function parseSoldLine(line: Input) {
  return {
    productId: requireId(line.productId),
    size: requireSize(line.size),
    qty: requireAmount(line.qty, "quantity", 1),
    unitPrice: requireAmount(line.unitPrice, "sellPrice", 1),
  };
}

function parsePayment(input: Input) {
  const paymentStatus = input.paymentStatus === "due" ? ("due" as const) : ("paid" as const);
  return {
    paymentStatus,
    expectedPayDate: paymentStatus === "due" ? optionalDate(input.expectedPayDate) : null,
  };
}

/** Pieces in stock per variant, as seen inside the current transaction. */
async function stockOnHand(tx: Tx) {
  const stock = new Map<string, number>();
  const add = (productId: number, size: string, qty: number) => {
    const key = variantKey(productId, size);
    stock.set(key, (stock.get(key) ?? 0) + qty);
  };
  const bought = await tx.select().from(purchaseItems);
  const sold = await tx.select().from(saleItems);
  for (const line of bought) add(line.productId, line.size, line.qty);
  for (const line of sold) add(line.productId, line.size, -line.qty);
  return stock;
}

async function productName(tx: Tx, id: number) {
  const [product] = await tx
    .select({ name: products.name })
    .from(products)
    .where(eq(products.id, id));
  return product?.name;
}

async function assertInStock(tx: Tx, lines: { productId: number; size: string; qty: number }[]) {
  const stock = await stockOnHand(tx);
  const wanted = new Map<string, { productId: number; size: string; qty: number }>();
  for (const line of lines) {
    const key = variantKey(line.productId, line.size);
    const current = wanted.get(key);
    wanted.set(key, { ...line, qty: (current?.qty ?? 0) + line.qty });
  }
  for (const [key, line] of wanted) {
    const available = stock.get(key) ?? 0;
    if (line.qty > available) {
      const name = await productName(tx, line.productId);
      throw new InputError((t) =>
        t.errors.notEnoughStock(name ?? t.errors.thisProduct, line.size, available, line.qty),
      );
    }
  }
}

// Purchases

function parsePurchase(input: Input) {
  return {
    date: requireDate(input.date, "date"),
    supplier: requireText(input.supplier, "supplier"),
    note: optionalText(input.note),
    lines: requireLines(input.lines, (line) => ({
      productId: requireId(line.productId),
      size: requireSize(line.size),
      qty: requireAmount(line.qty, "quantity", 1),
      unitCost: requireAmount(line.unitCost, "buyPrice", 1),
      courier: requireDecimalAmount(line.courier, "courier"),
    })),
  };
}

export async function createPurchase(input: Input) {
  return run(async (db) => {
    const { lines, ...purchase } = parsePurchase(input);

    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(purchases)
        .values(purchase)
        .returning({ id: purchases.id });
      await tx
        .insert(purchaseItems)
        .values(lines.map((line) => ({ ...line, purchaseId: created.id })));
    });
  });
}

/** Stock and profit are worked out from these lines, so they follow the edit. */
export async function updatePurchase(id: number, input: Input) {
  return run(async (db) => {
    const { lines, ...purchase } = parsePurchase(input);
    requireId(id);

    await db.transaction(async (tx) => {
      const oldLines = await tx
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, id));

      const short = findStockShortage(await stockOnHand(tx), oldLines, lines);
      if (short) {
        const name = await productName(tx, short.productId);
        throw new InputError((t) =>
          t.errors.alreadySold(name ?? t.errors.thisProduct, short.size, short.shortage),
        );
      }

      await tx.update(purchases).set(purchase).where(eq(purchases.id, id));
      await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));
      await tx.insert(purchaseItems).values(lines.map((line) => ({ ...line, purchaseId: id })));
    });
  });
}

/** Swaps pieces of one product and size in a batch for another, and logs it. */
export async function exchangePurchaseItem(input: Input) {
  return run(async (db) => {
    const purchaseId = requireId(input.purchaseId);
    const date = requireDate(input.date, "date");
    const from = { productId: requireId(input.productId), size: requireSize(input.size) };
    const to = { productId: requireId(input.toProductId), size: requireSize(input.toSize) };
    const qty = requireAmount(input.qty, "quantity", 1);
    if (from.productId === to.productId && from.size === to.size) {
      throw new InputError((t) => t.exchange.sameError);
    }

    await db.transaction(async (tx) => {
      const oldLines = await tx
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, purchaseId))
        .orderBy(purchaseItems.id);
      const next = applyExchange(oldLines, from, to, qty);
      if (!next) {
        const max = oldLines
          .filter((line) => line.productId === from.productId && line.size === from.size)
          .reduce((sum, line) => sum + line.qty, 0);
        throw new InputError((t) => t.exchange.tooMany(max));
      }

      // Pieces already sold can't go back to the supplier.
      const short = findStockShortage(await stockOnHand(tx), oldLines, next);
      if (short) {
        const name = await productName(tx, short.productId);
        throw new InputError((t) =>
          t.errors.alreadySold(name ?? t.errors.thisProduct, short.size, short.shortage),
        );
      }

      await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId));
      await tx.insert(purchaseItems).values(
        next.map((line) => ({
          purchaseId,
          productId: line.productId,
          size: line.size,
          qty: line.qty,
          unitCost: line.unitCost,
          courier: line.courier,
        })),
      );
      await tx.insert(purchaseExchanges).values({
        purchaseId,
        date,
        fromProductId: from.productId,
        fromSize: from.size,
        toProductId: to.productId,
        toSize: to.size,
        qty,
      });
    });
  });
}

export async function deletePurchase(id: number) {
  return run(async (db) => {
    await db.transaction(async (tx) => {
      const lines = await tx
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, requireId(id)));

      if (findStockShortage(await stockOnHand(tx), lines, [])) {
        throw new InputError((t) => t.errors.purchaseSold);
      }
      await tx.delete(purchases).where(eq(purchases.id, id));
    });
  });
}

// Sales

export async function createSale(input: Input) {
  return run(async (db) => {
    const date = requireDate(input.date, "date");
    const customer = requireText(input.customer, "customer");
    const phone = optionalText(input.phone);
    const note = optionalText(input.note);
    const payment = parsePayment(input);
    const lines = requireLines(input.lines, parseSoldLine);

    await db.transaction(async (tx) => {
      await assertInStock(tx, lines);
      const [sale] = await tx
        .insert(sales)
        .values({
          date,
          customer,
          phone,
          note,
          ...payment,
          paidDate: payment.paymentStatus === "paid" ? date : null,
        })
        .returning({ id: sales.id });
      await tx.insert(saleItems).values(lines.map((line) => ({ ...line, saleId: sale.id })));
    });
  });
}

export async function markSalePaid(id: number) {
  return run(async (db) => {
    await db
      .update(sales)
      .set({ paymentStatus: "paid", expectedPayDate: null, paidDate: todayInDhaka() })
      .where(eq(sales.id, requireId(id)));
  });
}

export async function deleteSale(id: number) {
  return run(async (db) => {
    await db.transaction(async (tx) => {
      const [sale] = await tx.select().from(sales).where(eq(sales.id, requireId(id)));
      if (!sale) return;
      await tx.delete(sales).where(eq(sales.id, id));
      // A sale made from a pre-order puts that pre-order back in the waiting list.
      if (sale.preorderId) {
        await tx
          .update(preorders)
          .set({ status: "pending" })
          .where(eq(preorders.id, sale.preorderId));
      }
    });
  });
}

// Pre-orders

export async function createPreorder(input: Input) {
  return run(async (db) => {
    const date = requireDate(input.date, "date");
    const customer = requireText(input.customer, "customer");
    const phone = optionalText(input.phone);
    const note = optionalText(input.note);
    const paymentStatus = input.paymentStatus === "paid" ? ("paid" as const) : ("due" as const);
    const lines = requireLines(input.lines, parseSoldLine);

    await db.transaction(async (tx) => {
      const [preorder] = await tx
        .insert(preorders)
        .values({ date, customer, phone, note, paymentStatus })
        .returning({ id: preorders.id });
      await tx
        .insert(preorderItems)
        .values(lines.map((line) => ({ ...line, preorderId: preorder.id })));
    });
  });
}

/** Delivers a pre-order: stock goes down and it becomes a normal sale. */
export async function deliverPreorder(input: Input) {
  return run(async (db) => {
    const id = requireId(input.id);
    const date = requireDate(input.date, "date");
    const payment = parsePayment(input);

    await db.transaction(async (tx) => {
      const [preorder] = await tx.select().from(preorders).where(eq(preorders.id, id));
      if (!preorder || preorder.status !== "pending") {
        throw new InputError((t) => t.errors.preorderNotWaiting);
      }
      const lines = await tx
        .select()
        .from(preorderItems)
        .where(eq(preorderItems.preorderId, id));
      await assertInStock(tx, lines);

      const [sale] = await tx
        .insert(sales)
        .values({
          date,
          customer: preorder.customer,
          phone: preorder.phone,
          note: preorder.note,
          ...payment,
          paidDate: payment.paymentStatus === "paid" ? date : null,
          preorderId: id,
        })
        .returning({ id: sales.id });
      await tx.insert(saleItems).values(
        lines.map((line) => ({
          saleId: sale.id,
          productId: line.productId,
          size: line.size,
          qty: line.qty,
          unitPrice: line.unitPrice,
        })),
      );
      await tx.update(preorders).set({ status: "delivered" }).where(eq(preorders.id, id));
    });
  });
}

export async function markPreorderPaid(id: number) {
  return run(async (db) => {
    await db
      .update(preorders)
      .set({ paymentStatus: "paid" })
      .where(eq(preorders.id, requireId(id)));
  });
}

export async function setPreorderCancelled(id: number, cancelled: boolean) {
  return run(async (db) => {
    await db
      .update(preorders)
      .set({ status: cancelled ? "cancelled" : "pending" })
      .where(eq(preorders.id, requireId(id)));
  });
}

export async function deletePreorder(id: number) {
  return run(async (db) => {
    const [linked] = await db
      .select({ id: sales.id })
      .from(sales)
      .where(eq(sales.preorderId, requireId(id)));
    if (linked) throw new InputError((t) => t.errors.preorderDelivered);
    await db.delete(preorders).where(eq(preorders.id, id));
  });
}

// Products

function parseProduct(input: Input) {
  const sellPrices = input.sellPrices;
  if (!Array.isArray(sellPrices) || sellPrices.length === 0) {
    throw new InputError((t) => t.errors.needSellPrice);
  }
  const color = typeof input.color === "string" ? input.color : "";
  return {
    name: requireText(input.name, "productName"),
    color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#0F5C45",
    buyPrice: requireAmount(input.buyPrice, "buyPrice"),
    sellPrices: sellPrices.map((price) => requireAmount(price, "sellPrice")),
  };
}

async function assertNameFree(db: DB, name: string, ownId?: number) {
  const rows = await db.select({ id: products.id, name: products.name }).from(products);
  const clash = rows.find(
    (row) => row.id !== ownId && row.name.toLowerCase() === name.toLowerCase(),
  );
  if (clash) throw new InputError((t) => t.errors.nameTaken);
}

export async function createProduct(input: Input) {
  return run(async (db) => {
    const values = parseProduct(input);
    await assertNameFree(db, values.name);
    await db.insert(products).values(values);
  });
}

export async function updateProduct(id: number, input: Input) {
  return run(async (db) => {
    const values = parseProduct(input);
    await assertNameFree(db, values.name, requireId(id));
    await db.update(products).set(values).where(eq(products.id, id));
  });
}

export async function setProductArchived(id: number, archived: boolean) {
  return run(async (db) => {
    await db.update(products).set({ archived }).where(eq(products.id, requireId(id)));
  });
}

// Language

export async function setLanguage(lang: Lang) {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

// Login

export async function login(formData: FormData) {
  const token = sessionToken();
  if (!token || !credentialsMatch(formData.get("username"), formData.get("password"))) {
    redirect("/login?error=1");
  }
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/login");
}
