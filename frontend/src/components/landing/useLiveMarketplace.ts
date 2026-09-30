"use client";

import { useEffect, useState } from "react";
import { getPublicStores, getStoreProducts, getShowcase } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import type { LandingProduct } from "./data";

export interface LiveStore {
  id: string;
  name: string;
  city: string;
  initial: string;
  logo_url?: string | null;
  banner_url?: string | null;
}

interface CachedMarketplaceData {
  stores: LiveStore[];
  products: LandingProduct[];
  timestamp: number;
}

// Global in-memory cache and in-flight fetch deduplicator across component unmounts
let memoryMarketplaceCache: CachedMarketplaceData | null = null;
let inFlightFetch: Promise<CachedMarketplaceData> | null = null;
const STALE_AFTER_MS = 45_000; // 45 seconds stale-while-revalidate threshold

async function executeMarketplaceFetch(): Promise<CachedMarketplaceData> {
  // 1. Single-request fast path: /api/v1/stores/showcase
  try {
    const showcase = await getShowcase();
    if (showcase && Array.isArray(showcase.stores) && showcase.stores.length > 0) {
      const storeMap = new Map<string, string>();
      const liveStores: LiveStore[] = showcase.stores.map((s) => {
        storeMap.set(s.id, s.name);
        return {
          id: s.id,
          name: s.name,
          city: [s.city, s.state].filter(Boolean).join(", ") || "Online",
          initial: s.name.charAt(0).toUpperCase(),
          logo_url: s.logo_url ?? null,
          banner_url: s.banner_url ?? null,
        };
      });

      const liveProducts: LandingProduct[] = (showcase.products || [])
        .filter((p) => p.is_active)
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: formatNaira(Number(p.price) || 0),
          store: storeMap.get(p.store_id) || "Store",
          storeInitial: (storeMap.get(p.store_id) || "S").charAt(0).toUpperCase(),
          rating: "New",
          icon: "fa-cube",
          tint: "bg-stone-100 text-stone-500",
          verified: true,
          image: p.images?.[0] ?? null,
          backendId: p.id,
          storeId: p.store_id,
        }))
        .slice(0, 8);

      return {
        stores: liveStores,
        products: liveProducts,
        timestamp: Date.now(),
      };
    }
  } catch {
    // Graceful fallback to legacy multi-endpoint flow
  }

  // 2. Legacy fallback
  const res = await getPublicStores({ size: 6 });
  if (res.stores.length === 0) {
    return { stores: [], products: [], timestamp: Date.now() };
  }

  const liveStores = res.stores.map((s) => ({
    id: s.id,
    name: s.name,
    city: [s.city, s.state].filter(Boolean).join(", ") || "Online",
    initial: s.name.charAt(0).toUpperCase(),
    logo_url: s.logo_url ?? null,
    banner_url: s.banner_url ?? null,
  }));

  const settled = await Promise.allSettled(
    res.stores.slice(0, 4).map(async (s) => ({
      store: s,
      products: (await getStoreProducts(s.id, { page: 1, size: 4 })).products,
    }))
  );

  const items: LandingProduct[] = [];
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const p of r.value.products) {
      if (!p.is_active) continue;
      items.push({
        id: p.id,
        name: p.name,
        price: formatNaira(Number(p.price) || 0),
        store: r.value.store.name,
        storeInitial: r.value.store.name.charAt(0).toUpperCase(),
        rating: "New",
        icon: "fa-cube",
        tint: "bg-stone-100 text-stone-500",
        verified: true,
        image: p.images?.[0] ?? null,
        backendId: p.id,
        storeId: p.store_id,
      });
    }
  }

  return {
    stores: liveStores,
    products: items.slice(0, 8),
    timestamp: Date.now(),
  };
}

/**
 * Live marketplace content with in-memory SWR caching and in-flight request deduplication.
 * Renders instantly (0ms) from cache when navigating back, avoiding loading skeletons.
 */
export function useLiveMarketplace() {
  const [stores, setStores] = useState<LiveStore[] | null>(() => memoryMarketplaceCache?.stores ?? null);
  const [products, setProducts] = useState<LandingProduct[] | null>(() => memoryMarketplaceCache?.products ?? null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // If we have cached data and it's still fresh, skip network request
      if (memoryMarketplaceCache && Date.now() - memoryMarketplaceCache.timestamp < STALE_AFTER_MS) {
        setStores(memoryMarketplaceCache.stores);
        setProducts(memoryMarketplaceCache.products);
        return;
      }

      // Deduplicate in-flight fetch across concurrent components (e.g. FeaturedStores & PopularProducts)
      if (!inFlightFetch) {
        inFlightFetch = executeMarketplaceFetch().finally(() => {
          inFlightFetch = null;
        });
      }

      try {
        const data = await inFlightFetch;
        if (!cancelled) {
          memoryMarketplaceCache = data;
          setStores(data.stores);
          setProducts(data.products);
        }
      } catch {
        if (!cancelled && !memoryMarketplaceCache) {
          setStores([]);
          setProducts([]);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    stores,
    products,
    hasLiveStores: !!stores && stores.length > 0,
    hasLiveProducts: !!products && products.length > 0,
  };
}
