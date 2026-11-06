import Link from "next/link";
import { OverallReport } from "@/components/profit-report";
import { SaleCard } from "@/components/sale-card";
import { Card, PageHeader, SizeMatrix, Stat, buttonClass } from "@/components/ui";
import { loadBook, visibleProducts } from "@/lib/book";
import { variantKey } from "@/lib/constants";
import { money, moneyExact, todayInDhaka } from "@/lib/format";
import { messages } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";
import { dueState } from "@/lib/ledger";
import { productReport } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const book = await loadBook();
  const today = todayInDhaka();
  const lang = await getLang();
  const t = messages[lang];

  const revenue = book.sales.reduce((sum, sale) => sum + sale.total, 0);
  const spent = book.purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const courier = book.purchases.reduce((sum, purchase) => sum + purchase.courier, 0);
  const boughtPieces = book.purchases.reduce((sum, purchase) => sum + purchase.pieces, 0);
  const overall = revenue - spent;

  const stockEntries = [...book.stock.values()];
  const stockPieces = stockEntries.reduce((sum, entry) => sum + entry.qty, 0);
  const stockValue = stockEntries.reduce((sum, entry) => sum + entry.value, 0);

  const dueSales = book.sales
    .filter((sale) => sale.paymentStatus === "due")
    .sort((a, b) =>
      (a.expectedPayDate ?? "9999-12-31").localeCompare(b.expectedPayDate ?? "9999-12-31"),
    );
  const dueTotal = dueSales.reduce((sum, sale) => sum + sale.total, 0);
  const overdue = dueSales.filter((sale) => dueState(sale, today) === "overdue");

  const pending = book.preorders.filter((preorder) => preorder.status === "pending");
  const pendingPieces = pending.reduce((sum, preorder) => sum + preorder.pieces, 0);

  const courierHint = t.home.courierIncluded(money(courier));

  return (
    <>
      <PageHeader
        title={t.home.title}
        action={
          <Link href="/sales/new" className={buttonClass("primary")}>
            {t.home.newSale}
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat
          label={overall < 0 ? t.home.totalLoss : t.home.totalProfit}
          value={money(Math.abs(overall))}
          tone={overall < 0 ? "bad" : "good"}
          hint={t.home.profitHint}
        />
        <Stat
          label={t.home.totalSales}
          value={money(revenue)}
          hint={t.pcs(book.sales.reduce((s, x) => s + x.pieces, 0))}
        />
        <Stat
          label={t.home.dueAmount}
          value={money(dueTotal)}
          tone={overdue.length > 0 ? "bad" : dueTotal > 0 ? "warn" : "plain"}
          hint={overdue.length > 0 ? t.home.overdueCount(overdue.length) : t.home.saleCount(dueSales.length)}
        />
        <Stat
          label={t.home.totalBought}
          value={money(spent)}
          hint={
            boughtPieces > 0
              ? `${courierHint} · ${t.home.perPieceCost(moneyExact(spent / boughtPieces))}`
              : courierHint
          }
        />
        <Stat label={t.home.stockValue} value={money(stockValue)} hint={t.pcs(stockPieces)} />
        <Link href="/preorders" className="block rounded-xl hover:opacity-85">
          <Stat
            label={t.home.preorders}
            value={t.pcs(pendingPieces)}
            tone={pendingPieces > 0 ? "warn" : "plain"}
            hint={t.home.ordersWaiting(pending.length)}
          />
        </Link>
      </section>

      <OverallReport
        bought={spent}
        sold={revenue}
        stockPieces={stockPieces}
        stockValue={stockValue}
        rows={productReport(
          book.sales.flatMap((sale) => sale.items),
          visibleProducts(book).map((product) => product.id),
        )}
        products={book.productById}
        t={t}
      />

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">{t.home.stockTitle}</h2>
        <Card className="overflow-hidden">
          <SizeMatrix
            products={visibleProducts(book)}
            cell={(id, size) => book.stock.get(variantKey(id, size))?.qty ?? 0}
            labels={{ product: t.common.product, total: t.common.total }}
          />
        </Card>
      </section>

      {dueSales.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.home.dueTitle}</h2>
            <Link href="/sales?filter=due" className="text-sm font-medium text-pitch hover:underline">
              {t.home.seeAll}
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {dueSales.slice(0, 4).map((sale) => (
              <SaleCard key={sale.id} sale={sale} products={book.productById} today={today} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
