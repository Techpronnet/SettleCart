"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart, CartCountBadge, CartDrawer } from "./ui/Dialog";

const NAV_LINKS = [
  { label: "Explore", href: "/marketplace" },
  { label: "Stores", href: "/#stores" },
  { label: "Categories", href: "/#categories" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Become a Vendor", href: "/register?as=vendor" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { count, setCartOpen } = useCart();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const next = query.trim();
    setMobileOpen(false);
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-[0_1px_12px_rgba(0,0,0,0.06)]"
            : "bg-white/70 backdrop-blur border-b border-transparent"
        }`}
      >
        <div className="site-container">
          <div className="flex items-center justify-between h-16 sm:h-[72px] gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 rounded-md py-1 focus-visible:outline-2 focus-visible:outline-brand-600"
              aria-label="SettleCart home"
            >
              <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-sm">
                <i className="fa fa-shopping-bag text-sm" aria-hidden="true" />
              </span>
              <span className="text-xl font-bold tracking-tight text-stone-900">
                SettleCart
              </span>
            </Link>

            <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-stone-600">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="hover:text-stone-950 transition-colors py-1.5 rounded-md focus-visible:outline-2 focus-visible:outline-brand-600">
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <form
                role="search"
                onSubmit={submitSearch}
                className="hidden md:flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 focus-within:border-brand-600"
              >
                <label htmlFor="navbar-search" className="sr-only">
                  Search products or stores
                </label>
                <input
                  id="navbar-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, stores…"
                  autoComplete="off"
                  className="w-36 lg:w-52 bg-transparent px-1.5 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none min-h-[32px]"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="p-2 rounded-md text-stone-600 hover:text-stone-950 hover:bg-stone-100 flex items-center justify-center transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
              <Link
                href="/search"
                aria-label="Search products"
                className="p-2.5 rounded-md text-stone-600 hover:text-stone-950 hover:bg-stone-100 min-h-[44px] min-w-[44px] flex md:hidden items-center justify-center transition-colors"
              >
                <Search className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="hidden md:inline-flex items-center justify-center px-3.5 py-2 rounded-md text-sm font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-100 min-h-[40px] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="hidden md:inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 min-h-[40px] shadow-sm transition-colors"
              >
                Sign Up
              </Link>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label={count ? `Open cart, ${count} items` : "Open cart"}
                className="relative p-2.5 rounded-md text-stone-700 hover:text-stone-950 hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <CartCountBadge />
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 rounded-md text-stone-700 hover:text-stone-950 hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation-drawer"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Site Navigation"
          className="fixed inset-0 z-[100] bg-white lg:hidden flex flex-col overflow-y-auto px-6 py-6"
        >
          <div className="flex items-center justify-between pb-5 border-b border-stone-200/80">
            <span className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm">
                <i className="fa fa-shopping-bag" aria-hidden="true" />
              </span>
              <span className="text-xl font-bold tracking-tight text-stone-900">SettleCart</span>
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2.5 rounded-md text-stone-700 hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form role="search" onSubmit={submitSearch} className="pt-5">
            <label htmlFor="mobile-search" className="sr-only">
              Search products or stores
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1 focus-within:border-brand-600">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                id="mobile-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, stores…"
                autoComplete="off"
                className="flex-1 bg-transparent py-2.5 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none min-h-[48px]"
              />
            </div>
          </form>
          <nav aria-label="Mobile" className="py-6 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between py-3.5 px-3 rounded-lg text-lg font-semibold text-stone-800 hover:bg-stone-100 min-h-[48px] transition-colors"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-stone-200/80 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold border border-stone-300 text-stone-900 min-h-[48px]"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 min-h-[48px]"
              >
                Sign Up
              </Link>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setCartOpen(true);
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium text-stone-700 bg-stone-100 min-h-[48px]"
            >
              <ShoppingCart className="w-4 h-4" />
              View cart{count ? ` (${count})` : ""}
            </button>
          </div>
        </div>
      )}

      <CartDrawer />
    </>
  );
}
