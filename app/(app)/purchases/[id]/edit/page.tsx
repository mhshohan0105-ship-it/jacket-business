import { notFound } from "next/navigation";
import { OrderForm } from "@/components/order-form";
import { PageHeader } from "@/components/ui";
import { loadBook } from "@/lib/book";
import { todayInDhaka } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await loadBook();
  const purchase = book.purchases.find((row) => row.id === Number(id));
  if (!purchase) notFound();

  // A product hidden since this purchase must still be selectable here.
  const usedIds = new Set(purchase.items.map((item) => item.productId));
  const products = book.products.filter((product) => !product.archived || usedIds.has(product.id));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="কেনা এডিট করুন" back={{ href: "/purchases", label: "কেনা" }} />
      <OrderForm kind="purchase" products={products} today={todayInDhaka()} editing={purchase} />
    </div>
  );
}
