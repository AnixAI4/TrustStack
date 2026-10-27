"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import type { TrustStackFeature } from "@/lib/supabase/types";

interface FeatureGateProps {
  feature: TrustStackFeature;
  children: ReactNode;
  fallback?: ReactNode;
  mode?: "hide" | "blur" | "overlay";
}

const FEATURE_NAMES: Record<TrustStackFeature, string> = {
  templates: "Policy Templates",
  certifications: "Certifications",
  tools: "Tools & Utilities",
  scanner_full: "Full Scanner Access",
  trustchat: "TrustChat AI",
  platform: "TrustDeck",
};

export function FeatureGate({
  feature,
  children,
  fallback,
  mode = "overlay",
}: FeatureGateProps) {
  const { canAccess, loading } = useSubscription();

  if (loading) {
    return <>{children}</>;
  }

  const hasAccess = canAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (mode === "hide") {
    return null;
  }

  if (mode === "blur") {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <UpgradePrompt feature={feature} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-lg">
        <UpgradePrompt feature={feature} />
      </div>
    </div>
  );
}

function UpgradePrompt({ feature }: { feature: TrustStackFeature }) {
  return (
    <div className="text-center p-6 max-w-sm">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/10 mb-4">
        <Lock className="h-6 w-6 text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {FEATURE_NAMES[feature]} is a Pilot feature
      </h3>
      <p className="text-sm text-zinc-400 mb-4">
        Upgrade to Pilot to unlock this feature and get full access to TrustStack.
      </p>
      <Link
        href="/subscribe"
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" />
        Upgrade to Pilot
      </Link>
    </div>
  );
}

export function FeatureBadge({
  feature,
  className = "",
}: {
  feature: TrustStackFeature;
  className?: string;
}) {
  const { canAccess, loading } = useSubscription();

  if (loading || canAccess(feature)) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ${className}`}
    >
      <Lock className="h-3 w-3" />
      Pilot
    </span>
  );
}

export function RequireFeature({
  feature,
  children,
  redirectTo = "/subscribe",
}: {
  feature: TrustStackFeature;
  children: ReactNode;
  redirectTo?: string;
}) {
  const { canAccess, loading } = useSubscription();

  if (loading) {
    return <>{children}</>;
  }

  if (!canAccess(feature)) {
    if (typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
    return null;
  }

  return <>{children}</>;
}
