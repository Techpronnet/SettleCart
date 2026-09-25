import type { Tone } from "./status";
import type { VendorOrderStatus } from "./api";

export const KYC_STATUS_LABELS: Record<string, string> = {
  pending: "Not submitted",
  under_review: "Under review",
  verified: "Verified",
  rejected: "Rejected",
};

export function kycTone(status: string): Tone {
  switch (status) {
    case "verified":
      return "success";
    case "rejected":
      return "danger";
    case "under_review":
      return "warning";
    default:
      return "neutral";
  }
}

export function kycLabel(status: string | null | undefined): string {
  if (!status) return "Not started";
  return KYC_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export type VendorOrderAction = "accept" | "reject" | "prepare" | "ready";

export const VENDOR_ORDER_LABELS: Record<string, string> = {
  pending: "New",
  accepted: "Accepted",
  rejected: "Declined",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  picked_up: "Picked up",
  delivered: "Delivered",
  settled: "Settled",
  cancelled: "Cancelled",
};

export function vendorOrderLabel(status: string): string {
  return VENDOR_ORDER_LABELS[status] ?? status.replace(/_/g, " ");
}

export function vendorOrderActions(status: string): VendorOrderAction[] {
  switch (status) {
    case "pending":
      return ["accept", "reject"];
    case "accepted":
      return ["prepare"];
    case "preparing":
      return ["ready"];
    default:
      return [];
  }
}

export const VENDOR_ACTION_STATUS: Record<VendorOrderAction, VendorOrderStatus> = {
  accept: "accepted",
  reject: "rejected",
  prepare: "preparing",
  ready: "ready_for_pickup",
};

export function storeStatus(isPublished: boolean, isActive: boolean): {
  label: string;
  tone: Tone;
} {
  if (!isActive) return { label: "Suspended", tone: "danger" };
  if (isPublished) return { label: "Published", tone: "success" };
  return { label: "Draft", tone: "neutral" };
}
