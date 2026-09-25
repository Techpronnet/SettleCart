import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar, ADMIN_NAV } from "@/components/layout/Nav";
import { RequireRole } from "@/components/auth/RequireAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader title="Operations" nav={ADMIN_NAV} />
      <RequireRole allow={["admin", "support"]}>
        <div className="site-container flex gap-6 pt-4 sm:pt-6 pb-10">
          <Sidebar items={ADMIN_NAV} title="Operations" />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </RequireRole>
    </>
  );
}
