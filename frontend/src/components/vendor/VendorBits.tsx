"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/ui/States";

export function VendorSetupPrompt({ message }: { message?: string }) {
  return (
    <EmptyState
      icon="fa-building"
      title="Set up your business first"
      description={
        message ??
        "Create your business, complete KYC and open your store to unlock this section."
      }
      action={
        <Link
          href="/vendor/onboarding"
          className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
        >
          Start onboarding
        </Link>
      }
    />
  );
}

export function StatCard({  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-stone-500">
        <span className="w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
          <i className={`fa ${icon}`} aria-hidden="true" />
        </span>
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

export function ShareStorefrontButton({
  storeId,
  storeName,
}: {
  storeId: string;
  storeName: string;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function share() {
    const url = `${window.location.origin}/stores/${storeId}`;
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: storeName,
          text: `Shop ${storeName} on SettleCart`,
          url,
        });
        return;
      }
      throw new Error("no-share");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setFeedback("Link copied. Share it anywhere.");
      } catch {
        setFeedback("Copy this link: " + url);
      }
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[40px]"
      >
        <i className="fa fa-share-alt" aria-hidden="true" />
        Share storefront
      </button>
      {feedback && (
        <span role="status" className="text-xs text-teal-800">
          {feedback}
        </span>
      )}
    </span>
  );
}
