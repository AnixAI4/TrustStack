"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { PilotCheckoutGate } from "@/components/auth/PilotCheckoutGate";
import { SecurityShield } from "@/components/security/SecurityShield";
import { NextDevToolsGuard } from "@/components/providers/NextDevToolsGuard";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <NextDevToolsGuard />
        <SecurityShield />
        <PilotCheckoutGate />
        {children}
      </SubscriptionProvider>
    </AuthProvider>
  );
}
