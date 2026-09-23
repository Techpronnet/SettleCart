"use client";

import React, { useState } from "react";
import {
  Search,
  ShoppingBag,
  Plus,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Check,
} from "lucide-react";

export interface CustomerJourneyStep {
  number: string;
  title: string;
  shortCopy: string;
  description: string;
}

export const customerJourneySteps: CustomerJourneyStep[] = [
  {
    number: "01",
    title: "Discover",
    shortCopy: "Find businesses and products.",
    description: "Explore businesses, products, and services available around you.",
  },
  {
    number: "02",
    title: "Order",
    shortCopy: "Add what you need and checkout.",
    description: "Add what you need and place your order in a few simple steps.",
  },
  {
    number: "03",
    title: "Pay",
    shortCopy: "Complete your payment securely.",
    description: "Complete checkout securely and keep track of your transaction from payment to fulfillment.",
  },
  {
    number: "04",
    title: "Receive",
    shortCopy: "Track your order to delivery.",
    description: "Follow your order as it moves from the business to your doorstep.",
  },
];

export function CustomerJourney() {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <section id="for-customers" className="fluid-section bg-white border-b border-stone-200/80 overflow-hidden">
      <div className="site-container">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span
            data-aos="fade-up"
            className="text-xs font-semibold tracking-wider uppercase text-stone-500 block mb-3"
          >
            THE CUSTOMER EXPERIENCE
          </span>
          <h2
            data-aos="fade-up"
            data-aos-delay="60"
            className="text-[clamp(1.75rem,3.2vw+0.25rem,2.85rem)] font-semibold tracking-tight text-stone-900 leading-tight"
          >
            From discovery to doorstep.
          </h2>
          <p
            data-aos="fade-up"
            data-aos-delay="120"
            className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-2xl"
          >
            Find what you need, order from businesses you trust, pay securely, and follow your order until it reaches you.
          </p>
        </div>

        {/* ============================================================ */}
        {/* DESKTOP INTERACTIVE JOURNEY (Two-column layout)              */}
        {/* ============================================================ */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Interactive 4-Stage Stepper */}
          <div
            data-aos="fade-up"
            data-aos-delay="100"
            className="lg:col-span-5 space-y-4 pt-2"
          >
            {customerJourneySteps.map((step, idx) => {
              const isActive = activeStep === idx;

              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  onMouseEnter={() => setActiveStep(idx)}
                  className={`w-full text-left p-5 rounded-lg border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#fafaf9] border-stone-400/80 shadow-xs translate-x-1"
                      : "bg-white border-stone-200/80 hover:border-stone-300 hover:bg-[#fafaf9]/50"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`font-mono text-xs font-semibold tracking-wider transition-colors ${
                        isActive ? "text-teal-700" : "text-stone-400"
                      }`}
                    >
                      {step.number}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    )}
                  </div>

                  <h3
                    className={`text-lg font-semibold mt-1 transition-colors ${
                      isActive ? "text-stone-900" : "text-stone-700"
                    }`}
                  >
                    {step.title}
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-stone-500 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Realistic Evolving Product UI Surface */}
          <div
            data-aos="fade-up"
            data-aos-delay="120"
            className="lg:col-span-7 bg-[#fafaf9] rounded-lg border border-stone-200 p-6 sm:p-8 shadow-xs min-h-[480px] flex flex-col justify-between"
          >
            {/* STAGE 01: DISCOVER UI */}
            {activeStep === 0 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Search & Tags */}
                <div className="flex items-center gap-2 pb-3 border-b border-stone-200/80">
                  <div className="flex-1 flex items-center gap-2 bg-white border border-stone-200 rounded px-3 py-1.5 text-xs text-stone-600">
                    <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Search businesses, farm produce, meals...</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                    <span className="px-2 py-1 rounded bg-white border border-stone-200 font-medium text-stone-800">
                      Nearby
                    </span>
                    <span className="px-2 py-1 rounded bg-white border border-stone-200 font-medium text-stone-600">
                      Popular
                    </span>
                  </div>
                </div>

                {/* Business Storefront Header */}
                <div className="bg-white p-4 rounded-md border border-stone-200 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-stone-900">Fresh Market</h4>
                      <span className="text-[10px] font-medium text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                        Open
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Fresh groceries delivered from local businesses
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>Lekki &bull; 15-25 min</span>
                  </div>
                </div>

                {/* Products List */}
                <div className="space-y-2.5">
                  <div className="bg-white p-3 rounded-md border border-stone-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-stone-900">Heirloom Vine Tomatoes (1kg)</p>
                      <p className="text-[11px] text-stone-500">Fresh produce &bull; Daily farm delivery</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-stone-900">₦1,800</span>
                      <button
                        onClick={() => setActiveStep(1)}
                        className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-white font-medium text-[11px] transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-md border border-stone-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-stone-900">Sweet Bell Peppers (Pack of 3)</p>
                      <p className="text-[11px] text-stone-500">Fresh produce &bull; In stock</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-stone-900">₦2,200</span>
                      <button
                        onClick={() => setActiveStep(1)}
                        className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-white font-medium text-[11px] transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-md border border-stone-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-stone-900">Cold-Pressed Palm Oil (1 Litre)</p>
                      <p className="text-[11px] text-stone-500">Pantry essentials &bull; Sealed bottle</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-stone-900">₦3,400</span>
                      <button
                        onClick={() => setActiveStep(1)}
                        className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-white font-medium text-[11px] transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs text-stone-500 border-t border-stone-200">
                  <span>Cart: 2 items selected</span>
                  <button
                    onClick={() => setActiveStep(1)}
                    className="font-medium text-stone-900 hover:text-teal-700 flex items-center gap-1 transition-colors"
                  >
                    Proceed to Order <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 02: ORDER UI */}
            {activeStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-stone-800" />
                    <h4 className="text-sm font-semibold text-stone-900">Your Basket &bull; Fresh Market</h4>
                  </div>
                  <span className="text-xs text-stone-500">2 items</span>
                </div>

                {/* Items in Basket */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-white rounded-md border border-stone-200 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-900">Heirloom Vine Tomatoes (1kg)</p>
                      <p className="text-[11px] text-stone-500">₦1,800 &times; 2</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-stone-900">₦3,600</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-md border border-stone-200 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-900">Sweet Bell Peppers (Pack of 3)</p>
                      <p className="text-[11px] text-stone-500">₦2,200 &times; 1</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-stone-900">₦2,200</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white p-3.5 rounded-md border border-stone-200 text-xs space-y-1.5 text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₦5,800</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery (Lekki neighborhood dispatch)</span>
                    <span>₦1,200</span>
                  </div>
                  <div className="flex justify-between text-stone-900 font-semibold text-sm pt-2 border-t border-stone-100">
                    <span>Total</span>
                    <span>₦7,000</span>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2 flex justify-between items-center">
                  <button
                    onClick={() => setActiveStep(0)}
                    className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    &larr; Back to catalogue
                  </button>
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-5 py-2.5 rounded-md bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    Place order <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 03: PAY UI */}
            {activeStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900">Checkout &amp; Payment</h4>
                    <p className="text-xs text-stone-500">Order reference #SC-7104</p>
                  </div>
                  <span className="text-sm font-bold text-stone-900">₦7,000</span>
                </div>

                {/* Payment Option */}
                <div className="p-4 bg-white rounded-md border border-stone-200 space-y-3 text-xs">
                  <span className="font-semibold text-stone-900 block">Select Payment Method</span>
                  
                  <div className="p-2.5 rounded border border-stone-300 bg-stone-50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-stone-800" />
                      <div>
                        <p className="font-medium text-stone-900">Instant Bank Transfer / Card</p>
                        <p className="text-[11px] text-stone-500">Fast transaction processing via platform rail</p>
                      </div>
                    </div>
                    <span className="w-3.5 h-3.5 rounded-full bg-stone-900 border-2 border-white" />
                  </div>
                </div>

                {/* Verified Escrow Note */}
                <div className="p-3.5 rounded-md bg-white border border-stone-200 flex items-start gap-2.5 text-xs text-stone-600">
                  <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-stone-900 block">Payment verified through platform</span>
                    <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                      Funds are held securely in the transaction flow until fulfillment is completed and confirmed at your door.
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2 flex justify-between items-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="w-3 h-3" /> Ready to pay
                  </span>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-5 py-2.5 rounded-md bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    Pay securely <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 04: RECEIVE UI */}
            {activeStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900">Delivery Tracking</h4>
                    <p className="text-xs text-stone-500">Order #SC-7104 &bull; Fresh Market</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Delivery verified &check;
                  </span>
                </div>

                {/* Rider Info Card */}
                <div className="p-3.5 bg-white rounded-md border border-stone-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-stone-800 font-semibold">
                      MK
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">Musa K. (Assigned Rider)</p>
                      <p className="text-[11px] text-stone-500">Dispatch Box Motorcycle &bull; Verified rider</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    At your door
                  </span>
                </div>

                {/* Step Route */}
                <div className="bg-white p-4 rounded-md border border-stone-200 text-xs space-y-2">
                  <span className="font-semibold text-stone-900 block mb-2">Transit Timeline</span>

                  <div className="flex items-center justify-between text-stone-400">
                    <span>Store accepted order</span>
                    <span>10:14 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-400">
                    <span>Package picked up by rider</span>
                    <span>10:22 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-400">
                    <span>On the way (Lekki Phase 1)</span>
                    <span>10:31 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-900 font-medium pt-1 border-t border-stone-100">
                    <span className="flex items-center gap-1.5 text-teal-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Handover code validated
                    </span>
                    <span className="text-teal-800">Completed</span>
                  </div>
                </div>

                {/* Verification Notice */}
                <div className="p-3 rounded bg-stone-100/70 border border-stone-200 text-xs text-stone-600">
                  <p className="leading-relaxed">
                    Confirm your delivery with the verification code provided by the platform.
                  </p>
                </div>

                {/* Reset loop */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveStep(0)}
                    className="text-xs text-stone-500 hover:text-stone-900 underline transition-colors"
                  >
                    Explore another order journey &rarr;
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ============================================================ */}
        {/* MOBILE VERTICAL JOURNEY (< lg)                               */}
        {/* ============================================================ */}
        <div className="lg:hidden space-y-12">
          
          {/* 01 DISCOVER */}
          <div data-aos="fade-up" className="relative pl-6 border-l-2 border-stone-200 space-y-4">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white bg-teal-700" />
            <div>
              <span className="font-mono text-xs font-semibold text-teal-700">01</span>
              <h3 className="text-xl font-semibold text-stone-900">Discover</h3>
              <p className="text-sm text-stone-600 mt-1">Explore businesses, products, and services available around you.</p>
            </div>
            
            <div className="bg-[#fafaf9] p-4 rounded-lg border border-stone-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center font-medium text-stone-900">
                <span>Fresh Market</span>
                <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Open</span>
              </div>
              <div className="p-2.5 bg-white rounded border border-stone-200 flex justify-between items-center">
                <span>Heirloom Vine Tomatoes (1kg)</span>
                <span className="font-semibold text-stone-900">₦1,800</span>
              </div>
              <div className="p-2.5 bg-white rounded border border-stone-200 flex justify-between items-center">
                <span>Sweet Bell Peppers (Pack of 3)</span>
                <span className="font-semibold text-stone-900">₦2,200</span>
              </div>
            </div>
          </div>

          {/* 02 ORDER */}
          <div data-aos="fade-up" data-aos-delay="80" className="relative pl-6 border-l-2 border-stone-200 space-y-4">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white bg-teal-700" />
            <div>
              <span className="font-mono text-xs font-semibold text-teal-700">02</span>
              <h3 className="text-xl font-semibold text-stone-900">Order</h3>
              <p className="text-sm text-stone-600 mt-1">Add what you need and place your order in a few simple steps.</p>
            </div>

            <div className="bg-[#fafaf9] p-4 rounded-lg border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span>₦5,800</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery</span>
                <span>₦1,200</span>
              </div>
              <div className="flex justify-between font-semibold text-stone-900 pt-1.5 border-t border-stone-200">
                <span>Total</span>
                <span>₦7,000</span>
              </div>
              <div className="pt-2">
                <span className="block text-center py-2 rounded bg-stone-900 text-white font-medium text-xs">
                  Place order
                </span>
              </div>
            </div>
          </div>

          {/* 03 PAY */}
          <div data-aos="fade-up" data-aos-delay="160" className="relative pl-6 border-l-2 border-stone-200 space-y-4">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white bg-teal-700" />
            <div>
              <span className="font-mono text-xs font-semibold text-teal-700">03</span>
              <h3 className="text-xl font-semibold text-stone-900">Pay</h3>
              <p className="text-sm text-stone-600 mt-1">Complete checkout securely and keep track of your transaction.</p>
            </div>

            <div className="bg-[#fafaf9] p-4 rounded-lg border border-stone-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-medium text-stone-900">Bank Transfer / Card</span>
                <span className="font-semibold text-stone-900">₦7,000</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-teal-800 bg-teal-50 border border-teal-200 p-2 rounded">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Payment verified &bull; Held safely in escrow</span>
              </div>
            </div>
          </div>

          {/* 04 RECEIVE */}
          <div data-aos="fade-up" data-aos-delay="240" className="relative pl-6 border-l-2 border-stone-200 space-y-4">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white bg-teal-700" />
            <div>
              <span className="font-mono text-xs font-semibold text-teal-700">04</span>
              <h3 className="text-xl font-semibold text-stone-900">Receive</h3>
              <p className="text-sm text-stone-600 mt-1">Follow your order as it moves from the business to your doorstep.</p>
            </div>

            <div className="bg-[#fafaf9] p-4 rounded-lg border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Musa K. (Rider)</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Delivery verified &check;
                </span>
              </div>
              <p className="text-[11px] text-stone-500 pt-1 leading-relaxed">
                Confirm your delivery with the verification code provided by the platform.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

