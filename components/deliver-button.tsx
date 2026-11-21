"use client";

import { useRef, useState, useTransition } from "react";
import { deliverPreorder } from "@/lib/actions";
import { useT } from "./i18n";
import { PaymentFields, type PaymentStatus } from "./payment-fields";
import { buttonClass, inputClass, labelClass } from "./ui";

export function DeliverButton({
  id,
  customer,
  today,
  paymentStatus,
  total,
}: {
  id: number;
  customer: string;
  today: string;
  total: number;
  /** What the pre-order already says, so a paid pre-order becomes a paid sale. */
  paymentStatus: "paid" | "due";
}) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState<PaymentStatus>(paymentStatus);
  const [expectedDate, setExpectedDate] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const confirm = () => {
    setError("");
    start(async () => {
      const result = await deliverPreorder({
        id,
        date,
        paymentStatus: status,
        paidAmount: Number(paidAmount),
        expectedPayDate: expectedDate,
      });
      if (result.ok) dialog.current?.close();
      else setError(result.error);
    });
  };

  return (
    <>
      <button
        type="button"
        className={buttonClass("primary")}
        onClick={() => {
          // Start from the pre-order's current payment, which may have changed since this loaded.
          setStatus(paymentStatus);
          setPaidAmount("");
          setError("");
          dialog.current?.showModal();
        }}
      >
        {t.preorders.deliver}
      </button>
      <dialog
        ref={dialog}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-card p-5 text-ink"
      >
        <h2 className="text-lg font-bold">{t.preorders.deliverTitle(customer)}</h2>
        <p className="mt-1 text-sm text-muted">{t.preorders.deliverNote}</p>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor={`deliver-date-${id}`} className={labelClass}>
              {t.preorders.deliverDate}
            </label>
            <input
              id={`deliver-date-${id}`}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
          <PaymentFields
            status={status}
            onStatus={setStatus}
            allowPartial
            total={total}
            paidAmount={paidAmount}
            onPaidAmount={setPaidAmount}
            expectedDate={expectedDate}
            minDate={date}
            onExpectedDate={setExpectedDate}
          />
        </div>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-loss-soft px-3 py-2 text-sm text-loss">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={buttonClass("quiet")} onClick={() => dialog.current?.close()}>
            {t.preorders.keep}
          </button>
          <button type="button" disabled={pending} className={buttonClass("primary")} onClick={confirm}>
            {pending ? t.preorders.working : t.preorders.confirm}
          </button>
        </div>
      </dialog>
    </>
  );
}
