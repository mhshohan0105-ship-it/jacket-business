import { Trophy } from "lucide-react";
import { money, moneyExact } from "@/lib/format";
import type { Messages } from "@/lib/i18n/messages";
import { bestProduct, type ProductRow } from "@/lib/report";
import { Card, ColorDot } from "./ui";

type ProductNames = Map<number, { name: string; color: string }>;

function profitClass(profit: number) {
  return profit < 0 ? "text-loss" : profit > 0 ? "text-pitch" : "";
}

/** Home page: everything bought against everything sold, plus the best seller. */
export function OverallReport({
  bought,
  sold,
  stockPieces,
  stockValue,
  rows,
  products,
  t,
}: {
  bought: number;
  sold: number;
  stockPieces: number;
  stockValue: number;
  rows: ProductRow[];
  products: ProductNames;
  t: Messages;
}) {
  const result = sold - bought;
  const best = bestProduct(rows);
  const bestInfo = best && products.get(best.productId);

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-lg font-semibold">{t.report.title}</h2>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <dl className="num space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t.home.totalSales}</dt>
              <dd>{moneyExact(sold)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t.report.boughtWithCourier}</dt>
              <dd>− {moneyExact(bought)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-2 text-base font-bold">
              <dt>{result < 0 ? t.home.totalLoss : t.home.totalProfit}</dt>
              <dd className={profitClass(result)}>{moneyExact(Math.abs(result))}</dd>
            </div>
          </dl>
          {stockPieces > 0 && (
            <p className="num mt-2 text-xs text-muted">
              {t.report.stockNote(stockPieces, money(stockValue))}
            </p>
          )}
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <span
            aria-hidden
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
              bestInfo ? "bg-due-soft text-due" : "bg-paper text-muted"
            }`}
          >
            <Trophy size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted">{t.report.bestProduct}</p>
            {best && bestInfo ? (
              <>
                <p className="truncate text-lg font-bold">{bestInfo.name}</p>
                <p className="num text-sm text-muted">
                  {t.report.bestSold(best.pieces, money(best.revenue))}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium">{t.report.bestEmpty}</p>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

/** Sales page: profit per product, from each sold piece's real cost. */
export function ProductProfitTable({
  rows,
  products,
  t,
}: {
  rows: ProductRow[];
  products: ProductNames;
  t: Messages;
}) {
  const pieces = rows.reduce((sum, row) => sum + row.pieces, 0);
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const profit = rows.reduce((sum, row) => sum + row.profit, 0);

  return (
    <section className="mb-4">
      <h2 className="mb-2 text-lg font-semibold">{t.report.byProductTitle}</h2>
      <Card className="overflow-hidden">
        <table className="num w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="px-3 py-2 text-left font-medium sm:px-4">
                {t.common.product}
              </th>
              <th scope="col" className="w-9 py-2 text-right font-medium sm:w-20">
                {t.report.piecesColumn}
              </th>
              <th scope="col" className="w-[72px] py-2 text-right font-medium sm:w-28">
                {t.common.sale}
              </th>
              <th scope="col" className="w-[84px] py-2 pr-3 text-right font-medium sm:w-28 sm:pr-4">
                {t.common.profit}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const product = products.get(row.productId);
              const faded = row.pieces === 0 ? "text-muted/50" : "";
              return (
                <tr key={row.productId} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-3 py-2.5 text-left font-medium sm:px-4">
                    <span className="flex items-center gap-2">
                      <ColorDot color={product?.color ?? "#999"} />
                      <span className="truncate">{product?.name}</span>
                    </span>
                  </th>
                  <td className={`py-2.5 text-right ${faded}`}>{row.pieces}</td>
                  <td className={`py-2.5 text-right ${faded}`}>{money(row.revenue)}</td>
                  <td
                    className={`py-2.5 pr-3 text-right sm:pr-4 ${
                      faded ? `font-normal ${faded}` : `font-semibold ${profitClass(row.profit)}`
                    }`}
                  >
                    {moneyExact(row.profit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line bg-paper/60 font-semibold">
              <th scope="row" className="px-3 py-2.5 text-left font-semibold sm:px-4">
                {t.common.total}
              </th>
              <td className="py-2.5 text-right">{pieces}</td>
              <td className="py-2.5 text-right">{money(revenue)}</td>
              <td className={`py-2.5 pr-3 text-right sm:pr-4 ${profitClass(profit)}`}>
                {moneyExact(profit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
      <p className="mt-1.5 text-xs text-muted">{t.report.byProductNote}</p>
    </section>
  );
}
