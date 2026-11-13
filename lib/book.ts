import { asc, desc } from "drizzle-orm";
import { getDb } from "./db/client";
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
import { computeLedger, landedUnitCost } from "./ledger";

export type Product = typeof products.$inferSelect;

function groupBy<T>(rows: T[], key: (row: T) => number) {
  const groups = new Map<number, T[]>();
  for (const row of rows) {
    const id = key(row);
    groups.set(id, [...(groups.get(id) ?? []), row]);
  }
  return groups;
}

/** Loads the whole book. Small enough for one shop that this stays fast. */
export async function loadBook() {
  const db = await getDb();
  const [
    productRows,
    purchaseRows,
    purchaseItemRows,
    saleRows,
    saleItemRows,
    preorderRows,
    preorderItemRows,
    exchangeRows,
  ] = await Promise.all([
    db.select().from(products).orderBy(asc(products.id)),
    db.select().from(purchases).orderBy(asc(purchases.date), asc(purchases.id)),
    db.select().from(purchaseItems).orderBy(asc(purchaseItems.id)),
    db.select().from(sales).orderBy(asc(sales.date), asc(sales.id)),
    db.select().from(saleItems).orderBy(asc(saleItems.id)),
    db.select().from(preorders).orderBy(desc(preorders.date), desc(preorders.id)),
    db.select().from(preorderItems).orderBy(asc(preorderItems.id)),
    db.select().from(purchaseExchanges).orderBy(asc(purchaseExchanges.date), asc(purchaseExchanges.id)),
  ]);

  const purchaseLines = groupBy(purchaseItemRows, (row) => row.purchaseId);
  const saleLines = groupBy(saleItemRows, (row) => row.saleId);
  const preorderLines = groupBy(preorderItemRows, (row) => row.preorderId);
  const exchangesByPurchase = groupBy(exchangeRows, (row) => row.purchaseId);

  const { saleLineCost, stock } = computeLedger(
    purchaseRows.flatMap((purchase) => purchaseLines.get(purchase.id) ?? []),
    saleRows.flatMap((sale) => saleLines.get(sale.id) ?? []),
  );

  const purchaseList = purchaseRows.map((purchase) => {
    const items = purchaseLines.get(purchase.id) ?? [];
    const goods = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
    const courier = items.reduce((sum, item) => sum + item.courier, 0);
    return {
      ...purchase,
      exchanges: exchangesByPurchase.get(purchase.id) ?? [],
      items: items.map((item) => ({ ...item, landed: landedUnitCost(item) })),
      goods,
      courier,
      total: goods + courier,
      pieces: items.reduce((sum, item) => sum + item.qty, 0),
    };
  });

  const saleList = saleRows.map((sale) => {
    const items = saleLines.get(sale.id) ?? [];
    const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const costedItems = items.map((item) => ({ ...item, cost: saleLineCost.get(item.id) ?? 0 }));
    const cost = costedItems.reduce((sum, item) => sum + item.cost, 0);
    return {
      ...sale,
      items: costedItems,
      total,
      cost,
      profit: total - cost,
      pieces: items.reduce((sum, item) => sum + item.qty, 0),
    };
  });

  const preorderList = preorderRows.map((preorder) => {
    const items = preorderLines.get(preorder.id) ?? [];
    return {
      ...preorder,
      items,
      total: items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0),
      pieces: items.reduce((sum, item) => sum + item.qty, 0),
    };
  });

  return {
    products: productRows,
    productById: new Map(productRows.map((product) => [product.id, product])),
    stock,
    // Newest first for display.
    purchases: purchaseList.reverse(),
    sales: saleList.reverse(),
    preorders: preorderList,
  };
}

export type Book = Awaited<ReturnType<typeof loadBook>>;
export type SaleRow = Book["sales"][number];
export type PurchaseRow = Book["purchases"][number];
export type PreorderRow = Book["preorders"][number];

/** Products worth showing: active ones, plus archived ones that still hold stock. */
export function visibleProducts(book: Book) {
  return book.products.filter(
    (product) =>
      !product.archived ||
      [...book.stock].some(
        ([key, entry]) => key.startsWith(`${product.id}:`) && entry.qty > 0,
      ),
  );
}
