import Link from "next/link";
import { ArrowRight, Truck, Star } from "lucide-react";
import { HERO_PRODUCTS } from "./data";
import { HeroProductCard } from "./cards";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-white">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(13,148,136,0.08),transparent)]" />
      <div className="site-container relative grid gap-10 lg:gap-6 lg:grid-cols-2 items-center py-12 sm:py-16 lg:py-24">
        <div data-aos="fade-up">
          <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight text-stone-950 leading-[1.05] text-balance">
            Discover More. Shop Local. Get It Delivered.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
            Explore products from different stores, order what you need, pay
            securely, and have everything delivered to your doorstep, all from
            one place.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              href="#discover"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 shadow-sm min-h-[48px] transition-colors"
            >
              Start Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#sell"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[48px] transition-colors"
            >
              Become a Vendor
            </Link>
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <dt className="sr-only">Ratings</dt>
              <dd className="text-stone-600"><span className="font-semibold text-stone-900">4.8</span> avg. product rating</dd>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-700" />
              <dd className="text-stone-600">Verified stores + tracked delivery</dd>
            </div>
          </dl>
        </div>

        <div className="relative" aria-label="Products from different stores on SettleCart">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-3 sm:space-y-4 pt-6">
              <HeroProductCard product={HERO_PRODUCTS[0]} delay={0} />
              <HeroProductCard product={HERO_PRODUCTS[3]} delay={200} className="[animation-delay:1.2s]" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <HeroProductCard product={HERO_PRODUCTS[1]} delay={100} className="[animation-delay:0.6s]" />
              <HeroProductCard product={HERO_PRODUCTS[4]} delay={300} className="[animation-delay:1.8s]" />
            </div>
            <div className="hidden sm:block space-y-3 sm:space-y-4 pt-12">
              <HeroProductCard product={HERO_PRODUCTS[2]} delay={150} className="[animation-delay:2.4s]" />
              <div data-aos="fade-up" data-aos-delay="350" className="rounded-2xl bg-stone-950 text-white p-4 shadow-lg">
                <p className="text-xs text-stone-300">One cart, 3 stores</p>
                <p className="mt-1 text-lg font-bold">₦45,550</p>
                <p className="mt-1 text-[11px] text-stone-400">Single checkout. Tracked delivery.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
