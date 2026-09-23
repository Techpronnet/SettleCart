import React from "react";
import {
  Store,
  ShoppingBag,
  User,
  PackageCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Coins,
} from "lucide-react";

export interface LifecycleStage {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const lifecycleStages: LifecycleStage[] = [
  {
    number: "01",
    title: "Business",
    description: "Create your business profile and get verified.",
    icon: Store,
  },
  {
    number: "02",
    title: "Store",
    description: "Publish products or services through your digital storefront.",
    icon: ShoppingBag,
  },
  {
    number: "03",
    title: "Customer",
    description: "Customers discover your business and browse what you offer.",
    icon: User,
  },
  {
    number: "04",
    title: "Order",
    description: "Orders move from checkout into fulfillment.",
    icon: PackageCheck,
  },
  {
    number: "05",
    title: "Payment",
    description: "Payments are verified and held through the transaction flow.",
    icon: CreditCard,
  },
  {
    number: "06",
    title: "Dispatch",
    description: "Ready orders are connected to delivery operations.",
    icon: Truck,
  },
  {
    number: "07",
    title: "Delivery",
    description: "The order moves from store to customer and is verified at handover.",
    icon: CheckCircle2,
  },
  {
    number: "08",
    title: "Settlement",
    description: "Completed transactions become eligible for vendor and dispatch settlement.",
    icon: Coins,
  },
];

export function ConnectedCommerceLifecycle() {
  return (
    <section className="fluid-section bg-[#fafaf9] border-b border-stone-200/80 overflow-hidden">
      <div className="site-container">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 lg:mb-20">
          <h2
            data-aos="fade-up"
            className="text-[clamp(1.75rem,3.2vw+0.25rem,2.85rem)] font-semibold tracking-tight text-stone-900 leading-tight"
          >
            How commerce moves
          </h2>
          <p
            data-aos="fade-up"
            data-aos-delay="80"
            className="mt-4 sm:mt-5 text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-2xl"
          >
            From the moment a customer discovers a business to the moment the transaction is settled, every part of the journey is connected.
          </p>
        </div>

        {/* ============================================================ */}
        {/* DESKTOP TIMELINE (lg and above: single wide connected track) */}
        {/* ============================================================ */}
        <div className="hidden lg:block relative py-8">
          
          {/* Continuous Connecting Line running through all 8 stages */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[2px] bg-stone-200 pointer-events-none z-0">
            {/* Subtle progressive gradient pulse indicating flow from left to right */}
            <div className="w-full h-full bg-gradient-to-r from-stone-300 via-teal-600/50 to-stone-400 transition-opacity duration-1000" />
          </div>

          {/* 8 Columns Grid */}
          <div className="grid grid-cols-8 gap-3 relative z-10">
            {lifecycleStages.map((stage, idx) => {
              const Icon = stage.icon;
              const isAbove = idx % 2 === 0; // Alternating rhythm: 01, 03, 05, 07 above; 02, 04, 06, 08 below
              const delay = idx * 80;

              return (
                <div
                  key={stage.number}
                  data-aos="fade-up"
                  data-aos-delay={delay}
                  className="group flex flex-col items-center cursor-default"
                >
                  {/* TOP SLOT (for stages 01, 03, 05, 07) */}
                  <div className="h-44 w-full flex flex-col justify-end pb-4 transition-transform duration-300 group-hover:-translate-y-1">
                    {isAbove ? (
                      <div className="text-left pr-2">
                        <span className="font-mono text-3xl font-semibold text-stone-300 group-hover:text-stone-900 transition-colors block">
                          {stage.number}
                        </span>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Icon className="w-3.5 h-3.5 text-stone-500 group-hover:text-teal-700 transition-colors shrink-0" />
                          <h3 className="text-sm font-semibold text-stone-900 leading-tight">
                            {stage.title}
                          </h3>
                        </div>
                        <p className="mt-1.5 text-xs text-stone-500 leading-relaxed font-normal group-hover:text-stone-700 transition-colors">
                          {stage.description}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* CENTER MILESTONE NODE (directly on the line) */}
                  <div className="relative flex items-center justify-center my-1 z-20">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#fafaf9] bg-stone-300 group-hover:bg-teal-700 group-hover:scale-125 transition-all duration-200 shadow-xs" />
                  </div>

                  {/* BOTTOM SLOT (for stages 02, 04, 06, 08) */}
                  <div className="h-44 w-full flex flex-col justify-start pt-4 transition-transform duration-300 group-hover:translate-y-1">
                    {!isAbove ? (
                      <div className="text-left pr-2">
                        <span className="font-mono text-3xl font-semibold text-stone-300 group-hover:text-stone-900 transition-colors block">
                          {stage.number}
                        </span>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Icon className="w-3.5 h-3.5 text-stone-500 group-hover:text-teal-700 transition-colors shrink-0" />
                          <h3 className="text-sm font-semibold text-stone-900 leading-tight">
                            {stage.title}
                          </h3>
                        </div>
                        <p className="mt-1.5 text-xs text-stone-500 leading-relaxed font-normal group-hover:text-stone-700 transition-colors">
                          {stage.description}
                        </p>
                      </div>
                    ) : null}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* MOBILE & TABLET TIMELINE (< lg: clean vertical journey)     */}
        {/* ============================================================ */}
        <div className="lg:hidden relative pl-6 sm:pl-8 border-l border-stone-200 space-y-10 my-10">
          {lifecycleStages.map((stage, idx) => {
            const Icon = stage.icon;
            const delay = Math.min(idx * 70, 400);

            return (
              <div
                key={stage.number}
                data-aos="fade-up"
                data-aos-delay={delay}
                className="relative group cursor-default"
              >
                {/* Node on vertical line */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[#fafaf9] bg-stone-300 group-hover:bg-teal-700 transition-colors shadow-xs" />

                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-semibold text-stone-300 group-hover:text-stone-900 transition-colors">
                    {stage.number}
                  </span>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-stone-500 group-hover:text-teal-700 transition-colors shrink-0" />
                    <h3 className="text-base font-semibold text-stone-900">
                      {stage.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-1.5 text-sm text-stone-600 leading-relaxed max-w-md">
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* SECONDARY VISUAL BELOW THE LIFECYCLE                         */}
        {/* ============================================================ */}
        <div className="mt-20 md:mt-28 pt-12 border-t border-stone-200/90">
          
          {/* Subtle statement */}
          <p
            data-aos="fade-up"
            className="text-base sm:text-lg font-medium text-stone-800 tracking-tight mb-8"
          >
            One connected flow. Multiple businesses. Thousands of possible commerce journeys.
          </p>

          {/* Three small supporting concepts in clean editorial 3-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            
            <div data-aos="fade-up" data-aos-delay="80" className="flex flex-col">
              <div className="flex items-center gap-2 text-stone-900 mb-1.5">
                <Store className="w-4 h-4 text-teal-700" />
                <h4 className="text-base font-semibold">Sell</h4>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed font-normal">
                Create your storefront and publish what you offer.
              </p>
            </div>

            <div data-aos="fade-up" data-aos-delay="160" className="flex flex-col">
              <div className="flex items-center gap-2 text-stone-900 mb-1.5">
                <Truck className="w-4 h-4 text-teal-700" />
                <h4 className="text-base font-semibold">Fulfill</h4>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed font-normal">
                Manage orders and connect them with delivery.
              </p>
            </div>

            <div data-aos="fade-up" data-aos-delay="240" className="flex flex-col">
              <div className="flex items-center gap-2 text-stone-900 mb-1.5">
                <Coins className="w-4 h-4 text-teal-700" />
                <h4 className="text-base font-semibold">Settle</h4>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed font-normal">
                Complete the transaction and move earnings through the platform.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

