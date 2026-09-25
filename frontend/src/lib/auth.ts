import type { UserRole } from "@/lib/api";

export type AppRole =
  | "customer"
  | "vendor_owner"
  | "vendor_staff"
  | "rider"
  | "admin"
  | "finance"
  | "support";

export const ROLE_HOME: Record<AppRole, string> = {
  customer: "/home",
  vendor_owner: "/vendor",
  vendor_staff: "/vendor",
  rider: "/dispatch",
  admin: "/admin",
  finance: "/finance",
  support: "/admin",
};

export function normalizeRole(role: UserRole | string | null | undefined): AppRole | null {
  if (!role) return null;
  const r = String(role).toLowerCase();
  if (r === "customer") return "customer";
  if (r === "vendor_owner" || r === "vendor-owner" || r === "vendor") return "vendor_owner";
  if (r === "vendor_staff" || r === "vendor-staff" || r === "staff") return "vendor_staff";
  if (r === "rider" || r === "dispatch" || r === "dispatch_rider") return "rider";
  if (r === "admin" || r === "platform_admin") return "admin";
  if (r === "finance" || r === "settlement_operator") return "finance";
  if (r === "support") return "support";
  return null;
}

export function canAccess(role: AppRole | null, allowed: AppRole[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

export function homeForRole(role: AppRole | null): string {
  if (!role) return "/login";
  return ROLE_HOME[role] ?? "/";
}
