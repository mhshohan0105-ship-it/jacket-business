import { describe, expect, it } from "vitest";
import { bestProduct, productReport } from "./report";

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
