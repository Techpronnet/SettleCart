"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StorefrontView } from "@/components/customer/StorefrontView";
import { VendorSetupPrompt } from "@/components/vendor/VendorBits";
import { getVendorContext } from "@/lib/vendor-context";

function PreviewGate() {
  const ctx = getVendorContext();
  if (!ctx.storeId) return <VendorSetupPrompt />;
  return (
    <StorefrontView
      storeId={ctx.storeId}
      homeLabel="Store"
      homeHref="/vendor/store"
      productHref={(productId) => `/vendor/products/${productId}/edit`}
    />
  );
}

export default function StorePreviewPage() {
  return (
    <div>
      <PageHeader
        title="Storefront preview"
        description="Exactly what customers see. Tap a product to edit it."
      />
      <RequireAuth>
        <PreviewGate />
      </RequireAuth>
    </div>
  );
}
