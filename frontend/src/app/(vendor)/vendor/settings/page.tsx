"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RequireAuth, useAuthUser } from "@/components/auth/RequireAuth";
import { authStorage } from "@/lib/api";
import { clearVendorContext } from "@/lib/vendor-context";

function SettingsBody() {
  const user = useAuthUser();
  const router = useRouter();

  function switchStore() {
    clearVendorContext();
    router.push("/vendor/onboarding");
  }

  function logout() {
    authStorage.clearTokens();
    router.push("/login");
  }

  const sections = [
    { href: "/vendor/business", icon: "fa-building", title: "Business profile", text: "Name, type, description, tax ID." },
    { href: "/vendor/store", icon: "fa-home", title: "Store settings", text: "Details, publication, storefront link." },
    { href: "/vendor/kyc", icon: "fa-id-card", title: "Verification", text: "KYC status and submissions." },
    { href: "/vendor/withdrawals", icon: "fa-money", title: "Payout settings", text: "Bank destination for withdrawals." },
    { href: "/notifications", icon: "fa-bell-o", title: "Notifications", text: "Order, payment and payout alerts." },
  ];

  return (
    <div className="space-y-4">
      <Card title="Settings">
        <ul className="divide-y divide-stone-100">
          {sections.map((s) => (
            <li key={s.href + s.title}>
              <Link href={s.href} className="flex items-center gap-3 py-3.5 min-h-[56px]">
                <span className="w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
                  <i className={`fa ${s.icon}`} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-stone-900">{s.title}</span>
                  <span className="block text-xs text-stone-500">{s.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Workspace">
        <p className="text-sm text-stone-600">
          Signed in as <span className="font-medium text-stone-900">{user?.email}</span>
        </p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2.5">
          <Button variant="secondary" onClick={switchStore}>
            Switch business
          </Button>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Staff roles and permissions arrive with team management. Financial settings stay
          restricted to the business owner.
        </p>
      </Card>
    </div>
  );
}

export default function VendorSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Business, store and account." />
      <RequireAuth>
        <SettingsBody />
      </RequireAuth>
    </div>
  );
}
