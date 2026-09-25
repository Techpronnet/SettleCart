"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Navigation";
import {
  ApiError,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationEventType,
  type NotificationResponse,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";

type Category = "All" | "Orders" | "Payments" | "Delivery" | "Account" | "Financial" | "System";

const CATEGORIES: Category[] = ["All", "Orders", "Payments", "Delivery", "Account", "Financial", "System"];

function categoryOf(event: NotificationEventType): Exclude<Category, "All"> {
  switch (event) {
    case "order_created":
    case "order_cancelled":
    case "vendor_order_assigned":
      return "Orders";
    case "payment_confirmed":
      return "Payments";
    case "dispatch_assigned":
    case "delivery_otp_generated":
    case "delivery_picked_up":
    case "delivery_in_transit":
    case "delivery_completed":
    case "delivery_failed":
      return "Delivery";
    case "kyc_reviewed":
      return "Account";
    case "settlement_credited":
    case "withdrawal_requested":
    case "withdrawal_processed":
      return "Financial";
    default:
      return "System";
  }
}

const CATEGORY_ICONS: Record<Exclude<Category, "All">, string> = {
  Orders: "fa-shopping-bag",
  Payments: "fa-credit-card",
  Delivery: "fa-truck",
  Account: "fa-user",
  Financial: "fa-bank",
  System: "fa-bell-o",
};

export function NotificationCenterShell({ active = "All" }: { active?: string }) {
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [tab, setTab] = useState<Category>(
    (CATEGORIES as string[]).includes(active) ? (active as Category) : "All"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await listNotifications(1, 50);
      setItems(res.notifications);
      setUnread(res.unread_count);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function openItem(item: NotificationResponse) {
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        // stay unread on failure
      }
    }
  }

  async function markAll() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  }

  const visible = tab === "All" ? items : items.filter((n) => categoryOf(n.event_type) === tab);

  return (
    <div className="space-y-4">
      <Tabs tabs={CATEGORIES.map((c) => ({ key: c, label: c }))} active={tab} onChange={setTab} />
      <Card
        title={unread > 0 ? `${unread} unread` : "Notifications"}
        action={
          unread > 0 ? (
            <button
              type="button"
              onClick={markAll}
              className="text-xs font-medium text-stone-900 underline min-h-[36px]"
            >
              Mark all read
            </button>
          ) : undefined
        }
      >
        {loading ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState title="Notifications unavailable." description={error} onRetry={load} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="fa-bell-o"
            title={tab === "All" ? "No notifications yet" : `No ${tab.toLowerCase()} notifications`}
            description="Order, payment, delivery and account updates will appear here."
          />
        ) : (
          <ul className="space-y-2.5">
            {visible.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className={`w-full text-left rounded-xl border p-3.5 min-h-[56px] ${
                    n.is_read ? "border-stone-200 bg-white" : "border-stone-900 bg-stone-50"
                  }`}
                >
                  <span className="flex items-start gap-2.5">
                    <span className="w-8 h-8 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
                      <i className={`fa ${CATEGORY_ICONS[categoryOf(n.event_type)]}`} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-stone-900">{n.title}</span>
                      <span className="block mt-0.5 text-sm text-stone-600">{n.message}</span>
                      <span className="block mt-1 text-xs text-stone-400">{formatDateTime(n.created_at)}</span>
                    </span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-stone-900 shrink-0 mt-1.5" aria-label="Unread" />
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
