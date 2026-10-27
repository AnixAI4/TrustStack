"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import type {
  SubscriptionTier,
  TrustStackFeature,
  CanScanResult,
} from "@/lib/supabase/types";
import { canAccessFeature } from "@/lib/supabase/types";

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  loading: boolean;
  canAccess: (feature: TrustStackFeature) => boolean;
  canScan: CanScanResult | null;
  refreshSubscription: () => Promise<void>;
  dailyScansRemaining: number;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [canScan, setCanScan] = useState<CanScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = supabaseConfigured();

  const fetchSubscription = useCallback(async () => {
    if (!user || !configured) {
      setTier("free");
      setCanScan(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data: tierData, error: tierError } = await supabase.rpc(
        "get_user_tier",
        {
          p_user_id: user.id,
        }
      );

      if (!tierError && tierData) {
        setTier(tierData as SubscriptionTier);
      } else {
        const { data: subData } = await supabase
          .from("truststack_subscriptions")
          .select("tier, status, current_period_end")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (subData) {
          setTier(subData.tier as SubscriptionTier);
        } else {
          setTier("free");
        }
      }

      const { data: scanData, error: scanError } = await supabase.rpc(
        "can_user_scan",
        {
          p_user_id: user.id,
        }
      );

      if (!scanError && scanData) {
        setCanScan(scanData as CanScanResult);
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
      setTier("free");
    } finally {
      setLoading(false);
    }
  }, [user, configured]);

  useEffect(() => {
    if (!authLoading) {
      void fetchSubscription();
    }
  }, [authLoading, fetchSubscription]);

  const canAccess = useCallback(
    (feature: TrustStackFeature) => canAccessFeature(tier, feature),
    [tier]
  );

  const dailyScansRemaining = canScan?.scans_remaining ?? 0;

  const value = useMemo(
    () => ({
      tier,
      loading: loading || authLoading,
      canAccess,
      canScan,
      refreshSubscription: fetchSubscription,
      dailyScansRemaining,
    }),
    [tier, loading, authLoading, canAccess, canScan, fetchSubscription, dailyScansRemaining]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error(
      "useSubscription must be used within SubscriptionProvider"
    );
  }
  return ctx;
}
