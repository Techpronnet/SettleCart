import type { Metadata } from "next";
import "./globals.css";
import "font-awesome/css/font-awesome.min.css";
import { AosProvider } from "@/components/AosProvider";
import { CartProvider } from "@/components/ui/Dialog";

export const metadata: Metadata = {
  title: "SettleCart | African Multi-Vendor Commerce & Dispatch Platform",
  description:
    "Your business. Your storefront. One connected marketplace. Create your store, sell products or services, receive orders, and reach customers across Africa.",
  keywords: [
    "SettleCart",
    "Commerce Infrastructure",
    "African Marketplace",
    "Storefront",
    "Dispatch Network",
    "Fulfillment & Settlement",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#fffbf5] text-[#0a1f16] font-sans antialiased selection:bg-[#123524] selection:text-white">
        <AosProvider>
          <CartProvider>{children}</CartProvider>
        </AosProvider>
      </body>
    </html>
  );
}
