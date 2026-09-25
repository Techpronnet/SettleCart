"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Bell, User } from "lucide-react";
import { getCurrentUser, getUnreadCount } from "@/lib/api";
import { normalizeRole } from "@/lib/auth";
import type { NavItem } from "./Nav";

export function AppHeader({
  title,
  nav,
  alertsCount = 0,
}: {
  title: string;
  nav: NavItem[];
  alertsCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [profileHref, setProfileHref] = useState("/profile");
  const [liveUnread, setLiveUnread] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then((me) => {
        const role = normalizeRole(me.role);
        if (role === "vendor_owner" || role === "vendor_staff") setProfileHref("/vendor/settings");
        else if (role === "rider") setProfileHref("/dispatch/profile");
        else setProfileHref("/profile");
      })
      .catch(() => {
        // logged out: keep default
      });
    getUnreadCount()
      .then(setLiveUnread)
      .catch(() => {
        setLiveUnread(null);
      });
  }, []);

  const shownUnread = liveUnread ?? alertsCount;

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all ${
          scrolled
            ? "bg-[#fafaf9]/95 backdrop-blur-md border-b border-stone-200 shadow-[0_1px_10px_rgba(0,0,0,0.06)]"
            : "bg-[#fafaf9]/80 backdrop-blur border-b border-transparent"
        }`}
      >
        <div
          className={`site-container flex items-center justify-between gap-3 transition-all ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="md:hidden p-2.5 rounded-md text-stone-700 hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-md bg-stone-900 text-stone-50 flex items-center justify-center font-semibold text-sm">
                S
              </span>
              <span className="text-base font-bold tracking-tight text-stone-900">
                {title}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href="/notifications"
              aria-label={`Notifications${shownUnread ? `, ${shownUnread} unread` : ""}`}
              className="relative p-2.5 rounded-md text-stone-600 hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Bell className="w-5 h-5" />
              {shownUnread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                  {shownUnread > 9 ? "9+" : shownUnread}
                </span>
              )}
            </Link>
            <Link
              href={profileHref}
              aria-label="Profile menu"
              className="p-2.5 rounded-md text-stone-600 hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Section navigation"
          className="fixed inset-0 z-[100] bg-[#fafaf9] md:hidden flex flex-col px-6 py-6 overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-5 border-b border-stone-200">
            <span className="text-lg font-bold text-stone-900">{title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2.5 rounded-md hover:bg-stone-200/60 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="py-6 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 py-3 px-3 rounded-lg text-base font-medium text-stone-800 hover:bg-stone-200/50 min-h-[48px]"
              >
                <span className="w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center">
                  <i className={`fa ${item.icon}`} aria-hidden="true" />
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
