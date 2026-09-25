import { PageHeader } from "@/components/ui/PageHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PendingBackendState } from "@/components/admin/AdminBits";

export default function ReviewsModerationPage() {
  return (
    <div>
      <PageHeader title="Review moderation" description="Keep marketplace feedback genuine." />
      <RequireAuth>
        <PendingBackendState
          title="Moderation queue ships with backend support"
          description="Customer reviews are only accepted for delivered or settled orders. Flagging, hiding and removal tools arrive with the backend reviews service."
        />
      </RequireAuth>
    </div>
  );
}
