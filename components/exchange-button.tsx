"use client";

import { Minus, Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { exchangePurchaseItem } from "@/lib/actions";
import { SIZES, type Size } from "@/lib/constants";
import { useT } from "./i18n";
import { buttonClass, inputClass, labelClass } from "./ui";

export type ExchangeOption = { productId: number; size: string; name: string; max: number };

/** Swap pieces of a batch for another product or size, from the purchases page. */
export function ExchangeButton({
  purchaseId,
  options,
  products,
  today,
}: {
  purchaseId: number;
  /** What can be swapped from this batch: pieces it has that are still in stock. */
  options: ExchangeOption[];
  products: { id: number; name: string }[];
  today: string;
}) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const [fromIndex, setFromIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [toProductId, setToProductId] = useState(options[0]?.productId ?? products[0]?.id);
  const [toSize, setToSize] = useState<Size>("M");
  const [date, setDate] = useState(today);

  const from = options[fromIndex];

  /** Start on the same product, next size up: the most common swap. */
  const resetFor = (index: number) => {
    const option = options[index];
    setFromIndex(index);
    setQty(1);
    setToProductId(option.productId);
    const next = SIZES[(SIZES.indexOf(option.size as Size) + 1) % SIZES.length];
    setToSize(next);
  };

  const open = () => {
    resetFor(0);
    setDate(today);
    setError("");
    dialog.current?.showModal();
  };

  const confirm = () => {
    setError("");
    start(async () => {
      const result = await exchangePurchaseItem({
        purchaseId,
        date,
        productId: from.productId,
        size: from.size,
        qty,
        toProductId,
        toSize,
      });
      if (result.ok) dialog.current?.close();
      else setError(result.error);
    });
  };

  return (
    <>
      <button type="button" className={buttonClass("secondary")} onClick={open}>
        {t.exchange.button}
      </button>
      <dialog
        ref={dialog}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-card p-5 text-ink"
      >
        <h2 className="text-lg font-bold">{t.exchange.title}</h2>
        <p className="mt-1 text-sm text-muted">{t.exchange.note}</p>

        {from && (
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor={`exchange-from-${purchaseId}`} className={labelClass}>
                {t.exchange.from}
              </label>
              <select
                id={`exchange-from-${purchaseId}`}
                value={fromIndex}
                onChange={(event) => resetFor(Number(event.target.value))}
                className={`${inputClass} mt-1`}
              >
                {options.map((option, index) => (
                  <option key={`${option.productId}:${option.size}`} value={index}>
                    {t.exchange.fromOption(option.name, option.size, option.max)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`exchange-qty-${purchaseId}`} className={labelClass}>
                {t.exchange.qty}
              </label>
              <div className="mt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={t.form.decrease}
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className={`${buttonClass("secondary")} w-11 shrink-0 !px-0`}
                >
                  <Minus size={16} aria-hidden />
                </button>
                <input
                  id={`exchange-qty-${purchaseId}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={from.max}
                  value={qty}
                  onChange={(event) => setQty(Number(event.target.value) || 1)}
                  className={`${inputClass} num text-center`}
                />
                <button
                  type="button"
                  aria-label={t.form.increase}
                  onClick={() => setQty(Math.min(from.max, qty + 1))}
                  className={`${buttonClass("secondary")} w-11 shrink-0 !px-0`}
                >
                  <Plus size={16} aria-hidden />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor={`exchange-to-${purchaseId}`} className={labelClass}>
                {t.exchange.to}
              </label>
              <select
                id={`exchange-to-${purchaseId}`}
                value={toProductId}
                onChange={(event) => setToProductId(Number(event.target.value))}
                className={`${inputClass} mt-1`}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5" role="group" aria-label={t.form.size}>
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={toSize === size}
                    onClick={() => setToSize(size)}
                    className={`min-h-11 rounded-lg border text-sm font-semibold ${
                      toSize === size
                        ? "border-pitch bg-pitch text-white"
                        : "border-line bg-card text-ink hover:bg-paper"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor={`exchange-date-${purchaseId}`} className={labelClass}>
                {t.exchange.date}
              </label>
              <input
                id={`exchange-date-${purchaseId}`}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={`${inputClass} mt-1`}
              />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-loss-soft px-3 py-2 text-sm text-loss">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={buttonClass("quiet")} onClick={() => dialog.current?.close()}>
            {t.exchange.cancel}
          </button>
          <button type="button" disabled={pending || !from} className={buttonClass("primary")} onClick={confirm}>
            {pending ? t.exchange.working : t.exchange.confirm}
          </button>
        </div>
      </dialog>
    </>
  );
}
