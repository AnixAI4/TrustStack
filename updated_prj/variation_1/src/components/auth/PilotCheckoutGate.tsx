"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  clearPilotCheckoutPending,
  isPilotCheckoutPending,
} from "@/lib/pilot-checkout";

/**
 * If the user started the Pilot path but landed on Free (cookie race / welcome
 * redirect), force them back to /subscribe until they pay or opt out.
 */
export function PilotCheckoutGate() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { tier, loading: subLoading } = useSubscription();

  useEffect(() => {
    if (authLoading || subLoading) return;
    if (!user || !isPilotCheckoutPending()) return;

    if (tier === "pilot") {
      clearPilotCheckoutPending();
      return;
    }

    if (
      pathname === "/subscribe" ||
      pathname?.startsWith("/auth") ||
      pathname === "/welcome"
    ) {
      return;
    }

    window.location.assign("/subscribe");
  }, [authLoading, subLoading, user, tier, pathname]);

  return null;
}
