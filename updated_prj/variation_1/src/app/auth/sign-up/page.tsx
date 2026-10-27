"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UserPlus, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  clearPilotCheckoutPending,
  markPilotCheckoutPending,
} from "@/lib/pilot-checkout";
import { safeInternalPath } from "@/lib/pilot-paths";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const plan = searchParams.get("plan") === "pilot" ? "pilot" : "free";
  const redirectTo = safeInternalPath(searchParams.get("redirect"), "/");
  const isPilot = plan === "pilot";

  useEffect(() => {
    if (isPilot) {
      markPilotCheckoutPending();
    } else {
      clearPilotCheckoutPending();
    }
  }, [isPilot]);

  useEffect(() => {
    if (user && !authLoading) {
      if (isPilot) {
        markPilotCheckoutPending();
        // Full navigation so auth cookies are visible to middleware.
        window.location.assign("/subscribe");
      } else {
        clearPilotCheckoutPending();
        router.replace(redirectTo);
      }
    }
  }, [user, authLoading, router, redirectTo, isPilot]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);

    if (password !== confirmPassword) {
      setBusy(false);
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setBusy(false);
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!ageConfirmed) {
      setBusy(false);
      setError("Please confirm that you are at least 18 years old.");
      return;
    }

    const result = await signUp(email, password);

    if (result.status === "ok") {
      if (isPilot) {
        markPilotCheckoutPending();
        window.location.assign("/subscribe");
      } else {
        clearPilotCheckoutPending();
        router.replace(redirectTo);
      }
      return;
    }

    setBusy(false);

    if (result.status === "confirm_email") {
      setSuccess(result.message);
      return;
    }

    setError(result.message);
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        isPilot
          ? "You're signing up for the Pilot plan"
          : "You're signing up for the Free plan"
      }
    >
      {success ? (
        <div className="text-center">
          <Check className="mx-auto mb-4 h-12 w-12 text-accent" />
          <h2 className="mb-2 font-display text-lg font-semibold text-text">
            Check your email
          </h2>
          <p className="text-sm text-text-muted">{success}</p>
          <Link href="/auth/sign-in" className="btn btn-ghost mt-6">
            Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {isPilot && (
            <div className="badge mx-auto mb-2">
              <Check className="h-3 w-3" />
              Full access to all features
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-muted">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-2 px-4 py-3 text-text placeholder:text-text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-2 px-4 py-3 text-text placeholder:text-text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-text-muted"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-2 px-4 py-3 text-text placeholder:text-text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Confirm your password"
            />
          </div>

          <label className="flex items-start gap-3 py-1">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 rounded border-line bg-bg-2 text-accent focus:ring-accent"
            />
            <span className="text-sm text-text-muted">
              I confirm that I am at least 18 years of age and agree to the Terms
              of Service and Privacy Policy.
            </span>
          </label>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-accent w-full justify-center">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {busy
              ? "Creating account..."
              : isPilot
                ? "Create account & continue"
                : "Create account"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-text-faint">
        <Link href="/welcome" className="hover:text-text-muted">
          Back to plans
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <SignUpForm />
    </Suspense>
  );
}
