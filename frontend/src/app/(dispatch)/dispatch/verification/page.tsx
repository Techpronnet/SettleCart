"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { RequireAuth, useAuthUser } from "@/components/auth/RequireAuth";
import { getVehicle, type VehicleInfo } from "@/lib/dispatch";

function VerificationBody() {
  const user = useAuthUser();
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Client-only vehicle restore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVehicle(getVehicle());
    setReady(true);
  }, []);

  if (!ready) return <ListSkeleton rows={2} />;

  const verified = user?.is_verified ?? false;

  return (
    <div className="space-y-4">
      <Card
        title="Verification status"
        action={<Badge tone={verified ? "success" : "warning"}>{verified ? "Verified" : "Pending"}</Badge>}
      >
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-stone-500">Identity</dt>
            <dd className="text-stone-800">{verified ? "Approved" : "Under review"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-stone-500">Vehicle</dt>
            <dd className="text-stone-800">
              {vehicle ? `${vehicle.type}${vehicle.plate ? ` · ${vehicle.plate}` : ""}` : "Not provided"}
            </dd>
          </div>
        </dl>
        {!verified && (
          <p className="mt-3 text-sm text-stone-600">
            You can browse jobs while review is pending. Payouts unlock after approval.
          </p>
        )}
      </Card>
    </div>
  );
}

export default function DispatchVerificationPage() {
  return (
    <div>
      <PageHeader title="Verification" description="Your rider approval state." />
      <RequireAuth>
        <VerificationBody />
      </RequireAuth>
    </div>
  );
}
