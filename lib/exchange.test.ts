import { describe, expect, it } from "vitest";
import { applyExchange, type PurchaseLine } from "./exchange";
import { landedUnitCost, splitCourier } from "./ledger";

const L = { productId: 1, size: "L" };
const XL = { productId: 1, size: "XL" };
const brazilM = { productId: 2, size: "M" };

// Like the real first batch: 200 taka courier over 15 pieces.
function batch(): PurchaseLine[] {
  const qtys = [5, 3, 7];
  const couriers = splitCourier(200, qtys);
  return [
    { ...L, qty: 5, unitCost: 1050, courier: couriers[0] },
    { ...XL, qty: 3, unitCost: 1050, courier: couriers[1] },
    { productId: 3, size: "M", qty: 7, unitCost: 1050, courier: couriers[2] },
  ];
}

const totals = (lines: PurchaseLine[]) => ({
  pieces: lines.reduce((sum, line) => sum + line.qty, 0),
  courier: lines.reduce((sum, line) => sum + line.courier, 0),
});

describe("applyExchange", () => {
  it("moves pieces into an existing line, keeping their cost", () => {
    const next = applyExchange(batch(), L, XL, 1)!;
    expect(next.find((line) => line.size === "L")?.qty).toBe(4);
    expect(next.find((line) => line.size === "XL")?.qty).toBe(4);
    next.forEach((line) => expect(landedUnitCost(line)).toBeCloseTo(1050 + 200 / 15, 2));
  });

  it("adds a new line for a product the batch didn't have", () => {
    const next = applyExchange(batch(), L, brazilM, 2)!;
    expect(next.find((line) => line.productId === 2)).toMatchObject({ size: "M", qty: 2, unitCost: 1050 });
    expect(landedUnitCost(next.find((line) => line.productId === 2)!)).toBeCloseTo(1063.33, 2);
  });

  it("drops a line that is fully swapped away", () => {
    const next = applyExchange(batch(), XL, brazilM, 3)!;
    expect(next.some((line) => line.size === "XL")).toBe(false);
  });

  it("never changes the batch's pieces or courier total", () => {
    const before = totals(batch());
    const after = totals(applyExchange(batch(), L, brazilM, 5)!);
    expect(after.pieces).toBe(before.pieces);
    expect(after.courier).toBeCloseTo(before.courier, 6);
  });

  it("refuses more pieces than the batch has", () => {
    expect(applyExchange(batch(), L, XL, 6)).toBeNull();
    expect(applyExchange(batch(), brazilM, XL, 1)).toBeNull();
    expect(applyExchange(batch(), L, XL, 0)).toBeNull();
  });

  it("leaves the original lines untouched", () => {
    const lines = batch();
    applyExchange(lines, L, XL, 2);
    expect(lines[0].qty).toBe(5);
  });
});
