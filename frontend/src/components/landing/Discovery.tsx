"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { CATEGORIES, DISCOVERY_PRODUCTS } from "./data";
import { ProductCard, SectionHeading } from "./cards";
import { useLiveMarketplace } from "./useLiveMarketplace";

export function Discovery() {
  const { products } = useLiveMarketplace();
  const visible = products === null || products.length === 0 ? DISCOVERY_PRODUCTS : products;
  return (
    <section id="discover" aria-labelledby="discover-heading" className="bg-[#fafaf9] fluid-section scroll-mt-20">
      <div className="site-container">
        <SectionHeading
          eyebrow="Marketplace"
          title="Everything You Need, From Stores You Can Discover."
          copy="Browse products from independent stores and businesses, all brought together in one marketplace."
        />

        <nav id="categories" aria-label="Categories" className="mt-8 flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center scroll-mt-24">
          {CATEGORIES.map((c) => (
            <a
              key={c.label}
              href="#discover"
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-900 hover:text-stone-950 whitespace-nowrap min-h-[44px] transition-colors"
            >
              <i className={`fa ${c.icon} text-stone-500`} aria-hidden="true" />
              {c.label}
            </a>
          ))}
        </nav>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-teal-800">
          <BadgeCheck className="w-4 h-4" />
          From verified stores
        </p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px] transition-colors"
          >
            Explore Marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}
