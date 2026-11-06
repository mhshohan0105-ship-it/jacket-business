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

/** The best seller, or null until something has been sold. */
export function bestProduct(rows: ProductRow[]) {
  return rows[0] && rows[0].pieces > 0 ? rows[0] : null;
}
