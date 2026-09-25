"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, friendlyApiMessage, register, getCurrentUser } from "@/lib/api";
import { homeForRole, normalizeRole } from "@/lib/auth";

type Intent = "customer" | "vendor" | "dispatch";

const INTENTS: { key: Intent; title: string; text: string; icon: string }[] = [
  { key: "customer", title: "I want to shop", text: "Discover stores and order.", icon: "fa-shopping-cart" },
  { key: "vendor", title: "I want to sell", text: "Open a store and receive orders.", icon: "fa-building" },
  { key: "dispatch", title: "I want to deliver", text: "Accept jobs and earn.", icon: "fa-motorcycle" },
];

function intentFromParam(value: string | null): Intent {
  if (value === "vendor" || value === "dispatch" || value === "customer") return value;
  return "customer";
}

function PasswordChecklist({ password }: { password: string }) {
  const rules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a letter", met: /[A-Za-z]/.test(password) },
    { label: "Contains a number", met: /\d/.test(password) },
  ];
  return (
    <ul aria-label="Password requirements" className="-mt-2 space-y-1">
      {rules.map((rule) => (
        <li
          key={rule.label}
          aria-label={`${rule.label}: ${rule.met ? "met" : "not met"}`}
          className={`flex items-center gap-2 text-xs ${rule.met ? "text-teal-800" : "text-stone-500"}`}
        >
          <i
            className={`fa ${rule.met ? "fa-check-circle" : "fa-circle-o"}`}
            aria-hidden="true"
          />
          {rule.label}
        </li>
      ))}
    </ul>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [intent, setIntent] = useState<Intent>(() =>
    intentFromParam(searchParams.get("as"))
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailTaken(false);
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role: intent,
      });
      const me = await getCurrentUser();
      router.push(homeForRole(normalizeRole(me.role)));
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[register] failure details:', JSON.stringify(err instanceof ApiError ? err.details : err));
      }
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setEmailTaken(true);
          setError("An account with this email already exists.");
        } else {
          setError(friendlyApiMessage(err, "Registration failed. Please try again."));
        }
      } else {
        setError("Network error. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-stone-900">Create account</h1>
      <p className="mt-1 text-sm text-stone-500">Choose how you want to use SettleCart.</p>

      <div role="radiogroup" aria-label="Account type" className="mt-4 grid gap-2">
        {INTENTS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={intent === opt.key}
            onClick={() => setIntent(opt.key)}
            className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left min-h-[56px] ${
              intent === opt.key
                ? "border-stone-900 bg-stone-50"
                : "border-stone-300 bg-white hover:bg-stone-50"
            }`}
          >
            <span className="w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
              <i className={`fa ${opt.icon}`} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-stone-900">{opt.title}</span>
              <span className="block text-xs text-stone-500">{opt.text}</span>
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
          <p>{error}</p>
          {emailTaken && (
            <Link href="/login" className="mt-1.5 inline-block font-semibold underline min-h-[32px]">
              Log in instead
            </Link>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <Input label="Full name" name="fullName" required autoComplete="name" placeholder="e.g. Amina Mohammed" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Phone (optional)" name="phone" type="tel" autoComplete="tel" placeholder="e.g. 0802 345 6789" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Password" name="password" type="password" required autoComplete="new-password" allowShowPassword hint="At least 8 characters, with a letter and a number." placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordChecklist password={password} />
        <Button type="submit" loading={loading} size="lg" className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-5 text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-stone-900 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
