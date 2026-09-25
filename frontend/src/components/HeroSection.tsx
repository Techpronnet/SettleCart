"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  MapPin,
  Plus,
  Minus,
  CheckCircle2,
  Truck,
  Check,
  Package,
  Tag,
  ShoppingBag,
} from "lucide-react";

export function HeroSection() {
  const [productQty, setProductQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-[#fafaf9] border-b border-stone-200/80">
      <div className="site-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-14 xl:gap-16 items-center">
          
          {/* ============================================================ */}
          {/* LEFT SIDE: EDITORIAL HEADLINE & VALUE PROPOSITION            */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            
            {/* Small uppercase eyebrow */}
            <span
              data-aos="fade-up"
              className="text-xs font-semibold tracking-wider uppercase text-stone-500 block mb-3 sm:mb-4"
            >
              THE FUTURE OF LOCAL COMMERCE
            </span>

            {/* Headline with strong fluid typographic hierarchy */}
            <h1
              data-aos="fade-up"
              data-aos-delay="60"
              className="text-[clamp(2.15rem,5.2vw+0.25rem,3.65rem)] font-bold tracking-tight text-stone-900 leading-[1.12]"
            >
              Discover. Order. Pay.{" "}
              <span className="text-stone-600 block mt-2 font-normal text-[clamp(1.25rem,2.8vw+0.25rem,2.25rem)] leading-snug">
                Everything You Need, From Businesses Around You.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p
              data-aos="fade-up"
              data-aos-delay="120"
              className="mt-5 sm:mt-6 text-sm sm:text-base lg:text-lg text-stone-600 leading-relaxed font-normal max-w-xl"
            >
              A connected marketplace that brings customers, businesses, and delivery partners into one seamless commerce experience. Discover products, order from local stores, and get everything delivered without the friction.
            </p>

            {/* CTAs with minimum 44px touch targets */}
            <div
              data-aos="fade-up"
              data-aos-delay="180"
              className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5"
            >
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-md text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-sm min-h-[44px]"
              >
                Join the Waiting List
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-md text-sm font-medium text-stone-700 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-200 transition-colors group min-h-[44px]"
              >
                <span>Explore How It Works</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-0.5 transition-all" />
              </a>
            </div>

            {/* Subtle Trust Line */}
            <p
              data-aos="fade-up"
              data-aos-delay="240"
              className="mt-4 sm:mt-5 text-xs text-stone-500 font-medium"
            >
              Built for customers. Built for businesses. Built for everyday commerce.
            </p>

          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDE: LIVING COMMERCE ECOSYSTEM COMPOSITION            */}
          {/* (Responsively adapted: 5 cards on desktop, clean 3 on mobile) */}
          {/* ============================================================ */}
          <div
            data-aos="fade-up"
            data-aos-delay="120"
            className="lg:col-span-6 relative w-full mt-6 lg:mt-0"
          >
            {/* Background Connection Pathway: CUSTOMER → STORE → ORDER → DISPATCH → CUSTOMER */}
            <div className="absolute inset-0 pointer-events-none hidden md:flex items-center justify-center z-0">
              <svg
                className="w-full h-full text-stone-300 opacity-60"
                viewBox="0 0 540 460"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 60 70 C 160 50, 360 40, 460 110 C 500 180, 480 320, 420 390 C 280 440, 120 410, 70 330 C 30 250, 40 120, 60 70"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>

            {/* Subtle participant nodes along the connection track (tablet/desktop) */}
            <div className="hidden sm:flex absolute -top-4 left-4 items-center gap-1.5 text-[10px] font-mono text-stone-400 uppercase tracking-wider z-0">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
              <span>Customer &bull; Store &bull; Dispatch Ecosystem</span>
            </div>

            {/* The Layered Living Ecosystem Container */}
            <div className="relative z-10 flex flex-col gap-3.5 sm:gap-4">
              
              {/* ROW 1: PRIMARY STOREFRONT DISCOVERY CARD */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4 items-start">
                
                {/* 1. Primary Storefront / Product Discovery Card */}
                <div
                  className="sm:col-span-7 bg-white rounded-xl border border-stone-200 p-4 shadow-sm hover:border-stone-300 transition-all duration-200"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                        FM
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-xs font-semibold text-stone-900 leading-tight">Fresh Market</h2>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        </div>
                        <p className="text-[11px] text-stone-500 leading-tight mt-0.5">Groceries &amp; Essentials</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-stone-600 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                      Nearby &bull; 15m
                    </span>
                  </div>

                  {/* Product Thumbnails List */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center text-stone-600 font-medium shrink-0">
                          <Package className="w-3.5 h-3.5 text-stone-600" />
                        </span>
                        <span className="font-medium text-stone-800 text-[11px] sm:text-xs">Vine Tomatoes (1kg)</span>
                      </div>
                      <span className="font-semibold text-stone-900 text-[11px] font-mono">₦1,800</span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center text-stone-600 font-medium shrink-0">
                          <Tag className="w-3.5 h-3.5 text-stone-600" />
                        </span>
                        <span className="font-medium text-stone-800 text-[11px] sm:text-xs">Sweet Peppers (Pack)</span>
                      </div>
                      <span className="font-semibold text-stone-900 text-[11px] font-mono">₦2,200</span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center text-stone-600 font-medium shrink-0">
                          <ShoppingBag className="w-3.5 h-3.5 text-stone-600" />
                        </span>
                        <span className="font-medium text-stone-800 text-[11px] sm:text-xs">Forest Honey (500g)</span>
                      </div>
                      <span className="font-semibold text-stone-900 text-[11px] font-mono">₦4,500</span>
                    </div>
                  </div>
                </div>

                {/* 2. Compact Order Card (Desktop & Tablet) */}
                <div
                  className="sm:col-span-5 bg-white rounded-xl border border-stone-200 p-4 shadow-sm hover:border-stone-300 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <span className="text-[11px] font-semibold text-stone-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                        Order confirmed
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">#SC-6014</span>
                    </div>

                    <p className="text-xs text-stone-600 mt-2.5 font-medium">
                      Preparing your order
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Fresh Market &bull; Kitchen counter
                    </p>
                  </div>

                  {/* Simple Progress Indicator */}
                  <div className="mt-3">
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-teal-700 h-1.5 rounded-full w-2/3 transition-all duration-500" />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1.5">
                      <span>Accepted</span>
                      <span className="text-teal-800 font-medium">Packaging</span>
                      <span>Ready</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* ROW 2: INTERACTIVE PRODUCT CARD + DISPATCH DELIVERY CARD */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
                
                {/* 3. Interactive Product Card */}
                <div
                  className="sm:col-span-6 lg:col-span-5 bg-white rounded-xl border border-stone-200 p-4 shadow-sm hover:border-stone-300 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                        Featured Item
                      </span>
                      <span className="text-xs font-bold text-stone-900 font-mono">₦4,800</span>
                    </div>
                    <h3 className="text-xs font-semibold text-stone-900 mt-2 leading-snug">
                      Cold-Pressed Coconut Oil (500ml)
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Pure organic &bull; Glass bottle
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    {/* Quantity Control with min 40px height */}
                    <div className="flex items-center border border-stone-200 rounded min-h-[36px]">
                      <button
                        type="button"
                        onClick={() => setProductQty(Math.max(1, productQty - 1))}
                        className="px-2 py-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 text-xs transition-colors min-w-[32px] flex items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-semibold text-stone-800 font-mono">
                        {productQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setProductQty(productQty + 1)}
                        className="px-2 py-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 text-xs transition-colors min-w-[32px] flex items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Add to cart with min 36px height */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 py-2 px-3 rounded bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1 shadow-2xs min-h-[36px]"
                    >
                      {addedToCart ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Added
                        </>
                      ) : (
                        "Add to cart"
                      )}
                    </button>
                  </div>
                </div>

                {/* 4. Small Delivery Card */}
                <div
                  className="sm:col-span-6 lg:col-span-4 bg-white rounded-xl border border-stone-200 p-4 shadow-sm hover:border-stone-300 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="text-[11px] font-semibold text-stone-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-stone-700" />
                      On the way
                    </span>
                    <span className="text-[10px] text-teal-800 font-medium">8 min away</span>
                  </div>

                  {/* Minimal map / location route visual */}
                  <div className="my-2.5 p-2 bg-stone-50 rounded border border-stone-200/70 text-[11px]">
                    <div className="flex items-center gap-2 text-stone-700">
                      <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
                      <span className="truncate">Store (Lekki Phase 1)</span>
                    </div>
                    <div className="h-2.5 ml-1 border-l border-dashed border-stone-300 my-0.5" />
                    <div className="flex items-center gap-2 font-medium text-stone-900">
                      <MapPin className="w-2.5 h-2.5 text-teal-700 shrink-0" />
                      <span className="truncate">Doorstep handover</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-500">
                    Rider: Musa K. &bull; Box Bike
                  </p>
                </div>

                {/* 5. Summary Card (Visible on desktop: lg:col-span-3) */}
                <div
                  className="hidden lg:flex lg:col-span-3 bg-white rounded-xl border border-stone-200 p-4 shadow-sm hover:border-stone-300 transition-all duration-200 flex-col justify-between text-xs"
                >
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-1">
                      Summary
                    </span>
                    <span className="font-semibold text-stone-900 block text-xs">
                      3 items
                    </span>
                    <span className="font-bold text-stone-900 text-sm mt-0.5 block font-mono">
                      ₦24,500
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 flex justify-between items-center">
                    <span>Delivery:</span>
                    <span className="font-medium text-stone-800 font-mono">₦1,500</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
