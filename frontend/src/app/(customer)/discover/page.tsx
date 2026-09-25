"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Navigation";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BackendProductCard } from "@/components/customer/BackendProductCard";
import {
  ApiError,
  getPublicStores,
  searchProducts,
  type ProductResponse,
  type StoreResponse,
} from "@/lib/api";

type SortKey = "relevant" | "price-asc" | "price-desc" | "name";

function sortProducts(products: ProductResponse[], sort: SortKey): ProductResponse[] {
  const list = [...products];
  if (sort === "price-asc") list.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "price-desc") list.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<SortKey>("relevant");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [stores, setStores] = useState<StoreResponse[] | null>(null);
  const [products, setProducts] = useState<ProductResponse[] | null>(null);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [storePage, setStorePage] = useState(1);
  const STORES_PER_PAGE = 6;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [storeRes, productRes] = await Promise.all([
        getPublicStores({ city: city.trim() || undefined, page: 1, size: 24 }),
        query.trim()
          ? searchProducts({ query: query.trim(), page: 1, size: 24 })
          : Promise.resolve(null),
      ]);
      setStores(storeRes.stores);
      const names: Record<string, string> = {};
      for (const s of storeRes.stores) names[s.id] = s.name;
      setStoreNames(names);
      setProducts(productRes ? productRes.products : null);
      setStorePage(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load the marketplace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial marketplace load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleProducts = products
    ? sortProducts(
        inStockOnly ? products.filter((p) => p.is_active) : products,
        sort
      )
    : null;
  const totalStorePages = stores ? Math.max(1, Math.ceil(stores.length / STORES_PER_PAGE)) : 1;
  const pagedStores = stores
    ? stores.slice((storePage - 1) * STORES_PER_PAGE, storePage * STORES_PER_PAGE)
    : null;

  return (
    <div>
      <PageHeader title="Discover" description="Browse stores and products across the marketplace." />

      <Card title="Filters">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"
        >
          <Input
            label="Search products"
            name="q"
            type="search"
            placeholder="e.g. Ankara dress"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Input
            label="City"
            name="city"
            placeholder="e.g. Lagos"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full sm:w-auto rounded-md bg-stone-900 text-white px-5 text-sm font-medium min-h-[44px] hover:bg-stone-800"
            >
              Apply
            </button>
          </div>
        </form>
        <div className="mt-3 hidden sm:flex flex-wrap items-center gap-3">
          <label className="text-sm text-stone-700">
            Sort{" "}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="ml-1 rounded-md border border-stone-300 bg-white px-2.5 py-2 text-sm min-h-[44px]"
            >
              <option value="relevant">Most relevant</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A to Z</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-stone-700 min-h-[44px]">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 accent-stone-900"
            />
            In stock only
          </label>
        </div>
        <div className="mt-3 sm:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 min-h-[48px]"
            aria-haspopup="dialog"
          >
            <i className="fa fa-sliders" aria-hidden="true" />
            Filters & sort
            {(inStockOnly || sort !== "relevant") && (
              <span className="ml-1 w-2 h-2 rounded-full bg-teal-700" aria-label="Filters active" />
            )}
          </button>
        </div>
      </Card>

      <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filter products">
        <div className="grid gap-4">
          <label className="block text-sm text-stone-700">
            <span className="block font-medium mb-1.5">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-3 text-sm min-h-[48px]"
            >
              <option value="relevant">Most relevant</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A to Z</option>
            </select>
          </label>
          <label className="flex items-center gap-2.5 text-sm text-stone-800 min-h-[48px]">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-5 h-5 accent-stone-900"
            />
            In stock only
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSort("relevant");
                setInStockOnly(false);
              }}
              className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-800 min-h-[48px]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white min-h-[48px]"
            >
              Show results
            </button>
          </div>
        </div>
      </BottomSheet>

      {loading ? (
        <div className="mt-4">
          <ListSkeleton rows={4} />
        </div>
      ) : error ? (
        <div className="mt-4">
          <ErrorState title="We couldn't load the marketplace." description={error} onRetry={load} />
        </div>
      ) : (
        <>
          <section aria-label="Stores" className="mt-6">
            <h2 className="text-base font-semibold text-stone-900">Stores</h2>
            {!pagedStores || pagedStores.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon="fa-building"
                  title="No stores found"
                  description="Try a different city or check back when new stores go live."
                />
              </div>
            ) : (
              <>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {pagedStores.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/stores/${s.id}`}
                        className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5 hover:border-stone-400"
                      >
                        <span className="w-10 h-10 rounded-xl bg-stone-900 text-white font-bold flex items-center justify-center shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-stone-900 truncate">
                            {s.name}
                          </span>
                          <span className="block text-xs text-stone-500 truncate">
                            {[s.city, s.state].filter(Boolean).join(", ") || "Online store"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Pagination page={storePage} totalPages={totalStorePages} onChange={setStorePage} />
              </>
            )}
          </section>

          <section aria-label="Products" className="mt-6">
            <h2 className="text-base font-semibold text-stone-900">Products</h2>
            {visibleProducts === null ? (
              <p className="mt-3 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
                Search for a product above to see results from every live store.
              </p>
            ) : visibleProducts.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon="fa-cube"
                  title="No products found"
                  description="Try different keywords or clear the in-stock filter."
                />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {visibleProducts.map((p) => (
                  <BackendProductCard key={p.id} product={p} storeName={storeNames[p.store_id]} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
