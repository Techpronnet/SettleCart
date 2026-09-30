"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListSkeleton, ProductGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { BackendProductCard } from "@/components/customer/BackendProductCard";
import { StoreReviews } from "@/components/customer/Reviews";
import {
  ApiError,
  getCategories,
  getStore,
  getStoreProducts,
  type CategoryResponse,
  type ProductResponse,
  type StoreResponse,
} from "@/lib/api";

/**
 * Full customer-facing storefront. Rendered at /stores/[id] for shoppers
 * and at /vendor/store/preview for vendors previewing their own store,
 * so vendors never leave Vendor Studio (role guards bounce them off
 * customer routes).
 */
export function StorefrontView({
  storeId,
  homeLabel,
  homeHref,
  productHref,
}: {
  storeId: string;
  homeLabel: string;
  homeHref: string;
  productHref?: (productId: string) => string;
}) {
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getStore(storeId)
      .then((s) => {
        if (!cancelled) setStore(s);
      })
      .catch(async (err) => {
        // Guests may hit auth-walled deployments: fall back to the public
        // directory before giving up.
        if (!cancelled && err instanceof ApiError && err.isUnauthorized) {
          try {
            const { getPublicStores } = await import("@/lib/api");
            const pub = await getPublicStores({ page: 1, size: 100 });
            const found = pub.stores.find((s) => s.id === storeId) ?? null;
            if (!cancelled) {
              if (found) setStore(found);
              else setError("Store not found.");
            }
            return;
          } catch {
            // fall through to generic error
          }
        }
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Store not found.");
      });
    getCategories(storeId)
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch(() => {
        // categories are optional
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  useEffect(() => {
    let cancelled = false;
    // Reset list while refetching for the new filter.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(null);
    getStoreProducts(storeId, {
      category_id: activeCategory,
      search: appliedSearch.trim() || undefined,
      page: 1,
      size: 24,
    })
      .then((res) => {
        if (!cancelled) setProducts(res.products);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, activeCategory, appliedSearch]);

  if (error) {
    return (
      <div>
        <PageHeader title="Store" breadcrumbs={[{ label: homeLabel, href: homeHref }, { label: "Store" }]} />
        <ErrorState title="We couldn't load this store." description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!store) {
    return (
      <div>
        <PageHeader title="Store" breadcrumbs={[{ label: homeLabel, href: homeHref }, { label: "Store" }]} />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={store.name}
        description={[store.city, store.state].filter(Boolean).join(", ") || undefined}
        breadcrumbs={[{ label: homeLabel, href: homeHref }, { label: store.name }]}
      />

      {store.banner_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.banner_url}
          alt={`${store.name} cover`}
          className="mb-4 h-36 sm:h-48 w-full rounded-2xl border border-stone-200 object-cover"
        />
      )}

      <Card title="About this store">
        <div className="flex items-start gap-3">
          {store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logo_url}
              alt={`${store.name} logo`}
              className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
            />
          ) : (
            <span className="w-12 h-12 rounded-xl bg-stone-900 text-white text-lg font-bold flex items-center justify-center shrink-0">
              {store.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm text-stone-600 leading-relaxed">
              {store.description || "An independent business selling on SettleCart."}
            </p>
            {store.address && <p className="mt-1 text-xs text-stone-500">{store.address}</p>}
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-teal-800">
              <i className="fa fa-check-circle" aria-hidden="true" /> Verified store
            </p>
          </div>
        </div>
      </Card>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedSearch(search);
        }}
        className="mt-4 flex gap-2"
        role="search"
      >
        <label htmlFor="store-search" className="sr-only">
          Search this store
        </label>
        <input
          id="store-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search in ${store.name}…`}
          className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm min-h-[48px] focus-visible:outline-2 focus-visible:outline-stone-900"
        />
        <button
          type="submit"
          className="rounded-xl bg-stone-900 text-white px-5 text-sm font-semibold min-h-[48px] hover:bg-stone-800"
        >
          Search
        </button>
      </form>

      {categories.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Store categories">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            aria-pressed={activeCategory === null}
            className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium min-h-[44px] ${
              activeCategory === null
                ? "bg-stone-900 text-white"
                : "border border-stone-200 bg-white text-stone-600"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              aria-pressed={activeCategory === c.id}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium min-h-[44px] ${
                activeCategory === c.id
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 bg-white text-stone-600"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <section aria-label="Store products" className="mt-4">
        {products === null ? (
          <ProductGridSkeleton count={6} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="fa-cube"
            title="No products here yet"
            description="This store has not published products in this view."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p) => (
              <BackendProductCard
                key={p.id}
                product={p}
                storeName={store.name}
                productHref={productHref ? productHref(p.id) : undefined}
              />
            ))}
          </div>
        )}
      </section>

      <div className="mt-4">
        <StoreReviews storeName={store.name} />
      </div>
    </div>
  );
}
