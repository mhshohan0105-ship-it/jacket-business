import { SIZES, variantKey } from "@/lib/constants";
import type { Messages } from "@/lib/i18n/messages";
import type { preorderDemand } from "@/lib/report";
import { ColorDot } from "./ui";

type Demand = ReturnType<typeof preorderDemand>;

// One hue, light to dark: more pieces, deeper green. Every cell also shows its number.
const STEPS = [
  { min: 0.8, cell: "bg-[#0A4433] text-white" },
  { min: 0.6, cell: "bg-[#0F5C45] text-white" },
  { min: 0.4, cell: "bg-[#4E9C78] text-white" },
  { min: 0.2, cell: "bg-[#A7D1BA] text-ink" },
  { min: 0, cell: "bg-[#DCEDE3] text-ink" },
];

function cellClass(value: number, max: number) {
  if (value === 0) return "bg-paper text-muted/40";
  const share = value / max;
  return (STEPS.find((step) => share >= step.min) ?? STEPS[STEPS.length - 1]).cell;
}

/** Pieces wanted per product and size, as a shaded grid that reads well in a screenshot. */
export function PreorderChart({
  demand,
  products,
  t,
}: {
  demand: Demand;
  products: Map<number, { name: string; color: string }>;
  t: Messages;
}) {
  if (demand.pieces === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted">{t.preorders.chartEmpty}</p>;
  }

  const qty = (productId: number, size: string) => demand.cells.get(variantKey(productId, size)) ?? 0;
  const rowTotal = (productId: number) => SIZES.reduce((sum, size) => sum + qty(productId, size), 0);
  const columnTotal = (size: string) =>
    demand.productIds.reduce((sum, productId) => sum + qty(productId, size), 0);

  return (
    <table className="num w-full table-fixed border-separate border-spacing-[3px] text-sm">
      <thead>
        <tr className="text-xs text-muted">
          <th scope="col" className="px-1 py-1 text-left font-medium">
            {t.common.product}
          </th>
          {SIZES.map((size) => (
            <th key={size} scope="col" className="w-10 py-1 text-center font-semibold text-ink sm:w-16">
              {size}
            </th>
          ))}
          <th scope="col" className="w-9 py-1 text-right font-medium sm:w-14">
            {t.common.total}
          </th>
        </tr>
      </thead>
      <tbody>
        {demand.productIds.map((productId) => {
          const product = products.get(productId);
          return (
            <tr key={productId}>
              <th scope="row" className="px-1 text-left font-medium">
                {/* Names wrap instead of being cut off, so a screenshot stays readable. */}
                <span className="flex items-center gap-1.5">
                  <ColorDot color={product?.color ?? "#999"} />
                  <span className="break-words leading-tight">{product?.name}</span>
                </span>
              </th>
              {SIZES.map((size) => {
                const value = qty(productId, size);
                return (
                  <td
                    key={size}
                    title={t.preorders.cellTitle(product?.name ?? "", size, t.pcs(value))}
                    className={`h-11 rounded-md text-center text-base font-bold ${cellClass(value, demand.max)}`}
                  >
                    {value}
                  </td>
                );
              })}
              <td className="pr-1 text-right font-bold">{rowTotal(productId)}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="font-bold">
          <th scope="row" className="px-1 pt-1.5 text-left">
            {t.common.total}
          </th>
          {SIZES.map((size) => (
            <td key={size} className="pt-1.5 text-center">
              {columnTotal(size)}
            </td>
          ))}
          <td className="pt-1.5 pr-1 text-right text-pitch">{demand.pieces}</td>
        </tr>
      </tfoot>
    </table>
  );
}
