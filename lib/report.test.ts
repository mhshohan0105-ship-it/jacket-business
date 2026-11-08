import { describe, expect, it } from "vitest";
import { bestProduct, preorderDemand, productReport } from "./report";

const sold = (productId: number, qty: number, unitPrice: number, cost: number) => ({
  productId,
  qty,
  unitPrice,
  cost,
});

describe("productReport", () => {
  it("adds up each product across sales", () => {
    const [row] = productReport([sold(1, 2, 1500, 2140), sold(1, 1, 1650, 1070)], [1]);
    expect(row).toEqual({ productId: 1, pieces: 3, revenue: 4650, cost: 3210, profit: 1440 });
  });

  it("puts the most pieces sold first, even with less profit", () => {
    const rows = productReport([sold(1, 2, 2000, 2000), sold(2, 3, 1100, 3000)], [1, 2]);
    expect(rows.map((row) => row.productId)).toEqual([2, 1]);
  });

  it("breaks a tie on pieces by profit", () => {
    const rows = productReport([sold(1, 2, 1500, 2100), sold(2, 2, 1650, 2100)], [1, 2]);
    expect(rows.map((row) => row.productId)).toEqual([2, 1]);
  });

  it("keeps unsold products with zeros", () => {
    const rows = productReport([sold(1, 1, 1500, 1000)], [1, 2]);
    expect(rows[1]).toMatchObject({ productId: 2, pieces: 0, profit: 0 });
  });

  it("includes a sold product that is no longer listed", () => {
    const rows = productReport([sold(9, 1, 1500, 1000)], [1]);
    expect(rows.map((row) => row.productId)).toEqual([9, 1]);
  });

  it("shows a loss as negative profit", () => {
    expect(productReport([sold(1, 1, 1000, 1070)], [1])[0].profit).toBe(-70);
  });
});

describe("preorderDemand", () => {
  const order = (paymentStatus: "paid" | "due", ...items: [number, string, number][]) => ({
    paymentStatus,
    items: items.map(([productId, size, qty]) => ({ productId, size, qty })),
  });

  it("adds up pieces per product and size across orders", () => {
    const demand = preorderDemand([
      order("due", [1, "L", 2], [2, "XL", 1]),
      order("paid", [1, "L", 3]),
    ]);
    expect(demand.cells.get("1:L")).toBe(5);
    expect(demand.cells.get("2:XL")).toBe(1);
    expect(demand.pieces).toBe(6);
    expect(demand.max).toBe(5);
    expect(demand.productIds).toEqual([1, 2]);
  });

  it("counts paid and due orders", () => {
    const demand = preorderDemand([order("due"), order("due"), order("paid")]);
    expect(demand).toMatchObject({ orders: 3, paid: 1, due: 2 });
  });

  it("is empty with no orders", () => {
    expect(preorderDemand([])).toMatchObject({ pieces: 0, orders: 0, max: 0, productIds: [] });
  });
});

describe("bestProduct", () => {
  it("is empty until something sells", () => {
    expect(bestProduct(productReport([], [1, 2]))).toBeNull();
    expect(bestProduct([])).toBeNull();
  });

  it("is the top seller", () => {
    const rows = productReport([sold(1, 1, 1500, 1000), sold(2, 4, 1500, 4000)], [1, 2]);
    expect(bestProduct(rows)?.productId).toBe(2);
  });
});
