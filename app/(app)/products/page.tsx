import { ActionButton } from "@/components/action-button";
import { ProductForm } from "@/components/product-form";
import { Badge, Card, ColorDot, PageHeader } from "@/components/ui";
import { setProductArchived } from "@/lib/actions";
import { loadBook } from "@/lib/book";
import { SIZES, variantKey } from "@/lib/constants";
import { money, moneyExact } from "@/lib/format";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const book = await loadBook();
  const t = await getT();

  return (
    <>
      <PageHeader title={t.products.title} />

      <div className="grid gap-3 lg:grid-cols-2">
        {book.products.map((product) => {
          const entries = SIZES.map((size) => book.stock.get(variantKey(product.id, size)));
          const inStock = entries.reduce((sum, entry) => sum + (entry?.qty ?? 0), 0);
          const stockValue = entries.reduce((sum, entry) => sum + (entry?.value ?? 0), 0);
          return (
            <Card key={product.id} className={`p-4 ${product.archived ? "opacity-70" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="flex min-w-0 items-center gap-2 font-semibold">
                  <ColorDot color={product.color} />
                  <span className="truncate">{product.name}</span>
                </p>
                {product.archived ? (
                  <Badge tone="plain">{t.products.hidden}</Badge>
                ) : (
                  <span className="num shrink-0 text-sm text-muted">{t.products.inStock(inStock)}</span>
                )}
              </div>
              <p className="num mt-2 text-sm text-muted">
                {t.products.prices(money(product.buyPrice), product.sellPrices.join(", "))}
              </p>
              {inStock > 0 && (
                <p className="num mt-0.5 text-sm">
                  {t.products.stockCost}{" "}
                  <span className="font-semibold">{moneyExact(stockValue / inStock)}</span>
                </p>
              )}
              <details className="mt-3 border-t border-line pt-3">
                <summary className="text-sm font-medium text-pitch">{t.products.edit}</summary>
                <div className="mt-3">
                  <ProductForm product={product} />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <p className="max-w-xs text-xs text-muted">{t.products.hideNote}</p>
                    <ActionButton
                      action={setProductArchived.bind(null, product.id, !product.archived)}
                    >
                      {product.archived ? t.products.show : t.products.hide}
                    </ActionButton>
                  </div>
                </div>
              </details>
            </Card>
          );
        })}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">{t.products.addTitle}</h2>
        <Card className="p-4">
          <ProductForm />
        </Card>
      </section>
    </>
  );
}
