"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Templates catalog requires sign-in. Full document bodies are sold per
 * template - Pilot alone does not unlock them.
 */
export function TemplatesGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        Checking access…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-x py-16 text-center">
        <h2 className="font-display text-2xl font-semibold text-text">
          Sign in to browse templates
        </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">
            Unlock individual templates to read on-screen and download Word + PDF.
            Pricing is confirmed securely at checkout.
          </p>
        <Link href="/auth/sign-in?redirect=/templates" className="btn btn-accent mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
