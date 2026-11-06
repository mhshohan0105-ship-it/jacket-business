import { OrderForm } from "@/components/order-form";
import { EmptyState, PageHeader } from "@/components/ui";
import { loadBook } from "@/lib/book";
import { todayInDhaka } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const book = await loadBook();
  const products = book.products.filter((product) => !product.archived);
  const stock = Object.fromEntries([...book.stock].map(([key, entry]) => [key, entry.qty]));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="নতুন বিক্রি" back={{ href: "/sales", label: "বিক্রি" }} />
      {products.length === 0 ? (
        <EmptyState>আগে একটা প্রোডাক্ট যোগ করুন।</EmptyState>
      ) : (
        <OrderForm kind="sale" products={products} stock={stock} today={todayInDhaka()} />
      )}
    </div>
  );
}
