import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar, VENDOR_NAV } from "@/components/layout/Nav";
import { RequireRole } from "@/components/auth/RequireAuth";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader title="Vendor Studio" nav={VENDOR_NAV} />
      <RequireRole allow={["vendor_owner", "vendor_staff"]}>
        <div className="site-container flex gap-6 pt-4 sm:pt-6 pb-10">
          <Sidebar items={VENDOR_NAV} title="Business" />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </RequireRole>
    </>
  );
}
