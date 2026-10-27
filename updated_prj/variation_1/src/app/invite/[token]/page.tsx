"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const MESSAGES: Record<string, string> = {
  invite_not_found: "This invitation is invalid or was revoked.",
  invite_already_used: "This invitation was already used.",
  invite_expired: "This invitation has expired. Ask the workspace owner for a new one.",
  email_mismatch: "Sign in with the email address that received this invitation.",
  seat_limit_reached: "This workspace has no available seats.",
  active_org_pilot_required: "The workspace subscription is not active.",
};

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invitePath = `/invite/${encodeURIComponent(params.token)}`;

  async function accept() {
    setAccepting(true);
    setError(null);
    const response = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setAccepting(false);
    if (!response.ok) {
      setError(MESSAGES[body.error || ""] || "Could not accept this invitation.");
      return;
    }
    setAccepted(true);
    window.setTimeout(() => router.replace("/trustdeck/overview"), 900);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-4 py-12">
      <section className="w-full max-w-md rounded-xl border border-line bg-bg-2 p-7 text-center shadow-card">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-accent/10 text-accent">
          {accepted ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-text">
          {accepted ? "Workspace joined" : "TrustStack workspace invitation"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {accepted
            ? "Opening your compliance workspace…"
            : "Membership is tied to the invited email and consumes one licensed seat."}
        </p>

        {error && <p className="mt-5 rounded-lg border border-red/30 bg-red/10 p-3 text-sm text-red">{error}</p>}

        {!accepted && !loading && !user && (
          <div className="mt-6 grid gap-3">
            <Link href={`/auth/sign-in?redirect=${encodeURIComponent(invitePath)}`} className="btn btn-accent justify-center">
              Sign in to accept
            </Link>
            <Link href={`/auth/sign-up?redirect=${encodeURIComponent(invitePath)}`} className="btn btn-ghost justify-center">
              Create account
            </Link>
          </div>
        )}

        {!accepted && user && (
          <button className="btn btn-accent mt-6 w-full justify-center" disabled={accepting} onClick={() => void accept()}>
            {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
            Accept invitation
          </button>
        )}
      </section>
    </main>
  );
}
