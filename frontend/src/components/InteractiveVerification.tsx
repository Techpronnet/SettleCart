"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, RefreshCw, KeyRound, Truck, Check, Wallet } from "lucide-react";

export function InteractiveVerification() {
  const sampleCode = "729415";
  const [inputCode, setInputCode] = useState("");
  const [status, setStatus] = useState<"idle" | "validating" | "success" | "error">("idle");

  const handleValidate = () => {
    if (!inputCode) return;
    setStatus("validating");
    setTimeout(() => {
      if (inputCode.trim() === sampleCode) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    }, 700);
  };

  const handleReset = () => {
    setInputCode("");
    setStatus("idle");
  };

  return (
    <section id="verification" className="py-20 bg-slate-900/60 border-y border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <KeyRound className="w-3.5 h-3.5" />
            SRS v1.1 Standard
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Cryptographic Delivery Verification:{" "}
            <span className="text-emerald-400">Zero Handover Disputes</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Say goodbye to &ldquo;my rider ran away&rdquo; or &ldquo;the customer claims they never received it&rdquo;. In SettleCart, settlement eligibility is locked until the customer provides their private 6-digit OTP code to the rider at physical handover.
          </p>
        </div>

        {/* Interactive Demo Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Customer Handover View */}
          <div className="lg:col-span-6 bg-slate-950/80 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  📱
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Customer Live Tracking</h3>
                  <p className="text-xs text-slate-400">Order #SC-89240 &bull; Ikeja, Lagos</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                OUT FOR DELIVERY
              </span>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Your Delivery Verification Code
              </p>
              <div className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border-2 border-emerald-500/40 text-emerald-400 font-mono text-3xl font-extrabold tracking-widest shadow-inner shadow-emerald-500/10">
                {sampleCode.slice(0, 3)} - {sampleCode.slice(3)}
              </div>
              <p className="mt-3 text-xs text-slate-400 max-w-sm mx-auto">
                🔒 Give this 6-digit code to rider <strong className="text-slate-200">Tunde (Bike #LA-29)</strong> only after inspecting and receiving your package.
              </p>
            </div>

            {/* Simulated Live Order Handover Stepper */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>₦45,000 paid via Paystack (Escrow Held)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Vendor fulfilled &amp; packed at Yaba kitchen</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-emerald-300 font-medium">
                <Truck className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
                <span>Rider arrived at customer doorstep &bull; Waiting for code</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dispatch Rider Interface & Settlement Simulator */}
          <div className="lg:col-span-6 bg-slate-950/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  🛵
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Rider Verification Portal</h3>
                  <p className="text-xs text-slate-400">Rider: Tunde A. &bull; SettleCart Dispatch</p>
                </div>
              </div>
              {status === "success" ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  DELIVERED &bull; SETTLED
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AWAITING CODE
                </span>
              )}
            </div>

            {status !== "success" ? (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Enter Customer Handover OTP:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 729415"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono text-center tracking-widest text-white focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                    <button
                      onClick={handleValidate}
                      disabled={inputCode.length !== 6 || status === "validating"}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {status === "validating" ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verify & Deliver"
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <span>Tip: Try testing with code <strong className="text-emerald-400 font-mono">{sampleCode}</strong></span>
                  <button
                    onClick={() => setInputCode(sampleCode)}
                    className="text-emerald-400 hover:underline"
                  >
                    Auto-Fill Code
                  </button>
                </div>

                {status === "error" && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Invalid code submitted! Max 5 attempts before admin escalation. (Try {sampleCode})</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-4 animate-in fade-in duration-300">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300">Handover Verified Successfully!</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Order status moved to <strong className="text-white">DELIVERED</strong>. Immutable ledger entries executed automatically:
                    </p>
                  </div>
                </div>

                {/* Simulated Ledger Breakdown */}
                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Vendor Payout (Held 24h for dispute)
                    </span>
                    <span className="font-mono font-bold text-emerald-400">+₦42,750</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-teal-400" /> Rider Delivery Earnings (Instant Available)
                    </span>
                    <span className="font-mono font-bold text-teal-400">+₦2,500</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 border-t border-slate-800 pt-2">
                    <span>SettleCart Platform Commission (5%)</span>
                    <span className="font-mono text-slate-300">₦2,250</span>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Interactive Simulation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

