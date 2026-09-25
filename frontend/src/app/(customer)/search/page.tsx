"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { BackendProductCard } from "@/components/customer/BackendProductCard";
import {
  ApiError,
  getPublicStores,
  searchProducts,
  type ProductResponse,
  type StoreResponse,
} from "@/lib/api";

const POPULAR_SEARCHES = ["Ankara", "Smartphone", "Shea butter", "Rice", "Earbuds", "Sofa"];

const RECENT_KEY = "settlecart_recent_searches";

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  try {
    const next = [term, ...getRecent().filter((t) => t !== term)].slice(0, 6);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const [draft, setDraft] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  const [recent, setRecent] = useState<string[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [products, setProducts] = useState<ProductResponse[] | null>(null);
  const [stores, setStores] = useState<StoreResponse[] | null>(null);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  // Keep the input in sync when navigating between searches.
  if (syncedQ !== q) {
    setSyncedQ(q);
    setDraft(q);
  }

  useEffect(() => {
    // Client-only recent restore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(getRecent());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError("");
      setProducts(null);
      setStores(null);
      if (!q) return;
      setSearching(true);
      try {
        const [productRes, storeRes] = await Promise.all([
          searchProducts({ query: q, page: 1, size: 24 }),
          getPublicStores({ page: 1, size: 50 }),
        ]);
        if (cancelled) return;
        setProducts(productRes.products);
        const names: Record<string, string> = {};
        for (const s of storeRes.stores) names[s.id] = s.name;
        setStoreNames(names);
        const needle = q.toLowerCase();
        setStores(storeRes.stores.filter((s) => s.name.toLowerCase().includes(needle)));
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Search failed.");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [q]);

  function onType(value: string) {
    setDraft(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const next = value.trim();
      if (next) saveRecent(next);
      router.replace(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
    }, 450);
  }

  return (
    <div>
      <PageHeader
        title={q ? `Results for "${q}"` : "Search"}
        description="Products and stores across the marketplace."
        breadcrumbs={[{ label: "Home", href: "/home" }, { label: "Search" }]}
      />
      <form
        onSubmit={(e) => e.preventDefault()}
        role="search"
        className="flex gap-2"
      >
        <label htmlFor="search-input" className="sr-only">
          Search products
        </label>
        <input
          id="search-input"
          name="q"
          type="search"
          value={draft}
          onChange={(e) => onType(e.target.value)}
          placeholder="Search products or stores…"
          autoComplete="off"
          className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm min-h-[48px] focus-visible:outline-2 focus-visible:outline-stone-900"
        />
        {searching && (
          <span className="inline-flex items-center text-stone-400" role="status" aria-label="Searching">
            <i className="fa fa-spinner fa-spin" aria-hidden="true" />
          </span>
        )}
      </form>

      {!q && (
        <div className="mt-4 space-y-4">
          {recent.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Recent</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {recent.map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="rounded-full border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-700 min-h-[40px] inline-flex items-center"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Popular</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full bg-stone-100 px-3.5 py-2 text-sm font-medium text-stone-800 min-h-[40px] inline-flex items-center"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {q && (
        <>
          {error ? (
            <div className="mt-4">
              <ErrorState title="Search failed." description={error} onRetry={() => window.location.reload()} />
            </div>
          ) : products === null || stores === null ? (
            <div className="mt-4">
              <ProductGridSkeleton count={6} />
            </div>
          ) : (
            <>
              {stores.length > 0 && (
                <section aria-label="Matching stores" className="mt-6">
              <h2 className="text-base font-semibold text-stone-900">Stores</h2>
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
                      <span className="text-sm font-semibold text-stone-900 truncate">{s.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-label="Matching products" className="mt-6">
            <h2 className="text-base font-semibold text-stone-900">Products</h2>
            {products.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon="fa-search"
                  title="No products found"
                  description={`Nothing matches "${q}" yet. Try different keywords.`}
                />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {products.map((p) => (
                  <BackendProductCard key={p.id} product={p} storeName={storeNames[p.store_id]} />
                ))}
              </div>
            )}
          </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton count={6} />}>
      <SearchResults />
    </Suspense>
  );
}
