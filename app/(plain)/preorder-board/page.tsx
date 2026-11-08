import Link from "next/link";
import { PreorderChart } from "@/components/preorder-chart";
import { loadBook } from "@/lib/book";
import { shortDate, todayInDhaka } from "@/lib/format";
import { messages } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";
import { preorderDemand } from "@/lib/report";

export const dynamic = "force-dynamic";

/** A clean card with no menus, sized to screenshot on a phone and send on. */
export default async function PreorderBoardPage() {
  const book = await loadBook();
  const lang = await getLang();
  const t = messages[lang];
  const demand = preorderDemand(book.preorders.filter((order) => order.status === "pending"));

  return (
    <main className="mx-auto max-w-lg px-3 py-4">
      <Link href="/preorders" className="mb-3 inline-block text-sm text-muted hover:text-ink">
        {t.preorders.back}
      </Link>

      <section className="rounded-2xl border border-line bg-card p-3 sm:p-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-pitch">{t.appName}</p>
            <h1 className="text-xl font-bold">{t.preorders.boardTitle}</h1>
          </div>
          <p className="num shrink-0 pt-1 text-xs text-muted">
            {t.preorders.asOf(shortDate(todayInDhaka(), lang))}
          </p>
        </header>

        <dl className="num mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-paper px-2 py-2">
            <dt className="text-xs text-muted">{t.preorders.waitingOrders}</dt>
            <dd className="text-lg font-bold">{demand.orders}</dd>
          </div>
          <div className="rounded-lg bg-paper px-2 py-2">
            <dt className="text-xs text-muted">{t.preorders.totalPieces}</dt>
            <dd className="text-lg font-bold text-pitch">{demand.pieces}</dd>
          </div>
          <div className="rounded-lg bg-paper px-2 py-2">
            <dt className="text-xs text-muted">{t.preorders.paidBadge} / {t.preorders.dueBadge}</dt>
            <dd className="text-lg font-bold">
              {demand.paid} / <span className="text-due">{demand.due}</span>
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <PreorderChart demand={demand} products={book.productById} t={t} />
        </div>
      </section>
    </main>
  );
}
