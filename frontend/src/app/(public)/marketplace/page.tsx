import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { getPublicStores, getStoreProducts, type ProductResponse } from "@/lib/api";
import { formatMoney } from "@/lib/format";

export const metadata = {
  title: "Marketplace | SettleCart",
  description: "Discover businesses, products and services on SettleCart.",
};

const CATEGORIES = [
  { icon: "fa-shopping-basket", label: "Retail & Grocery" },
  { icon: "fa-cutlery", label: "Food & Restaurants" },
  { icon: "fa-black-tie", label: "Fashion" },
  { icon: "fa-scissors", label: "Beauty & Salon" },
  { icon: "fa-wrench", label: "Repairs & Services" },
  { icon: "fa-briefcase", label: "Professional Services" },
];

interface LiveProduct {
  product: ProductResponse;
  storeName: string;
}

async function getLiveProducts(): Promise<LiveProduct[] | null> {
  try {
    const stores = await getPublicStores({ size: 4 });
    if (stores.stores.length === 0) return [];
    const settled = await Promise.allSettled(
      stores.stores.map(async (s) => {
        const res = await getStoreProducts(s.id, { page: 1, size: 4 });
        return res.products.map((p) => ({ product: p, storeName: s.name }));
      })
    );
    return settled
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .filter((item) => item.product.is_active)
      .slice(0, 8);
  } catch {
    return null;
  }
}

export default async function MarketplacePage() {
  const live = await getLiveProducts();

  return (
    <div className="site-container py-8 sm:py-12">
      <PageHeader
        title="Marketplace"
        description="One marketplace connecting customers, businesses and dispatch riders."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Marketplace" }]}
      />

      <Card
        title="Early access"
        action={
          <Link
            href="/waitlist"
            className="text-sm font-medium text-stone-900 underline"
          >
            Join the waitlist
          </Link>
        }
      >
        <p className="text-sm text-stone-600 leading-relaxed">
          The live marketplace is opening to early businesses and customers
          first. Join the waitlist to get notified when stores in your city go
          live.
        </p>
      </Card>

      <h2 className="mt-8 text-base font-semibold text-stone-900">
        Supported business types
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-stone-200 bg-white p-4 flex items-center gap-3"
          >
            <span className="w-9 h-9 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
              <i className={`fa ${c.icon}`} aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-stone-800">{c.label}</span>
          </div>
        ))}
      </div>

      <section aria-label="Live products" className="mt-8">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-stone-900">Live products</h2>
          <Link href="/register" className="text-sm font-medium text-stone-900 underline">
            Start shopping
          </Link>
        </div>

        {live === null ? (
          <p className="mt-3 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
            Live products are unavailable right now. Check your connection and refresh.
          </p>
        ) : live.length === 0 ? (
          <div className="mt-3 rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-600">
              No live products yet. Early stores are still setting up.
            </p>
            <Link
              href="/waitlist"
              className="mt-3 inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[44px]"
            >
              Join the waitlist
            </Link>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {live.map(({ product, storeName }) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group rounded-2xl border border-stone-200 bg-white p-3 hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
              >
                <span className="block rounded-xl bg-stone-100 h-36 sm:h-40 overflow-hidden">
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="h-full w-full flex items-center justify-center text-stone-300">
                      <i className="fa fa-cube text-4xl" aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="block px-1 pt-3 pb-1">
                  <span className="block text-xs text-stone-500 truncate">{storeName}</span>
                  <span className="mt-0.5 block text-sm font-semibold text-stone-900 truncate">
                    {product.name}
                  </span>
                  <span className="mt-1 block text-sm font-bold text-stone-900">
                    {formatMoney(product.price)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
