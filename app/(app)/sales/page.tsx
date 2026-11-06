import Link from "next/link";
import { ProductProfitTable } from "@/components/profit-report";
import { SaleCard } from "@/components/sale-card";
import { EmptyState, PageHeader, Stat, Tabs, buttonClass } from "@/components/ui";
import { loadBook, visibleProducts } from "@/lib/book";
import { money, todayInDhaka } from "@/lib/format";
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

  const due = book.sales.filter((sale) => sale.paymentStatus === "due");
  const shown = onlyDue ? due : book.sales;

  return (
    <>
      <PageHeader
        title="বিক্রি"
        action={
          <Link href="/sales/new" className={buttonClass("primary")}>
            + নতুন বিক্রি
          </Link>
        }
      />
      <section className="mb-4 grid grid-cols-2 gap-3">
        <Stat label="মোট বিক্রি" value={money(book.sales.reduce((sum, s) => sum + s.total, 0))} />
        <Stat
          label="বাকি টাকা"
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
        />
      )}
      <Tabs
        active={onlyDue ? "due" : "all"}
        tabs={[
          { key: "all", href: "/sales", label: `সব (${book.sales.length})` },
          { key: "due", href: "/sales?filter=due", label: `বাকি (${due.length})` },
        ]}
      />
      {shown.length === 0 ? (
        <EmptyState>{onlyDue ? "কোনো টাকা বাকি নেই।" : "এখনো কোনো বিক্রি নেই।"}</EmptyState>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((sale) => (
            <SaleCard key={sale.id} sale={sale} products={book.productById} today={today} />
          ))}
        </div>
      )}
    </>
  );
}
