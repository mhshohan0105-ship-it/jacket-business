import { deleteSale, markSalePaid } from "@/lib/actions";
import type { SaleRow } from "@/lib/book";
import { money, moneyExact, shortDate } from "@/lib/format";
import { messages, type Lang } from "@/lib/i18n/messages";
import { dueState } from "@/lib/ledger";
import { ActionButton } from "./action-button";
import { Badge, Card, LineItems } from "./ui";

export function SaleCard({
  sale,
  products,
  today,
  lang,
}: {
  sale: SaleRow;
  products: Map<number, { name: string; color: string }>;
  today: string;
  lang: Lang;
}) {
  const t = messages[lang];
  const state = dueState(sale, today);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{sale.customer}</p>
          <p className="text-xs text-muted">
            {shortDate(sale.date, lang)}
            {sale.phone && (
              <>
                {" · "}
                <a href={`tel:${sale.phone}`} className="num underline">
                  {sale.phone}
                </a>
              </>
            )}
          </p>
        </div>
        {state === "paid" && <Badge tone="good">{t.sales.paid}</Badge>}
        {state === "due" && <Badge tone="warn">{t.sales.dueBadge}</Badge>}
        {state === "overdue" && <Badge tone="bad">{t.sales.overdue}</Badge>}
      </div>

      <div className="mt-3">
        <LineItems items={sale.items} products={products} price={(item) => item.unitPrice} />
      </div>

      {sale.paymentStatus === "due" && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${state === "overdue" ? "bg-loss-soft text-loss" : "bg-due-soft text-due"}`}>
          {sale.expectedPayDate
            ? t.sales.expected(shortDate(sale.expectedPayDate, lang))
            : t.sales.noExpectedDate}
        </p>
      )}
      {sale.note && <p className="mt-2 text-sm text-muted">{sale.note}</p>}

      <div className="num mt-3 flex items-end justify-between border-t border-line pt-3">
        <div>
          <p className="text-xs text-muted">{t.common.total}</p>
          <p className="font-bold">{money(sale.total)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">{t.common.profit}</p>
          <p className={`font-bold ${sale.profit < 0 ? "text-loss" : "text-pitch"}`}>
            {moneyExact(sale.profit)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <ActionButton
          kind="danger"
          action={deleteSale.bind(null, sale.id)}
          confirm={t.sales.confirmDelete(sale.customer)}
        >
          {t.common.delete}
        </ActionButton>
        {sale.paymentStatus === "due" && (
          <ActionButton
            kind="primary"
            action={markSalePaid.bind(null, sale.id)}
            confirm={t.sales.confirmPaid(sale.customer, money(sale.total))}
          >
            {t.sales.gotPaid}
          </ActionButton>
        )}
      </div>
    </Card>
  );
}
