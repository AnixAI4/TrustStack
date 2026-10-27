"use client";

import { ReactNode } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PilotUpgradeOverlay } from "./PilotUpgradeOverlay";

export function CertificationGate({ children }: { children: ReactNode }) {
  const { canAccess, loading } = useSubscription();
  const hasAccess = canAccess("certifications");

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        Checking access…
      </div>
    );
  }

  if (!hasAccess) {
    return <PilotUpgradeOverlay featureName="Certifications" />;
  }

  return <>{children}</>;
}
