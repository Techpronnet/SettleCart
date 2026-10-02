"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Package, TrendingUp } from "lucide-react";
import { SectionHeading } from "./cards";
import { useLiveMarketplace } from "./useLiveMarketplace";

function LiveStoresPanel() {
  const { stores } = useLiveMarketplace();

  if (stores === null) {
    return (
      <div data-aos="fade-up" data-aos-delay="120" className="rounded-2xl border border-stone-200 bg-cream p-4 sm:p-6" aria-hidden="true">
        <div className="rounded-xl bg-white border border-stone-200 p-3.5 h-[68px] animate-pulse" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-white border border-stone-200 p-3 h-[68px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div data-aos="fade-up" data-aos-delay="120" className="overflow-hidden rounded-2xl border border-sand-border bg-cream shadow-[0_16px_50px_rgba(0,0,0,0.08)]" aria-label="Vendor opportunity">
        <div className="relative h-44 sm:h-52" aria-hidden="true">
          <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
            <rect width="400" height="200" fill="#EFF6F1" />
            <path d="M-20 150 C 60 130, 120 170, 200 150 S 340 120, 430 150 L 430 220 L -20 220 Z" fill="#DCE9E2" />
            <rect x="30" y="25" width="70" height="45" rx="6" fill="#FFFFFF" />
            <rect x="115" y="25" width="45" height="45" rx="6" fill="#FDF6EC" />
            <rect x="175" y="20" width="80" height="50" rx="6" fill="#FFFFFF" />
            <rect x="270" y="25" width="55" height="45" rx="6" fill="#FDF6EC" />
            <rect x="30" y="85" width="45" height="40" rx="6" fill="#FDF6EC" />
            <rect x="270" y="85" width="100" height="40" rx="6" fill="#FFFFFF" />
            <rect x="30" y="140" width="90" height="35" rx="6" fill="#FFFFFF" />
            <rect x="280" y="140" width="90" height="35" rx="6" fill="#FDF6EC" />
            <ellipse cx="330" cy="45" rx="28" ry="16" fill="#CFE3D4" />
            <g stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round">
              <line x1="0" y1="78" x2="400" y2="78" />
              <line x1="168" y1="0" x2="168" y2="200" />
              <line x1="262" y1="0" x2="262" y2="200" />
              <line x1="0" y1="132" x2="400" y2="132" />
            </g>
            <g stroke="#E9DDCB" strokeWidth="2" strokeDasharray="8 6">
              <line x1="0" y1="78" x2="400" y2="78" />
              <line x1="168" y1="0" x2="168" y2="200" />
            </g>
          </svg>
          <span className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="rounded-full bg-forest-950/90 px-2.5 py-1 text-[10px] font-bold text-white whitespace-nowrap">
              Your spot
            </span>
            <span className="relative mt-1 flex items-center justify-center">
              <span className="absolute w-10 h-10 rounded-full bg-brand-600/20 animate-ping" />
              <span className="relative w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg">
                <i className="fa fa-store text-sm" aria-hidden="true" />
              </span>
            </span>
          </span>
        </div>
        <div className="p-6 sm:p-8 text-center">
          <p className="text-base font-semibold text-stone-900">Be the first store here</p>
          <p className="mt-1 text-sm text-stone-600">New marketplaces need pioneers. Open your store in minutes.</p>
          <Link
            href="/register?as=vendor"
            className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 min-h-[48px]"
          >
            Claim your spot <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const featured = stores.slice(0, 3);

  return (
    <div data-aos="fade-up" data-aos-delay="120" className="rounded-2xl border border-stone-200 bg-cream p-4 sm:p-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)]" aria-label="Stores live on SettleCart">
      <div className="flex items-center gap-3 rounded-xl bg-white border border-stone-200 p-3.5">
        {featured[0].logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={featured[0].logo_url} alt="" aria-hidden="true" className="w-10 h-10 rounded-xl object-cover shrink-0" />
        ) : (
          <span className="w-10 h-10 rounded-xl bg-forest-900 text-white font-bold flex items-center justify-center shrink-0">
            {featured[0].initial}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 truncate">{featured[0].name}</p>
          <p className="text-xs text-forest-700 font-medium">Live · Accepting orders</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-stone-500 shrink-0">
          <TrendingUp className="w-4 h-4" /> {stores.length} live
        </span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {featured.map((s) => (
          <li key={s.id}>
            <Link
              href={`/stores/${s.id}`}
              className="flex items-center gap-3 rounded-xl bg-white border border-stone-200 p-3 hover:border-brand-600 transition-colors"
            >
              {s.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logo_url} alt="" aria-hidden="true" className="w-9 h-9 rounded-lg object-cover shrink-0" />
              ) : (
                <span className="w-9 h-9 rounded-lg bg-forest-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {s.initial}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-stone-900 truncate">{s.name}</span>
                <span className="block text-[11px] text-stone-500 truncate">{s.city}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-forest-700 shrink-0">
                <Package className="w-3.5 h-3.5" /> Visit
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VendorCTA() {
  return (
    <section id="sell" aria-labelledby="sell-heading" className="bg-white fluid-section scroll-mt-20">
      <div className="site-container grid gap-8 lg:grid-cols-2 lg:items-center">
        <div data-aos="fade-up">
          <SectionHeading
            align="left"
            eyebrow="For vendors"
            title="Your Store Belongs Here."
            copy="Turn your products into a digital storefront and reach customers beyond your physical location."
          />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 min-h-[48px] transition-colors"
            >
              Start Selling <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[48px] transition-colors"
            >
              Learn More
            </Link>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-stone-600">
            {["Publish products in minutes", "Receive and prepare orders", "Get paid through verified settlement"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-brand-600 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <LiveStoresPanel />
      </div>
    </section>
  );
}
