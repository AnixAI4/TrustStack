"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";
import { AI_CHILD_TRACKING_QUESTION, AI_CHILD_UNEXEMPT_WARNING, childExemptionShort } from "@truststack/core";
import { TRI_LABEL, type AiDetailPayload, type AiRegisterPayload } from "@/lib/client/retention";
import { formatDay } from "@/lib/client/rights";
import { RegisterDocuments } from "../../register-documents";
import { AiFields, aiBody } from "../ai-fields";

/**
 * One AI system (Slice 10, Stage 5): its purpose, data, children (s.9(3) and
 * the exemption relied on, D-096), human review
 * and last review — who recorded the review is the database's — and its
 * documents. Written with ropa.write (D-094.2); it has no actions (D-094.3).
 */
export function AiDetail({ aiSystemId }: { aiSystemId: string }) {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canWrite = permissions.kind === "ready" && permissions.value.permissions.includes("ropa.write");
  const [payload, setPayload] = useState<AiDetailPayload | null>(null);
  const [scopeSystems, setScopeSystems] = useState<AiRegisterPayload["scopeSystems"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const url = organizationId ? `/api/v1/organizations/${organizationId}/ai-systems/${aiSystemId}` : null;
  const load = useCallback(() => {
    if (!url) return Promise.resolve();
    return apiFetch<AiDetailPayload>(url).then((r) => {
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
  }, [url]);

  useEffect(() => {
    void load();
    if (!organizationId) return;
    apiFetch<AiRegisterPayload>(`/api/v1/organizations/${organizationId}/ai-systems`).then((r) => {
      if (r.success) setScopeSystems(r.data.scopeSystems);
    });
  }, [load, organizationId]);

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="ai-error">
        {error}
      </Notice>
    );
  }
  if (!payload || !organizationId || !url) return <p className="text-sm text-slate-500">Loading…</p>;
  const a = payload.system;

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setSaveError(null);
    const r = await apiFetch<AiDetailPayload>(url!, { method: "PATCH", body: JSON.stringify(aiBody(new FormData(e.currentTarget))) });
    setBusy(false);
    if (!r.success) return setSaveError(r.error.message);
    setPayload(r.data);
    setEditing(false);
  }

  return (
    <div className="space-y-6" data-testid="ai-detail">
      <div>
        <Link href="/dashboard/ai-risk" className="text-xs text-indigo-700 hover:underline">
          ← Back to the register
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span data-testid="ai-detail-status" className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-800">
            {a.statusLabel}
          </span>
          {a.usageLabel && <span className="text-slate-600">{a.usageLabel}</span>}
          {a.reviewDue && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900">Review due</span>}
        </div>
        <h2 className="mt-1 text-lg font-semibold">{a.name}</h2>
        {a.childTrackingUnexempt && (
          <Notice tone="error" compact testId="ai-child-warning" className="mt-2">
            {AI_CHILD_UNEXEMPT_WARNING}
          </Notice>
        )}
      </div>

      {!editing ? (
        <section data-testid="ai-facts" className="space-y-2 rounded-xl border border-slate-200 p-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="What it is for" value={a.purpose} />
            <Fact label="The personal data it uses" value={a.personalData} />
            <Fact label="System in the scope" value={a.system?.name ?? "—"} />
            <div>
              <dt className="text-xs text-slate-500">{AI_CHILD_TRACKING_QUESTION} (s.9(3))</dt>
              <dd data-testid="ai-detail-child-tracking">
                {TRI_LABEL[a.childTracking]}
                {a.childTracking === "yes" && (
                  // Slice 10.5 B3 (F3.10): the exemption by its short name, the code in brackets; the full wording on hover.
                  <span data-testid="ai-detail-child-exemption" title={a.childExemptionLabel ?? undefined} className="block text-xs text-slate-600">
                    Exemption relied on (Fourth Schedule): {childExemptionShort(a.childExemption) ?? "none recorded"}
                  </span>
                )}
              </dd>
            </div>
            <Fact label="The human-review step" value={a.humanReview ?? "Not recorded"} />
            <div>
              <dt className="text-xs text-slate-500">Last reviewed</dt>
              <dd data-testid="ai-detail-reviewed">
                {a.lastReviewedOn ? formatDay(a.lastReviewedOn) : "Never"}
                {a.review && <span className="block text-xs text-slate-500">Recorded by {a.review.byName ?? "a former member"}</span>}
                {a.reviewDueOn && <span className="block text-xs text-slate-500">Next review by {formatDay(a.reviewDueOn)} (a TrustStack default)</span>}
              </dd>
            </div>
          </dl>
          {canWrite && (
            <button type="button" data-testid="ai-edit" onClick={() => setEditing(true)} className="text-sm font-medium text-indigo-700 hover:underline">
              Change or record a review
            </button>
          )}
        </section>
      ) : (
        <form data-testid="ai-edit-form" onSubmit={save} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <AiFields initial={a} scopeSystems={scopeSystems} today={payload.today} />
          <button type="submit" data-testid="ai-edit-save" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-sm font-medium text-white disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-sm text-slate-600 hover:underline">
            Cancel
          </button>
          {saveError && (
            <Notice tone="error" compact testId="ai-edit-error" className="w-full">
              {saveError}
            </Notice>
          )}
        </form>
      )}

      <RegisterDocuments
        organizationId={organizationId}
        documents={a.documents}
        link={{ aiSystemId: a.id }}
        detachUrl={`${url}/evidence`}
        canWrite={canWrite}
        hint="Nothing attached yet. A review record, a bias or accuracy test, or an impact assessment is good evidence here."
        testIdPrefix="ai"
        onChanged={load}
      />
      <p className="text-xs text-slate-500">{payload.note}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
