"use client";

import { use } from "react";
import { StorefrontView } from "@/components/customer/StorefrontView";

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <StorefrontView storeId={id} homeLabel="Home" homeHref="/home" />;
}
