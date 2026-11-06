import { OrderForm } from "@/components/order-form";
import { EmptyState, PageHeader } from "@/components/ui";
import { loadBook } from "@/lib/book";
import { todayInDhaka } from "@/lib/format";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function NewPreorderPage() {
  const book = await loadBook();
  const t = await getT();
  const products = book.products.filter((product) => !product.archived);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t.preorders.newTitle} back={{ href: "/preorders", label: t.preorders.title }} />
      {products.length === 0 ? (
        <EmptyState>{t.common.addProductFirst}</EmptyState>
      ) : (
        <OrderForm kind="preorder" products={products} today={todayInDhaka()} />
      )}
    </div>
  );
}
