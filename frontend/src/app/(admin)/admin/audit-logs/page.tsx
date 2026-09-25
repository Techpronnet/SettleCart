import { PageHeader } from "@/components/ui/PageHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PendingBackendState } from "@/components/admin/AdminBits";

export default function AuditLogsPage() {
  return (
    <div>
      <PageHeader title="Audit logs" description="Who did what, and when." />
      <RequireAuth>
        <PendingBackendState
          title="Audit trail ships with backend support"
          description="KYC decisions, settlements, payments and security events will be searchable here by actor, action, resource and date once the audit endpoint lands."
        />
      </RequireAuth>
    </div>
  );
}
