"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { VendorSetupPrompt } from "@/components/vendor/VendorBits";
import { ProductForm, emptyProductForm } from "@/components/vendor/ProductForm";
import { createProduct, type ProductCreateRequest, type ProductUpdateRequest } from "@/lib/api";
import { getVendorContext } from "@/lib/vendor-context";

function NewProductBody({ storeId }: { storeId: string }) {
  const router = useRouter();

  async function handleSubmit(payload: ProductCreateRequest & ProductUpdateRequest) {
    return createProduct(storeId, payload);
  }

  return (
    <ProductForm
      storeId={storeId}
      initial={emptyProductForm()}
      initialImages={[]}
      productId={null}
      submitLabel="Create product"
      onSubmit={handleSubmit}
      onDone={() => router.push("/vendor/products")}
    />
  );
}

function NewProductGate() {
  const ctx = getVendorContext();
  if (!ctx.storeId) return <VendorSetupPrompt />;
  return <NewProductBody storeId={ctx.storeId} />;
}

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="Add Product" breadcrumbs={[{ label: "Products", href: "/vendor/products" }, { label: "New" }]} />
      <RequireAuth>
        <NewProductGate />
      </RequireAuth>
    </div>
  );
}
