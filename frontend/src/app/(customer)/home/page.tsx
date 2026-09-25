import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPublicStores, listMyOrders } from "@/lib/api";
import { customerOrderLabel } from "@/lib/status";
import { formatMoney, formatDateTime } from "@/lib/format";

export const metadata = { title: "Home | SettleCart" };

const CATEGORIES = [
  { label: "Fashion", icon: "fa-black-tie" },
  { label: "Electronics", icon: "fa-plug" },
  { label: "Beauty", icon: "fa-magic" },
  { label: "Groceries", icon: "fa-shopping-basket" },
  { label: "Phones", icon: "fa-mobile" },
  { label: "Food", icon: "fa-cutlery" },
];

const ACTIVE_STATUSES = new Set([
  "created",
  "payment_pending",
  "payment_confirmed",
  "processing",
  "partially_ready",
  "ready_for_pickup",
  "dispatch_assigned",
  "picked_up",
  "out_for_delivery",
  "disputed",
]);

async function getStores() {
  try {
    const res = await getPublicStores({ size: 6 });
    return res.stores;
  } catch {
    return null;
  }
}

async function getActiveOrders() {
  try {
    const res = await listMyOrders(1, 10);
    return res.orders.filter((o) => ACTIVE_STATUSES.has(o.status));
  } catch {
    return null;
  }
}

export default async function CustomerHomePage() {
  const [stores, activeOrders] = await Promise.all([getStores(), getActiveOrders()]);

  return (
    <div>
      <PageHeader title="Good to see you" description="Discover stores, order, and track delivery." />

      <form action="/search" method="get" role="search" className="flex gap-2">
        <label htmlFor="home-search" className="sr-only">
          Search products
        </label>
        <input
          id="home-search"
          name="q"
          type="search"
          placeholder="Search products or stores…"
          className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm min-h-[48px] focus-visible:outline-2 focus-visible:outline-stone-900"
        />
        <button
          type="submit"
          className="rounded-xl bg-stone-900 text-white px-5 text-sm font-semibold min-h-[48px] hover:bg-stone-800"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <Link
            key={c.label}
            href={`/search?q=${encodeURIComponent(c.label)}`}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-900 whitespace-nowrap min-h-[44px]"
          >
            <i className={`fa ${c.icon} text-stone-500`} aria-hidden="true" />
            {c.label}
          </Link>
        ))}
      </div>

      {activeOrders !== null && activeOrders.length > 0 && (
        <section aria-label="Active orders" className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900">Active orders</h2>
            <Link href="/orders" className="text-sm font-medium text-stone-900 underline">
              View all
            </Link>
          </div>
          <ul className="mt-3 space-y-2.5">
            {activeOrders.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5 hover:border-stone-400"
                >
                  <span className="w-9 h-9 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
                    <i className="fa fa-shopping-bag" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-stone-900 truncate">
                      Order {o.order_number}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {customerOrderLabel(o.status.toUpperCase())} · {formatMoney(o.total)}
                    </span>
                  </span>
                  <span className="text-xs text-stone-400 shrink-0">{formatDateTime(o.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Recommended stores" className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">Stores near you</h2>
          <Link href="/discover" className="text-sm font-medium text-stone-900 underline">
            Discover more
          </Link>
        </div>
        {stores === null ? (
          <p className="mt-3 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
            Stores are unavailable right now. Check your connection and try again.
          </p>
        ) : stores.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">
            No live stores yet. Join the waitlist and we will notify you when your city opens.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {stores.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/stores/${s.id}`}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5 hover:border-stone-400"
                >
                  <span className="w-10 h-10 rounded-xl bg-stone-900 text-white font-bold flex items-center justify-center shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-900 truncate">{s.name}</span>
                    <span className="block text-xs text-stone-500 truncate">
                      {[s.city, s.state].filter(Boolean).join(", ") || "Online store"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
