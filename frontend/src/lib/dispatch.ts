import type { Tone } from "./status";

export type RiderAvailability = "offline" | "available" | "busy" | "paused";

const AVAILABILITY_KEY = "settlecart_rider_availability";
const DISMISSED_KEY = "settlecart_dismissed_jobs";
const VEHICLE_KEY = "settlecart_rider_vehicle";

export interface VehicleInfo {
  type: string;
  plate: string;
}

export function getAvailability(): RiderAvailability {
  if (typeof window === "undefined") return "offline";
  try {
    const v = window.localStorage.getItem(AVAILABILITY_KEY);
    if (v === "available" || v === "busy" || v === "paused" || v === "offline") return v;
  } catch {
    // ignore
  }
  return "offline";
}

export function setAvailability(value: RiderAvailability): void {
  try {
    window.localStorage.setItem(AVAILABILITY_KEY, value);
  } catch {
    // ignore
  }
}

export function getDismissedJobs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function dismissJob(taskId: string): void {
  try {
    const next = Array.from(new Set([...getDismissedJobs(), taskId]));
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getVehicle(): VehicleInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(VEHICLE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.type === "string") return { type: parsed.type, plate: parsed.plate ?? "" };
  } catch {
    // ignore
  }
  return null;
}

export function setVehicle(info: VehicleInfo): void {
  try {
    window.localStorage.setItem(VEHICLE_KEY, JSON.stringify(info));
  } catch {
    // ignore
  }
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for rider",
  assigned: "Assigned to you",
  accepted: "Accepted",
  picked_up: "Picked up",
  in_transit: "On the way",
  delivered: "Delivered",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function taskLabel(status: string): string {
  return TASK_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function taskTone(status: string): Tone {
  switch (status) {
    case "delivered":
      return "success";
    case "failed":
    case "cancelled":
      return "danger";
    case "pending":
    case "assigned":
      return "warning";
    default:
      return "info";
  }
}

export const FAILURE_REASONS = [
  "Customer unavailable",
  "Wrong address",
  "Customer refused",
  "Verification failed",
  "Vehicle issue",
  "Vendor issue",
  "Other",
];

export function isActiveTask(status: string): boolean {
  return status === "assigned" || status === "accepted" || status === "picked_up" || status === "in_transit";
}

/** Where the rider should go next for a task in the given status. */
export function nextStepFor(status: string, taskId: string): string {
  switch (status) {
    case "pending":
    case "assigned":
      return `/dispatch/jobs/${taskId}`;
    case "accepted":
      return `/dispatch/pickup/${taskId}`;
    case "picked_up":
    case "in_transit":
      return `/dispatch/active/${taskId}`;
    default:
      return `/dispatch/jobs/${taskId}`;
  }
}
