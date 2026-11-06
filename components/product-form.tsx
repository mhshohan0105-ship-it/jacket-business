"use client";

import { useState, useTransition } from "react";
import { createProduct, updateProduct } from "@/lib/actions";
import { buttonClass, inputClass, labelClass } from "./ui";

type Initial = {
  id: number;
  name: string;
  color: string;
  buyPrice: number;
  sellPrices: number[];
};

export function ProductForm({ product, onDone }: { product?: Initial; onDone?: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(product?.name ?? "");
  const [color, setColor] = useState(product?.color ?? "#0F5C45");
  const [buyPrice, setBuyPrice] = useState(String(product?.buyPrice ?? 1050));
  const [sellPrices, setSellPrices] = useState(
    (product?.sellPrices ?? [1500, 1550, 1600, 1650]).join(", "),
  );
  const idPrefix = `product-${product?.id ?? "new"}`;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    start(async () => {
      const values = {
        name,
        color,
        buyPrice: Number(buyPrice),
        sellPrices: sellPrices
          .split(/[,\s]+/)
          .filter(Boolean)
          .map(Number),
      };
      const result = product ? await updateProduct(product.id, values) : await createProduct(values);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      if (!product) setName("");
      onDone?.();
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={`${idPrefix}-name`} className={labelClass}>
          নাম
        </label>
        <div className="mt-1 flex gap-2">
          <input
            aria-label="রঙ"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-11 w-11 shrink-0 rounded-lg border border-line bg-card p-1"
          />
          <input
            id={`${idPrefix}-name`}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-buy`} className={labelClass}>
          কেনার দাম
        </label>
        <input
          id={`${idPrefix}-buy`}
          type="number"
          inputMode="numeric"
          min="1"
          required
          value={buyPrice}
          onChange={(event) => setBuyPrice(event.target.value)}
          className={`${inputClass} num mt-1`}
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-sell`} className={labelClass}>
          বিক্রির দামগুলো (কমা দিয়ে আলাদা করে)
        </label>
        <input
          id={`${idPrefix}-sell`}
          required
          inputMode="numeric"
          value={sellPrices}
          onChange={(event) => setSellPrices(event.target.value)}
          className={`${inputClass} num mt-1`}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-loss sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        {saved && <p role="status" className="text-sm text-pitch">সেভ হয়েছে</p>}
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "সেভ হচ্ছে..." : product ? "সেভ করুন" : "যোগ করুন"}
        </button>
      </div>
    </form>
  );
}
