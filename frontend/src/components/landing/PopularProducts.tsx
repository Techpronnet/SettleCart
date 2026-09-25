"use client";

import { useState } from "react";
import { POPULAR_PRODUCTS, type LandingProduct } from "./data";
import { ProductCard, SectionHeading } from "./cards";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "trending", label: "Trending" },
  { key: "new", label: "New Arrivals" },
  { key: "best", label: "Best Sellers" },
  { key: "deal", label: "Deals" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function PopularProducts() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const visible: LandingProduct[] =
    filter === "all" ? POPULAR_PRODUCTS : POPULAR_PRODUCTS.filter((p) => p.trend === filter);

  return (
    <section id="deals" aria-labelledby="popular-heading" className="bg-white fluid-section scroll-mt-20">
      <div className="site-container">
        <SectionHeading
          eyebrow="Trending"
          title="Popular Right Now."
          copy="What customers are discovering across vendors this week."
        />
        <div role="tablist" aria-label="Filter products" className="mt-6 flex gap-2 overflow-x-auto pb-1 justify-start sm:justify-center">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium min-h-[44px] transition-colors ${
                filter === f.key
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-stone-900 hover:text-stone-950"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="mt-8 text-center text-sm text-stone-500">No products in this view yet. Check back soon.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
