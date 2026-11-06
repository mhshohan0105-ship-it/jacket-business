import { ActionButton } from "@/components/action-button";
import { ProductForm } from "@/components/product-form";
import { Badge, Card, ColorDot, PageHeader } from "@/components/ui";
import { setProductArchived } from "@/lib/actions";
import { loadBook } from "@/lib/book";
import { SIZES, variantKey } from "@/lib/constants";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const book = await loadBook();

  return (
    <>
      <PageHeader title="প্রোডাক্ট" />

      <div className="grid gap-3 lg:grid-cols-2">
        {book.products.map((product) => {
          const inStock = SIZES.reduce(
            (sum, size) => sum + (book.stock.get(variantKey(product.id, size))?.qty ?? 0),
            0,
          );
          return (
            <Card key={product.id} className={`p-4 ${product.archived ? "opacity-70" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="flex min-w-0 items-center gap-2 font-semibold">
                  <ColorDot color={product.color} />
                  <span className="truncate">{product.name}</span>
                </p>
                {product.archived ? (
                  <Badge tone="plain">লুকানো</Badge>
                ) : (
                  <span className="num shrink-0 text-sm text-muted">স্টকে {inStock} পিস</span>
                )}
              </div>
              <p className="num mt-2 text-sm text-muted">
                কেনা {money(product.buyPrice)} · বিক্রি{" "}
                {product.sellPrices.join(", ")}
              </p>
              <details className="mt-3 border-t border-line pt-3">
                <summary className="text-sm font-medium text-pitch">এডিট করুন</summary>
                <div className="mt-3">
                  <ProductForm product={product} />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <p className="max-w-xs text-xs text-muted">
                      লুকালে নতুন কেনা-বিক্রির তালিকায় আসবে না, তবে পুরনো হিসাব থাকবে।
                    </p>
                    <ActionButton
                      action={setProductArchived.bind(null, product.id, !product.archived)}
                    >
                      {product.archived ? "আবার দেখান" : "লুকিয়ে রাখুন"}
                    </ActionButton>
                  </div>
                </div>
              </details>
            </Card>
          );
        })}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">নতুন প্রোডাক্ট যোগ করুন</h2>
        <Card className="p-4">
          <ProductForm />
        </Card>
      </section>
    </>
  );
}
