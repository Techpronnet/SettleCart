"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { VendorSetupPrompt } from "@/components/vendor/VendorBits";
import {
  ApiError,
  createCategory,
  deleteCategory,
  friendlyApiMessage,
  getCategories,
  updateCategory,
  type CategoryResponse,
} from "@/lib/api";
import { getVendorContext } from "@/lib/vendor-context";

function CategoriesBody({ storeId }: { storeId: string }) {
  const [categories, setCategories] = useState<CategoryResponse[] | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [deleting, setDeleting] = useState<CategoryResponse | null>(null);
  const [actionError, setActionError] = useState("");

  async function load() {
    setError("");
    try {
      setCategories(await getCategories(storeId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load categories.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError("Give the category a name.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), description: description.trim() || null });
        setEditing(null);
      } else {
        const existing = categories ?? [];
        await createCategory(storeId, {
          name: name.trim(),
          description: description.trim() || null,
          sort_order: existing.length,
        });
      }
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? friendlyApiMessage(err, "Could not save.") : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c: CategoryResponse) {
    setEditing(c);
    setName(c.name);
    setDescription(c.description ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setActionError("");
    try {
      await deleteCategory(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? friendlyApiMessage(err, "Could not delete.") : "Network error."
      );
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card title={editing ? "Edit category" : "New category"}>
        {formError && (
          <p role="alert" className="mb-3 text-xs text-red-700">
            {formError}
          </p>
        )}
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Input label="Name" name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ready to Wear" />
          <Input label="Description (optional)" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex gap-2.5">
            <Button type="submit" loading={saving}>
              {editing ? "Save" : "Add"}
            </Button>
            {editing && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  setName("");
                  setDescription("");
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      {actionError && (
        <p role="alert" className="text-xs text-red-700">
          {actionError}
        </p>
      )}

      {error ? (
        <ErrorState title="Categories unavailable." description={error} onRetry={load} />
      ) : categories === null ? (
        <ListSkeleton rows={3} />
      ) : categories.length === 0 ? (
        <EmptyState icon="fa-tags" title="No categories yet" description="Group products so customers can browse." />
      ) : (
        <ul className="space-y-2.5">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">{c.name}</p>
                {c.description && <p className="text-xs text-stone-500 truncate">{c.description}</p>}
              </div>
              <div className="flex gap-3 shrink-0">
                <button type="button" onClick={() => startEdit(c)} className="text-xs font-medium text-stone-700 underline min-h-[36px]">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(c)}
                  className="text-xs font-medium text-stone-500 hover:text-red-700 underline min-h-[36px]"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete "${deleting?.name}"?`}
        description="Products in this category become uncategorized."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function CategoriesGate() {
  const ctx = getVendorContext();
  if (!ctx.storeId) return <VendorSetupPrompt />;
  return <CategoriesBody storeId={ctx.storeId} />;
}

export default function CategoriesPage() {
  return (
    <div>
      <PageHeader title="Categories" description="Organize your catalogue." />
      <RequireAuth>
        <CategoriesGate />
      </RequireAuth>
    </div>
  );
}
