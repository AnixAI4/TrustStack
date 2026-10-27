"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const result = await requestPasswordReset(email);
    setBusy(false);

    if (result.status === "ok") {
      setSuccess(true);
      return;
    }

    setError(result.message);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      {success ? (
        <div className="text-center">
          <Check className="mx-auto mb-4 h-12 w-12 text-accent" />
          <h2 className="mb-2 font-display text-lg font-semibold text-text">
            Check your email
          </h2>
          <p className="text-sm text-text-muted">
            We&apos;ve sent a password reset link to{" "}
            <span className="text-text">{email}</span>
          </p>
          <Link href="/auth/sign-in" className="btn btn-ghost mt-6">
            Back to sign in
          </Link>
        </div>
      ) : (
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

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-accent w-full justify-center">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {busy ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center">
        <Link
          href="/auth/sign-in"
          className="inline-flex items-center gap-1 text-sm text-text-faint hover:text-text-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
