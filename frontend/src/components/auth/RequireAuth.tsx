"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiError, getCurrentUser, type UserResponse } from "@/lib/api";
import { homeForRole, normalizeRole, type AppRole } from "@/lib/auth";
import { ListSkeleton } from "@/components/ui/Skeleton";

const AuthUserContext = createContext<UserResponse | null>(null);

export function useAuthUser(): UserResponse | null {
  return useContext(AuthUserContext);
}

/**
 * Guards a customer page: redirects to /login when unauthenticated,
 * shows a skeleton while resolving, and shares the user via context.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.isUnauthorized) {
          router.replace("/login");
        } else {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (failed) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-stone-900">We could not load your account.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 text-sm font-medium text-stone-900 underline min-h-[44px]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) return <ListSkeleton rows={3} />;

  return <AuthUserContext.Provider value={user}>{children}</AuthUserContext.Provider>;
}

/**
 * Strict workspace guard: requires authentication AND one of the allowed
 * roles. Anyone else is bounced to their own workspace home, so a vendor
 * can never land on (or refresh into) the customer experience.
 */
export function RequireRole({ allow, children }: { allow: AppRole[]; children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const allowKey = allow.join(",");

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((me) => {
        if (cancelled) return;
        const role = normalizeRole(me.role);
        if (!role || !allow.includes(role)) {
          router.replace(homeForRole(role));
          return;
        }
        setUser(me);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.isUnauthorized) {
          router.replace("/login");
        } else {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, allowKey]);

  if (failed) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-stone-900">We could not load your account.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 text-sm font-medium text-stone-900 underline min-h-[44px]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) return <ListSkeleton rows={3} />;

  return <AuthUserContext.Provider value={user}>{children}</AuthUserContext.Provider>;
}

type Workspace = "customer" | "vendor" | "dispatch" | "admin" | "finance";

function workspaceOf(role: AppRole): Workspace {
  if (role === "customer") return "customer";
  if (role === "vendor_owner" || role === "vendor_staff") return "vendor";
  if (role === "rider") return "dispatch";
  if (role === "finance") return "finance";
  return "admin";
}

const ROLE_LABELS: Record<AppRole, string> = {
  customer: "customer",
  vendor_owner: "vendor",
  vendor_staff: "staff member",
  rider: "rider",
  admin: "admin",
  finance: "finance",
  support: "support",
};

const WORKSPACE_LABELS: Record<Workspace, string> = {
  customer: "customer marketplace",
  vendor: "Vendor Studio",
  dispatch: "Dispatch app",
  admin: "Operations center",
  finance: "Finance workspace",
};

/**
 * Slim banner shown when a signed-in user browses outside their own
 * workspace (e.g. a vendor opening the customer marketplace).
 */
export function WorkspaceBanner({ workspace }: { workspace: Workspace }) {
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        // logged out: no banner
      });
  }, []);

  if (!user) return null;
  const role = normalizeRole(user.role);
  if (!role || workspaceOf(role) === workspace) return null;

  return (
    <div className="site-container pt-3">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-600">
        <span>
          Signed in as a {ROLE_LABELS[role]} ({user.email}). You are viewing the{" "}
          {WORKSPACE_LABELS[workspace]}.
        </span>
        <a href={homeForRole(role)} className="font-semibold text-stone-900 underline">
          Open {WORKSPACE_LABELS[workspaceOf(role)]}
        </a>
      </p>
    </div>
  );
}
