export type PurchaseLine = {
  productId: number;
  size: string;
  qty: number;
  unitCost: number;
  courier: number; // for the whole line
};

type Variant = { productId: number; size: string };

const round4 = (value: number) => Math.round(value * 10_000) / 10_000;
const same = (line: Variant, variant: Variant) =>
  line.productId === variant.productId && line.size === variant.size;

/**
 * Swaps pieces of one product and size in a purchase for another, as when the
 * supplier takes some back. Each moved piece keeps its buying price and its share
 * of the courier, so its real cost does not change. Returns null if the purchase
 * doesn't have that many pieces to swap.
 */
export function applyExchange(
  lines: PurchaseLine[],
  from: Variant,
  to: Variant,
  qty: number,
): PurchaseLine[] | null {
  const available = lines.filter((line) => same(line, from)).reduce((sum, l) => sum + l.qty, 0);
  if (qty < 1 || qty > available) return null;

  const next = lines.map((line) => ({ ...line }));
  const moved: { qty: number; unitCost: number; courier: number }[] = [];
  let left = qty;

  for (const line of next) {
    if (left === 0) break;
    if (!same(line, from)) continue;
    const take = Math.min(left, line.qty);
    const courier = round4((line.courier * take) / line.qty);
    line.qty -= take;
    line.courier = round4(line.courier - courier);
    moved.push({ qty: take, unitCost: line.unitCost, courier });
    left -= take;
  }

  const result = next.filter((line) => line.qty > 0);
  for (const chunk of moved) {
    // Join a line that already holds the new size at the same price.
    const target = result.find((line) => same(line, to) && line.unitCost === chunk.unitCost);
    if (target) {
      target.qty += chunk.qty;
      target.courier = round4(target.courier + chunk.courier);
    } else {
      result.push({ ...to, ...chunk });
    }
  }
  return result;
}
