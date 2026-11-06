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
        title="প্রি-অর্ডার"
        action={
          <Link href="/preorders/new" className={buttonClass("primary")}>
            + নতুন
          </Link>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="অপেক্ষায় অর্ডার" value={`${pending.length}টা`} />
        <Stat label="মোট পিস" value={`${pending.reduce((sum, p) => sum + p.pieces, 0)} পিস`} />
        <Stat label="মোট টাকা" value={money(pending.reduce((sum, p) => sum + p.total, 0))} />
        <Stat
          label="আরও কিনতে হবে"
          value={`${toBuy} পিস`}
          tone={toBuy > 0 ? "bad" : "plain"}
          hint="স্টক বাদ দিয়ে"
        />
      </section>

      {demandProducts.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 text-lg font-semibold">কোন সাইজ কত পিস লাগবে</h2>
          <Card className="overflow-hidden">
            <SizeMatrix
              products={demandProducts}
              cell={(id, size) => demand.get(variantKey(id, size)) ?? 0}
              highlight={(id, size) => {
                const key = variantKey(id, size);
                return (demand.get(key) ?? 0) > stockOf(key);
              }}
            />
          </Card>
          {toBuy > 0 && (
            <p className="mt-1.5 text-xs text-muted">
              <span className="font-semibold text-loss">লাল</span> সংখ্যা মানে স্টকে এতগুলো নেই।
            </p>
          )}
        </section>
      )}

      <Tabs
        active={active}
        tabs={[
          { key: "pending", href: "/preorders", label: `অপেক্ষায় (${count("pending")})` },
          { key: "delivered", href: "/preorders?status=delivered", label: `ডেলিভারি (${count("delivered")})` },
          { key: "cancelled", href: "/preorders?status=cancelled", label: `বাতিল (${count("cancelled")})` },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyState>এই তালিকায় কোনো প্রি-অর্ডার নেই।</EmptyState>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((preorder) => (
            <Card key={preorder.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{preorder.customer}</p>
                  <p className="text-xs text-muted">
                    {shortDate(preorder.date)}
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
                {preorder.status === "pending" && <Badge tone="warn">অপেক্ষায়</Badge>}
                {preorder.status === "delivered" && <Badge tone="good">ডেলিভারি হয়েছে</Badge>}
                {preorder.status === "cancelled" && <Badge tone="plain">বাতিল</Badge>}
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
                <p className="text-sm text-muted">মোট {preorder.pieces} পিস</p>
                <p className="font-bold">{money(preorder.total)}</p>
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {preorder.status !== "delivered" && (
                  <ActionButton
                    kind="danger"
                    action={deletePreorder.bind(null, preorder.id)}
                    confirm={`${preorder.customer}-এর এই প্রি-অর্ডারটা একেবারে মুছবেন?`}
                  >
                    মুছুন
                  </ActionButton>
                )}
                {preorder.status === "pending" && (
                  <>
                    <ActionButton
                      kind="quiet"
                      action={setPreorderCancelled.bind(null, preorder.id, true)}
                      confirm={`${preorder.customer}-এর প্রি-অর্ডারটা বাতিল করবেন?`}
                    >
                      বাতিল
                    </ActionButton>
                    <DeliverButton id={preorder.id} customer={preorder.customer} today={today} />
                  </>
                )}
                {preorder.status === "cancelled" && (
                  <ActionButton action={setPreorderCancelled.bind(null, preorder.id, false)}>
                    আবার চালু করুন
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
