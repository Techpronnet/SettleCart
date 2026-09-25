import { Store, CreditCard, BadgeCheck, Truck, LayoutDashboard, ReceiptText } from "lucide-react";
import { SectionHeading } from "./cards";

const FLOW = [
  { icon: Store, label: "Catalogue", sub: "Stores publish products" },
  { icon: ReceiptText, label: "Order", sub: "One checkout, split per vendor" },
  { icon: CreditCard, label: "Payment", sub: "Confirmed via webhook" },
  { icon: Truck, label: "Dispatch", sub: "Verified handoff" },
  { icon: BadgeCheck, label: "Settlement", sub: "Earnings land in wallets" },
];

const LANES: {
  stage: string;
  title: string;
  features: { icon: typeof Store; title: string; text: string }[];
}[] = [
  {
    stage: "01 · Discover",
    title: "Find trusted stores",
    features: [
      { icon: Store, title: "Multiple Stores", text: "Discover products from different businesses in one marketplace." },
      { icon: BadgeCheck, title: "Verified Businesses", text: "Helps customers discover trusted stores and vendors." },
    ],
  },
  {
    stage: "02 · Transact",
    title: "Order and pay with confidence",
    features: [
      { icon: CreditCard, title: "Secure Payments", text: "A streamlined and secure checkout experience." },
      { icon: ReceiptText, title: "Transparent Transactions", text: "Clear order and payment tracking for customers and vendors." },
    ],
  },
  {
    stage: "03 · Fulfill",
    title: "Delivered and settled",
    features: [
      { icon: Truck, title: "Reliable Delivery", text: "Orders move from store preparation to dispatch and delivery." },
      { icon: LayoutDashboard, title: "Simple Vendor Tools", text: "Businesses manage products, orders and storefronts from one place." },
    ],
  },
];

export function WhySettleCart() {
  return (
    <section aria-labelledby="why-heading" className="bg-white fluid-section">
      <div className="site-container">
        <SectionHeading
          eyebrow="Why SettleCart"
          title="Commerce Designed Around Simplicity."
        />
        <ol aria-label="How data moves through SettleCart" className="mt-10 flex items-stretch gap-0 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {FLOW.map((step, i) => (
            <li key={step.label} className="flex items-center min-w-[150px] flex-1" data-aos="fade-up" data-aos-delay={i * 80}>
              <div className="flex flex-col items-center text-center w-[118px] shrink-0">
                <span className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-sm">
                  <step.icon className="w-5 h-5" />
                </span>
                <p className="mt-2 text-sm font-semibold text-stone-900">{step.label}</p>
                <p className="text-[11px] text-stone-500 leading-snug">{step.sub}</p>
              </div>
              {i < FLOW.length - 1 && (
                <div aria-hidden="true" className="relative h-px flex-1 bg-stone-200 min-w-6 mx-1 self-start mt-[22px]">
                  <span className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-600 animate-flow-x" />
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-3 sm:gap-4 lg:grid-cols-3">
          {LANES.map((lane, i) => (
            <article
              key={lane.stage}
              data-aos="fade-up"
              data-aos-delay={i * 90}
              className="rounded-2xl border border-stone-200 bg-[#fafaf9] p-5 sm:p-6"
            >
              <p className="text-[11px] font-mono uppercase tracking-wider text-teal-800">{lane.stage}</p>
              <h3 id={i === 0 ? "why-heading" : undefined} className="mt-1 text-base font-semibold text-stone-900">{lane.title}</h3>
              <ul className="mt-4 space-y-4">
                {lane.features.map((f) => (
                  <li key={f.title} className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0">
                      <f.icon className="w-4 h-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-stone-900">{f.title}</span>
                      <span className="block mt-0.5 text-[13px] text-stone-600 leading-relaxed">{f.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
