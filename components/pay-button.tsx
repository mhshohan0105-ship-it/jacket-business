"use client";

import { useRef, useState, useTransition } from "react";
import { recordSalePayment } from "@/lib/actions";
import { money } from "@/lib/format";
import { useT } from "./i18n";
import { buttonClass, inputClass, labelClass } from "./ui";

/** Record money received for a sale later: the whole balance or another part. */
export function PayButton({
  saleId,
  customer,
  due,
  today,
}: {
  saleId: number;
  customer: string;
  due: number;
  today: string;
}) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(String(due));
  const [date, setDate] = useState(today);

  const open = () => {
    setAmount(String(due));
    setDate(today);
    setError("");
    dialog.current?.showModal();
  };

  const save = () => {
    setError("");
    start(async () => {
      const result = await recordSalePayment({ saleId, amount: Number(amount), date });
      if (result.ok) dialog.current?.close();
      else setError(result.error);
    });
  };

  return (
    <>
      <button type="button" className={buttonClass("primary")} onClick={open}>
        {t.sales.gotPaid}
      </button>
      <dialog
        ref={dialog}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-card p-5 text-ink"
      >
        <h2 className="text-lg font-bold">{t.partial.payTitle(customer)}</h2>
        <p className="num mt-1 text-sm text-muted">{t.partial.payNote(money(due))}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`pay-amount-${saleId}`} className={labelClass}>
              {t.partial.payAmount}
            </label>
            <input
              id={`pay-amount-${saleId}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={due}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={`${inputClass} num mt-1`}
            />
            {Number(amount) > 0 && Number(amount) < due && (
              <p className="num mt-1 text-xs text-muted">
                {t.partial.remaining(money(due - Number(amount)))}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`pay-date-${saleId}`} className={labelClass}>
              {t.partial.payDate}
            </label>
            <input
              id={`pay-date-${saleId}`}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-loss-soft px-3 py-2 text-sm text-loss">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={buttonClass("quiet")} onClick={() => dialog.current?.close()}>
            {t.partial.payCancel}
          </button>
          <button type="button" disabled={pending} className={buttonClass("primary")} onClick={save}>
            {pending ? t.form.saving : t.partial.paySave}
          </button>
        </div>
      </dialog>
    </>
  );
}
