import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { MarketHero } from "@/components/market/MarketHero";
import { FeaturedCategories } from "@/components/market/FeaturedCategories";
import { PromoBanners } from "@/components/market/PromoBanners";
import { FeaturedProducts } from "@/components/market/MarketHero";
import { DealCountdown, DealsOfDay } from "@/components/market/DealCountdown";

export const metadata = {
  title: "Marketplace | SettleCart",
  description: "Discover businesses, products and services on SettleCart.",
};

const CATEGORIES = [
  { icon: "fa-shopping-basket", label: "Retail & Grocery" },
  { icon: "fa-cutlery", label: "Food & Restaurants" },
  { icon: "fa-black-tie", label: "Fashion" },
  { icon: "fa-scissors", label: "Beauty & Salon" },
  { icon: "fa-wrench", label: "Repairs & Services" },
  { icon: "fa-briefcase", label: "Professional Services" },
];

export default function MarketplacePage() {
  return (
    <>
      <div className="site-container py-8 sm:py-10">
        <PageHeader
          title="Marketplace"
          description="One marketplace connecting customers, businesses and dispatch riders."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Marketplace" }]}
        />

        <Card
          title="Early access"
          action={
            <Link
              href="/waitlist"
              className="text-sm font-medium text-stone-900 underline"
            >
              Join the waitlist
            </Link>
          }
        >
          <p className="text-sm text-stone-600 leading-relaxed">
            The live marketplace is opening to early businesses and customers
            first. Join the waitlist to get notified when stores in your city go
            live.
          </p>
        </Card>
      </div>

      <MarketHero />
      <FeaturedCategories />
      <PromoBanners />
      <FeaturedProducts />
      <DealCountdown />
      <DealsOfDay />

      <div className="site-container py-8 sm:py-12">
        <h2 className="text-base font-semibold text-stone-900">
          Supported business types
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-stone-200 bg-white p-4 flex items-center gap-3"
            >
              <span className="w-9 h-9 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
                <i className={`fa ${c.icon}`} aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-stone-800">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
