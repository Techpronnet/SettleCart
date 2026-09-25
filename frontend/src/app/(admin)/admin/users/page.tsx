"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  createUserByAdmin,
  friendlyApiMessage,
  listAdminUsers,
  type UserResponse,
  type UserRole,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 20;
const ROLES = ["all", "customer", "vendor", "dispatch", "admin", "finance"] as const;

function UsersBody() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState("customer");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  async function load(nextPage: number) {
    setLoading(true);
    setError("");
    try {
      const res = await listAdminUsers(nextPage, PAGE_SIZE);
      setUsers(res.users);
      setTotal(res.total);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1);
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      await createUserByAdmin({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: null,
        role: newRole as UserRole,
      });
      setShowCreate(false);
      setFullName("");
      setEmail("");
      setPassword("");
      await load(1);
    } catch (err) {
      setFormError(err instanceof ApiError ? friendlyApiMessage(err, "Could not create user.") : "Network error.");
    } finally {
      setCreating(false);
    }
  }

  const needle = query.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      (!needle ||
        u.email.toLowerCase().includes(needle) ||
        u.full_name.toLowerCase().includes(needle))
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="flex-1 min-w-[200px]"
          role="search"
        >
          <Input label="Search" name="q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email…" />
        </form>
        <label className="text-sm text-stone-700">
          Role{" "}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
            className="ml-1 rounded-md border border-stone-300 bg-white px-2.5 py-2 text-sm min-h-[44px]"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "All roles" : r}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={() => setShowCreate((v) => !v)}>New user</Button>
      </div>

      {showCreate && (
        <Card title="Create user">
          {formError && (
            <p role="alert" className="mb-3 text-xs text-red-700">
              {formError}
            </p>
          )}
          <form onSubmit={onCreate} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" name="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label="Email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Temporary password" name="password" type="password" required allowShowPassword value={password} onChange={(e) => setPassword(e.target.value)} />
              <div>
                <label htmlFor="new-user-role" className="block text-sm font-medium text-stone-800 mb-1.5">
                  Role
                </label>
                <select
                  id="new-user-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-md border border-stone-300 bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                  <option value="dispatch">Dispatch rider</option>
                  <option value="admin">Admin</option>
                  <option value="finance">Finance</option>
                </select>
              </div>
            </div>
            <div>
              <Button type="submit" loading={creating}>
                Create user
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <ListSkeleton rows={5} />
      ) : error ? (
        <ErrorState title="Users unavailable." description={error} onRetry={() => load(1)} />
      ) : visible.length === 0 ? (
        <EmptyState icon="fa-users" title="No users found" description="Try a different search or role." />
      ) : (
        <>
          <ul className="space-y-2.5">
            {visible.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/admin/users/${u.id}`}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-400"
                >
                  <span className="w-10 h-10 rounded-xl bg-stone-900 text-white font-bold flex items-center justify-center shrink-0">
                    {u.full_name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-stone-900 truncate">{u.full_name}</span>
                    <span className="block text-xs text-stone-500 truncate">
                      {u.email} · joined {formatDateTime(u.created_at)}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1 shrink-0">
                    <Badge tone="neutral">{u.role}</Badge>
                    {!u.is_active && <Badge tone="danger">Suspended</Badge>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <div>
      <PageHeader title="Users" description="Every account on the platform." />
      <RequireAuth>
        <UsersBody />
      </RequireAuth>
    </div>
  );
}
