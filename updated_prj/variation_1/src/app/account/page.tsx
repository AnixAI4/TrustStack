"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Shield,
  Sparkles,
  CreditCard,
  Building2,
  LogOut,
  Check,
  Scan,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function AccountPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { tier, dailyScansRemaining, loading: subLoading } = useSubscription();
  const [signingOut, setSigningOut] = useState(false);

  const loading = authLoading || subLoading;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    window.location.assign("/welcome");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-1 flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Please sign in to view your account.</p>
          <Link href="/auth/sign-in" className="btn btn-accent">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const isPilot = tier === "pilot";

  return (
    <div className="min-h-screen bg-bg-1">
      <div className="container-x py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-text mb-2">
            Account Settings
          </h1>
          <p className="text-text-muted mb-8">
            Manage your TrustStack account and subscription
          </p>

          {/* Profile Section */}
          <section className="rounded-xl border border-line bg-surface-2/30 p-6 mb-6">
            <h2 className="font-display text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-accent" />
              Profile
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-text-muted" />
                <span className="text-text">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-text-muted" />
                <span className="text-text-muted text-sm">
                  Account created{" "}
                  {new Date(user.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </section>

          {/* Subscription Section */}
          <section className="rounded-xl border border-line bg-surface-2/30 p-6 mb-6">
            <h2 className="font-display text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              Subscription
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                    isPilot
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-zinc-500/10 text-zinc-500"
                  }`}
                >
                  {isPilot ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Pilot
                    </>
                  ) : (
                    "Free"
                  )}
                </span>
              </div>
              {!isPilot && (
                <Link href="/subscribe" className="btn btn-accent btn-sm">
                  Upgrade to Pilot
                </Link>
              )}
            </div>

            {isPilot && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-bg-1/50 p-4">
                  <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                    <Scan className="h-4 w-4" />
                    Daily Scans
                  </div>
                  <div className="text-2xl font-semibold text-text">
                    {dailyScansRemaining}{" "}
                    <span className="text-sm text-text-muted font-normal">
                      remaining
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-bg-1/50 p-4">
                  <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                    <Calendar className="h-4 w-4" />
                    Resets
                  </div>
                  <div className="text-lg font-medium text-text">Tomorrow</div>
                </div>
              </div>
            )}

            {isPilot && (
              <div className="mt-4 pt-4 border-t border-line">
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Your Pilot benefits
                </h3>
                <ul className="space-y-2">
                  {[
                    "Template catalog (individual unlocks)",
                    "8 certification modules",
                    "1 compliance scan per day",
                    "All tools & utilities",
                    "TrustChat AI (coming soon)",
                  ].map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-center gap-2 text-sm text-text"
                    >
                      <Check className="h-4 w-4 text-emerald-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Organization Section */}
          <section className="rounded-xl border border-line bg-surface-2/30 p-6 mb-6">
            <h2 className="font-display text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              Organization
            </h2>
            <p className="text-text-muted text-sm mb-4">
              Create or join an organization to share your subscription with
              team members.
            </p>
            <Link
              href="/account/organization"
              className="btn btn-ghost btn-sm"
            >
              Manage Organization
            </Link>
          </section>

          {/* Sign Out */}
          <section className="rounded-xl border border-line bg-surface-2/30 p-6">
            <button
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="btn btn-ghost text-red-500 hover:bg-red-500/10 hover:border-red-500/30"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
