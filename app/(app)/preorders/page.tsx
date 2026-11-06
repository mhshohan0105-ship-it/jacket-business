import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { DeliverButton } from "@/components/deliver-button";
import {
  Badge,
  Card,
  EmptyState,
  LineItems,
  PageHeader,
  SizeMatrix,
  Stat,
  Tabs,
  buttonClass,
} from "@/components/ui";
import { deletePreorder, setPreorderCancelled } from "@/lib/actions";
import { loadBook } from "@/lib/book";
import { variantKey } from "@/lib/constants";
import { money, shortDate, todayInDhaka } from "@/lib/format";
import { messages } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "delivered", "cancelled"] as const;

export default async function PreordersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const active = STATUSES.find((status) => status === params.status) ?? "pending";
  const book = await loadBook();
  const today = todayInDhaka();
  const lang = await getLang();
  const t = messages[lang];

  const count = (status: string) =>
    book.preorders.filter((preorder) => preorder.status === status).length;
  const pending = book.preorders.filter((preorder) => preorder.status === "pending");
  const shown = book.preorders.filter((preorder) => preorder.status === active);

  const demand = new Map<string, number>();
  for (const preorder of pending) {
    for (const item of preorder.items) {
      const key = variantKey(item.productId, item.size);
      demand.set(key, (demand.get(key) ?? 0) + item.qty);
    }
  }
  const stockOf = (key: string) => book.stock.get(key)?.qty ?? 0;
  const toBuy = [...demand].reduce((sum, [key, qty]) => sum + Math.max(0, qty - stockOf(key)), 0);
  const demandProducts = book.products.filter((product) =>
    [...demand.keys()].some((key) => key.startsWith(`${product.id}:`)),
  );

  return (
    <>
      <PageHeader
        title={t.preorders.title}
        action={
          <Link href="/preorders/new" className={buttonClass("primary")}>
            {t.preorders.new}
          </Link>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t.preorders.waitingOrders} value={t.count(pending.length)} />
        <Stat label={t.preorders.totalPieces} value={t.pcs(pending.reduce((sum, p) => sum + p.pieces, 0))} />
        <Stat label={t.preorders.totalAmount} value={money(pending.reduce((sum, p) => sum + p.total, 0))} />
        <Stat
          label={t.preorders.toBuy}
          value={t.pcs(toBuy)}
          tone={toBuy > 0 ? "bad" : "plain"}
          hint={t.preorders.afterStock}
        />
      </section>

      {demandProducts.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 text-lg font-semibold">{t.preorders.neededTitle}</h2>
          <Card className="overflow-hidden">
            <SizeMatrix
              products={demandProducts}
              cell={(id, size) => demand.get(variantKey(id, size)) ?? 0}
              highlight={(id, size) => {
                const key = variantKey(id, size);
                return (demand.get(key) ?? 0) > stockOf(key);
              }}
              labels={{ product: t.common.product, total: t.common.total }}
            />
          </Card>
          {toBuy > 0 && (
            <p className="mt-1.5 text-xs text-muted">
              <span className="font-semibold text-loss">{t.preorders.redPrefix}</span>{" "}
              {t.preorders.redNote}
            </p>
          )}
        </section>
      )}

      <Tabs
        active={active}
        tabs={[
          { key: "pending", href: "/preorders", label: t.preorders.tabWaiting(count("pending")) },
          { key: "delivered", href: "/preorders?status=delivered", label: t.preorders.tabDelivered(count("delivered")) },
          { key: "cancelled", href: "/preorders?status=cancelled", label: t.preorders.tabCancelled(count("cancelled")) },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyState>{t.preorders.empty}</EmptyState>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((preorder) => (
            <Card key={preorder.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{preorder.customer}</p>
                  <p className="text-xs text-muted">
                    {shortDate(preorder.date, lang)}
                    {preorder.phone && (
                      <>
                        {" · "}
                        <a href={`tel:${preorder.phone}`} className="num underline">
                          {preorder.phone}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                {preorder.status === "pending" && <Badge tone="warn">{t.preorders.badgeWaiting}</Badge>}
                {preorder.status === "delivered" && <Badge tone="good">{t.preorders.badgeDelivered}</Badge>}
                {preorder.status === "cancelled" && <Badge tone="plain">{t.preorders.badgeCancelled}</Badge>}
              </div>
              <div className="mt-3">
                <LineItems
                  items={preorder.items}
                  products={book.productById}
                  price={(item) => item.unitPrice}
                />
              </div>
              {preorder.note && <p className="mt-2 text-sm text-muted">{preorder.note}</p>}
              <div className="num mt-3 flex items-center justify-between border-t border-line pt-3">
                <p className="text-sm text-muted">{t.preorders.totalPcs(preorder.pieces)}</p>
                <p className="font-bold">{money(preorder.total)}</p>
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {preorder.status !== "delivered" && (
                  <ActionButton
                    kind="danger"
                    action={deletePreorder.bind(null, preorder.id)}
                    confirm={t.preorders.confirmDelete(preorder.customer)}
                  >
                    {t.common.delete}
                  </ActionButton>
                )}
                {preorder.status === "pending" && (
                  <>
                    <ActionButton
                      kind="quiet"
                      action={setPreorderCancelled.bind(null, preorder.id, true)}
                      confirm={t.preorders.confirmCancel(preorder.customer)}
                    >
                      {t.preorders.cancel}
                    </ActionButton>
                    <DeliverButton id={preorder.id} customer={preorder.customer} today={today} />
                  </>
                )}
                {preorder.status === "cancelled" && (
                  <ActionButton action={setPreorderCancelled.bind(null, preorder.id, false)}>
                    {t.preorders.reopen}
                  </ActionButton>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
