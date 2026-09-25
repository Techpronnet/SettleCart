"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RequireAuth, useAuthUser } from "@/components/auth/RequireAuth";
import { getVehicle, setVehicle, type VehicleInfo } from "@/lib/dispatch";

const VEHICLE_TYPES = ["Motorcycle", "Bicycle", "Car", "Van", "On foot"];

function OnboardingBody() {
  const router = useRouter();
  const user = useAuthUser();
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [plate, setPlate] = useState("");
  const [vehicle, setVehicleState] = useState<VehicleInfo | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Client-only vehicle restore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVehicleState(getVehicle());
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const info = { type: vehicleType, plate: plate.trim() };
    setVehicle(info);
    setVehicleState(info);
    setDone(true);
  }

  const hasVehicle = done || vehicle !== null;

  const steps = [
    { label: "Account", done: true, text: user?.email ?? "Signed in" },
    { label: "Identity verification", done: user?.is_verified ?? false, text: user?.is_verified ? "Verified" : "Pending review" },
    { label: "Vehicle", done: hasVehicle, text: hasVehicle ? "Provided" : "Not provided" },
  ];

  return (
    <div className="space-y-4">
      <Card title="Progress">
        <ol className="space-y-2.5">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3 text-sm">
              <span
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                  s.done ? "bg-teal-700 text-white" : "bg-stone-200 text-stone-600"
                }`}
              >
                {i + 1}
              </span>
              <span className="font-medium text-stone-900">{s.label}</span>
              <span className="ml-auto text-xs text-stone-500">{s.text}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Vehicle information">
        {done ? (
          <div>
            <p className="text-sm text-stone-600">Vehicle saved. You can now go online and receive jobs.</p>
            <Button className="mt-4" size="lg" onClick={() => router.push("/dispatch")}>
              Go to dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <label htmlFor="vehicle-type" className="block text-sm font-medium text-stone-800 mb-1.5">
                Vehicle type
              </label>
              <select
                id="vehicle-type"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full rounded-md border border-stone-300 bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Plate number (optional)" name="plate" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="e.g. ABC-123-XY" />
            <div>
              <Button type="submit" size="lg">
                Save and continue
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function DispatchOnboardingPage() {
  return (
    <div>
      <PageHeader title="Rider onboarding" description="Account, verification, vehicle, approval." />
      <RequireAuth>
        <OnboardingBody />
      </RequireAuth>
    </div>
  );
}
