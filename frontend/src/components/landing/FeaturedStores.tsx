"use client";

import Link from "next/link";
import { BadgeCheck, ArrowRight } from "lucide-react";
import { SectionHeading } from "./cards";
import { StoreGridSkeleton } from "@/components/ui/Skeleton";
import { useLiveMarketplace, type LiveStore } from "./useLiveMarketplace";

function LiveStoreCard({ s, index }: { s: LiveStore; index: number }) {
  return (
    <article
      data-aos="fade-up"
      data-aos-delay={(index % 3) * 90}
      className="group rounded-2xl border border-stone-200 bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
    >
      <div className="h-28 bg-stone-100 text-stone-500 flex items-center justify-center">
        <span className="w-12 h-12 rounded-2xl bg-forest-900 text-white text-xl font-bold flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          {s.initial}
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
              <span className="truncate">{s.name}</span>
              <BadgeCheck className="w-4 h-4 text-forest-700 shrink-0" aria-label="Verified store" />
            </h3>
            <p className="text-xs text-stone-500">{s.city} · Live now</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-forest-50 border border-forest-100 px-2 py-0.5 text-[11px] font-semibold text-forest-800">
            Accepting orders
          </span>
          <Link href={`/stores/${s.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:gap-2 transition-all">
            View Store <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FeaturedStores() {
  const { stores } = useLiveMarketplace();
  return (
    <section id="stores" aria-labelledby="stores-heading" className="bg-cream fluid-section scroll-mt-20">
      <div className="site-container">
        <SectionHeading
          eyebrow="Stores"
          title="Meet the Stores Behind the Marketplace."
          copy="Independent businesses operating on SettleCart, each with its own storefront, products and customers."
        />
        {stores === null ? (
          <div className="mt-8">
            <StoreGridSkeleton count={6} />
          </div>
        ) : stores.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-base font-semibold text-stone-900">No live stores yet</p>
            <p className="mt-1.5 text-sm text-stone-600 max-w-md mx-auto">
              Independent businesses are setting up. Join the waitlist to know when your city opens.
            </p>
            <Link
              href="/waitlist"
              className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 min-h-[48px]"
            >
              Join the waitlist
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s, i) => (
              <LiveStoreCard key={s.id} s={s} index={i} />
            ))}
          </div>
        )}
        <div className="mt-8 text-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-sand-border text-stone-900 hover:bg-white min-h-[48px] transition-colors"
          >
            Explore Stores
          </Link>
        </div>
      </div>
    </section>
  );
}
