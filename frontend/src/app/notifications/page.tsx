import { PageHeader } from "@/components/ui/PageHeader";
import { NotificationCenterShell } from "@/components/notifications/NotificationCenter";

export const metadata = { title: "Notifications | SettleCart" };

export default function NotificationsPage() {
  return (
    <main className="site-container py-4 sm:py-6 pb-10">
      <PageHeader
        title="Notifications"
        description="Order, payment, delivery and account updates."
      />
      <NotificationCenterShell />
    </main>
  );
}
