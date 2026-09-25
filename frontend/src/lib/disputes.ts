/**
 * Customer problem reports, kept on this device until backend case
 * management lands. Filing is tied to a real order; the derived
 * disputed-orders queue stays the admin source of truth.
 */

export interface LocalDispute {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  details: string;
  status: "opened";
  createdAt: string;
}

const KEY = "settlecart_disputes";

export const DISPUTE_REASONS = [
  "Item arrived damaged",
  "Wrong item received",
  "Order never arrived",
  "Payment issue",
  "Problem with vendor",
  "Other",
];

function uid(): string {
  return `dsp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function loadDisputes(): LocalDispute[] {
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

function persist(disputes: LocalDispute[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(disputes));
  } catch {
    // ignore quota errors
  }
}

export function fileDispute(input: Omit<LocalDispute, "id" | "status" | "createdAt">): LocalDispute[] {
  const entry: LocalDispute = {
    ...input,
    status: "opened",
    id: uid(),
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...loadDisputes()];
  persist(next);
  return next;
}

export function disputesForOrder(orderId: string): LocalDispute[] {
  return loadDisputes().filter((d) => d.orderId === orderId);
}
