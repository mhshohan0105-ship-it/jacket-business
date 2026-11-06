import { describe, expect, it } from "vitest";
import {
  computeLedger,
  dueState,
  findStockShortage,
  landedUnitCost,
  splitCourier,
} from "./ledger";

const line = (qty: number, courier: number, unitCost = 1050) => ({
  productId: 1,
  size: "L",
  qty,
  unitCost,
  courier,
});

describe("landedUnitCost", () => {
  it("adds the per-piece courier share to the buying price", () => {
    expect(landedUnitCost(line(5, 200))).toBe(1090);
    expect(landedUnitCost(line(10, 200))).toBe(1070);
  });
});

describe("computeLedger", () => {
  it("costs sales from the oldest batch first, across batches", () => {
    const { saleLineCost, stock } = computeLedger(
      [line(5, 200), line(10, 200)],
      [{ id: 1, productId: 1, size: "L", qty: 6 }],
    );
    expect(saleLineCost.get(1)).toBe(5 * 1090 + 1070);
    expect(stock.get("1:L")).toEqual({ qty: 9, value: 9 * 1070 });
  });

  it("keeps variants apart", () => {
    const { stock } = computeLedger(
      [line(5, 0), { ...line(3, 0), size: "XL" }],
      [{ id: 1, productId: 1, size: "XL", qty: 1 }],
    );
    expect(stock.get("1:L")?.qty).toBe(5);
    expect(stock.get("1:XL")?.qty).toBe(2);
  });

  it("has no cost for a variant that was never bought", () => {
    const { saleLineCost } = computeLedger([], [{ id: 1, productId: 9, size: "M", qty: 2 }]);
    expect(saleLineCost.get(1)).toBe(0);
  });
});

describe("findStockShortage", () => {
  const variant = (size: string, qty: number) => ({ productId: 1, size, qty });
  // Bought 5 L, sold 2, so 3 are on hand.
  const stock = new Map([["1:L", 3]]);

  it("allows reducing a purchase down to what was sold", () => {
    expect(findStockShortage(stock, [variant("L", 5)], [variant("L", 2)])).toBeNull();
  });

  it("blocks reducing below what was sold", () => {
    expect(findStockShortage(stock, [variant("L", 5)], [variant("L", 1)])).toEqual({
      productId: 1,
      size: "L",
      shortage: 1,
    });
  });

  it("blocks moving sold pieces to another size", () => {
    expect(findStockShortage(stock, [variant("L", 5)], [variant("XL", 5)])?.shortage).toBe(2);
  });

  it("allows changing sizes that were not sold, and adding new ones", () => {
    const unsold = new Map([["1:L", 5]]);
    expect(findStockShortage(unsold, [variant("L", 5)], [variant("XL", 5)])).toBeNull();
  });

  it("counts several lines of the same size together", () => {
    expect(
      findStockShortage(stock, [variant("L", 5)], [variant("L", 1), variant("L", 1)]),
    ).toBeNull();
  });

  it("blocks deleting a purchase whose pieces were sold", () => {
    expect(findStockShortage(stock, [variant("L", 5)], [])?.shortage).toBe(2);
  });
});

describe("splitCourier", () => {
  it("splits by piece count", () => {
    expect(splitCourier(200, [5, 5])).toEqual([100, 100]);
    expect(splitCourier(200, [2, 8])).toEqual([40, 160]);
  });

  it("always adds back up to the total in whole taka", () => {
    const parts = splitCourier(200, [1, 3, 3]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(200);
    expect(parts.every(Number.isInteger)).toBe(true);
  });

  it("handles no pieces yet", () => {
    expect(splitCourier(200, [0, 0])).toEqual([0, 0]);
  });
});

describe("dueState", () => {
  const today = "2026-11-07";

  it("is overdue only after the expected date has passed", () => {
    const due = (expectedPayDate: string | null) => ({ paymentStatus: "due" as const, expectedPayDate });
    expect(dueState(due("2026-11-06"), today)).toBe("overdue");
    expect(dueState(due("2026-11-07"), today)).toBe("due");
    expect(dueState(due(null), today)).toBe("due");
  });

  it("ignores the date once paid", () => {
    expect(dueState({ paymentStatus: "paid", expectedPayDate: "2020-01-01" }, today)).toBe("paid");
  });
});
