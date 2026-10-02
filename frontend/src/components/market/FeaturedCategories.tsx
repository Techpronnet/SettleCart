"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { CATEGORIES } from "../landing/data";

/**
 * Agora-style category rail. Static, renders on server or client.
 * Links each tile into site search.
 */
export function FeaturedCategories() {
  return (
    <section aria-labelledby="featured-categories-heading" className="bg-white fluid-section-compact">
      <div className="site-container">
        <div className="flex items-end justify-between gap-4" data-aos="fade-up">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">Browse</p>
            <h2 id="featured-categories-heading" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-forest-950">
              Featured Categories
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-forest-950 hover:gap-2 transition-all shrink-0"
          >
            View all categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ul className="mt-6 flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 lg:grid-cols-9 sm:overflow-visible">
          {CATEGORIES.map((c, i) => (
            <li key={c.label} data-aos="fade-up" data-aos-delay={(i % 9) * 50} className="shrink-0 sm:shrink">
              <Link
                href={`/search?q=${encodeURIComponent(c.label)}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-sand-border bg-cream p-3 hover:border-brand-600 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all min-w-[96px] sm:min-w-0"
              >
                <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-sand-border text-forest-800 flex items-center justify-center group-hover:bg-forest-900 group-hover:text-white transition-colors">
                  <i className={`fa ${c.icon} text-xl`} aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-stone-800 text-center leading-tight">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-brand-700">
          <MapPin className="w-4 h-4" />
          Categories stocked by live local stores
        </p>
      </div>
    </section>
  );
}
