import Link from "next/link";
import { ProductProfitTable } from "@/components/profit-report";
import { SaleCard } from "@/components/sale-card";
import { EmptyState, PageHeader, Stat, Tabs, buttonClass } from "@/components/ui";
import { loadBook, visibleProducts } from "@/lib/book";
import { money, todayInDhaka } from "@/lib/format";
import { messages } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";
import { productReport } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const onlyDue = filter === "due";
  const book = await loadBook();
  const today = todayInDhaka();
  const lang = await getLang();
  const t = messages[lang];

  const due = book.sales.filter((sale) => sale.paymentStatus === "due");
  const shown = onlyDue ? due : book.sales;

  return (
    <>
      <PageHeader
        title={t.sales.title}
        action={
          <Link href="/sales/new" className={buttonClass("primary")}>
            {t.sales.new}
          </Link>
        }
      />
      <section className="mb-4 grid grid-cols-2 gap-3">
        <Stat label={t.home.totalSales} value={money(book.sales.reduce((sum, s) => sum + s.total, 0))} />
        <Stat
          label={t.home.dueAmount}
          value={money(due.reduce((sum, s) => sum + s.total, 0))}
          tone={due.length > 0 ? "warn" : "plain"}
        />
      </section>
      {book.sales.length > 0 && (
        <ProductProfitTable
          rows={productReport(
            book.sales.flatMap((sale) => sale.items),
            visibleProducts(book).map((product) => product.id),
          )}
          products={book.productById}
          t={t}
        />
      )}
      <Tabs
        active={onlyDue ? "due" : "all"}
        tabs={[
          { key: "all", href: "/sales", label: t.sales.all(book.sales.length) },
          { key: "due", href: "/sales?filter=due", label: t.sales.due(due.length) },
        ]}
      />
      {shown.length === 0 ? (
        <EmptyState>{onlyDue ? t.sales.emptyDue : t.sales.empty}</EmptyState>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((sale) => (
            <SaleCard key={sale.id} sale={sale} products={book.productById} today={today} lang={lang} />
          ))}
        </div>
      )}
    </>
  );
}
