"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Timer } from "lucide-react";
import { ProductCard } from "../landing/cards";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { useLiveMarketplace } from "../landing/useLiveMarketplace";

function nextMidnight(): Date {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Agora-style "Summer Discount" split banner with a live countdown.
 * Counts down to local midnight by default (pass endsAt to override).
 */
export function DealCountdown({ endsAt }: { endsAt?: Date | string }) {
  const target = useMemo(() => (endsAt ? new Date(endsAt) : nextMidnight()), [endsAt]);
  // Time is client-only: render zeros on server + first paint so SSR HTML
  // matches, then start ticking after mount to avoid hydration mismatch.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { days, hours, minutes, seconds } = parts(now === null ? 0 : target.getTime() - now);
  const units = [
    { value: pad(days), label: "Days" },
    { value: pad(hours), label: "Hours" },
    { value: pad(minutes), label: "Minutes" },
    { value: pad(seconds), label: "Seconds" },
  ];

  return (
    <section aria-labelledby="deal-countdown-heading" className="bg-white fluid-section-compact">
      <div className="site-container">
        <div data-aos="fade-up" className="grid overflow-hidden rounded-[2rem] border border-sand-border lg:grid-cols-2">
          <div className="bg-sand p-6 sm:p-10">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
              <Timer className="w-3.5 h-3.5" /> Limited time offer
            </p>
            <h2 id="deal-countdown-heading" className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-forest-950 text-balance">
              Weekend Discount, up to 20% off
            </h2>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Fresh deals from live stores. When the timer hits zero, prices go back up.
            </p>
            <div className="mt-5 flex items-center gap-2 sm:gap-3" role="timer" aria-label={`Deal ends in ${days} days, ${hours} hours, ${minutes} minutes`}>
              {units.map((u) => (
                <div key={u.label} className="text-center">
                  <div className="min-w-[56px] sm:min-w-[64px] rounded-2xl bg-forest-900 px-2 py-2.5 sm:py-3 text-xl sm:text-2xl font-bold tabular-nums text-white">
                    {u.value}
                  </div>
                  <p className="mt-1.5 text-[11px] font-medium text-stone-500">{u.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="#deals"
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 min-h-[48px] transition-colors"
            >
              Shop the sale <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative bg-forest-100 p-6 sm:p-10 flex items-center" aria-hidden="true">
            <div className="grid w-full grid-cols-3 gap-3">
              {["fa-shopping-basket", "fa-apple-whole", "fa-carrot"].map((icon, i) => (
                <div
                  key={icon}
                  className={`rounded-3xl bg-white/80 border border-white flex items-center justify-center h-28 sm:h-36 text-forest-800 ${i === 1 ? "-mt-4" : i === 2 ? "mt-4" : ""}`}
                >
                  <i className={`fa ${icon} text-3xl sm:text-4xl`} aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Agora-style "Deals of the Day" grid. Live deal-flagged products first,
 * then other live products. Honest empty state when nothing is live.
 */
export function DealsOfDay() {
  const { products } = useLiveMarketplace();
  const items =
    products && products.length > 0
      ? [...products.filter((p) => p.deal), ...products.filter((p) => !p.deal)].slice(0, 4)
      : [];

  return (
    <section id="deals" aria-labelledby="deals-heading" className="bg-cream fluid-section-compact scroll-mt-20">
      <div className="site-container">
        <div className="flex items-end justify-between gap-4" data-aos="fade-up">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">Today&apos;s deals</p>
            <h2 id="deals-heading" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-forest-950">
              Deals of the Day
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest-950 hover:gap-2 transition-all shrink-0"
          >
            All deals <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products === null ? (
          <div className="mt-6">
            <ProductGridSkeleton count={4} />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-sand-border bg-white p-8 text-center">
            <p className="text-base font-semibold text-stone-900">No deals today</p>
            <p className="mt-1.5 text-sm text-stone-600 max-w-md mx-auto">
              Check back soon — deals appear here as soon as stores publish them.
            </p>
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
