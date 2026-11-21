"use client";

import { money } from "@/lib/format";
import { useT } from "./i18n";
import { inputClass, labelClass } from "./ui";

export type PaymentStatus = "paid" | "partial" | "due";

/**
 * Paid, part paid or due. Part paid asks how much arrived and shows what is left;
 * due and part paid can ask when the rest will come.
 */
export function PaymentFields({
  status,
  onStatus,
  allowPartial = false,
  total = 0,
  paidAmount = "",
  onPaidAmount,
  expectedDate = "",
  minDate,
  onExpectedDate,
}: {
  status: PaymentStatus;
  onStatus: (status: PaymentStatus) => void;
  allowPartial?: boolean;
  /** The sale's total, to show what a part payment leaves due. */
  total?: number;
  paidAmount?: string;
  onPaidAmount?: (amount: string) => void;
  expectedDate?: string;
  minDate?: string;
  /** Leave out to skip asking for the expected payment date. */
  onExpectedDate?: (date: string) => void;
}) {
  const t = useT();
  const option = (value: PaymentStatus, label: string, activeClass: string) => (
    <button
      type="button"
      aria-pressed={status === value}
      onClick={() => onStatus(value)}
      className={`min-h-11 flex-1 rounded-lg border px-2 text-sm font-semibold ${
        status === value ? activeClass : "border-line bg-card text-muted hover:bg-paper"
      }`}
    >
      {label}
    </button>
  );

  const left = total - (Number(paidAmount) || 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className={labelClass}>{t.payment.question}</p>
        <div className="mt-1 flex gap-2">
          {option("paid", t.payment.paid, "border-pitch bg-pitch-soft text-pitch-dark")}
          {allowPartial && option("partial", t.partial.option, "border-due bg-due-soft text-due")}
          {option("due", t.payment.due, "border-due bg-due-soft text-due")}
        </div>
      </div>
      {status === "partial" && onPaidAmount && (
        <div>
          <label htmlFor="paid-amount" className={labelClass}>
            {t.partial.amount}
          </label>
          <input
            id="paid-amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, total - 1)}
            required
            value={paidAmount}
            onChange={(event) => onPaidAmount(event.target.value)}
            className={`${inputClass} num mt-1`}
          />
          {total > 0 && (
            <p className={`num mt-1 text-xs ${left <= 0 ? "font-semibold text-loss" : "text-muted"}`}>
              {left <= 0 ? t.partial.tooMuch : t.partial.remaining(money(left))}
            </p>
          )}
        </div>
      )}
      {status !== "paid" && onExpectedDate && (
        <div>
          <label htmlFor="expected-date" className={labelClass}>
            {status === "partial" ? t.partial.remainingDate : t.payment.expectedDate}
          </label>
          <input
            id="expected-date"
            type="date"
            value={expectedDate}
            min={minDate}
            onChange={(event) => onExpectedDate(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </div>
      )}
    </div>
  );
}
