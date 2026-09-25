export type OrderStatusKey =
  | "CREATED"
  | "PAYMENT_CONFIRMED"
  | "SENT_TO_VENDOR"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "DISPATCH_ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "SETTLED"
  | "PAYMENT_FAILED"
  | "REJECTED"
  | "CANCELLED"
  | "PICKUP_FAILED"
  | "DELIVERY_FAILED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "DISPUTED";

export const ORDER_STATUS_LABELS: Record<OrderStatusKey, string> = {
  CREATED: "Order placed",
  PAYMENT_CONFIRMED: "Payment confirmed",
  SENT_TO_VENDOR: "Sent to vendor",
  ACCEPTED: "Accepted by vendor",
  PREPARING: "Being prepared",
  READY_FOR_PICKUP: "Ready for pickup",
  DISPATCH_ASSIGNED: "Rider assigned",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
  SETTLED: "Completed",
  PAYMENT_FAILED: "Payment failed",
  REJECTED: "Declined by vendor",
  CANCELLED: "Cancelled",
  PICKUP_FAILED: "Pickup failed",
  DELIVERY_FAILED: "Delivery failed",
  REFUND_PENDING: "Refund pending",
  REFUNDED: "Refunded",
  DISPUTED: "Under review",
};

export type DeliveryStatusKey =
  | "READY_FOR_PICKUP"
  | "DISPATCH_ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "ARRIVED_AT_CUSTOMER"
  | "AWAITING_DELIVERY_VERIFICATION"
  | "CODE_SUBMITTED"
  | "CODE_VALIDATED"
  | "DELIVERED"
  | "DELIVERY_VERIFICATION_FAILED"
  | "FAILED";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatusKey, string> = {
  READY_FOR_PICKUP: "Ready for pickup",
  DISPATCH_ASSIGNED: "Rider assigned",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "On the way",
  ARRIVED_AT_CUSTOMER: "Rider arrived",
  AWAITING_DELIVERY_VERIFICATION: "Waiting for verification",
  CODE_SUBMITTED: "Code submitted",
  CODE_VALIDATED: "Code verified",
  DELIVERED: "Delivered",
  DELIVERY_VERIFICATION_FAILED: "Verification failed",
  FAILED: "Delivery failed",
};

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export function orderStatusTone(status: string): Tone {
  switch (status) {
    case "DELIVERED":
    case "SETTLED":
    case "PAYMENT_CONFIRMED":
      return "success";
    case "PAYMENT_FAILED":
    case "REJECTED":
    case "CANCELLED":
    case "PICKUP_FAILED":
    case "DELIVERY_FAILED":
      return "danger";
    case "REFUND_PENDING":
    case "DISPUTED":
    case "READY_FOR_PICKUP":
    case "DISPATCH_ASSIGNED":
      return "warning";
    default:
      return "info";
  }
}

export function customerOrderLabel(status: string): string {
  return (
    ORDER_STATUS_LABELS[status as OrderStatusKey] ??
    DELIVERY_STATUS_LABELS[status as DeliveryStatusKey] ??
    status.replace(/_/g, " ").toLowerCase()
  );
}
