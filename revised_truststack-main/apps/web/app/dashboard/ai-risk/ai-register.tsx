"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { Can, usePermissions } from "@/lib/client/permissions";
import { AI_CHILD_UNEXEMPT_WARNING } from "@truststack/core";
import { TRI_LABEL, type AiDetailPayload, type AiRegisterPayload } from "@/lib/client/retention";
import { formatDay } from "@/lib/client/rights";
import { AiFields, aiBody } from "./ai-fields";

/**
 * The AI risk register (Slice 10, Stage 5): one row per AI system or AI use —
 * what it is for, the personal data it uses, whether it tracks, monitors or
 * targets advertising at children and the Fourth Schedule exemption relied on
 * (D-096), the human-review step, the last review. Enabling, never a status (D-073): the
 * duty of algorithmic due diligence is a Significant Data Fiduciary's (Rule
 * 13(3)), and nothing here sets an exposure status.
 */
export function AiRegister() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [payload, setPayload] = useState<AiRegisterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!organizationId) return;
    apiFetch<AiRegisterPayload>(`/api/v1/organizations/${organizationId}/ai-systems`).then((r) => {
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
  }, [organizationId]);
  useEffect(load, [load]);

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="ai-error">
        {error}
      </Notice>
    );
  }
  if (!payload || !organizationId) return <p className="text-sm text-slate-500">Loading the register…</p>;
  const { counts } = payload;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Every AI system and AI use that touches personal data: what it is for, what it uses, whether it tracks, monitors
          or targets advertising at children, who reviews what it decides, and when it was last reviewed.
        </p>
      </div>

      <section data-testid="ai-summary" className="rounded-xl border border-slate-200 p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <Stat label="In the register" value={counts.total} testId="ai-count-total" />
          <Stat label="In use" value={counts.inUse} testId="ai-count-in-use" />
          <Stat label="Not reviewed in 12 months" value={counts.unreviewed} testId="ai-count-unreviewed" />
          <Stat label="Track or target children" value={counts.childTracking} testId="ai-count-child-tracking" />
          <Stat label="…with no exemption recorded" value={counts.childTrackingUnexempt} testId="ai-count-child-unexempt" alert={counts.childTrackingUnexempt > 0} />
        </dl>
        {counts.childTrackingUnexempt > 0 && (
          <Notice tone="error" compact testId="ai-child-warning" className="mt-3">
            {AI_CHILD_UNEXEMPT_WARNING}
          </Notice>
        )}
        {counts.childTrackingUnknown > 0 && (
          <p data-testid="ai-child-unknown" className="mt-2 text-xs text-amber-900">
            {counts.childTrackingUnknown === 1 ? "1 system in use has" : `${counts.childTrackingUnknown} systems in use have`} not yet answered whether it
            tracks, monitors or targets advertising at children.
          </p>
        )}
        <p data-testid="ai-note" className="mt-3 text-xs text-slate-500">
          {payload.note}
        </p>
        <p data-testid="ai-sdf" className="mt-2 text-xs text-slate-600">
          {payload.sdfNotified
            ? "A Significant Data Fiduciary notification is recorded: penalty head 4 applies, and an AI system not reviewed in twelve months is given as a reason on it."
            : "No Significant Data Fiduciary notification is recorded, so penalty head 4 does not apply. TrustStack never infers it."}
        </p>
      </section>

      <Can permission="ropa.write">
        <AddAi organizationId={organizationId} payload={payload} onAdded={load} />
      </Can>

      {payload.systems.length === 0 ? (
        <p data-testid="ai-empty" className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-700">
          No AI system is recorded. Add each AI system in the scope, and any other AI use that touches personal data.
        </p>
      ) : (
        <DataTable
          testId="ai-list"
          rows={payload.systems}
          rowKey={(a) => a.id}
          rowTestId={(a) => `ai-${a.id}`}
          noun="AI systems"
          search={{ label: "Search AI systems", placeholder: "Search by name or use", text: (a) => `${a.name} ${a.usageLabel ?? ""} ${a.system?.name ?? ""}` }}
          columns={[
            {
              key: "name",
              header: "AI system",
              sortValue: (a) => a.name,
              cell: (a) => (
                <>
                  <Link href={`/dashboard/ai-risk/${a.id}`} className="font-medium text-indigo-800 hover:underline">
                    {a.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-medium ${a.status === "in_use" ? "bg-slate-100 text-slate-800" : "bg-slate-50 text-slate-500"}`}>{a.statusLabel}</span>
                    {a.usageLabel && <span className="text-slate-600">{a.usageLabel}</span>}
                    {a.childTrackingUnexempt && (
                      <span data-testid={`ai-child-unexempt-${a.id}`} className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-900">
                        Children: no exemption recorded
                      </span>
                    )}
                    {a.reviewDue && (
                      <span data-testid={`ai-review-due-${a.id}`} className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900">
                        Review due
                      </span>
                    )}
                  </div>
                </>
              ),
            },
            { key: "system", header: "System", className: "text-xs", sortValue: (a) => a.system?.name ?? null, cell: (a) => a.system?.name ?? "—" },
            {
              key: "children",
              header: "Tracks or targets children",
              className: "text-xs",
              cell: (a) => (
                <>
                  {TRI_LABEL[a.childTracking]}
                  {a.childExemptionLabel && <span className="block text-slate-500">Exemption: {a.childExemptionLabel.split(" — ")[0]}</span>}
                </>
              ),
            },
            {
              key: "reviewed",
              header: "Last reviewed",
              className: "text-xs whitespace-nowrap",
              sortValue: (a) => a.lastReviewedOn,
              cell: (a) => (a.lastReviewedOn ? formatDay(a.lastReviewedOn) : "Never"),
            },
          ]}
        />
      )}
    </div>
  );
}

function AddAi({ organizationId, payload, onAdded }: { organizationId: string; payload: AiRegisterPayload; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await apiFetch<AiDetailPayload>(`/api/v1/organizations/${organizationId}/ai-systems`, {
      method: "POST",
      body: JSON.stringify(aiBody(new FormData(e.currentTarget))),
    });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button type="button" data-testid="ai-add" onClick={() => setOpen(true)} className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800">
        Add an AI system
      </button>
    );
  }
  const listed = new Set(payload.systems.map((s) => s.systemId));
  return (
    <form data-testid="ai-add-form" onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <AiFields scopeSystems={payload.scopeSystems.filter((s) => !listed.has(s.id))} today={payload.today} />
      <button type="submit" data-testid="ai-add-save" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-sm font-medium text-white disabled:opacity-50">
        {busy ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-600 hover:underline">
        Cancel
      </button>
      {error && (
        <Notice tone="error" compact testId="ai-add-error" className="w-full">
          {error}
        </Notice>
      )}
    </form>
  );
}

function Stat({ label, value, testId, alert }: { label: string; value: number; testId: string; alert?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd data-testid={testId} className={`text-lg font-semibold ${alert ? "text-red-800" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
