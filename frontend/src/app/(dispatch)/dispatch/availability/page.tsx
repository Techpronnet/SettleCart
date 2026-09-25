"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { getAvailability, setAvailability, type RiderAvailability } from "@/lib/dispatch";

const OPTIONS: { key: RiderAvailability; title: string; text: string }[] = [
  { key: "offline", title: "Offline", text: "No jobs offered." },
  { key: "available", title: "Available", text: "Receive new delivery offers." },
  { key: "busy", title: "Busy", text: "Finishing current work, no new offers." },
  { key: "paused", title: "Paused", text: "Short break, no new offers." },
];

function AvailabilityBody() {
  const [value, setValue] = useState<RiderAvailability>("offline");

  useEffect(() => {
    // Client-only availability restore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(getAvailability());
  }, []);

  function change(next: RiderAvailability) {
    setValue(next);
    setAvailability(next);
  }

  return (
    <Card title="Your status">
      <div role="radiogroup" aria-label="Availability" className="grid gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={value === opt.key}
            onClick={() => change(opt.key)}
            className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left min-h-[56px] ${
              value === opt.key ? "border-stone-900 bg-stone-50" : "border-stone-300 bg-white"
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                opt.key === "available"
                  ? "bg-teal-600"
                  : opt.key === "offline"
                    ? "bg-stone-300"
                    : "bg-amber-500"
              }`}
            />
            <span>
              <span className="block text-sm font-semibold text-stone-900">{opt.title}</span>
              <span className="block text-xs text-stone-500">{opt.text}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-500">
        Availability is kept on this device and controls which jobs are offered to you here.
      </p>
    </Card>
  );
}

export default function AvailabilityPage() {
  return (
    <div>
      <PageHeader title="Availability" description="Control when you receive jobs." />
      <RequireAuth>
        <AvailabilityBody />
      </RequireAuth>
    </div>
  );
}
