"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How much does SettleCart cost to use?",
      a: "Vendor registration, store creation, and platform access are 100% free with zero monthly subscriptions. SettleCart monetizes via a small, transparent commission (e.g. 5%) on successfully delivered sales and a standard pass-through bank transfer fee (₦50) on bank withdrawals.",
    },
    {
      q: "How does the Delivery Verification Code (v1.1) protect my business?",
      a: "Under SRS v1.1, every physical delivery generates a unique, one-time 6-digit cryptographic OTP sent directly to the customer. When the dispatch rider arrives, the customer inspects the package and gives the OTP to the rider. The order cannot be completed or settled without this code, completely eliminating 'package never arrived' false chargebacks and rider theft.",
    },
    {
      q: "How quickly do I get my money after a successful delivery?",
      a: "Our settlement engine utilizes a hybrid escrow model. For dispatch riders, delivery earnings become available immediately upon OTP validation. For merchants, sales proceeds move into your Available Balance after a configurable 24-hour dispute window, after which you can withdraw directly to any Nigerian commercial bank account via Paystack Transfers.",
    },
    {
      q: "What KYC verification is required to start selling?",
      a: "We operate a frictionless tiered KYC model. Tier 1 (Individual/Starter) requires just your Phone OTP verification, BVN/NIN validation, and bank account name matching—allowing you to start selling up to ₦500,000 monthly. Tier 2 (Registered Business) adds CAC registration for unlimited sales volume.",
    },
    {
      q: "Can customers buy from multiple stores in a single order?",
      a: "Yes! SettleCart features a Parent/Child order orchestration engine. The customer checks out with one single cart and payment. Behind the scenes, SettleCart automatically decomposes the order into independent vendor orders and dedicated dispatch tasks so that one vendor's preparation time never delays another.",
    },
    {
      q: "Can I manage deliveries with my own dispatch riders?",
      a: "Yes. SettleCart provides a flexible dispatch layer. You can fulfill orders using your own in-house riders or tap into the open SettleCart dispatch pool with automated radius broadcast matching.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-slate-900/40 relative border-t border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything You Need To Know
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Clear answers about payments, security, dispatch, and settlement.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:text-emerald-400 transition-colors"
                >
                  <span className="font-semibold text-white text-base sm:text-lg">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-emerald-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-slate-300 text-sm leading-relaxed border-t border-slate-900 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

