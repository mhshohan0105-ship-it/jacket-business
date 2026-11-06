import { OrderForm } from "@/components/order-form";
import { EmptyState, PageHeader } from "@/components/ui";
import { loadBook } from "@/lib/book";
import { todayInDhaka } from "@/lib/format";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const book = await loadBook();
  const t = await getT();
  const products = book.products.filter((product) => !product.archived);
  const stock = Object.fromEntries([...book.stock].map(([key, entry]) => [key, entry.qty]));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t.sales.newTitle} back={{ href: "/sales", label: t.sales.title }} />
      {products.length === 0 ? (
        <EmptyState>{t.common.addProductFirst}</EmptyState>
      ) : (
        <OrderForm kind="sale" products={products} stock={stock} today={todayInDhaka()} />
      )}
    </div>
  );
}
