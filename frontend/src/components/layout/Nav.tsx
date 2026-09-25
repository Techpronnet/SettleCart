"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const CUSTOMER_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: "fa-home" },
  { href: "/discover", label: "Discover", icon: "fa-search" },
  { href: "/orders", label: "Orders", icon: "fa-shopping-bag" },
  { href: "/cart", label: "Cart", icon: "fa-shopping-cart" },
  { href: "/profile", label: "Profile", icon: "fa-user" },
];

export const VENDOR_NAV: NavItem[] = [
  { href: "/vendor", label: "Dashboard", icon: "fa-dashboard" },
  { href: "/vendor/orders", label: "Orders", icon: "fa-shopping-bag" },
  { href: "/vendor/products", label: "Products", icon: "fa-cube" },
  { href: "/vendor/inventory", label: "Inventory", icon: "fa-archive" },
  { href: "/vendor/customers", label: "Customers", icon: "fa-users" },
  { href: "/vendor/staff", label: "Staff", icon: "fa-id-badge" },
  { href: "/vendor/wallet", label: "Wallet", icon: "fa-credit-card" },
  { href: "/vendor/analytics", label: "Analytics", icon: "fa-bar-chart" },
  { href: "/vendor/settings", label: "Settings", icon: "fa-cog" },
];

export const DISPATCH_NAV: NavItem[] = [
  { href: "/dispatch", label: "Home", icon: "fa-home" },
  { href: "/dispatch/jobs", label: "Jobs", icon: "fa-briefcase" },
  { href: "/dispatch/active", label: "Active", icon: "fa-motorcycle" },
  { href: "/dispatch/earnings", label: "Earnings", icon: "fa-money" },
  { href: "/dispatch/profile", label: "Profile", icon: "fa-user" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "fa-dashboard" },
  { href: "/admin/users", label: "Users", icon: "fa-users" },
  { href: "/admin/vendors", label: "Vendors", icon: "fa-building" },
  { href: "/admin/kyc", label: "KYC", icon: "fa-id-card" },
  { href: "/admin/stores", label: "Stores", icon: "fa-home" },
  { href: "/admin/reviews", label: "Reviews", icon: "fa-star" },
  { href: "/admin/orders", label: "Orders", icon: "fa-shopping-bag" },
  { href: "/admin/payments", label: "Payments", icon: "fa-credit-card" },
  { href: "/admin/deliveries", label: "Deliveries", icon: "fa-truck" },
  { href: "/admin/riders", label: "Riders", icon: "fa-motorcycle" },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: "fa-money" },
  { href: "/admin/refunds", label: "Refunds", icon: "fa-undo" },
  { href: "/admin/disputes", label: "Disputes", icon: "fa-flag" },
  { href: "/admin/audit-logs", label: "Audit", icon: "fa-list-alt" },
  { href: "/admin/settings", label: "Settings", icon: "fa-cog" },
];

export const FINANCE_NAV: NavItem[] = [
  { href: "/finance", label: "Dashboard", icon: "fa-dashboard" },
  { href: "/finance/transactions", label: "Transactions", icon: "fa-exchange" },
  { href: "/finance/ledger", label: "Ledger", icon: "fa-book" },
  { href: "/finance/settlement", label: "Settlement", icon: "fa-bank" },
  { href: "/finance/withdrawals", label: "Withdrawals", icon: "fa-money" },
  { href: "/finance/refunds", label: "Refunds", icon: "fa-undo" },
  { href: "/finance/reconciliation", label: "Reconciliation", icon: "fa-check-square" },
  { href: "/finance/reports", label: "Reports", icon: "fa-file-text" },
];

function activeHref(items: NavItem[], pathname: string): string | null {
  let best: string | null = null;
  for (const item of items) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.length) best = item.href;
    }
  }
  return best;
}

export function Sidebar({ items, title }: { items: NavItem[]; title: string }) {
  const pathname = usePathname();
  const active = activeHref(items, pathname);
  return (
    <nav aria-label={title} className="hidden md:flex md:flex-col gap-1 w-60 shrink-0 md:sticky md:top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
      <p className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-stone-400">
        {title}
      </p>
      {items.map((item) => {
        const isActive = active === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium min-h-[44px] ${
              isActive
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                isActive ? "bg-white/15 text-white" : "bg-stone-100 text-stone-600"
              }`}
            >
              <i className={`fa ${item.icon}`} aria-hidden="true" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active = activeHref(items, pathname);
  const cols = items.length >= 5 ? "grid-cols-5" : items.length === 4 ? "grid-cols-4" : "grid-cols-3";
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className={`grid ${cols}`}>
        {items.map((item) => {
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium min-h-[60px] justify-center ${
                isActive ? "text-stone-950" : "text-stone-500 hover:text-stone-950"
              }`}
            >
              {isActive && (
                <span aria-hidden="true" className="absolute top-0 h-0.5 w-10 rounded-full bg-stone-900" />
              )}
              <i className={`fa ${item.icon} text-lg`} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
