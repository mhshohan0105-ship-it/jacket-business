import Link from "next/link";
import type { ReactNode } from "react";
import { SIZES } from "@/lib/constants";
import { money } from "@/lib/format";

export const inputClass =
  "block w-full min-h-11 rounded-lg border border-line bg-card px-3 text-base text-ink placeholder:text-muted/70 focus:border-pitch focus:outline-none focus:ring-1 focus:ring-pitch";

export const labelClass = "block text-sm font-medium text-ink";

export function buttonClass(kind: "primary" | "secondary" | "quiet" | "danger" = "secondary") {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold disabled:opacity-50";
  const kinds = {
    primary: "bg-pitch text-white hover:bg-pitch-dark",
    secondary: "border border-line bg-card text-ink hover:bg-paper",
    quiet: "text-muted hover:bg-paper hover:text-ink",
    danger: "text-loss hover:bg-loss-soft",
  };
  return `${base} ${kinds[kind]}`;
}

export function PageHeader({
  title,
  action,
  back,
}: {
  title: string;
  action?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-5">
      {back && (
        <Link href={back.href} className="mb-1 inline-block text-sm text-muted hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        {action}
      </div>
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-card ${className}`}>{children}</div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "plain",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "plain" | "good" | "warn" | "bad";
}) {
  const tones = {
    plain: "text-ink",
    good: "text-pitch",
    warn: "text-due",
    bad: "text-loss",
  };
  return (
    <Card className="p-3.5 sm:p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={`num mt-0.5 text-xl font-bold sm:text-2xl ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "good" | "warn" | "bad" | "plain";
}) {
  const tones = {
    good: "bg-pitch-soft text-pitch-dark",
    warn: "bg-due-soft text-due",
    bad: "bg-loss-soft text-loss",
    plain: "bg-paper text-muted",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ColorDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card className="px-4 py-10 text-center text-sm text-muted">{children}</Card>
  );
}

export function Tabs({
  tabs,
  active,
}: {
  tabs: { href: string; label: string; key: string }[];
  active: string;
}) {
  return (
    <nav className="mb-4 flex gap-1 rounded-lg bg-line/60 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={`flex min-h-9 flex-1 items-center justify-center rounded-md px-2 text-sm font-medium ${
            tab.key === active ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

type LineItem = { id: number; productId: number; size: string; qty: number };

/** The jackets inside one purchase, sale or pre-order. */
export function LineItems<T extends LineItem>({
  items,
  products,
  price,
}: {
  items: T[];
  products: Map<number, { name: string; color: string }>;
  price: (item: T) => number;
}) {
  return (
    <ul className="space-y-1 text-sm">
      {items.map((item) => {
        const product = products.get(item.productId);
        return (
          <li key={item.id} className="flex items-center gap-2">
            <ColorDot color={product?.color ?? "#999"} />
            <span className="min-w-0 flex-1 truncate">
              {product?.name} <span className="font-semibold">{item.size}</span>
              <span className="num text-muted"> × {item.qty}</span>
            </span>
            <span className="num shrink-0 text-muted">{money(price(item))}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Product-by-size table. Fits a phone screen without sideways scrolling. */
export function SizeMatrix({
  products,
  cell,
  highlight,
  labels,
}: {
  products: { id: number; name: string; color: string }[];
  cell: (productId: number, size: string) => number;
  highlight?: (productId: number, size: string) => boolean;
  labels: { product: string; total: string };
}) {
  const rowTotal = (id: number) => SIZES.reduce((sum, size) => sum + cell(id, size), 0);
  const columnTotal = (size: string) => products.reduce((sum, p) => sum + cell(p.id, size), 0);

  return (
    <table className="num w-full table-fixed border-collapse text-sm">
      <thead>
        <tr className="border-b border-line text-xs text-muted">
          <th scope="col" className="px-3 py-2 text-left font-medium sm:px-4">
            {labels.product}
          </th>
          {SIZES.map((size) => (
            <th key={size} scope="col" className="w-10 py-2 text-center font-medium sm:w-16">
              {size}
            </th>
          ))}
          <th scope="col" className="w-12 py-2 pr-3 text-right font-medium sm:w-16 sm:pr-4">
            {labels.total}
          </th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id} className="border-b border-line last:border-b-0">
            <th scope="row" className="px-3 py-2.5 text-left font-medium sm:px-4">
              <span className="flex items-center gap-2">
                <ColorDot color={product.color} />
                <span className="truncate">{product.name}</span>
              </span>
            </th>
            {SIZES.map((size) => {
              const value = cell(product.id, size);
              const hot = highlight?.(product.id, size);
              return (
                <td
                  key={size}
                  className={`py-2.5 text-center ${
                    hot ? "font-bold text-loss" : value === 0 ? "text-muted/50" : ""
                  }`}
                >
                  {value}
                </td>
              );
            })}
            <td className="py-2.5 pr-3 text-right font-semibold sm:pr-4">{rowTotal(product.id)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-line bg-paper/60 font-semibold">
          <th scope="row" className="px-3 py-2.5 text-left font-semibold sm:px-4">
            {labels.total}
          </th>
          {SIZES.map((size) => (
            <td key={size} className="py-2.5 text-center">
              {columnTotal(size)}
            </td>
          ))}
          <td className="py-2.5 pr-3 text-right sm:pr-4">
            {products.reduce((sum, p) => sum + rowTotal(p.id), 0)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
