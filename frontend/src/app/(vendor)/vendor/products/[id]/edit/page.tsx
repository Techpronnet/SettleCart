"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProductForm, productFormFromResponse } from "@/components/vendor/ProductForm";
import {
  ApiError,
  getProduct,
  updateProduct,
  type ProductCreateRequest,
  type ProductResponse,
  type ProductUpdateRequest,
} from "@/lib/api";

function EditProductBody({ productId }: { productId: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProduct(productId)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Product not found.");
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleSubmit(payload: ProductCreateRequest & ProductUpdateRequest) {
    return updateProduct(productId, payload);
  }

  if (error) {
    return <ErrorState title="Product unavailable." description={error} onRetry={() => window.location.reload()} />;
  }

  if (!product) return <ListSkeleton rows={3} />;

  return (
    <ProductForm
      storeId={product.store_id}
      initial={productFormFromResponse(product)}
      initialImages={product.images ?? []}
      productId={product.id}
      submitLabel="Save changes"
      onSubmit={handleSubmit}
      onDone={() => router.push("/vendor/products")}
    />
  );
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <PageHeader title="Edit Product" breadcrumbs={[{ label: "Products", href: "/vendor/products" }, { label: "Edit" }]} />
      <RequireAuth>
        <EditProductBody productId={id} />
      </RequireAuth>
    </div>
  );
}
