import { variantKey } from "./constants";

export type PurchaseLine = {
  productId: number;
  size: string;
  qty: number;
  unitCost: number;
  courier: number; // courier charge for the whole line
};

export type SaleLine = {
  id: number;
  productId: number;
  size: string;
  qty: number;
};

export type StockEntry = { qty: number; value: number };

/** What one piece really cost: buying price plus its share of the courier charge. */
export function landedUnitCost(line: Pick<PurchaseLine, "qty" | "unitCost" | "courier">) {
  return line.unitCost + line.courier / line.qty;
}

/**
 * Works out cost of goods sold first-in-first-out, so a batch with a cheaper
 * courier charge per piece gives the right profit on the pieces from that batch.
 * Both lists must already be in date order.
 */
export function computeLedger(purchases: PurchaseLine[], sales: SaleLine[]) {
  const lots = new Map<string, { remaining: number; cost: number }[]>();
  for (const line of purchases) {
    const key = variantKey(line.productId, line.size);
    const queue = lots.get(key) ?? [];
    queue.push({ remaining: line.qty, cost: landedUnitCost(line) });
    lots.set(key, queue);
  }

  const saleLineCost = new Map<number, number>();
  for (const sale of sales) {
    const queue = lots.get(variantKey(sale.productId, sale.size)) ?? [];
    let left = sale.qty;
    let cost = 0;
    for (const lot of queue) {
      if (left === 0) break;
      const take = Math.min(left, lot.remaining);
      lot.remaining -= take;
      cost += take * lot.cost;
      left -= take;
    }
    saleLineCost.set(sale.id, cost);
  }

  const stock = new Map<string, StockEntry>();
  for (const [key, queue] of lots) {
    stock.set(key, {
      qty: queue.reduce((sum, lot) => sum + lot.remaining, 0),
      value: queue.reduce((sum, lot) => sum + lot.remaining * lot.cost, 0),
    });
  }

  return { saleLineCost, stock };
}

type Variant = { productId: number; size: string; qty: number };

/**
 * Checks that changing what was bought still covers what was already sold.
 * `stock` is pieces on hand per variant. Returns the first variant that would
 * go negative and by how many pieces, or null if the change is safe.
 */
export function findStockShortage(
  stock: Map<string, number>,
  removed: Variant[],
  added: Variant[],
) {
  const after = new Map<string, Variant>();
  const apply = (line: Variant, sign: number) => {
    const key = variantKey(line.productId, line.size);
    const qty = after.get(key)?.qty ?? stock.get(key) ?? 0;
    after.set(key, { productId: line.productId, size: line.size, qty: qty + sign * line.qty });
  };
  removed.forEach((line) => apply(line, -1));
  added.forEach((line) => apply(line, 1));

  for (const variant of after.values()) {
    if (variant.qty < 0) {
      return { productId: variant.productId, size: variant.size, shortage: -variant.qty };
    }
  }
  return null;
}

/** Splits a batch's courier charge across lines by piece count, in whole taka. */
export function splitCourier(total: number, qtys: number[]): number[] {
  const pieces = qtys.reduce((sum, qty) => sum + qty, 0);
  if (pieces === 0) return qtys.map(() => 0);

  const exact = qtys.map((qty) => (total * qty) / pieces);
  const result = exact.map(Math.floor);
  let leftover = total - result.reduce((sum, value) => sum + value, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { index } of byRemainder) {
    if (leftover === 0) break;
    result[index] += 1;
    leftover -= 1;
  }
  return result;
}

export type DueState = "paid" | "due" | "overdue";

export function dueState(
  sale: { paymentStatus: "paid" | "due"; expectedPayDate: string | null },
  today: string,
): DueState {
  if (sale.paymentStatus === "paid") return "paid";
  return sale.expectedPayDate && sale.expectedPayDate < today ? "overdue" : "due";
}
