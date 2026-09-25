"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RequireAuth, useAuthUser } from "@/components/auth/RequireAuth";
import { PATCH, authStorage } from "@/lib/api";
import { useRouter } from "next/navigation";

function ProfileBody() {
  const user = useAuthUser();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const { error } = await PATCH("/api/v1/users/me", {
        body: { full_name: fullName.trim(), phone: phone.trim() || null },
      });
      if (error) throw new Error("Could not save changes.");
      setMessage("Profile updated.");
    } catch {
      setMessage("Could not save changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    authStorage.clearTokens();
    router.push("/login");
  }

  return (
    <div className="space-y-4">
      {message && (
        <p role="status" className="rounded-md bg-stone-100 border border-stone-200 px-3.5 py-2.5 text-xs text-stone-800">
          {message}
        </p>
      )}

      <Card title="Personal information">
        <form onSubmit={onSave} className="grid gap-4">
          <Input label="Email" name="email" value={user?.email ?? ""} disabled hint="Email cannot be changed." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Shortcuts">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            { href: "/orders", icon: "fa-shopping-bag", label: "My orders" },
            { href: "/saved", icon: "fa-heart-o", label: "Saved items" },
            { href: "/addresses", icon: "fa-map-marker", label: "My addresses" },
            { href: "/notifications", icon: "fa-bell-o", label: "Notifications" },
            { href: "/discover", icon: "fa-search", label: "Discover stores" },
          ].map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="flex items-center gap-3 rounded-xl border border-stone-200 p-3.5 hover:border-stone-400"
            >
              <span className="w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
                <i className={`fa ${l.icon}`} aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-stone-800">{l.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card title="Account">
        <p className="text-sm text-stone-600">
          Role: <span className="font-medium text-stone-900">{user?.role}</span>
          {user?.is_verified ? " · Verified" : " · Unverified"}
        </p>
        <Button variant="secondary" className="mt-3" onClick={logout}>
          Log out
        </Button>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div>
      <PageHeader title="Profile" description="Manage your personal information." />
      <RequireAuth>
        <ProfileBody />
      </RequireAuth>
    </div>
  );
}
