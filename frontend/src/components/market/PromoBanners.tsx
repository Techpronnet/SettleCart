"use client";

import Link from "next/link";
import { ArrowRight, Store, BadgePercent } from "lucide-react";

/**
 * Agora-style dual promo banners: one shopper offer, one vendor invite.
 * Brand treatments only (forest + brand), no imagery required.
 */
export function PromoBanners() {
  return (
    <section aria-label="Promotions" className="bg-cream fluid-section-compact">
      <div className="site-container grid gap-3 sm:gap-4 md:grid-cols-2">
        <article
          data-aos="fade-up"
          className="relative overflow-hidden rounded-3xl bg-forest-900 text-white p-6 sm:p-8"
        >
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_0%,rgba(249,106,27,0.22),transparent)]" />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-100">
              <BadgePercent className="w-3.5 h-3.5" /> Up to 20% off
            </p>
            <h3 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-balance">
              Purely Fresh, <span className="text-brand-500">Pure Quality</span>
            </h3>
            <p className="mt-2 text-sm text-forest-100 leading-relaxed max-w-sm">
              Everyday essentials from verified local stores, delivered to your doorstep.
            </p>
            <Link
              href="/marketplace"
              className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 min-h-[48px] transition-colors"
            >
              Shop now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </article>

        <article
          data-aos="fade-up"
          data-aos-delay="100"
          className="relative overflow-hidden rounded-3xl bg-brand-600 text-white p-6 sm:p-8 md:mt-8"
        >
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_90%_at_0%_100%,rgba(10,31,22,0.25),transparent)]" />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              <Store className="w-3.5 h-3.5" /> For vendors
            </p>
            <h3 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-balance">
              Open Your Store Today
            </h3>
            <p className="mt-2 text-sm text-white/90 leading-relaxed max-w-sm">
              Publish products in minutes and reach customers beyond your street.
            </p>
            <Link
              href="/register?as=vendor"
              className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-forest-950 bg-white hover:bg-brand-50 min-h-[48px] transition-colors"
            >
              Start selling <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
