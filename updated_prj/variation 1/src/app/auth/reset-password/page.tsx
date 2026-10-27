"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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

    const result = await updatePassword(password);
    setBusy(false);

    if (result.status === "ok") {
      setSuccess(true);
      setTimeout(() => {
        router.replace("/");
      }, 2000);
      return;
    }

    setError(result.message);
  }

  return (
    <AuthShell title="Set new password" subtitle="Enter your new password below">
      {success ? (
        <div className="text-center">
          <Check className="mx-auto mb-4 h-12 w-12 text-accent" />
          <h2 className="mb-2 font-display text-lg font-semibold text-text">
            Password updated
          </h2>
          <p className="text-sm text-text-muted">
            Your password has been reset. Redirecting...
          </p>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-muted">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              autoFocus
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
              Confirm new password
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

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-accent w-full justify-center">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
