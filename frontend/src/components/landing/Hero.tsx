"use client";

import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";
import { HeroProductCard } from "./cards";
import { useLiveMarketplace } from "./useLiveMarketplace";
import type { LandingProduct } from "./data";

function PulseTile({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`rounded-2xl border border-stone-200/80 bg-white/60 p-3 ${className}`}>
      <div className="h-28 rounded-xl bg-stone-200/80 animate-pulse" />
      <div className="mt-2 h-3 w-3/4 rounded bg-stone-200/80 animate-pulse" />
      <div className="mt-1.5 h-3 w-1/2 rounded bg-stone-200/80 animate-pulse" />
    </div>
  );
}

function Collage({ items }: { items: LandingProduct[] }) {
  const pick = (i: number): LandingProduct | null => items[i] ?? null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      <div className="space-y-3 sm:space-y-4 pt-6">
        {pick(0) ? (
          <HeroProductCard product={pick(0) as LandingProduct} delay={0} />
        ) : (
          <SellHereTile />
        )}
        {pick(3) ? (
          <HeroProductCard product={pick(3) as LandingProduct} delay={200} className="[animation-delay:1.2s]" />
        ) : (
          <SellHereTile />
        )}
      </div>
      <div className="space-y-3 sm:space-y-4">
        {pick(1) ? (
          <HeroProductCard product={pick(1) as LandingProduct} delay={100} className="[animation-delay:0.6s]" />
        ) : (
          <SellHereTile />
        )}
        {pick(4) ? (
          <HeroProductCard product={pick(4) as LandingProduct} delay={300} className="[animation-delay:1.8s]" />
        ) : (
          <SellHereTile />
        )}
      </div>
      <div className="hidden sm:block space-y-3 sm:space-y-4 pt-12">
        {pick(2) ? (
          <HeroProductCard product={pick(2) as LandingProduct} delay={150} className="[animation-delay:2.4s]" />
        ) : (
          <SellHereTile />
        )}
        <div data-aos="fade-up" data-aos-delay="350" className="rounded-2xl bg-forest-800 border border-white/10 text-white p-4 shadow-lg">
          <p className="text-xs text-white">One cart, many stores</p>
          <p className="mt-1 text-[11px] text-forest-100">Single checkout. Tracked delivery.</p>
        </div>
      </div>
    </div>
  );
}

function SellHereTile() {
  return (
    <Link
      href="/register?as=vendor"
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/25 bg-white/10 p-3 text-center min-h-[132px] hover:border-brand-500 transition-colors"
    >
      <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
        <i className="fa fa-plus text-xs" aria-hidden="true" />
      </span>
      <span className="text-xs font-semibold text-white">Sell here</span>
      <span className="text-[11px] text-forest-100">Open your store</span>
    </Link>
  );
}

export function Hero() {
  const { products } = useLiveMarketplace();
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-forest-900 text-white">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(249,106,27,0.16),transparent)]" />
      <div className="site-container relative grid gap-10 lg:gap-6 lg:grid-cols-2 items-center py-12 sm:py-16 lg:py-24">
        <div data-aos="fade-up">
          <span className="inline-flex items-center rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-100">
            Limited only · Up to 50% off
          </span>
          <h1 id="hero-heading" className="mt-4 text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.05] text-balance">
            Shop More. <span className="text-brand-500">Save More!</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-forest-100 leading-relaxed max-w-xl">
            Discover amazing deals on your favorite products. Explore stores,
            order what you need, pay securely, and get everything delivered
            to your doorstep.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              href="#discover"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm min-h-[48px] transition-colors"
            >
              Start Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#sell"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-white/25 text-white hover:bg-white/10 min-h-[48px] transition-colors"
            >
              Become a Vendor
            </Link>
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-forest-100">
            <Truck className="w-4 h-4 text-brand-500" />
            Verified stores. Tracked delivery.
          </p>
        </div>

        <div className="relative" aria-label="Products from different stores on SettleCart">
          {products === null ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4" aria-hidden="true">
              <div className="space-y-3 sm:space-y-4 pt-6">
                <PulseTile />
                <PulseTile />
              </div>
              <div className="space-y-3 sm:space-y-4">
                <PulseTile />
                <PulseTile />
              </div>
              <div className="hidden sm:block pt-12">
                <PulseTile />
              </div>
            </div>
          ) : (
            <Collage items={products.slice(0, 5)} />
          )}
        </div>
      </div>
    </section>
  );
}
