export type PaymentState = "paid" | "partial" | "due";

/** How much of a sale is paid, from the payments received so far. */
export function paymentSummary(total: number, payments: { amount: number }[]) {
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const due = Math.max(0, total - paid);
  const state: PaymentState = due === 0 ? "paid" : paid > 0 ? "partial" : "due";
  return { paid, due, state };
}

/**
 * What arrives at the moment of sale: everything, a part, or nothing.
 * Returns null when a part is not actually less than the total.
 */
export function paidAtSale(choice: unknown, total: number, partialAmount: number) {
  if (choice === "due") return 0;
  if (choice === "partial") return partialAmount > 0 && partialAmount < total ? partialAmount : null;
  return total;
}
