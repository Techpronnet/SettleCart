"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Prevent background scrolling while mobile navigation is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Support keyboard accessibility: close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Businesses", href: "#for-businesses" },
    { label: "For Customers", href: "#for-customers" },
    { label: "Delivery Network", href: "#delivery" },
    { label: "Operations", href: "#operations" },
    { label: "Trust & Security", href: "#trust" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#fafaf9]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="site-container">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0 focus-visible:outline-2 focus-visible:outline-stone-900 rounded-md py-1"
          >
            <span className="w-8 h-8 rounded-md bg-stone-900 text-stone-50 flex items-center justify-center font-semibold text-sm tracking-tight shadow-sm">
              S
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-stone-900 font-sans">
                SettleCart
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-700" />
            </div>
          </Link>

          {/* Desktop & Laptop Navigation (Visible on lg: >= 1024px) */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium text-stone-600"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-stone-950 transition-colors py-1.5 rounded-md focus-visible:outline-2 focus-visible:outline-stone-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="#waitlist"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-sm min-h-[40px] focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              Join the Waitlist
            </a>

            {/* Mobile / Tablet Menu Trigger (< lg: < 1024px) */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-md text-stone-700 hover:text-stone-950 hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-stone-900 transition-colors"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Accessible Full Mobile & Tablet Navigation Drawer Overlay */}
      {mobileOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Site Navigation"
          className="fixed inset-0 top-[65px] sm:top-[81px] z-50 bg-[#fafaf9] lg:hidden flex flex-col justify-between overflow-y-auto px-6 py-8 border-t border-stone-200 shadow-xl transition-all"
        >
          {/* Nav Links Stack with large touch targets */}
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-3 px-3">
              Explore SettleCart
            </div>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between py-3.5 px-3 rounded-lg text-lg font-semibold text-stone-800 hover:text-stone-950 hover:bg-stone-100/70 transition-colors min-h-[48px]"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </a>
            ))}
          </div>

          {/* Drawer Footer Actions */}
          <div className="mt-8 pt-6 border-t border-stone-200/80 space-y-4">
            <a
              href="#waitlist"
              onClick={() => setMobileOpen(false)}
              className="w-full inline-flex items-center justify-center px-5 py-3.5 rounded-lg text-base font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-sm min-h-[48px]"
            >
              Join the Waiting List
            </a>

            <div className="flex items-center justify-between text-xs text-stone-500 pt-2 px-1">
              <span>African Commerce Infrastructure</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-stone-600 hover:text-stone-900 font-medium py-1 px-2 rounded"
              >
                Close Menu &times;
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
