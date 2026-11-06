"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createPreorder, createPurchase, createSale, updatePurchase } from "@/lib/actions";
import { SIZES, variantKey, type Size } from "@/lib/constants";
import { money, moneyExact } from "@/lib/format";
import { isEvenSplit, splitCourier } from "@/lib/ledger";
import { PaymentFields, type PaymentStatus } from "./payment-fields";
import { Card, buttonClass, inputClass, labelClass } from "./ui";

export type ProductOption = {
  id: number;
  name: string;
  buyPrice: number;
  sellPrices: number[];
};

type Kind = "purchase" | "sale" | "preorder";

type Line = {
  key: number;
  productId: number;
  size: Size;
  qty: string;
  price: string;
  courier: string;
};

const LIST_PAGE: Record<Kind, string> = {
  purchase: "/purchases",
  sale: "/sales",
  preorder: "/preorders",
};

/** Drops floating-point noise such as 200.00000000000003 from what is shown. */
function roundCourier(value: number) {
  return Number(value.toFixed(4));
}

export type PurchaseToEdit = {
  id: number;
  date: string;
  supplier: string;
  note: string;
  items: { productId: number; size: string; qty: number; unitCost: number; courier: number }[];
};

export function OrderForm({
  kind,
  products,
  stock,
  today,
  editing,
}: {
  kind: Kind;
  products: ProductOption[];
  /** Pieces in stock per variant, shown while selling. */
  stock?: Record<string, number>;
  today: string;
  /** An existing purchase to change, instead of adding a new one. */
  editing?: PurchaseToEdit;
}) {
  const router = useRouter();
  const nextKey = useRef((editing?.items.length ?? 1) + 1);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const defaultPrice = (product: ProductOption) =>
    String(kind === "purchase" ? product.buyPrice : product.sellPrices[0]);

  const stockOf = (productId: number, size: string) => stock?.[variantKey(productId, size)] ?? 0;

  /** When selling, start on a size that is actually in stock. */
  const sizeInStock = (productId: number, fallback: Size): Size =>
    SIZES.find((size) => stockOf(productId, size) > 0) ?? fallback;

  const [date, setDate] = useState(editing?.date ?? today);
  const [party, setParty] = useState(editing?.supplier ?? (kind === "purchase" ? "ঢাকা" : ""));
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState(editing?.note ?? "");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [expectedDate, setExpectedDate] = useState("");
  const [lines, setLines] = useState<Line[]>(() =>
    editing
      ? editing.items.map((item, index) => ({
          key: index + 1,
          productId: item.productId,
          size: item.size as Size,
          qty: String(item.qty),
          price: String(item.unitCost),
          courier: String(item.courier),
        }))
      : [
          {
            key: 1,
            productId: products[0].id,
            size: sizeInStock(products[0].id, "M"),
            qty: "1",
            price: defaultPrice(products[0]),
            courier: "",
          },
        ],
  );

  // While splitting automatically, each line's courier comes from the batch total.
  // An edit stays automatic if it was an even split; hand-typed charges stay as typed.
  const savedCouriers = editing?.items.map((item) => item.courier) ?? [];
  const [courierTotal, setCourierTotal] = useState(() =>
    editing ? String(roundCourier(savedCouriers.reduce((sum, value) => sum + value, 0))) : "",
  );
  const [courierAuto, setCourierAuto] = useState(
    () =>
      !editing ||
      isEvenSplit(
        savedCouriers,
        editing.items.map((item) => item.qty),
      ),
  );

  const qtyOf = (line: Line) => Number(line.qty) || 0;
  const autoSplit = splitCourier(Number(courierTotal) || 0, lines.map(qtyOf));
  const courierOf = (line: Line, index: number) =>
    courierAuto ? autoSplit[index] : Number(line.courier) || 0;

  const pieces = lines.reduce((sum, line) => sum + qtyOf(line), 0);
  const goods = lines.reduce((sum, line) => sum + qtyOf(line) * (Number(line.price) || 0), 0);
  const courierSum = lines.reduce((sum, line, index) => sum + courierOf(line, index), 0);

  const patch = (key: number, change: Partial<Line>) =>
    setLines((all) => all.map((line) => (line.key === key ? { ...line, ...change } : line)));

  const changeProduct = (key: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const change: Partial<Line> = { productId, price: defaultPrice(product) };
    if (kind === "sale") change.size = sizeInStock(productId, "M");
    patch(key, change);
  };

  const addLine = () => {
    // New line starts from the previous one: usually the same jacket in another size.
    const last = lines[lines.length - 1];
    const start = SIZES.indexOf(last.size) + 1;
    const inOrder = SIZES.map((_, offset) => SIZES[(start + offset) % SIZES.length]);
    const nextSize =
      (kind === "sale" && inOrder.find((size) => stockOf(last.productId, size) > 0)) || inOrder[0];
    setLines([
      ...lines,
      { ...last, key: nextKey.current++, size: nextSize, qty: "1", courier: "" },
    ]);
  };

  const editLineCourier = (key: number, value: string) => {
    // Hand-editing one line freezes the split, keeping the other lines as they were.
    setLines(
      lines.map((line, index) => ({
        ...line,
        courier: line.key === key ? value : String(courierOf(line, index)),
      })),
    );
    setCourierAuto(false);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    start(async () => {
      const shared = { date, note };
      let result;
      if (kind === "purchase") {
        const purchase = {
          ...shared,
          supplier: party,
          lines: lines.map((line, index) => ({
            productId: line.productId,
            size: line.size,
            qty: Number(line.qty),
            unitCost: Number(line.price),
            courier: courierOf(line, index),
          })),
        };
        result = editing
          ? await updatePurchase(editing.id, purchase)
          : await createPurchase(purchase);
      } else {
        const sold = {
          ...shared,
          customer: party,
          phone,
          lines: lines.map((line) => ({
            productId: line.productId,
            size: line.size,
            qty: Number(line.qty),
            unitPrice: Number(line.price),
          })),
        };
        result =
          kind === "sale"
            ? await createSale({ ...sold, paymentStatus, expectedPayDate: expectedDate })
            : await createPreorder(sold);
      }
      if (result.ok) router.push(LIST_PAGE[kind]);
      else setError(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card className="grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <label htmlFor="party" className={labelClass}>
            {kind === "purchase" ? "কোথা থেকে কেনা" : "ক্রেতার নাম"}
          </label>
          <input
            id="party"
            required
            value={party}
            onChange={(event) => setParty(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label htmlFor="date" className={labelClass}>
            তারিখ
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </div>
        {kind !== "purchase" && (
          <div>
            <label htmlFor="phone" className={labelClass}>
              ফোন (ইচ্ছা হলে)
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
        )}
      </Card>

      {kind === "purchase" && (
        <Card className="p-4">
          <label htmlFor="courier-total" className={labelClass}>
            এই চালানের মোট কুরিয়ার চার্জ
          </label>
          <input
            id="courier-total"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="যেমন 200"
            step="any"
            value={courierAuto ? courierTotal : String(roundCourier(courierSum))}
            onChange={(event) => {
              setCourierTotal(event.target.value);
              setCourierAuto(true);
            }}
            className={`${inputClass} num mt-1`}
          />
          {courierAuto && pieces > 0 && courierSum > 0 && (
            <p className="num mt-1.5 text-sm font-medium">
              {money(courierSum)} ÷ {pieces} পিস = প্রতি পিসে {moneyExact(courierSum / pieces)} কুরিয়ার
            </p>
          )}
          <p className="mt-1.5 text-xs text-muted">
            {courierAuto
              ? "সব পিসে সমান ভাগ হবে। চাইলে নিচে কোনো আইটেমের চার্জ আলাদা করে লিখতে পারবেন।"
              : "আপনি প্রতিটা আইটেমের চার্জ নিজে লিখছেন। এখানে নতুন টাকা লিখলে আবার সব পিসে সমান ভাগ হবে।"}
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {lines.map((line, index) => {
          const product = products.find((p) => p.id === line.productId);
          const available = stockOf(line.productId, line.size);
          const qty = qtyOf(line);
          const lineCourier = courierOf(line, index);
          return (
            <Card key={line.key} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted">আইটেম {index + 1}</p>
                {lines.length > 1 && (
                  <button
                    type="button"
                    aria-label={`আইটেম ${index + 1} বাদ দিন`}
                    onClick={() => setLines(lines.filter((l) => l.key !== line.key))}
                    className="-m-2 p-2 text-muted hover:text-loss"
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                )}
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`product-${line.key}`} className={labelClass}>
                    প্রোডাক্ট
                  </label>
                  <select
                    id={`product-${line.key}`}
                    value={line.productId}
                    onChange={(event) => changeProduct(line.key, Number(event.target.value))}
                    className={`${inputClass} mt-1`}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <fieldset>
                  <legend className={labelClass}>সাইজ</legend>
                  <div className="mt-1 grid grid-cols-4 gap-1.5">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        aria-pressed={line.size === size}
                        onClick={() => patch(line.key, { size })}
                        className={`min-h-11 rounded-lg border text-sm font-semibold ${
                          line.size === size
                            ? "border-pitch bg-pitch text-white"
                            : "border-line bg-card text-ink hover:bg-paper"
                        }`}
                      >
                        {size}
                        {kind === "sale" && (
                          <span className="num block text-xs font-normal opacity-80">
                            {stockOf(line.productId, size)} পিস
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor={`qty-${line.key}`} className={labelClass}>
                    কয় পিস
                  </label>
                  <div className="mt-1 flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="এক পিস কমান"
                      onClick={() => patch(line.key, { qty: String(Math.max(1, qty - 1)) })}
                      className={`${buttonClass("secondary")} w-11 shrink-0 !px-0`}
                    >
                      <Minus size={16} aria-hidden />
                    </button>
                    <input
                      id={`qty-${line.key}`}
                      type="number"
                      inputMode="numeric"
                      min="1"
                      required
                      value={line.qty}
                      onChange={(event) => patch(line.key, { qty: event.target.value })}
                      className={`${inputClass} num text-center`}
                    />
                    <button
                      type="button"
                      aria-label="এক পিস বাড়ান"
                      onClick={() => patch(line.key, { qty: String(qty + 1) })}
                      className={`${buttonClass("secondary")} w-11 shrink-0 !px-0`}
                    >
                      <Plus size={16} aria-hidden />
                    </button>
                  </div>
                  {kind === "sale" && (
                    <p className={`mt-1 text-xs ${qty > available ? "font-semibold text-loss" : "text-muted"}`}>
                      স্টকে আছে {available} পিস
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={`price-${line.key}`} className={labelClass}>
                    {kind === "purchase" ? "প্রতি পিস কেনার দাম" : "প্রতি পিস বিক্রির দাম"}
                  </label>
                  <input
                    id={`price-${line.key}`}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    required
                    value={line.price}
                    onChange={(event) => patch(line.key, { price: event.target.value })}
                    className={`${inputClass} num mt-1`}
                  />
                  {kind !== "purchase" && product && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {product.sellPrices.map((price) => (
                        <button
                          key={price}
                          type="button"
                          aria-pressed={line.price === String(price)}
                          onClick={() => patch(line.key, { price: String(price) })}
                          className={`num min-h-9 rounded-full border px-3 text-sm font-medium ${
                            line.price === String(price)
                              ? "border-pitch bg-pitch-soft text-pitch-dark"
                              : "border-line text-muted hover:bg-paper"
                          }`}
                        >
                          {price}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {kind === "purchase" && (
                  <div className="sm:col-span-2">
                    <label htmlFor={`courier-${line.key}`} className={labelClass}>
                      এই আইটেমের কুরিয়ার চার্জ
                    </label>
                    <input
                      id={`courier-${line.key}`}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="any"
                      value={courierAuto ? String(Number(lineCourier.toFixed(2))) : line.courier}
                      onChange={(event) => editLineCourier(line.key, event.target.value)}
                      className={`${inputClass} num mt-1`}
                    />
                    {qty > 0 && (
                      <p className="mt-1 text-xs text-muted">
                        কুরিয়ারসহ প্রতি পিসের খরচ:{" "}
                        <span className="num font-semibold text-ink">
                          {moneyExact((Number(line.price) || 0) + lineCourier / qty)}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        <button type="button" onClick={addLine} className={`${buttonClass("secondary")} w-full border-dashed`}>
          <Plus size={16} aria-hidden /> আরেকটা আইটেম যোগ করুন
        </button>
      </div>

      <Card className="space-y-3 p-4">
        {kind === "sale" && (
          <PaymentFields
            status={paymentStatus}
            expectedDate={expectedDate}
            minDate={date}
            onStatus={setPaymentStatus}
            onExpectedDate={setExpectedDate}
          />
        )}
        <div>
          <label htmlFor="note" className={labelClass}>
            নোট (ইচ্ছা হলে)
          </label>
          <input
            id="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </div>
      </Card>

      <Card className="p-4">
        <dl className="num space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">মোট পিস</dt>
            <dd>{pieces}</dd>
          </div>
          {kind === "purchase" && (
            <>
              <div className="flex justify-between">
                <dt className="text-muted">মালের দাম</dt>
                <dd>{money(goods)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">কুরিয়ার</dt>
                <dd>{moneyExact(courierSum)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>মোট</dt>
            <dd>{moneyExact(goods + (kind === "purchase" ? courierSum : 0))}</dd>
          </div>
        </dl>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-loss-soft px-3 py-2 text-sm text-loss">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className={`${buttonClass("primary")} mt-3 w-full`}>
          {pending ? "সেভ হচ্ছে..." : "সেভ করুন"}
        </button>
      </Card>
    </form>
  );
}
