"use client";

import { ReactNode } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import type { TrustStackFeature } from "@/lib/supabase/types";
import { PilotUpgradeOverlay } from "./PilotUpgradeOverlay";

const FEATURE_NAMES: Record<TrustStackFeature, string> = {
  scanner_full: "DPDP Scanner",
  tools: "Compliance Tools",
  templates: "Templates",
  certifications: "Certifications",
  trustchat: "TrustChat",
  platform: "TrustDeck",
};

export function RequirePilot({
  feature,
  children,
}: {
  feature: TrustStackFeature;
  children: ReactNode;
}) {
  const { canAccess, loading } = useSubscription();
  const hasAccess = canAccess(feature);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        Checking access…
      </div>
    );
  }

  // Never render gated children without access - previously they were sent and
  // merely covered by an overlay, which DevTools could delete.
  if (!hasAccess) {
    return <PilotUpgradeOverlay featureName={FEATURE_NAMES[feature] ?? feature} />;
  }

  return <>{children}</>;
}
