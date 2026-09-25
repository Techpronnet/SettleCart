import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar, FINANCE_NAV } from "@/components/layout/Nav";
import { RequireRole } from "@/components/auth/RequireAuth";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader title="Finance" nav={FINANCE_NAV} />
      <RequireRole allow={["finance", "admin"]}>
        <div className="site-container flex gap-6 pt-4 sm:pt-6 pb-10">
          <Sidebar items={FINANCE_NAV} title="Finance" />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </RequireRole>
    </>
  );
}
