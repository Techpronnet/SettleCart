/**
 * Vendor staff roster, kept on this device until backend team
 * management lands. Finance and settings stay owner-only by design;
 * the toggles below record intent and are enforced once supported.
 */

export type StaffStatus = "active" | "suspended";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  status: StaffStatus;
  addedAt: string;
}

const KEY = "settlecart_staff";

export const STAFF_PERMISSIONS = [
  { key: "orders", label: "Orders", text: "View and process orders." },
  { key: "products", label: "Products", text: "Manage catalogue." },
  { key: "inventory", label: "Inventory", text: "Adjust stock levels." },
  { key: "customers", label: "Customers", text: "View customer summaries." },
] as const;

export const LOCKED_PERMISSIONS = [
  { key: "finance", label: "Finance", text: "Owner only." },
  { key: "settings", label: "Settings", text: "Owner only." },
] as const;

function uid(): string {
  return `stf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function loadStaff(): StaffMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(roster: StaffMember[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(roster));
  } catch {
    // ignore quota errors
  }
}

export function addStaffMember(input: Omit<StaffMember, "id" | "status" | "addedAt">): StaffMember[] {
  const entry: StaffMember = {
    ...input,
    status: "active",
    id: uid(),
    addedAt: new Date().toISOString(),
  };
  const next = [entry, ...loadStaff()];
  persist(next);
  return next;
}

export function setStaffStatus(id: string, status: StaffStatus): StaffMember[] {
  const next = loadStaff().map((m) => (m.id === id ? { ...m, status } : m));
  persist(next);
  return next;
}

export function setStaffPermissions(id: string, permissions: string[]): StaffMember[] {
  const next = loadStaff().map((m) => (m.id === id ? { ...m, permissions } : m));
  persist(next);
  return next;
}

export function removeStaffMember(id: string): StaffMember[] {
  const next = loadStaff().filter((m) => m.id !== id);
  persist(next);
  return next;
}
