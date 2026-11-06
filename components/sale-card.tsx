import { deleteSale, markSalePaid } from "@/lib/actions";
import type { SaleRow } from "@/lib/book";
import { money, shortDate } from "@/lib/format";
import { dueState } from "@/lib/ledger";
import { ActionButton } from "./action-button";
import { Badge, Card, LineItems } from "./ui";

export function SaleCard({
  sale,
  products,
  today,
}: {
  sale: SaleRow;
  products: Map<number, { name: string; color: string }>;
  today: string;
}) {
  const state = dueState(sale, today);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{sale.customer}</p>
          <p className="text-xs text-muted">
            {shortDate(sale.date)}
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
        {state === "paid" && <Badge tone="good">পেইড</Badge>}
        {state === "due" && <Badge tone="warn">বাকি</Badge>}
        {state === "overdue" && <Badge tone="bad">তারিখ পেরিয়েছে</Badge>}
      </div>

      <div className="mt-3">
        <LineItems items={sale.items} products={products} price={(item) => item.unitPrice} />
      </div>

      {sale.paymentStatus === "due" && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${state === "overdue" ? "bg-loss-soft text-loss" : "bg-due-soft text-due"}`}>
          {sale.expectedPayDate
            ? `টাকা দেওয়ার কথা: ${shortDate(sale.expectedPayDate)}`
            : "টাকা দেওয়ার তারিখ ঠিক হয়নি"}
        </p>
      )}
      {sale.note && <p className="mt-2 text-sm text-muted">{sale.note}</p>}

      <div className="num mt-3 flex items-end justify-between border-t border-line pt-3">
        <div>
          <p className="text-xs text-muted">মোট</p>
          <p className="font-bold">{money(sale.total)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">লাভ</p>
          <p className={`font-bold ${sale.profit < 0 ? "text-loss" : "text-pitch"}`}>
            {money(sale.profit)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <ActionButton
          kind="danger"
          action={deleteSale.bind(null, sale.id)}
          confirm={`${sale.customer}-এর এই বিক্রিটা মুছবেন? স্টক আবার ফিরে আসবে।`}
        >
          মুছুন
        </ActionButton>
        {sale.paymentStatus === "due" && (
          <ActionButton
            kind="primary"
            action={markSalePaid.bind(null, sale.id)}
            confirm={`${sale.customer} ${money(sale.total)} দিয়েছে?`}
          >
            টাকা পেয়েছি
          </ActionButton>
        )}
      </div>
    </Card>
  );
}
