"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Truck,
  Bike,
  MapPin,
  Clock,
  Lock,
  Smartphone,
  Wallet,
  Check,
  RotateCcw,
  PackageCheck,
  UserCheck,
} from "lucide-react";

export function ConnectedDeliverySection() {
  // Interactive state for the Handover PIN demo
  const [demoCode, setDemoCode] = useState("849201");
  const [verifiedState, setVerifiedState] = useState(true);

  const handleRegenerateCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoCode(newCode);
    setVerifiedState(false);
    setTimeout(() => {
      setVerifiedState(true);
    }, 600);
  };

  return (
    <section
      id="delivery"
      className="fluid-section bg-[#fafaf9] border-b border-stone-200/80 overflow-hidden"
    >
      <div className="site-container">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span
            data-aos="fade-up"
            className="text-xs font-semibold tracking-wider uppercase text-stone-500 block mb-3"
          >
            DELIVERY &amp; DISPATCH NETWORK
          </span>
          <h2
            data-aos="fade-up"
            data-aos-delay="60"
            className="text-[clamp(1.75rem,3.2vw+0.25rem,2.85rem)] font-semibold tracking-tight text-stone-900 leading-[1.14]"
          >
            Connected delivery infrastructure. <br className="hidden sm:inline" />
            <span className="font-serif italic font-normal text-stone-950">
              Zero phone calls. Zero guesswork.
            </span>
          </h2>
          <p
            data-aos="fade-up"
            data-aos-delay="120"
            className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-2xl"
          >
            Businesses shouldn&apos;t have to hire delivery fleets or negotiate with riders on WhatsApp. SettleCart coordinates verified dispatch operators the moment orders are ready, tracking every parcel with cryptographic handover verification.
          </p>
        </div>

        {/* ============================================================ */}
        {/* 1. THE 3-PHASE FULFILLMENT PIPELINE (Replaces 7 small boxes) */}
        {/* ============================================================ */}
        <div className="mb-14 sm:mb-18">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-400">
              The 3-Phase Fulfillment Lifecycle
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-700" />
              Automated Platform Orchestration
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* PHASE 01: AT THE STORE */}
            <div
              data-aos="fade-up"
              data-aos-delay="100"
              className="group bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:border-stone-400/80 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <span className="font-mono text-xs font-semibold text-stone-400 group-hover:text-stone-900 transition-colors">
                    PHASE 01 &bull; STORE STAGING
                  </span>
                  <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                    Merchant Counter
                  </span>
                </div>

                <h3 className="text-base font-semibold text-stone-900 mt-3 leading-snug">
                  Preparation &amp; Ready Signal
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Merchant packs the order, attaches the dispatch label, and flags readiness on the terminal.
                </p>

                {/* Micro-UI: Manifest checklist */}
                <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200/70 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-stone-600 pb-1.5 border-b border-stone-200/50">
                    <span className="font-mono text-[10px] font-semibold uppercase text-stone-400">
                      Manifest #SC-8921
                    </span>
                    <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                      2 Items Sealed
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-700 text-[11px]">
                    <PackageCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>Package weighed &bull; 1.2kg (Secure Box)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-700 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>Auto-dispatched to nearest rider radius</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <span>STAGE 1: PACKAGED</span>
                <span className="w-2 h-2 rounded-full bg-stone-300 group-hover:bg-teal-700 transition-colors" />
              </div>
            </div>

            {/* PHASE 02: IN TRANSIT */}
            <div
              data-aos="fade-up"
              data-aos-delay="200"
              className="group bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:border-stone-400/80 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <span className="font-mono text-xs font-semibold text-stone-400 group-hover:text-stone-900 transition-colors">
                    PHASE 02 &bull; DISPATCH TRANSIT
                  </span>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded">
                    Active Route
                  </span>
                </div>

                <h3 className="text-base font-semibold text-stone-900 mt-3 leading-snug">
                  Smart Match &amp; Live Tracking
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  The nearest verified rider accepts the route, picks up the sealed package, and navigates to the customer.
                </p>

                {/* Micro-UI: Live Courier Card */}
                <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/50">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
                        🚴
                      </span>
                      <div>
                        <span className="font-semibold text-stone-900 text-[11px] block leading-tight">
                          Musa K.
                        </span>
                        <span className="text-[10px] text-stone-500">
                          Box Bike #14 &bull; Verified Partner
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                      8 mins away
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-700 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>Lekki Phase 1 &rarr; Admiralty Way</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-700 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>GPS route updated every 15 seconds</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <span>STAGE 2: ON THE WAY</span>
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              </div>
            </div>

            {/* PHASE 03: AT THE DOORSTEP */}
            <div
              data-aos="fade-up"
              data-aos-delay="300"
              className="group bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:border-stone-400/80 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <span className="font-mono text-xs font-semibold text-stone-400 group-hover:text-stone-900 transition-colors">
                    PHASE 03 &bull; HANDOVER &amp; SETTLEMENT
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded">
                    Zero Dispute
                  </span>
                </div>

                <h3 className="text-base font-semibold text-stone-900 mt-3 leading-snug">
                  Inspection &amp; Code Handover
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Customer inspects parcel condition and provides their private PIN. Validating the code completes the delivery instantly.
                </p>

                {/* Micro-UI: Settlement unlock */}
                <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200/70 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-stone-600 pb-1.5 border-b border-stone-200/50">
                    <span className="font-mono text-[10px] font-semibold uppercase text-stone-400">
                      Settlement Trigger
                    </span>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                      Auto-Posted
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-700 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>PIN matches cryptographic server token</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-700 text-[11px]">
                    <Wallet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Rider fare (₦1,800) posted to wallet</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <span>STAGE 3: VERIFIED COMPLETE</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. THE ZERO-DISPUTE HANDOVER VERIFICATION ARCHITECTURE       */}
        {/* (Interactive dual perspective: Customer Phone vs Courier Terminal) */}
        {/* ============================================================ */}
        <div
          data-aos="fade-up"
          data-aos-delay="200"
          className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden"
        >
          {/* Subtle background circuit watermark */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <ShieldCheck className="w-64 h-64 text-stone-900" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="max-w-2xl mb-8">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200/80 text-stone-700 text-[11px] font-mono font-semibold uppercase tracking-wider mb-3">
                <Lock className="w-3 h-3 text-teal-800" />
                <span>Zero-Dispute Handover Architecture</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 leading-tight">
                Verified delivery code at physical handover.
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-stone-600 leading-relaxed">
                Misplaced parcels and false &ldquo;package never arrived&rdquo; claims are completely eliminated. Every physical handover requires a private one-time cryptographic code that only the buyer possesses.
              </p>
            </div>

            {/* Side-by-Side Dual Perspective Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* LEFT: Customer Phone View */}
              <div className="lg:col-span-5 bg-[#fafaf9] rounded-xl border border-stone-200/90 p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/70">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-stone-500" />
                    <span className="text-xs font-semibold text-stone-900">
                      Customer App View
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                    Private to Buyer
                  </span>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-stone-500 mb-2">
                    Provide this 6-digit code to Musa K. upon package arrival:
                  </p>

                  {/* Code Display */}
                  <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-5 rounded-lg bg-white border border-stone-200 shadow-xs max-w-full overflow-hidden">
                    {demoCode.split("").map((digit, idx) => (
                      <span
                        key={idx}
                        className="w-6 h-8 sm:w-7 sm:h-9 rounded bg-stone-50 border border-stone-200 flex items-center justify-center text-base sm:text-lg font-bold font-mono text-stone-900 shadow-2xs"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>

                  <p className="mt-3 text-[11px] text-stone-500 leading-normal flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                    <span>Only disclose after physical package inspection.</span>
                  </p>

                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Simulate new OTP test code</span>
                  </button>
                </div>
              </div>

              {/* CENTER: Cryptographic Validation Arrow (Desktop) */}
              <div className="hidden lg:flex lg:col-span-2 flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-sm mb-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                  Real-time Matching
                </span>
                <span className="text-[10px] text-stone-400 mt-0.5">
                  Instant settlement
                </span>
              </div>

              {/* RIGHT: Courier Terminal View */}
              <div className="lg:col-span-5 bg-[#fafaf9] rounded-xl border border-stone-200/90 p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/70">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-teal-800" />
                    <span className="text-xs font-semibold text-stone-900">
                      Rider Terminal (Musa K.)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Handover Point
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-stone-600 mb-2">
                    <span>Entered Handover Code:</span>
                    {verifiedState ? (
                      <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Code Validated
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400 animate-pulse">
                        Verifying hash...
                      </span>
                    )}
                  </div>

                  {/* Rider input boxes */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-5 rounded-lg bg-white border border-stone-200 shadow-xs max-w-full overflow-hidden">
                    {demoCode.split("").map((digit, idx) => (
                      <span
                        key={idx}
                        className={`w-6 h-8 sm:w-7 sm:h-9 rounded flex items-center justify-center text-base sm:text-lg font-bold font-mono transition-all ${
                          verifiedState
                            ? "bg-emerald-50/80 border border-emerald-300 text-emerald-900"
                            : "bg-stone-50 border border-stone-200 text-stone-400"
                        }`}
                      >
                        {digit}
                      </span>
                    ))}
                  </div>

                  {/* Verified outcome banner */}
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-xs text-emerald-900 flex items-center justify-between">
                    <span className="font-semibold text-[11px]">
                      Delivery completed successfully
                    </span>
                    <span className="font-mono font-bold text-[11px] text-emerald-800">
                      +₦1,800 Credited
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom 3 Stakeholder Protection Guarantees */}
            <div className="mt-8 pt-6 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div className="flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-stone-900 text-xs">Protects Customers</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Packages cannot be marked delivered until you confirm receipt.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-stone-900 text-xs">Protects Riders</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Clear proof of delivery guarantees immediate, non-disputable earnings payout.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <PackageCheck className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-stone-900 text-xs">Protects Businesses</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Eliminates false &ldquo;item not received&rdquo; refund claims and friction.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. OPERATIONAL CAPABILITY PILLARS                            */}
        {/* ============================================================ */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div data-aos="fade-up" data-aos-delay="100" className="flex flex-col">
            <div className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-900 mb-3 shadow-2xs">
              <Truck className="w-4 h-4 text-stone-700" />
            </div>
            <h4 className="text-sm font-semibold text-stone-900">
              Automated Radius Matching
            </h4>
            <p className="mt-1.5 text-xs text-stone-500 leading-relaxed font-normal">
              When an order is marked ready, the platform broadcasts the pickup task to nearby verified riders, taking distance and vehicle type into account.
            </p>
          </div>

          <div data-aos="fade-up" data-aos-delay="200" className="flex flex-col">
            <div className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-900 mb-3 shadow-2xs">
              <Bike className="w-4 h-4 text-stone-700" />
            </div>
            <h4 className="text-sm font-semibold text-stone-900">
              Hybrid Fleet Flexibility
            </h4>
            <p className="mt-1.5 text-xs text-stone-500 leading-relaxed font-normal">
              Use SettleCart&apos;s on-demand verified courier network, or connect your in-house delivery staff to route orders through the same tracked system.
            </p>
          </div>

          <div data-aos="fade-up" data-aos-delay="300" className="flex flex-col">
            <div className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-900 mb-3 shadow-2xs">
              <Wallet className="w-4 h-4 text-stone-700" />
            </div>
            <h4 className="text-sm font-semibold text-stone-900">
              Instant Dispatch Earnings
            </h4>
            <p className="mt-1.5 text-xs text-stone-500 leading-relaxed font-normal">
              Riders don&apos;t wait weeks for delivery fees. As soon as the customer&apos;s handover code is confirmed, dispatch earnings settle immediately into the rider&apos;s digital wallet.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
