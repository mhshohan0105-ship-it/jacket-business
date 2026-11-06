"use client";

import { useT } from "./i18n";
import { inputClass, labelClass } from "./ui";

export type PaymentStatus = "paid" | "due";

/** Paid or due; choosing due reveals the expected payment date. */
export function PaymentFields({
  status,
  expectedDate,
  minDate,
  onStatus,
  onExpectedDate,
}: {
  status: PaymentStatus;
  expectedDate: string;
  minDate: string;
  onStatus: (status: PaymentStatus) => void;
  onExpectedDate: (date: string) => void;
}) {
  const t = useT();
  const option = (value: PaymentStatus, label: string, activeClass: string) => (
    <button
      type="button"
      aria-pressed={status === value}
      onClick={() => onStatus(value)}
      className={`min-h-11 flex-1 rounded-lg border text-sm font-semibold ${
        status === value ? activeClass : "border-line bg-card text-muted hover:bg-paper"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className={labelClass}>{t.payment.question}</p>
        <div className="mt-1 flex gap-2">
          {option("paid", t.payment.paid, "border-pitch bg-pitch-soft text-pitch-dark")}
          {option("due", t.payment.due, "border-due bg-due-soft text-due")}
        </div>
      </div>
      {status === "due" && (
        <div>
          <label htmlFor="expected-date" className={labelClass}>
            {t.payment.expectedDate}
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
