"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  createBusiness,
  createStore,
  friendlyApiMessage,
  listMyBusinesses,
  publishStore,
  submitKyc,
} from "@/lib/api";
import { getVendorContext, setVendorBusiness, setVendorStore } from "@/lib/vendor-context";

const STEPS = ["Business", "KYC", "Store", "Catalogue", "Publish"] as const;

const BUSINESS_TYPES = [
  "Retail",
  "Fashion",
  "Food / Restaurant",
  "Grocery",
  "Beauty",
  "Services",
  "Digital Products",
  "Other",
];

function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const [bizName, setBizName] = useState("");
  const [bizDesc, setBizDesc] = useState("");
  const [bizType, setBizType] = useState(BUSINESS_TYPES[0]);
  const [storeName, setStoreName] = useState("");
  const [storeCity, setStoreCity] = useState("Lagos");
  const [storeAddress, setStoreAddress] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function resume() {
      const ctx = getVendorContext();
      try {
        const businesses = await listMyBusinesses();
        const biz = businesses.find((b) => b.id === ctx.businessId) ?? businesses[0] ?? null;
        if (cancelled) return;
        if (biz) {
          setBusinessId(biz.id);
          setVendorBusiness(biz.id);
          setStep(biz.kyc_status === "verified" || biz.kyc_status === "under_review" ? 2 : 1);
          if (ctx.storeId) {
            setStoreId(ctx.storeId);
            setStep(4);
          }
        }
      } catch {
        // fresh start on failure
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    resume();
    return () => {
      cancelled = true;
    };
  }, []);

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setError("");
    setWorking(true);
    try {
      return await fn();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[onboarding] failure:", err);
      }
      if (err instanceof ApiError) {
        setError(friendlyApiMessage(err, "Something went wrong."));
      } else if (err instanceof TypeError) {
        setError(
          "Can't reach the SettleCart server from this device. Check your internet connection, then try again. " +
            "If you are on the live site and this keeps happening, the app may be pointing at an unreachable server address."
        );
      } else {
        setError("Something went wrong. Try again.");
      }
      return null;
    } finally {
      setWorking(false);
    }
  }

  async function saveBusiness() {
    if (!bizName.trim()) {
      setError("Give your business a name.");
      return;
    }
    const biz = await run(() =>
      createBusiness({ name: bizName.trim(), description: bizDesc.trim() || null, business_type: bizType })
    );
    if (biz) {
      setBusinessId(biz.id);
      setVendorBusiness(biz.id);
      setStep(1);
    }
  }

  async function submitBusinessKyc() {
    if (!businessId) return;
    const biz = await run(() => submitKyc(businessId));
    if (biz) {
      setStep(2);
    }
  }

  async function saveStore() {
    if (!businessId || !storeName.trim()) {
      setError("Give your store a name.");
      return;
    }
    const store = await run(() =>
      createStore({
        name: storeName.trim(),
        business_id: businessId,
        city: storeCity.trim() || null,
        address: storeAddress.trim() || null,
      })
    );
    if (store) {
      setStoreId(store.id);
      setVendorStore(store.id);
      setStep(3);
    }
  }

  async function publish() {
    if (!storeId) return;
    const store = await run(() => publishStore(storeId));
    if (store) {
      setPublished(true);
      setStep(4);
    }
  }

  if (checking) return <ListSkeleton rows={3} />;

  return (
    <div>
      <ol aria-label="Onboarding progress" className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-1.5 shrink-0">
            <span
              aria-current={step === i ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium min-h-[32px] ${
                i < step
                  ? "bg-teal-100 text-teal-900"
                  : i === step
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-500"
              }`}
            >
              <span className="font-bold">{i + 1}</span> {label}
            </span>
            {i < STEPS.length - 1 && <span aria-hidden="true" className="w-4 h-px bg-stone-300" />}
          </li>
        ))}
      </ol>

      {error && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="mt-4">
        {step === 0 && (
          <Card title="Your business">
            <div className="grid gap-4">
              <Input label="Business name" name="bizName" required value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="e.g. Zola Naturals" />
              <Input label="Description (optional)" name="bizDesc" value={bizDesc} onChange={(e) => setBizDesc(e.target.value)} placeholder="What does your business do?" />
              <div>
                <label htmlFor="bizType" className="block text-sm font-medium text-stone-800 mb-1.5">
                  Business type
                </label>
                <select
                  id="bizType"
                  value={bizType}
                  onChange={(e) => setBizType(e.target.value)}
                  className="w-full rounded-md border border-stone-300 bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={saveBusiness} loading={working} size="lg">
                Save and continue
              </Button>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card title="Identity verification (KYC)">
            <p className="text-sm text-stone-600 leading-relaxed">
              Submit your business for verification. Our team reviews KYC submissions; approval
              unlocks publishing and withdrawals.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <Button onClick={submitBusinessKyc} loading={working} size="lg">
                Submit for verification
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setStep(2)}>
                Skip for now
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card title="Your store">
            <div className="grid gap-4">
              <Input label="Store name" name="storeName" required value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. Zola Naturals Lagos" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="City" name="storeCity" value={storeCity} onChange={(e) => setStoreCity(e.target.value)} />
                <Input label="Address (optional)" name="storeAddress" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} />
              </div>
              <Button onClick={saveStore} loading={working} size="lg">
                Create store
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card title="Add your first products">
            <p className="text-sm text-stone-600">
              Your store exists. Add products so customers have something to buy, then come back
              to publish.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/vendor/products/new"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
              >
                Add a product
              </Link>
              <Button variant="secondary" size="lg" onClick={() => setStep(4)}>
                Continue to publish
              </Button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card title={published ? "You are live" : "Publish your store"}>
            <p className="text-sm text-stone-600">
              {published
                ? "Your store is published and visible in the marketplace."
                : "Publishing makes your store visible to customers in the marketplace."}
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
              {!published && (
                <Button onClick={publish} loading={working} size="lg">
                  Publish store
                </Button>
              )}
              <Button variant={published ? "primary" : "secondary"} size="lg" onClick={() => router.push("/vendor")}>
                Go to dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <div>
      <PageHeader title="Open your store" description="Business, verification, storefront, catalogue, publish." />
      <RequireAuth>
        <Wizard />
      </RequireAuth>
    </div>
  );
}
