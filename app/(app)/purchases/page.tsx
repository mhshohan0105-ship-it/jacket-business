import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { Card, ColorDot, EmptyState, PageHeader, Stat, buttonClass } from "@/components/ui";
import { deletePurchase } from "@/lib/actions";
import { loadBook } from "@/lib/book";
import { money, moneyExact, shortDate } from "@/lib/format";
import { messages } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const book = await loadBook();
  const lang = await getLang();
  const t = messages[lang];
  const goods = book.purchases.reduce((sum, purchase) => sum + purchase.goods, 0);
  const courier = book.purchases.reduce((sum, purchase) => sum + purchase.courier, 0);

  return (
    <>
      <PageHeader
        title={t.purchases.title}
        action={
          <Link href="/purchases/new" className={buttonClass("primary")}>
            {t.purchases.new}
          </Link>
        }
      />
      <section className="mb-4 grid grid-cols-2 gap-3">
        <Stat label={t.common.goodsCost} value={money(goods)} />
        <Stat label={t.purchases.totalCourier} value={moneyExact(courier)} />
      </section>

      {book.purchases.length === 0 ? (
        <EmptyState>{t.purchases.empty}</EmptyState>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {book.purchases.map((purchase) => (
            <Card key={purchase.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{purchase.supplier}</p>
                  <p className="text-xs text-muted">{shortDate(purchase.date, lang)}</p>
                </div>
                <p className="num shrink-0 text-sm text-muted">{t.pcs(purchase.pieces)}</p>
              </div>

              <ul className="mt-3 space-y-2 text-sm">
                {purchase.items.map((item) => {
                  const product = book.productById.get(item.productId);
                  return (
                    <li key={item.id}>
                      <div className="flex items-center gap-2">
                        <ColorDot color={product?.color ?? "#999"} />
                        <span className="min-w-0 flex-1 truncate">
                          {product?.name} <span className="font-semibold">{item.size}</span>
                          <span className="num text-muted"> × {item.qty}</span>
                        </span>
                        <span className="num shrink-0 font-semibold">
                          {moneyExact(item.landed)}
                          <span className="font-normal text-muted"> {t.common.perPiece}</span>
                        </span>
                      </div>
                      <p className="num pl-[18px] text-xs text-muted">
                        {t.purchases.costBreakdown(
                          money(item.unitCost),
                          moneyExact(item.landed - item.unitCost),
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
              {purchase.note && <p className="mt-2 text-sm text-muted">{purchase.note}</p>}

              <dl className="num mt-3 space-y-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t.common.goodsCost}</dt>
                  <dd>{moneyExact(purchase.goods)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t.common.courier}</dt>
                  <dd>{moneyExact(purchase.courier)}</dd>
                </div>
                <div className="flex justify-between gap-3 text-base font-bold">
                  <dt>{t.common.total}</dt>
                  <dd>{moneyExact(purchase.total)}</dd>
                </div>
              </dl>
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <ActionButton
                  kind="danger"
                  action={deletePurchase.bind(null, purchase.id)}
                  confirm={t.purchases.confirmDelete}
                >
                  {t.common.delete}
                </ActionButton>
                <Link href={`/purchases/${purchase.id}/edit`} className={buttonClass("secondary")}>
                  {t.common.edit}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
