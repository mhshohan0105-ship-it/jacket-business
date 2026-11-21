import { describe, expect, it } from "vitest";
import { paidAtSale, paymentSummary } from "./payments";

describe("paymentSummary", () => {
  it("is due with nothing received", () => {
    expect(paymentSummary(3100, [])).toEqual({ paid: 0, due: 3100, state: "due" });
  });

  it("is partial while some is still owed, across several payments", () => {
    expect(paymentSummary(3100, [{ amount: 1000 }, { amount: 500 }])).toEqual({
      paid: 1500,
      due: 1600,
      state: "partial",
    });
  });

  it("is paid once everything has arrived", () => {
    expect(paymentSummary(3100, [{ amount: 1000 }, { amount: 2100 }]).state).toBe("paid");
  });

  it("never shows a negative balance", () => {
    expect(paymentSummary(100, [{ amount: 150 }]).due).toBe(0);
  });
});

describe("paidAtSale", () => {
  it("takes the whole amount when paid, nothing when due", () => {
    expect(paidAtSale("paid", 3100, 0)).toBe(3100);
    expect(paidAtSale("due", 3100, 500)).toBe(0);
  });

  it("takes a part that is less than the total", () => {
    expect(paidAtSale("partial", 3100, 1000)).toBe(1000);
  });

  it("rejects a 'part' that is zero, the whole amount or more", () => {
    expect(paidAtSale("partial", 3100, 0)).toBeNull();
    expect(paidAtSale("partial", 3100, 3100)).toBeNull();
    expect(paidAtSale("partial", 3100, 4000)).toBeNull();
  });
});
