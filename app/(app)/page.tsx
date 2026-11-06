import Link from "next/link";
import { ProfitReport } from "@/components/profit-report";
import { SaleCard } from "@/components/sale-card";
import { Card, PageHeader, SizeMatrix, Stat, buttonClass } from "@/components/ui";
import { loadBook, visibleProducts } from "@/lib/book";
import { variantKey } from "@/lib/constants";
import { money, todayInDhaka } from "@/lib/format";
import { dueState } from "@/lib/ledger";
import { productReport } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const book = await loadBook();
  const today = todayInDhaka();

  const revenue = book.sales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = book.sales.reduce((sum, sale) => sum + sale.profit, 0);
  const spent = book.purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const courier = book.purchases.reduce((sum, purchase) => sum + purchase.courier, 0);

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

  return (
    <>
      <PageHeader
        title="হিসাবের সারাংশ"
        action={
          <Link href="/sales/new" className={buttonClass("primary")}>
            + বিক্রি
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="মোট লাভ" value={money(profit)} tone={profit < 0 ? "bad" : "good"} hint="কুরিয়ার খরচ বাদে" />
        <Stat label="মোট বিক্রি" value={money(revenue)} hint={`${book.sales.reduce((s, x) => s + x.pieces, 0)} পিস`} />
        <Stat
          label="বাকি টাকা"
          value={money(dueTotal)}
          tone={overdue.length > 0 ? "bad" : dueTotal > 0 ? "warn" : "plain"}
          hint={overdue.length > 0 ? `${overdue.length}টার তারিখ পেরিয়ে গেছে` : `${dueSales.length}টা বিক্রি`}
        />
        <Stat label="মোট কেনা" value={money(spent)} hint={`কুরিয়ার ${money(courier)} সহ`} />
        <Stat label="স্টকের মূল্য" value={money(stockValue)} hint={`${stockPieces} পিস`} />
        <Link href="/preorders" className="block rounded-xl hover:opacity-85">
          <Stat
            label="প্রি-অর্ডার"
            value={`${pendingPieces} পিস`}
            tone={pendingPieces > 0 ? "warn" : "plain"}
            hint={`${pending.length}টা অর্ডার অপেক্ষায়`}
          />
        </Link>
      </section>

      <ProfitReport
        rows={productReport(
          book.sales.flatMap((sale) => sale.items),
          visibleProducts(book).map((product) => product.id),
        )}
        products={book.productById}
      />

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">স্টকে কত পিস আছে</h2>
        <Card className="overflow-hidden">
          <SizeMatrix
            products={visibleProducts(book)}
            cell={(id, size) => book.stock.get(variantKey(id, size))?.qty ?? 0}
          />
        </Card>
      </section>

      {dueSales.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">যাদের কাছে টাকা বাকি</h2>
            <Link href="/sales?filter=due" className="text-sm font-medium text-pitch hover:underline">
              সব দেখুন
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {dueSales.slice(0, 4).map((sale) => (
              <SaleCard key={sale.id} sale={sale} products={book.productById} today={today} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
