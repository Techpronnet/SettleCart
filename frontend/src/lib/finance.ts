import { listAllOrders, type OrderResponse, type VendorOrderResponse } from "@/lib/api";

export interface SettlementCandidate {
  order: OrderResponse;
  vendorOrder: VendorOrderResponse;
}

/**
 * Scans recent orders for vendor orders that are delivered but not yet
 * settled. Bounded to the first pages to stay fast on large platforms.
 */
export async function scanPendingSettlements(maxOrders = 100): Promise<{
  candidates: SettlementCandidate[];
  scanned: number;
}> {
  const candidates: SettlementCandidate[] = [];
  let scanned = 0;
  let page = 1;
  const size = 50;
  for (;;) {
    const res = await listAllOrders(null, page, size);
    scanned += res.orders.length;
    for (const order of res.orders) {
      for (const vo of order.vendor_orders) {
        if (vo.status === "delivered") {
          candidates.push({ order, vendorOrder: vo });
        }
      }
    }
    if (res.orders.length < size || scanned >= maxOrders) break;
    page += 1;
  }
  return { candidates, scanned };
}

export interface FinanceTotals {
  gmv: number;
  platformFees: number;
  vendorVolume: number;
  orderCount: number;
  settledCount: number;
  refundedVolume: number;
  refundCount: number;
}

export function totalsFor(orders: OrderResponse[]): FinanceTotals {
  let gmv = 0;
  let platformFees = 0;
  let vendorVolume = 0;
  let settledCount = 0;
  let refundedVolume = 0;
  let refundCount = 0;
  for (const o of orders) {
    const total = Number(o.total) || 0;
    if (o.status === "cancelled" || o.status === "payment_failed") continue;
    gmv += total;
    platformFees += Number(o.platform_fee) || 0;
    vendorVolume += Number(o.subtotal) || 0;
    if (o.status === "settled") settledCount += 1;
    if (o.status === "refunded" || o.status === "refund_pending") {
      refundCount += 1;
      refundedVolume += total;
    }
  }
  return { gmv, platformFees, vendorVolume, orderCount: orders.length, settledCount, refundedVolume, refundCount };
}

export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
