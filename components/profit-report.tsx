import { Trophy } from "lucide-react";
import { money } from "@/lib/format";
import { bestProduct, type ProductRow } from "@/lib/report";
import { Card, ColorDot } from "./ui";

function profitClass(profit: number) {
  return profit < 0 ? "text-loss" : profit > 0 ? "text-pitch" : "";
}

export function ProfitReport({
  rows,
  products,
}: {
  rows: ProductRow[];
  products: Map<number, { name: string; color: string }>;
}) {
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const cost = rows.reduce((sum, row) => sum + row.cost, 0);
  const profit = revenue - cost;
  const pieces = rows.reduce((sum, row) => sum + row.pieces, 0);
  const best = bestProduct(rows);
  const bestInfo = best && products.get(best.productId);

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-lg font-semibold">লাভ-ক্ষতির হিসাব</h2>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <dl className="num space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">মোট বিক্রি</dt>
              <dd>{money(revenue)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">বিক্রি হওয়া মালের আসল খরচ</dt>
              <dd>− {money(cost)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-2 text-base font-bold">
              <dt>{profit < 0 ? "মোট ক্ষতি" : "মোট লাভ"}</dt>
              <dd className={profitClass(profit)}>{money(Math.abs(profit))}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted">
            আসল খরচে কুরিয়ার ধরা আছে। যে মাল এখনো বিক্রি হয়নি, সেটা এই হিসাবে নেই।
          </p>
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
            <p className="text-sm text-muted">সেরা প্রোডাক্ট</p>
            {best && bestInfo ? (
              <>
                <p className="truncate text-lg font-bold">{bestInfo.name}</p>
                <p className="num text-sm text-muted">
                  {best.pieces} পিস বিক্রি · {best.profit < 0 ? "ক্ষতি" : "লাভ"}{" "}
                  {money(Math.abs(best.profit))}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium">প্রথম বিক্রির পর এখানে দেখাবে</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-3 overflow-hidden">
        <table className="num w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="px-3 py-2 text-left font-medium sm:px-4">
                প্রোডাক্ট
              </th>
              <th scope="col" className="w-11 py-2 text-right font-medium sm:w-20">
                পিস
              </th>
              <th scope="col" className="w-20 py-2 text-right font-medium sm:w-28">
                বিক্রি
              </th>
              <th scope="col" className="w-20 py-2 pr-3 text-right font-medium sm:w-28 sm:pr-4">
                লাভ
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const product = products.get(row.productId);
              return (
                <tr key={row.productId} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-3 py-2.5 text-left font-medium sm:px-4">
                    <span className="flex items-center gap-2">
                      <ColorDot color={product?.color ?? "#999"} />
                      <span className="truncate">{product?.name}</span>
                    </span>
                  </th>
                  <td className={`py-2.5 text-right ${row.pieces === 0 ? "text-muted/50" : ""}`}>
                    {row.pieces}
                  </td>
                  <td className={`py-2.5 text-right ${row.pieces === 0 ? "text-muted/50" : ""}`}>
                    {money(row.revenue)}
                  </td>
                  <td
                    className={`py-2.5 pr-3 text-right font-semibold sm:pr-4 ${
                      row.pieces === 0 ? "font-normal text-muted/50" : profitClass(row.profit)
                    }`}
                  >
                    {money(row.profit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line bg-paper/60 font-semibold">
              <th scope="row" className="px-3 py-2.5 text-left font-semibold sm:px-4">
                মোট
              </th>
              <td className="py-2.5 text-right">{pieces}</td>
              <td className="py-2.5 text-right">{money(revenue)}</td>
              <td className={`py-2.5 pr-3 text-right sm:pr-4 ${profitClass(profit)}`}>
                {money(profit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </section>
  );
}
