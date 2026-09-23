"use client";

import React, { useState } from "react";
import {
  Store,
  MapPin,
  ShoppingBag,
  CheckCircle2,
  Truck,
  Clock,
  Plus,
  Minus,
  Check,
  Search,
  Bike,
  ChevronRight,
} from "lucide-react";

export function HowItWorksSection() {
  // Micro-interactive state for Stage 02 (Order cart quantities)
  const [nectarQty, setNectarQty] = useState(1);
  const [tonerQty, setTonerQty] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Micro-interactive state for Stage 03 (Merchant status simulation)
  const [prepStatus, setPrepStatus] = useState<"new" | "preparing" | "ready">("preparing");

  const subtotal = nectarQty * 8500 + tonerQty * 6200;
  const deliveryFee = 1200;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 2400);
  };

  return (
    <section
      id="how-it-works"
      className="fluid-section bg-white border-b border-stone-200/80 overflow-hidden"
    >
      <div className="site-container">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="max-w-3xl mb-10 sm:mb-14">
          <span
            data-aos="fade-up"
            className="text-xs font-semibold tracking-wider uppercase text-stone-500 block mb-3"
          >
            HOW IT WORKS
          </span>
          <h2
            data-aos="fade-up"
            data-aos-delay="60"
            className="text-[clamp(1.75rem,3.2vw+0.25rem,2.85rem)] font-semibold tracking-tight text-stone-900 leading-[1.14]"
          >
            From storefront <br className="hidden sm:inline" />
            to <span className="font-serif italic font-normal text-stone-950">doorstep.</span>
          </h2>
          <p
            data-aos="fade-up"
            data-aos-delay="120"
            className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-2xl"
          >
            Every order moves through a simple connected journey &mdash; from discovering a business to receiving your purchase.
          </p>
        </div>

        {/* ============================================================ */}
        {/* CONNECTED JOURNEY FLOW TRACK (TABLET & DESKTOP)              */}
        {/* Communicates: CUSTOMER → STORE → ORDER → DISPATCH → CUSTOMER */}
        {/* ============================================================ */}
        <div
          data-aos="fade-up"
          data-aos-delay="140"
          className="hidden md:block mb-8 relative"
        >
          {/* Subtle Progress Header Track */}
          <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-[#fafaf9] border border-stone-200/80">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-teal-700 animate-pulse" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-500">
                Connected Transaction Flow
              </span>
            </div>

            {/* Micro-nodes: Customer → Store → Order → Dispatch → Customer */}
            <div className="flex items-center gap-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200/90 text-stone-900 font-semibold shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                Customer
              </span>
              <span className="text-stone-300 font-medium">&rarr;</span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200/90 text-stone-900 font-semibold shadow-2xs">
                <Store className="w-3 h-3 text-stone-600" />
                Store
              </span>
              <span className="text-stone-300 font-medium">&rarr;</span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200/90 text-stone-900 font-semibold shadow-2xs">
                <ShoppingBag className="w-3 h-3 text-stone-600" />
                Order
              </span>
              <span className="text-stone-300 font-medium">&rarr;</span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200/90 text-stone-900 font-semibold shadow-2xs">
                <Truck className="w-3 h-3 text-teal-700" />
                Dispatch
              </span>
              <span className="text-stone-300 font-medium">&rarr;</span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200/90 text-stone-900 font-semibold shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Customer Handover
              </span>
            </div>
          </div>

          {/* Animated Connecting Journey SVG Line Spanning Across the Desktop Section */}
          <div className="absolute -bottom-5 left-8 right-8 pointer-events-none z-0">
            <svg
              className="w-full h-2 text-stone-300 overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 1000 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="0"
                y1="4"
                x2="1000"
                y2="4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="animate-flow-dash text-stone-300"
              />
            </svg>
          </div>
        </div>

        {/* ============================================================ */}
        {/* DESKTOP LAYOUT: WIDE HORIZONTAL JOURNEY (4 CONNECTED STAGES) */}
        {/* First card slightly larger; subtle asymmetric product UI     */}
        {/* ============================================================ */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-[1.28fr_1fr_1fr_1.06fr] gap-5 items-stretch relative z-10">
          
          {/* ======================================================== */}
          {/* STAGE 01: DISCOVER — “Find what you need.”              */}
          {/* (Slightly larger visual anchor)                         */}
          {/* ======================================================== */}
          <div
            data-aos="fade-up"
            data-aos-delay="100"
            className="group flex flex-col justify-between bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:border-stone-400/80 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 ease-out"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
                <span className="font-mono text-xs font-semibold tracking-wider text-stone-400 group-hover:text-stone-900 transition-colors">
                  01 &mdash; DISCOVER
                </span>
                <span className="text-[10px] font-medium text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded">
                  Marketplace
                </span>
              </div>

              <h3 className="text-base font-semibold text-stone-900 mt-3 leading-snug">
                Find what you need.
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Discover independent stores, browse live catalogues, and explore verified sellers nearby.
              </p>

              {/* Miniature Product Interface: Modern Marketplace Discovery UI */}
              <div className="mt-4 p-3.5 rounded-xl bg-stone-50/90 border border-stone-200/70 space-y-3">
                
                {/* Search Bar Micro-preview */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-md border border-stone-200 text-stone-400 text-xs shadow-2xs">
                  <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="text-[11px] truncate text-stone-500">
                    Search stores, skincare, groceries...
                  </span>
                </div>

                {/* Storefront Thumbnail & Info */}
                <div className="p-2.5 bg-white rounded-lg border border-stone-200/80 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-md bg-stone-900 text-stone-100 flex items-center justify-center font-bold text-xs shrink-0 tracking-tight">
                        KA
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-stone-900 leading-tight">
                            Kenza Apothecary
                          </h4>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        </div>
                        <p className="text-[10px] text-stone-500 leading-tight mt-0.5">
                          Botanical Skincare &bull; Lekki Phase 1
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Thumbnails with Naira Prices */}
                  <div className="mt-2.5 space-y-1.5 pt-2 border-t border-stone-100 text-xs">
                    <div className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[10px]">
                          🧴
                        </span>
                        <span className="text-[11px] font-medium text-stone-800">
                          Baobab Face Nectar
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-stone-900 font-mono">
                        ₦8,500
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-rose-50 border border-rose-200/60 flex items-center justify-center text-[10px]">
                          🌸
                        </span>
                        <span className="text-[11px] font-medium text-stone-800">
                          Wild Hibiscus Toner
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-stone-900 font-mono">
                        ₦6,200
                      </span>
                    </div>
                  </div>

                  {/* Location & Subtle Open Store Interaction */}
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-stone-500">
                      <MapPin className="w-3 h-3 text-teal-700" />
                      <span>1.8 km away &bull; Open</span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-semibold text-stone-900 group-hover:text-teal-800 transition-colors">
                      <span>Open store</span>
                      <ChevronRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Visual stage connection dot */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>CUSTOMER DISCOVERY</span>
              <span className="w-2 h-2 rounded-full bg-teal-600" />
            </div>
          </div>

          {/* ======================================================== */}
          {/* STAGE 02: ORDER — “Build your order.”                   */}
          {/* ======================================================== */}
          <div
            data-aos="fade-up"
            data-aos-delay="200"
            className="group flex flex-col justify-between bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:border-stone-400/80 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 ease-out"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
                <span className="font-mono text-xs font-semibold tracking-wider text-stone-400 group-hover:text-stone-900 transition-colors">
                  02 &mdash; ORDER
                </span>
                <span className="text-[10px] font-medium text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded">
                  Cart &bull; {nectarQty + tonerQty} items
                </span>
              </div>

              <h3 className="text-base font-semibold text-stone-900 mt-3 leading-snug">
                Build your order.
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Add selections to your bag, adjust quantities, review transparent totals, and checkout.
              </p>

              {/* Miniature Product Interface: Compact Cart / Order Interface */}
              <div className="mt-4 p-3.5 rounded-xl bg-stone-50/90 border border-stone-200/70 space-y-2.5">
                
                {/* Cart Items with Quantity Controls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-stone-200/70 text-xs shadow-2xs">
                    <div className="truncate pr-2">
                      <div className="font-semibold text-stone-900 text-[11px] truncate">
                        Baobab Face Nectar
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        ₦8,500 each
                      </div>
                    </div>
                    <div className="flex items-center border border-stone-200 rounded shrink-0">
                      <button
                        type="button"
                        onClick={() => setNectarQty(Math.max(1, nectarQty - 1))}
                        className="px-1.5 py-0.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 text-[10px]"
                        aria-label="Decrease nectar quantity"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="px-1.5 text-[11px] font-bold text-stone-900 font-mono">
                        {nectarQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNectarQty(nectarQty + 1)}
                        className="px-1.5 py-0.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 text-[10px]"
                        aria-label="Increase nectar quantity"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-stone-200/70 text-xs shadow-2xs">
                    <div className="truncate pr-2">
                      <div className="font-semibold text-stone-900 text-[11px] truncate">
                        Wild Hibiscus Toner
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        ₦6,200 each
                      </div>
                    </div>
                    <div className="flex items-center border border-stone-200 rounded shrink-0">
                      <button
                        type="button"
                        onClick={() => setTonerQty(Math.max(1, tonerQty - 1))}
                        className="px-1.5 py-0.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 text-[10px]"
                        aria-label="Decrease toner quantity"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="px-1.5 text-[11px] font-bold text-stone-900 font-mono">
                        {tonerQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTonerQty(tonerQty + 1)}
                        className="px-1.5 py-0.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 text-[10px]"
                        aria-label="Increase toner quantity"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtotal & Delivery Estimate */}
                <div className="pt-2 border-t border-stone-200/70 space-y-1 text-[11px]">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span className="font-mono text-stone-800">
                      ₦{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Delivery (Lekki)</span>
                    <span className="font-mono text-stone-800">
                      ₦{deliveryFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200/50">
                    <span>Total</span>
                    <span className="font-mono">
                      ₦{total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-teal-800 pt-0.5 font-medium">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>Est. arrival: 25&ndash;35 mins</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="w-full py-2 px-3 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {orderPlaced ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Order Confirmed</span>
                    </>
                  ) : (
                    <>
                      <span>Place order</span>
                      <span className="font-mono text-[11px] font-normal opacity-85">
                        &bull; ₦{total.toLocaleString()}
                      </span>
                    </>
                  )}
                </button>

              </div>
            </div>

            {/* Visual stage connection dot */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>ORDER PLACEMENT</span>
              <span className="w-2 h-2 rounded-full bg-teal-600" />
            </div>
          </div>

          {/* ======================================================== */}
          {/* STAGE 03: PREPARE — “Your store gets to work.”          */}
          {/* ======================================================== */}
          <div
            data-aos="fade-up"
            data-aos-delay="300"
            className="group flex flex-col justify-between bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:border-stone-400/80 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 ease-out"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
                <span className="font-mono text-xs font-semibold tracking-wider text-stone-400 group-hover:text-stone-900 transition-colors">
                  03 &mdash; PREPARE
                </span>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded">
                  Live Merchant
                </span>
              </div>

              <h3 className="text-base font-semibold text-stone-900 mt-3 leading-snug">
                Your store gets to work.
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                The merchant receives the order instantly, confirms items, and packs for dispatch.
              </p>

              {/* Miniature Product Interface: Merchant-Side Order Card */}
              <div className="mt-4 p-3.5 rounded-xl bg-stone-50/90 border border-stone-200/70 space-y-3">
                
                {/* New Order Alert Header */}
                <div className="p-2.5 bg-white rounded-lg border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-900 font-mono">
                      #SC-8921
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      2 mins ago
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 mt-0.5">
                    Customer: <span className="font-semibold text-stone-800">Amina O.</span>
                  </div>
                </div>

                {/* Packing Checklist */}
                <div className="bg-white p-2.5 rounded-lg border border-stone-200/80 text-[11px] space-y-1.5 shadow-2xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                    Pack Items ({nectarQty + tonerQty} units)
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{nectarQty}&times; Baobab Face Nectar</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{tonerQty}&times; Wild Hibiscus Toner</span>
                  </div>
                </div>

                {/* Status Changing Progression: New → Preparing → Ready */}
                <div className="bg-white p-2.5 rounded-lg border border-stone-200/80 shadow-2xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-2">
                    Fulfillment Status
                  </div>
                  
                  {/* Status Pills */}
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <button
                      type="button"
                      onClick={() => setPrepStatus("new")}
                      className={`py-1 px-1 rounded text-[10px] font-semibold transition-colors ${
                        prepStatus === "new"
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
                      }`}
                    >
                      New
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrepStatus("preparing")}
                      className={`py-1 px-1 rounded text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                        prepStatus === "preparing"
                          ? "bg-amber-600 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
                      }`}
                    >
                      {prepStatus === "preparing" && (
                        <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                      )}
                      Preparing
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrepStatus("ready")}
                      className={`py-1 px-1 rounded text-[10px] font-semibold transition-colors ${
                        prepStatus === "ready"
                          ? "bg-emerald-700 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
                      }`}
                    >
                      Ready
                    </button>
                  </div>

                  <p className="text-[10px] text-stone-500 mt-2 text-center">
                    {prepStatus === "new" && "Order accepted by merchant."}
                    {prepStatus === "preparing" && "Items packaged & sealed with safety sticker."}
                    {prepStatus === "ready" && "Ready for courier pickup at dispatch bay."}
                  </p>
                </div>

              </div>
            </div>

            {/* Visual stage connection dot */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>STORE FULFILLMENT</span>
              <span className="w-2 h-2 rounded-full bg-teal-600" />
            </div>
          </div>

          {/* ======================================================== */}
          {/* STAGE 04: DELIVER — “Track it to your doorstep.”        */}
          {/* ======================================================== */}
          <div
            data-aos="fade-up"
            data-aos-delay="400"
            className="group flex flex-col justify-between bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:border-stone-400/80 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 ease-out"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
                <span className="font-mono text-xs font-semibold tracking-wider text-stone-400 group-hover:text-stone-900 transition-colors">
                  04 &mdash; DELIVER
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  On the way
                </span>
              </div>

              <h3 className="text-base font-semibold text-stone-900 mt-3 leading-snug">
                Track it to your doorstep.
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Follow your verified courier in real time, view route progress, and secure handover.
              </p>

              {/* Miniature Product Interface: Delivery Tracking Interface */}
              <div className="mt-4 p-3.5 rounded-xl bg-stone-50/90 border border-stone-200/70 space-y-3">
                
                {/* Minimal Map & Route Visualization */}
                <div className="relative h-24 bg-stone-100 rounded-lg border border-stone-200 overflow-hidden shadow-2xs p-2">
                  {/* Stylized street lines */}
                  <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-4 left-0 right-0 h-px bg-stone-300" />
                    <div className="absolute top-12 left-0 right-0 h-px bg-stone-300" />
                    <div className="absolute top-20 left-0 right-0 h-px bg-stone-300" />
                    <div className="absolute top-0 bottom-0 left-8 w-px bg-stone-300" />
                    <div className="absolute top-0 bottom-0 left-24 w-px bg-stone-300" />
                    <div className="absolute top-0 bottom-0 right-10 w-px bg-stone-300" />
                  </div>

                  {/* Route Polyline (Store A -> Customer B) */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 200 96"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M 28 68 L 76 68 L 76 28 L 168 28"
                      stroke="#0f766e"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      className="animate-flow-dash"
                    />
                  </svg>

                  {/* Origin Pin (Store) */}
                  <div className="absolute bottom-4 left-5 flex items-center gap-1 z-10">
                    <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                      A
                    </span>
                    <span className="text-[9px] font-semibold bg-white/90 px-1 rounded text-stone-700 shadow-2xs">
                      Store
                    </span>
                  </div>

                  {/* Moving Courier Pin */}
                  <div className="absolute top-4 left-18 z-20 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] shadow-xs animate-bounce">
                      <Bike className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Destination Pin (Doorstep) */}
                  <div className="absolute top-4 right-3 flex items-center gap-1 z-10">
                    <span className="text-[9px] font-semibold bg-white/90 px-1 rounded text-stone-700 shadow-2xs">
                      Doorstep
                    </span>
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                      B
                    </span>
                  </div>
                </div>

                {/* Courier / ETA Card */}
                <div className="bg-white p-2.5 rounded-lg border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs">
                        🚴
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-stone-900 leading-tight">
                          Musa K.
                        </div>
                        <div className="text-[9px] text-stone-400">
                          Box Bike #14 &bull; 4.9 &starf;
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-teal-800 font-mono">
                        12 mins away
                      </div>
                      <div className="text-[9px] text-stone-400">
                        Lekki Phase 1
                      </div>
                    </div>
                  </div>

                  {/* Handover Verification PIN */}
                  <div className="mt-2 pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 text-[10px]">
                      Handover PIN:
                    </span>
                    <span className="font-mono font-bold tracking-widest text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px] border border-stone-200">
                      7 4 9 2
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Visual stage connection dot */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>FINAL HANDOVER</span>
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* MOBILE LAYOUT (< md: clean vertical connected timeline)     */}
        {/* ============================================================ */}
        <div className="md:hidden relative pl-6 sm:pl-8 space-y-8">
          
          {/* Continuous vertical connecting line on the left */}
          <div className="absolute left-2.5 sm:left-3.5 top-3 bottom-8 w-0.5 bg-stone-200" />

          {/* STAGE 01 MOBILE */}
          <div data-aos="fade-up" className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-white border-2 border-stone-900 flex items-center justify-center shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <span className="font-mono text-xs font-semibold tracking-wider text-stone-400 block">
                01 &mdash; DISCOVER
              </span>
              <h3 className="text-base font-semibold text-stone-900 mt-1">
                Find what you need.
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 mb-3">
                Discover independent stores, browse live catalogues, and explore verified sellers nearby.
              </p>

              {/* Compact Discovery UI */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center">
                      KA
                    </span>
                    <div>
                      <span className="text-xs font-bold text-stone-900 block leading-tight">
                        Kenza Apothecary
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Lekki Phase 1 &bull; 1.8km
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    Open store &rarr;
                  </span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex justify-between text-xs font-medium text-stone-800">
                  <span>Baobab Face Nectar (30ml)</span>
                  <span className="font-mono font-bold">₦8,500</span>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 02 MOBILE */}
          <div data-aos="fade-up" className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-white border-2 border-teal-700 flex items-center justify-center shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-700" />
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <span className="font-mono text-xs font-semibold tracking-wider text-stone-400 block">
                02 &mdash; ORDER
              </span>
              <h3 className="text-base font-semibold text-stone-900 mt-1">
                Build your order.
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 mb-3">
                Review your selections, clear pricing, and place your order in seconds.
              </p>

              {/* Compact Cart UI */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-700">2 items in bag</span>
                  <span className="font-mono font-bold text-stone-900">₦15,900</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-stone-500">
                  <span>Est. delivery: 25&ndash;35 mins</span>
                  <span className="text-teal-800 font-medium">Standard delivery</span>
                </div>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="w-full py-1.5 rounded bg-stone-900 text-white text-xs font-semibold tracking-wide transition-colors mt-1"
                >
                  {orderPlaced ? "Order Confirmed" : "Place order • ₦15,900"}
                </button>
              </div>
            </div>
          </div>

          {/* STAGE 03 MOBILE */}
          <div data-aos="fade-up" className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-white border-2 border-amber-600 flex items-center justify-center shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <span className="font-mono text-xs font-semibold tracking-wider text-stone-400 block">
                03 &mdash; PREPARE
              </span>
              <h3 className="text-base font-semibold text-stone-900 mt-1">
                Your store gets to work.
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 mb-3">
                Merchant packages items and prepares for courier pickup.
              </p>

              {/* Compact Merchant UI */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-stone-900">#SC-8921</span>
                  <span className="text-[10px] text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded font-medium">
                    Packaging in progress
                  </span>
                </div>
                <div className="text-[11px] text-stone-600">
                  Items sealed. Courier pickup scheduled in 5 mins.
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 04 MOBILE */}
          <div data-aos="fade-up" className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <span className="font-mono text-xs font-semibold tracking-wider text-stone-400 block">
                04 &mdash; DELIVER
              </span>
              <h3 className="text-base font-semibold text-stone-900 mt-1">
                Track it to your doorstep.
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 mb-3">
                Live courier tracking with security PIN confirmation on handover.
              </p>

              {/* Compact Tracking UI */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    On the way &bull; 12 mins
                  </span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-900 text-[11px]">
                    PIN: 7492
                  </span>
                </div>
                <div className="text-[11px] text-stone-500">
                  Courier: Musa K. (Box Bike #14)
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
