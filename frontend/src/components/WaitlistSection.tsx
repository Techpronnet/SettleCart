"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function WaitlistSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "Retail",
    city: "Lagos",
    sellingDescription: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit. Please try again.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="fluid-section bg-[#fafaf9] border-b border-stone-200/80">
      <div className="site-container">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-[clamp(1.75rem,3.2vw+0.25rem,2.85rem)] font-semibold tracking-tight text-stone-900 leading-tight">
              Be part of what we&apos;re building.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-xl mx-auto">
              We&apos;re opening the platform to early businesses and customers first. Join the waiting list and be among the first to experience a more connected way to sell, shop, and deliver.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-8 lg:p-10 shadow-xs">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMessage && (
                  <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-stone-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amina Mohammed"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-stone-50/50 border border-stone-300 rounded-md px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-stone-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="amina@business.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-stone-50/50 border border-stone-300 rounded-md px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Phone Number <span className="text-stone-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0802 345 6789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-stone-50/50 border border-stone-300 rounded-md px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Business Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Business Name <span className="text-stone-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zola Naturals"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full bg-stone-50/50 border border-stone-300 rounded-md px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Business Type */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Business Type
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full bg-stone-50/50 border border-stone-300 rounded-md px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                    >
                      <option value="Retail">Retail</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Food / Restaurant">Food / Restaurant</option>
                      <option value="Grocery / Supermarket">Grocery / Supermarket</option>
                      <option value="Beauty / Salon">Beauty / Salon</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Repairs / Services">Repairs / Services</option>
                      <option value="Digital Products">Digital Products</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* City / Location */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      City / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lagos, Abuja, Port Harcourt"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-stone-50/50 border border-stone-300 rounded-md px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* What do you want to sell? (optional) */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    What do you want to sell? <span className="text-stone-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Handcrafted leather shoes and matching belts"
                    value={formData.sellingDescription}
                    onChange={(e) => setFormData({ ...formData, sellingDescription: e.target.value })}
                    className="w-full bg-stone-50/50 border border-stone-300 rounded-md px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                  />
                </div>

                {/* Submit CTA */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-md font-medium text-sm text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Reserving your spot...</span>
                      </>
                    ) : (
                      "Join the Waitlist"
                    )}
                  </button>
                  <p className="mt-3 text-center text-xs text-stone-500">
                    Early access &bull; Product updates &bull; Launch invitations
                  </p>
                </div>
              </form>
            ) : (
              /* Polished, Restrained Success State */
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto text-stone-800">
                  <CheckCircle2 className="w-6 h-6 text-teal-800" />
                </div>
                <h3 className="text-2xl font-semibold text-stone-900">
                  You&apos;re on the list.
                </h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                  We&apos;ll let you know when early access opens.
                </p>
                <div className="pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        fullName: "",
                        email: "",
                        phone: "",
                        businessName: "",
                        businessType: "Retail",
                        city: "Lagos",
                        sellingDescription: "",
                      });
                    }}
                    className="text-xs text-stone-500 hover:text-stone-900 font-medium underline transition-colors"
                  >
                    Add another business or email &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
