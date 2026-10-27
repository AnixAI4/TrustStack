"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { safeInternalPath } from "@/lib/pilot-paths";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const redirectTo = safeInternalPath(searchParams.get("redirect"), "/");
  const callbackError = searchParams.get("error");

  useEffect(() => {
    if (user && !authLoading) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  useEffect(() => {
    const hash =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.hash.replace(/^#/, ""))
        : null;
    const hashCode = hash?.get("error_code");
    const hashDesc = hash?.get("error_description")?.replace(/\+/g, " ");

    if (
      callbackError === "auth_callback_failed" ||
      hashCode === "otp_expired" ||
      hash?.get("error") === "access_denied"
    ) {
      setError(
        hashDesc?.includes("expired")
          ? "That email link was already used or burned by a mail scanner. Skip the link - sign in with your password, or create the account again from Welcome."
          : "That confirmation link failed. Skip the email link and sign in with your password instead."
      );
      if (typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`
        );
      }
    }
  }, [callbackError]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const result = await signIn(email, password);

    if (result.status === "ok") {
      router.replace(redirectTo);
      return;
    }

    setBusy(false);
    setError(result.message);
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your TrustStack account">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg-2 px-4 py-3 text-text placeholder:text-text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Your password"
          />
          <div className="mt-2 text-right">
            <Link href="/auth/forgot-password" className="text-xs text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <button type="submit" disabled={busy} className="btn btn-accent w-full justify-center">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href={`/auth/sign-up${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-accent hover:underline"
        >
          Sign up
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <SignInForm />
    </Suspense>
  );
}
