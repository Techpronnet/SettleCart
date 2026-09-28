"use client";

import Link from "next/link";
import { ProductCard, SectionHeading } from "./cards";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { useLiveMarketplace } from "./useLiveMarketplace";

export function PopularProducts() {
  const { products } = useLiveMarketplace();

  return (
    <section id="deals" aria-labelledby="popular-heading" className="bg-white fluid-section scroll-mt-20">
      <div className="site-container">
        <SectionHeading
          eyebrow="Trending"
          title="Popular Right Now."
          copy="What customers are discovering across vendors this week."
        />
        {products === null ? (
          <div className="mt-6">
            <ProductGridSkeleton count={8} />
          </div>
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-[#fafaf9] p-8 text-center">
            <p className="text-base font-semibold text-stone-900">Nothing trending yet</p>
            <p className="mt-1.5 text-sm text-stone-600 max-w-md mx-auto">
              As soon as stores publish products, the most loved ones will appear here.
            </p>
            <Link
              href="/marketplace"
              className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-white min-h-[48px]"
            >
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
