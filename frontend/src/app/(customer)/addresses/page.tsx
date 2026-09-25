"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  loadAddresses,
  removeAddress,
  saveAddress,
  updateAddress,
  type SavedAddress,
} from "@/lib/addresses";

const EMPTY_FORM = {
  label: "Home",
  recipient: "",
  phone: "",
  address: "",
  city: "",
  state: "Lagos",
  instructions: "",
};

function AddressesBody() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Hydration-safe: localStorage is only available on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddresses(loadAddresses());
  }, []);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.recipient.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      setError("Fill in recipient, phone, address and city.");
      return;
    }
    if (editingId) {
      setAddresses(updateAddress(editingId, { ...form }));
      setEditingId(null);
    } else {
      setAddresses(saveAddress({ ...form }));
    }
    setForm(EMPTY_FORM);
  }

  function startEdit(a: SavedAddress) {
    setEditingId(a.id);
    setForm({
      label: a.label,
      recipient: a.recipient,
      phone: a.phone,
      address: a.address,
      city: a.city,
      state: a.state,
      instructions: a.instructions,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      <PageHeader title="Addresses" description="Where your orders get delivered." />

      {error && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
          {error}
        </div>
      )}

      <Card title={editingId ? "Edit address" : "Add address"}>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Label" name="label" placeholder="Home, Office…" value={form.label} onChange={(e) => set("label", e.target.value)} />
            <Input label="Recipient" name="recipient" required value={form.recipient} onChange={(e) => set("recipient", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" name="phone" required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <Input label="City" name="city" required value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <Input label="Street address" name="address" required value={form.address} onChange={(e) => set("address", e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="State" name="state" value={form.state} onChange={(e) => set("state", e.target.value)} />
            <Input label="Delivery instructions (optional)" name="instructions" value={form.instructions} onChange={(e) => set("instructions", e.target.value)} />
          </div>
          <div className="flex gap-2.5">
            <Button type="submit">{editingId ? "Save changes" : "Add address"}</Button>
            {editingId && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="mt-4">
        {addresses.length === 0 ? (
          <EmptyState
            icon="fa-map-marker"
            title="No addresses yet"
            description="Add your first delivery address above."
          />
        ) : (
          <ul className="space-y-2.5">
            {addresses.map((a) => (
              <li key={a.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-stone-900">{a.label}</span>
                  {a.isDefault && <Badge tone="success">Default</Badge>}
                </div>
                <p className="mt-1 text-sm text-stone-600">
                  {a.recipient} · {a.phone}
                </p>
                <p className="text-sm text-stone-600">
                  {a.address}, {a.city}
                  {a.state ? `, ${a.state}` : ""}
                </p>
                {a.instructions && <p className="mt-1 text-xs text-stone-500">{a.instructions}</p>}
                <div className="mt-2.5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className="text-xs font-medium text-stone-700 underline min-h-[36px]"
                  >
                    Edit
                  </button>
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() => setAddresses(updateAddress(a.id, { isDefault: true }))}
                      className="text-xs font-medium text-stone-700 underline min-h-[36px]"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeletingId(a.id)}
                    className="text-xs font-medium text-stone-500 hover:text-red-700 underline min-h-[36px]"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete this address?"
        description="It will no longer be available at checkout."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingId) setAddresses(removeAddress(deletingId));
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}

export default function AddressesPage() {
  return (
    <RequireAuth>
      <AddressesBody />
    </RequireAuth>
  );
}
