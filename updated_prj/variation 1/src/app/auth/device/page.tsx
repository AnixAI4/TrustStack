"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

function DeviceRegistration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const rawRedirect = searchParams.get("redirect") || "/account";
    const redirect =
      rawRedirect.startsWith("/") &&
      !rawRedirect.startsWith("//") &&
      !rawRedirect.includes("..")
        ? rawRedirect
        : "/account";

    if (searchParams.get("revoked") === "1") {
      createClient()
        .auth.signOut()
        .finally(() => {
          if (!cancelled) {
            router.replace(`/auth/sign-in?redirect=${encodeURIComponent(redirect)}`);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    fetch("/api/auth/session/register", { method: "POST" })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!response.ok) throw new Error(body.error || "Could not register this device");
        if (!cancelled) router.replace(redirect);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Could not register this device");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <AuthShell title="Checking this device" subtitle="Securing your account session">
      {error ? (
        <div className="rounded-lg border border-red/30 bg-red/10 p-4 text-sm text-red">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" /> Device verification failed
          </div>
          <p className="mt-2">{error}</p>
          <button className="btn btn-ghost mt-4" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-text-muted">
          <Loader2 className="h-5 w-5 animate-spin" /> Verifying this browser…
        </div>
      )}
    </AuthShell>
  );
}

export default function DevicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <DeviceRegistration />
    </Suspense>
  );
}
