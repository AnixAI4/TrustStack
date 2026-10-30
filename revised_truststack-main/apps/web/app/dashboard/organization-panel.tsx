"use client";

import { useEffect, useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { useIndustryLabel } from "@/lib/client/industries";

interface OrganizationMe {
  organization: { id: string; name: string; organizationType: string; industryCode: string | null; consultantAssisted: boolean };
  user: { email: string; fullName: string | null };
  role: string;
}

type ApiBody =
  | { success: true; data: OrganizationMe }
  | { success: false; error: { code: string; message: string } };

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string; code?: string }
  | { kind: "ready"; data: OrganizationMe };

/**
 * The overview's header: the caller's organisation, read through the real,
 * authenticated API, its industry as its label (Slice 10.5 B1, F1.2). Who is
 * signed in, as which role, is the top bar's; what they do next is the
 * "Your next steps" panel below (F1.1).
 */
export function OrganizationPanel() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const industry = useIndustryLabel(state.kind === "ready" ? state.data.organization.industryCode : null);

  useEffect(() => {
    // Ignore a late answer rather than aborting the request: an abort on
    // navigation surfaces as a runtime AbortError in the dev overlay. The
    // same pattern as the other dashboard pages.
    let cancelled = false;
    fetch("/api/v1/organizations/me", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as ApiBody;
        if (cancelled) return;
        if (body.success) setState({ kind: "ready", data: body.data });
        else setState({ kind: "error", message: body.error.message, code: body.error.code });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({ kind: "error", message: error instanceof Error ? error.message : "Network error." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <section aria-busy="true" className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Loading your organisation…</p>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <Notice tone="error">
        <p className="font-medium">We couldn’t load your organisation.</p>
        <p className="text-sm">
          {state.message}
          {state.code ? ` (${state.code})` : ""}
        </p>
      </Notice>
    );
  }

  const { organization } = state.data;
  // An organisation whose scope names no industry yet shows its stored type.
  const kind = industry ?? (organization.industryCode ? null : organization.organizationType);
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-500">Organisation</p>
      <h2 data-testid="organization-name" className="text-xl font-semibold">
        {organization.name}
      </h2>
      <p data-testid="organization-kind" className="min-h-5 text-sm text-slate-600">
        {kind}
        {kind && organization.consultantAssisted ? " · consultant-assisted" : ""}
      </p>
    </section>
  );
}
