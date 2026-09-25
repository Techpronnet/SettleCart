"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RequireAuth, useAuthUser } from "@/components/auth/RequireAuth";
import { authStorage } from "@/lib/api";
import { getAvailability, type RiderAvailability } from "@/lib/dispatch";

function ProfileBody() {
  const user = useAuthUser();
  const router = useRouter();
  const [availability, setAvailabilityState] = useState<RiderAvailability>("offline");

  useEffect(() => {
    // Client-only availability restore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailabilityState(getAvailability());
  }, []);

  function logout() {
    authStorage.clearTokens();
    router.push("/login");
  }

  const sections = [
    { href: "/dispatch/verification", icon: "fa-id-card", title: "Verification", text: "Approval state." },
    { href: "/dispatch/onboarding", icon: "fa-motorcycle", title: "Vehicle", text: "Vehicle information." },
    { href: "/dispatch/availability", icon: "fa-clock-o", title: "Availability", text: "When you receive jobs." },
    { href: "/notifications", icon: "fa-bell-o", title: "Notifications", text: "Job and payout alerts." },
  ];

  return (
    <div className="space-y-4">
      <Card title="Rider">
        <p className="text-sm font-semibold text-stone-900">{user?.full_name}</p>
        <p className="text-sm text-stone-500">{user?.email}</p>
        {user?.phone && <p className="text-sm text-stone-500">{user.phone}</p>}
        <p className="mt-1 text-xs text-stone-500">
          Status: {availability} · {user?.is_verified ? "Verified" : "Pending verification"}
        </p>
      </Card>

      <Card title="Settings">
        <ul className="divide-y divide-stone-100">
          {sections.map((s) => (
            <li key={s.href}>
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

      <Button variant="secondary" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}

export default function DispatchProfilePage() {
  return (
    <div>
      <PageHeader title="Profile" description="Rider account and settings." />
      <RequireAuth>
        <ProfileBody />
      </RequireAuth>
    </div>
  );
}
