import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, DISPATCH_NAV, Sidebar } from "@/components/layout/Nav";
import { RequireRole } from "@/components/auth/RequireAuth";

export default function DispatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader title="Dispatch" nav={DISPATCH_NAV} />
      <RequireRole allow={["rider"]}>
        <div className="site-container flex gap-6 pt-4 sm:pt-6 pb-24 md:pb-10">
          <Sidebar items={DISPATCH_NAV} title="Dispatch" />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </RequireRole>
      <BottomNav items={DISPATCH_NAV} />
    </>
  );
}
