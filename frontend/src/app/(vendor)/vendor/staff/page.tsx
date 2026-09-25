"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  addStaffMember,
  loadStaff,
  LOCKED_PERMISSIONS,
  removeStaffMember,
  setStaffPermissions,
  setStaffStatus,
  STAFF_PERMISSIONS,
  type StaffMember,
} from "@/lib/staff";

function StaffBody() {
  const [roster, setRoster] = useState<StaffMember[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [perms, setPerms] = useState<string[]>(["orders"]);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<StaffMember | null>(null);

  useEffect(() => {
    // Client-only roster restore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoster(loadStaff());
  }, []);

  function togglePerm(key: string) {
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));
  }

  function onInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError("");
    setRoster(addStaffMember({ name: name.trim(), email: email.trim().toLowerCase(), permissions: perms }));
    setName("");
    setEmail("");
    setPerms(["orders"]);
  }

  function toggleMemberPerm(member: StaffMember, key: string) {
    const next = member.permissions.includes(key)
      ? member.permissions.filter((x) => x !== key)
      : [...member.permissions, key];
    setRoster(setStaffPermissions(member.id, next));
  }

  return (
    <div className="space-y-4">
      <Card title="Invite staff">
        {error && (
          <p role="alert" className="mb-3 text-xs text-red-700">
            {error}
          </p>
        )}
        <form onSubmit={onInvite} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-stone-800 mb-1.5">Permissions</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {STAFF_PERMISSIONS.map((p) => (
                <label key={p.key} className="flex items-start gap-2.5 rounded-lg border border-stone-200 p-3 min-h-[56px]">
                  <input
                    type="checkbox"
                    checked={perms.includes(p.key)}
                    onChange={() => togglePerm(p.key)}
                    className="mt-0.5 w-4 h-4 accent-stone-900"
                  />
                  <span>
                    <span className="block text-sm font-medium text-stone-900">{p.label}</span>
                    <span className="block text-xs text-stone-500">{p.text}</span>
                  </span>
                </label>
              ))}
              {LOCKED_PERMISSIONS.map((p) => (
                <span key={p.key} className="flex items-start gap-2.5 rounded-lg border border-dashed border-stone-200 bg-stone-50 p-3 opacity-70">
                  <i className="fa fa-lock mt-0.5 text-stone-400" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-medium text-stone-900">{p.label}</span>
                    <span className="block text-xs text-stone-500">{p.text}</span>
                  </span>
                </span>
              ))}
            </div>
          </fieldset>
          <div>
            <Button type="submit">Send invite</Button>
          </div>
        </form>
      </Card>

      {roster.length === 0 ? (
        <EmptyState icon="fa-users" title="No staff yet" description="Invite people to help run your store." />
      ) : (
        <ul className="space-y-2.5">
          {roster.map((m) => (
            <li key={m.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-stone-900 truncate">{m.name}</span>
                <Badge tone={m.status === "active" ? "success" : "warning"}>{m.status}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">{m.email}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {STAFF_PERMISSIONS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={m.permissions.includes(p.key)}
                    onClick={() => toggleMemberPerm(m, p.key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] ${
                      m.permissions.includes(p.key)
                        ? "bg-stone-900 text-white"
                        : "border border-stone-300 text-stone-600"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setRoster(setStaffStatus(m.id, m.status === "active" ? "suspended" : "active"))}
                  className="text-xs font-medium text-stone-700 underline min-h-[36px]"
                >
                  {m.status === "active" ? "Suspend" : "Reactivate"}
                </button>
                <button
                  type="button"
                  onClick={() => setRemoving(m)}
                  className="text-xs font-medium text-stone-500 hover:text-red-700 underline min-h-[36px]"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${removing?.name}?`}
        description="They will lose access to your store immediately."
        confirmLabel="Remove"
        onConfirm={() => {
          if (removing) setRoster(removeStaffMember(removing.id));
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}

export default function StaffPage() {
  return (
    <div>
      <PageHeader title="Staff" description="Who can help run your store." />
      <RequireAuth>
        <StaffBody />
      </RequireAuth>
    </div>
  );
}
