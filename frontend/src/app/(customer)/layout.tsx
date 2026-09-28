import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, CUSTOMER_NAV, Sidebar } from "@/components/layout/Nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader title="SettleCart" nav={CUSTOMER_NAV} />
      <div className="site-container flex gap-6 pt-4 sm:pt-6 pb-24 md:pb-10">
        <Sidebar items={CUSTOMER_NAV} title="Shop" />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <BottomNav items={CUSTOMER_NAV} />
    </>
  );
}
