"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { ProductCard } from "../landing/cards";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { useLiveMarketplace } from "../landing/useLiveMarketplace";

/**
 * Agora-style marketplace hero: headline + CTAs beside a live-product visual.
 * Shows a loading shimmer while fetching, and an honest waitlist prompt
 * when no stores have published yet — never sample data.
 */
export function MarketHero() {
  const { products, stores } = useLiveMarketplace();
  const visual = (products ?? []).slice(0, 3);

  return (
    <section aria-labelledby="market-hero-heading" className="relative overflow-hidden bg-cream">
      <div className="site-container grid gap-8 lg:grid-cols-2 lg:items-center py-10 sm:py-14">
        <div data-aos="fade-up">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            <ShoppingBag className="w-3.5 h-3.5" /> Live marketplace
          </p>
          <h1 id="market-hero-heading" className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-forest-950 leading-[1.05] text-balance">
            Good living starts with <span className="text-brand-600">fresh finds</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
            Shop products from independent local stores, check out once, and track delivery to your doorstep.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="#featured-products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm min-h-[48px] transition-colors"
            >
              Shop featured <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#deals"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-sand-border bg-white text-forest-950 hover:border-brand-600 min-h-[48px] transition-colors"
            >
              Today&apos;s deals
            </Link>
          </div>
          <dl className="mt-8 flex items-center gap-6 text-sm">
            <div>
              <dt className="sr-only">Live stores</dt>
              <dd className="text-xl font-bold text-forest-950">{stores ? stores.length : "–"}</dd>
              <dd className="text-xs text-stone-500">Live stores</dd>
            </div>
            <div className="w-px h-8 bg-sand-border" aria-hidden="true" />
            <div>
              <dt className="sr-only">Products</dt>
              <dd className="text-xl font-bold text-forest-950">{products ? products.length : "–"}</dd>
              <dd className="text-xs text-stone-500">Products listed</dd>
            </div>
            <div className="w-px h-8 bg-sand-border" aria-hidden="true" />
            <div>
              <dt className="sr-only">Delivery</dt>
              <dd className="text-xl font-bold text-forest-950">Tracked</dd>
              <dd className="text-xs text-stone-500">Doorstep delivery</dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4" aria-hidden="true">
          {products === null ? (
            <>
              <div className="h-44 sm:h-56 rounded-3xl bg-sand-border/60 animate-pulse mt-8" />
              <div className="h-44 sm:h-56 rounded-3xl bg-sand-border/60 animate-pulse" />
              <div className="h-44 sm:h-56 rounded-3xl bg-sand-border/60 animate-pulse mt-12" />
            </>
          ) : visual.length === 0 ? (
            <div className="col-span-3 rounded-3xl border border-dashed border-sand-border bg-white p-6 text-center">
              <p className="text-sm font-semibold text-stone-900">Stores are setting up</p>
              <p className="mt-1 text-xs text-stone-500">Join the waitlist and we will tell you when shopping opens.</p>
              <Link
                href="/waitlist"
                className="mt-3 inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 min-h-[44px]"
              >
                Join the waitlist
              </Link>
            </div>
          ) : (
            visual.map((p, i) => (
              <div
                key={p.id}
                data-aos="fade-up"
                data-aos-delay={i * 90}
                className={`rounded-3xl overflow-hidden border border-sand-border bg-white shadow-sm ${i === 0 ? "mt-8" : i === 2 ? "mt-12" : ""}`}
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" loading="lazy" className="h-32 sm:h-44 w-full object-cover" />
                ) : (
                  <div className={`h-32 sm:h-44 w-full ${p.tint} flex items-center justify-center`}>
                    <i className={`fa ${p.icon} text-3xl opacity-80`} aria-hidden="true" />
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold text-stone-900 truncate">{p.name}</p>
                  <p className="text-[11px] font-bold text-brand-700">{p.price}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Agora-style featured product grid, shared by landing + marketplace.
 * Shows live products only; honest empty state when stores are onboarding.
 */
export function FeaturedProducts() {
  const { products } = useLiveMarketplace();
  const items = (products ?? []).slice(0, 8);

  return (
    <section id="featured-products" aria-labelledby="featured-products-heading" className="bg-white fluid-section-compact scroll-mt-20">
      <div className="site-container">
        <div className="flex items-end justify-between gap-4" data-aos="fade-up">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">Products</p>
            <h2 id="featured-products-heading" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-forest-950">
              Featured Products
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest-950 hover:gap-2 transition-all shrink-0"
          >
            See more <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products === null ? (
          <div className="mt-6">
            <ProductGridSkeleton count={8} />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-sand-border bg-cream p-8 text-center">
            <p className="text-base font-semibold text-stone-900">No live products yet</p>
            <p className="mt-1.5 text-sm text-stone-600 max-w-md mx-auto">
              Stores are still setting up. Join the waitlist and we will tell you when shopping opens.
            </p>
            <Link
              href="/waitlist"
              className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 min-h-[48px]"
            >
              Join the waitlist
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
