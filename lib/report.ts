type SoldItem = { productId: number; qty: number; unitPrice: number; cost: number };

export type ProductRow = {
  productId: number;
  pieces: number;
  revenue: number;
  cost: number;
  profit: number;
};

/** Totals per product, most pieces sold first; ties go to the higher profit. */
export function productReport(items: SoldItem[], productIds: number[]): ProductRow[] {
  const rows = new Map<number, ProductRow>();
  const rowFor = (productId: number) => {
    const row = rows.get(productId) ?? { productId, pieces: 0, revenue: 0, cost: 0, profit: 0 };
    rows.set(productId, row);
    return row;
  };

  productIds.forEach(rowFor);
  for (const item of items) {
    const row = rowFor(item.productId);
    const revenue = item.qty * item.unitPrice;
    row.pieces += item.qty;
    row.revenue += revenue;
    row.cost += item.cost;
    row.profit += revenue - item.cost;
  }

  return [...rows.values()].sort((a, b) => b.pieces - a.pieces || b.profit - a.profit);
}

type WaitingOrder = {
  paymentStatus: "paid" | "due";
  items: { productId: number; size: string; qty: number }[];
};

/** What waiting pre-orders add up to: pieces per product and size. */
export function preorderDemand(orders: WaitingOrder[]) {
  const cells = new Map<string, number>();
  const productIds: number[] = [];
  let pieces = 0;

  for (const order of orders) {
    for (const item of order.items) {
      const key = `${item.productId}:${item.size}`;
      cells.set(key, (cells.get(key) ?? 0) + item.qty);
      if (!productIds.includes(item.productId)) productIds.push(item.productId);
      pieces += item.qty;
    }
  }

  return {
    cells,
    productIds,
    pieces,
    orders: orders.length,
    paid: orders.filter((order) => order.paymentStatus === "paid").length,
    due: orders.filter((order) => order.paymentStatus === "due").length,
    max: Math.max(0, ...cells.values()),
  };
}

/** The best seller, or null until something has been sold. */
export function bestProduct(rows: ProductRow[]) {
  return rows[0] && rows[0].pieces > 0 ? rows[0] : null;
}
