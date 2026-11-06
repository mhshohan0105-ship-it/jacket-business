import { OrderForm } from "@/components/order-form";
import { EmptyState, PageHeader } from "@/components/ui";
import { loadBook } from "@/lib/book";
import { todayInDhaka } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const book = await loadBook();
  const products = book.products.filter((product) => !product.archived);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="নতুন কেনা" back={{ href: "/purchases", label: "কেনা" }} />
      {products.length === 0 ? (
        <EmptyState>আগে একটা প্রোডাক্ট যোগ করুন।</EmptyState>
      ) : (
        <OrderForm kind="purchase" products={products} today={todayInDhaka()} />
      )}
    </div>
  );
}
