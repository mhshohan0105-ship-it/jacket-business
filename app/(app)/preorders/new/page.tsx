import { OrderForm } from "@/components/order-form";
import { EmptyState, PageHeader } from "@/components/ui";
import { loadBook } from "@/lib/book";
import { todayInDhaka } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewPreorderPage() {
  const book = await loadBook();
  const products = book.products.filter((product) => !product.archived);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="নতুন প্রি-অর্ডার" back={{ href: "/preorders", label: "প্রি-অর্ডার" }} />
      {products.length === 0 ? (
        <EmptyState>আগে একটা প্রোডাক্ট যোগ করুন।</EmptyState>
      ) : (
        <OrderForm kind="preorder" products={products} today={todayInDhaka()} />
      )}
    </div>
  );
}
