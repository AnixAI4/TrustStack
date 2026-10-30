"use client";

import {
  BREACH_NATURE_LABEL,
  BREACH_NATURES,
  BREACH_SEVERITIES,
  BREACH_STATUS_LABEL,
  BREACH_TRANSITIONS,
  formatInIndia,
  GAP_SEVERITY_LABEL,
  type BreachStatus,
} from "@truststack/core";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AcceptedDraft, DraftButton } from "@/components/ai/draft-panel";
import { Notice } from "@/components/feedback/notice";
import { Tabs } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/client/api";
import {
  CLOCK_STYLE,
  instantToIstInput,
  istInputToInstant,
  nowIstInput,
  STATUS_STYLE,
  type BreachDetailPayload,
  type BreachIncident,
  type RecordedBy,
} from "@/lib/client/breaches";
import { SEVERITY_STYLE, todayInIndia } from "@/lib/client/gaps";
import { Can, usePermissions } from "@/lib/client/permissions";
import { AddAction } from "../../add-action";
import { RegisterDocuments } from "../../register-documents";
import { ActionEditor } from "../../assessments/[assessmentId]/gaps/action-editor";

/**
 * One breach (Slice 10, Stage 1): its Rule 7 timeline, what happened, its
 * lifecycle and its remedial actions.
 *
 * Each intimation is a fact recorded once, with when it was made; the server
 * stamps who recorded it and when, and a recorded fact can be corrected but
 * never removed. The due time of the Board report is the database's. The
 * browser explains the rules; the database enforces them.
 */
export function BreachDetail({ breachId }: { breachId: string }) {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canWrite = permissions.kind === "ready" && permissions.value.permissions.includes("breach.write");
  const [payload, setPayload] = useState<BreachDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const url = organizationId ? `/api/v1/organizations/${organizationId}/breaches/${breachId}` : null;
  const load = useCallback(() => {
    if (!url) return Promise.resolve();
    return apiFetch<BreachDetailPayload>(url).then((r) => {
      if (r.success) {
        setPayload(r.data);
        setError(null);
      } else setError(r.error.message);
    });
  }, [url]);

  useEffect(() => {
    void load();
    apiFetch<{ user: { id: string } }>("/api/v1/auth/me").then((r) => {
      if (r.success) setCurrentUserId(r.data.user.id);
    });
  }, [load]);

  /** One PATCH; the fresh incident comes back in the response. */
  const patch = useCallback(
    async (body: Record<string, unknown>): Promise<string | null> => {
      if (!url) return "Not ready.";
      const r = await apiFetch<BreachDetailPayload>(url, { method: "PATCH", body: JSON.stringify(body) });
      if (!r.success) return r.error.message;
      setPayload(r.data);
      return null;
    },
    [url],
  );

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="breach-error">
        {error}
      </Notice>
    );
  }
  if (!payload || !organizationId) return <p className="text-sm text-slate-500">Loading the breach…</p>;
  const b = payload.incident;
  const locked = b.status === "closed" || b.status === "dismissed";
  const editable = canWrite && !locked;

  return (
    <div className="space-y-6" data-testid="breach-detail" data-status={b.status}>
      <div>
        <Link href="/dashboard/breaches" className="text-xs text-indigo-700 hover:underline">
          ← Back to the register
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span data-testid="breach-code" className="font-mono font-semibold text-slate-800">
            {b.incidentCode}
          </span>
          <span data-testid="breach-status" className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLE[b.status]}`}>
            {b.statusLabel}
          </span>
          <span className={`rounded-full px-2 py-0.5 font-medium ${SEVERITY_STYLE[b.severity] ?? ""}`}>{GAP_SEVERITY_LABEL[b.severity]}</span>
          <span className="text-slate-600">{b.natureLabel}</span>
        </div>
        <h2 className="mt-1 text-lg font-semibold">{b.title}</h2>
        {b.status === "dismissed" && (
          <p data-testid="breach-dismissed" className="mt-2 rounded-md bg-slate-100 p-2 text-sm text-slate-700">
            Dismissed as not a personal data breach: {b.dismissalReason}
          </p>
        )}
      </div>

      <Tabs
        label="Breach"
        tabs={[
          {
            id: "timeline",
            label: "Timeline",
            content: (
              <>
                <Timeline b={b} clockNote={payload.clockNote} editable={editable} patch={patch} organizationId={organizationId} />
                <Lifecycle b={b} canWrite={canWrite} patch={patch} />
              </>
            ),
          },
          {
            id: "documents",
            label: "Documents",
            badge: b.documents.length,
            content: (
              <RegisterDocuments
                organizationId={organizationId}
                documents={b.documents}
                link={{ breachIncidentId: b.id }}
                detachUrl={`${url}/evidence`}
                canWrite={canWrite && b.status !== "dismissed"}
                canDetach={canWrite && !locked}
                hint="Nothing attached yet. The intimations to the Board (Rule 7(2)) and the notice to the people affected (Rule 7(1)) belong here."
                testIdPrefix="breach"
                onChanged={load}
              />
            ),
          },
          {
            id: "actions",
            label: "Actions",
            badge: b.actions.length,
            content: (
              <section data-testid="breach-actions" className="space-y-2 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold">Remedial actions</h3>
                <p className="text-xs text-slate-600">
                  What will stop it happening again (Rule 7(2)(b)(v)). These are on the same action list as every other gap —
                  the same owners, due dates and closing rule: reviewed evidence, or a reviewer who is not the owner.
                </p>
                {b.actions.length === 0 && <p className="text-sm text-slate-600">No action yet.</p>}
                {b.actions.map((action) => (
                  <ActionEditor
                    key={action.id}
                    organizationId={organizationId}
                    gap={{ id: b.id }}
                    actionUrl={`/api/v1/organizations/${organizationId}/breaches/${b.id}/actions/${action.id}`}
                    action={action}
                    members={payload.members}
                    currentUserId={currentUserId}
                    today={todayInIndia()}
                    onChanged={load}
                  />
                ))}
                {b.status !== "dismissed" && (
                  <Can permission="breach.write">
                    <Can permission="gap.write">
                      <AddAction<BreachDetailPayload>
                        url={`/api/v1/organizations/${organizationId}/breaches/${b.id}/actions`}
                        members={payload.members}
                        onAdded={setPayload}
                        testIdPrefix="breach"
                      />
                    </Can>
                  </Can>
                )}
              </section>
            ),
          },
          {
            id: "details",
            label: "Details",
            content: <Narrative b={b} editable={editable} patch={patch} />,
          },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// The Rule 7 timeline
// ---------------------------------------------------------------------------

type Patch = (body: Record<string, unknown>) => Promise<string | null>;

function Timeline({
  b,
  clockNote,
  editable,
  patch,
  organizationId,
}: {
  b: BreachIncident;
  clockNote: string;
  editable: boolean;
  patch: Patch;
  organizationId: string;
}) {
  const clock = b.board.clock;
  // Slice 11 Stage 2a: read the accepted intimation again after an accept (D-129.1).
  const [accepted, setAccepted] = useState(0);
  return (
    <section data-testid="breach-timeline" className="space-y-3 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">Rule 7 timeline</h3>
      <Step title="Became aware" testId="step-aware">
        <p className="text-sm">{formatInIndia(b.awareAt)}</p>
        {b.occurredAt && <p className="text-xs text-slate-600">Occurred {formatInIndia(b.occurredAt)}</p>}
      </Step>

      <Step title="Board told without delay — Rule 7(2)(a)" testId="step-board-initial">
        <Fact recorded={b.board.initial && { ...b.board.initial, text: `Told ${formatInIndia(b.board.initial.at)}` }} />
        {editable && (
          <FactForm
            testId="form-board-initial"
            label={b.board.initial ? "Correct" : "Record"}
            initialAt={b.board.initial?.at}
            onSubmit={(at) => patch({ boardInitialAt: at })}
          />
        )}
      </Step>

      <Step title="Detailed report to the Board — Rule 7(2)(b)" testId="step-board-report">
        <p className="text-sm">
          Due <strong data-testid="breach-due">{formatInIndia(b.board.dueAt)}</strong>
          {b.board.extension ? ` — extended by the Board (${b.board.extension.reference})` : " — 72 hours from becoming aware"}
        </p>
        <p data-testid="breach-clock" className={`text-sm ${clock.urgency ? CLOCK_STYLE[clock.urgency] : ""}`}>
          {clock.label}
        </p>
        {b.board.report && (
          <Fact
            recorded={{
              ...b.board.report,
              text: `Report made ${formatInIndia(b.board.report.at)}${b.board.report.reference ? ` (${b.board.report.reference})` : ""}`,
            }}
          />
        )}
        {editable && (
          <FactForm
            testId="form-board-report"
            label={b.board.report ? "Correct the report" : "Record the report"}
            initialAt={b.board.report?.at}
            extra={{ name: "reference", label: "Reference (optional)", initial: b.board.report?.reference ?? "" }}
            onSubmit={(at, reference) => patch({ boardReport: { at, reference: reference || null } })}
          />
        )}
        {/* Slice 11 Stage 2a (D-129.1): the assistant drafts the text; recording the report stays the step above. */}
        <AcceptedDraft
          organizationId={organizationId}
          task="breach_intimation_draft"
          targetId={b.id}
          heading={b.incidentCode}
          reloadKey={accepted}
          testId="breach-ai-intimation"
        />
        {editable && (
          <div>
            <DraftButton
              organizationId={organizationId}
              task="breach_intimation_draft"
            body={{ breachId: b.id }}
            subject={`${b.incidentCode} — ${b.title}`}
              onAccepted={() => setAccepted((n) => n + 1)}
              testId="breach-ai-draft"
            />
          </div>
        )}
        {b.board.extension && (
          <Fact
            recorded={{
              recorded: b.board.extension.recorded,
              text: `The Board allowed until ${formatInIndia(b.board.extension.until)} (${b.board.extension.reference})`,
            }}
          />
        )}
        {editable && !b.board.report && (
          <FactForm
            testId="form-board-extension"
            label={b.board.extension ? "Correct the extension" : "Record an extension the Board allowed"}
            atLabel="Allowed until (IST)"
            initialAt={b.board.extension?.until}
            defaultAt={instantToIstInput(new Date(Date.parse(b.awareAt) + 7 * 24 * 3_600_000).toISOString())}
            extra={{ name: "reference", label: "The Board's reference — required", initial: b.board.extension?.reference ?? "", required: true }}
            onSubmit={(until, reference) => patch({ boardExtension: { until, reference } })}
          />
        )}
        <p className="text-xs text-slate-500">{clockNote}</p>
      </Step>

      <Step title="Each affected Data Principal told — Rule 7(1)" testId="step-principals">
        <Fact
          recorded={
            b.principals && {
              ...b.principals,
              text: `Told ${formatInIndia(b.principals.at)}${b.principals.method ? ` — ${b.principals.method}` : ""}`,
            }
          }
          pending={b.status === "dismissed" ? undefined : "Not yet recorded as told."}
        />
        {editable && (
          <FactForm
            testId="form-principals"
            label={b.principals ? "Correct" : "Record"}
            initialAt={b.principals?.at}
            extra={{ name: "method", label: "How they were told — required", initial: b.principals?.method ?? "", required: true }}
            onSubmit={(at, method) => patch({ principals: { at, method } })}
          />
        )}
      </Step>
    </section>
  );
}

function Step({ title, testId, children }: { title: string; testId: string; children: ReactNode }) {
  return (
    <div data-testid={testId} className="space-y-1 border-l-2 border-indigo-200 pl-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
      {children}
    </div>
  );
}

function Fact({ recorded, pending }: { recorded: ({ text: string; recorded: RecordedBy | null } | null) | undefined; pending?: string }) {
  if (!recorded) return pending ? <p className="text-sm text-red-800">{pending}</p> : null;
  return (
    <div>
      <p className="text-sm">{recorded.text}</p>
      {recorded.recorded && (
        <p className="text-xs text-slate-500">
          Recorded{recorded.recorded.byName ? ` by ${recorded.recorded.byName}` : ""} on {formatInIndia(recorded.recorded.at)}
        </p>
      )}
    </div>
  );
}

function FactForm({
  testId,
  label,
  atLabel = "When (IST)",
  initialAt,
  defaultAt,
  extra,
  onSubmit,
}: {
  testId: string;
  label: string;
  atLabel?: string;
  initialAt?: string;
  defaultAt?: string;
  extra?: { name: string; label: string; initial: string; required?: boolean };
  onSubmit: (at: string, extra: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const failed = await onSubmit(istInputToInstant(String(form.get("at"))), String(form.get("extra") ?? "").trim());
    setBusy(false);
    if (failed) return setError(failed);
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" data-testid={`${testId}-open`} onClick={() => setOpen(true)} className="mr-4 text-xs font-medium text-indigo-700 hover:underline">
        {label}
      </button>
    );
  }
  const input = "mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
  return (
    <form data-testid={testId} onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-2">
      <label className="flex flex-col text-xs text-slate-600">
        {atLabel}
        <input name="at" type="datetime-local" required defaultValue={initialAt ? instantToIstInput(initialAt) : (defaultAt ?? nowIstInput())} className={input} />
      </label>
      {extra && (
        <label className="flex flex-col text-xs text-slate-600">
          {extra.label}
          <input name="extra" required={extra.required} maxLength={500} defaultValue={extra.initial} className={`${input} w-64`} />
        </label>
      )}
      <button type="submit" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-800 disabled:opacity-50">
        {busy ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-600 hover:underline">
        Cancel
      </button>
      {error && (
        <Notice tone="error" compact className="w-full">
          {error}
        </Notice>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// The lifecycle
// ---------------------------------------------------------------------------

const MOVE_LABEL: Record<BreachStatus, string> = {
  open: "Reopen",
  contained: "Mark contained",
  closed: "Close",
  dismissed: "Dismiss — not a personal data breach",
};

function Lifecycle({ b, canWrite, patch }: { b: BreachIncident; canWrite: boolean; patch: Patch }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const [reason, setReason] = useState("");
  if (!canWrite) return null;

  async function move(status: BreachStatus, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    const failed = await patch({ status, ...extra });
    setBusy(false);
    if (failed) setError(failed);
    else setDismissing(false);
  }

  return (
    <section data-testid="breach-lifecycle" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">Status: {BREACH_STATUS_LABEL[b.status]}</h3>
      {b.status === "closed" && b.closedAt && (
        <p className="text-xs text-slate-600">
          Closed {formatInIndia(b.closedAt)}
          {b.closedByName ? ` by ${b.closedByName}` : ""}. Reopen it to change anything.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {BREACH_TRANSITIONS[b.status].map((to) =>
          to === "dismissed" ? (
            <button
              key={to}
              type="button"
              data-testid="breach-move-dismissed"
              onClick={() => setDismissing(true)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              {MOVE_LABEL[to]}
            </button>
          ) : (
            <button
              key={to}
              type="button"
              data-testid={`breach-move-${to}`}
              disabled={busy}
              onClick={() => move(to)}
              className={
                to === "closed"
                  ? "rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
                  : "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50"
              }
            >
              {MOVE_LABEL[to]}
            </button>
          ),
        )}
      </div>
      {BREACH_TRANSITIONS[b.status].includes("closed") && (
        <p className="text-xs text-slate-500">Closing needs the report to the Board and the intimation to the affected Data Principals recorded.</p>
      )}
      {dismissing && (
        <div className="space-y-2 rounded-md bg-slate-50 p-2">
          <label className="block text-xs text-slate-600">
            Why is this not a personal data breach? (required)
            <textarea
              data-testid="breach-dismiss-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={2000}
              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
            />
          </label>
          <button
            type="button"
            data-testid="breach-dismiss-confirm"
            disabled={busy || reason.trim() === ""}
            onClick={() => move("dismissed", { dismissalReason: reason.trim() })}
            className="rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <Notice tone="error" compact testId="breach-lifecycle-error">
          {error}
        </Notice>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// What happened
// ---------------------------------------------------------------------------

function Narrative({ b, editable, patch }: { b: BreachIncident; editable: boolean; patch: Patch }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const v = (k: string) => {
      const s = String(form.get(k) ?? "").trim();
      return s === "" ? null : s;
    };
    const affected = v("principalsAffected");
    setBusy(true);
    setError(null);
    const failed = await patch({
      title: v("title"),
      nature: v("nature"),
      severity: v("severity"),
      occurredAt: v("occurredAt") ? istInputToInstant(v("occurredAt")!) : null,
      location: v("location"),
      principalsAffected: affected === null ? null : Number(affected),
      dataCategories: v("dataCategories"),
      description: v("description"),
      likelyImpact: v("likelyImpact"),
      containmentMeasures: v("containmentMeasures"),
    });
    setBusy(false);
    if (failed) return setError(failed);
    setEditing(false);
  }

  const rows: [string, ReactNode][] = [
    ["Where", b.location],
    ["People affected (approx.)", b.principalsAffected?.toLocaleString("en-IN") ?? null],
    ["Personal data involved", b.dataCategories],
    ["What happened", b.description],
    ["Likely impact", b.likelyImpact],
    ["Containment", b.containmentMeasures],
    ["Recorded by", b.createdByName ? `${b.createdByName}, ${formatInIndia(b.createdAt)}` : formatInIndia(b.createdAt)],
  ];
  const input = "mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";

  return (
    <section data-testid="breach-narrative" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">What happened</h3>
        {editable && !editing && (
          <button type="button" data-testid="breach-edit" onClick={() => setEditing(true)} className="text-xs font-medium text-indigo-700 hover:underline">
            Edit
          </button>
        )}
      </div>
      {!editing ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="whitespace-pre-wrap">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <form onSubmit={submit} data-testid="breach-edit-form" className="space-y-3">
          <label className="block text-sm">
            Short title
            <input name="title" required maxLength={200} defaultValue={b.title} className={input} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Nature
              <select name="nature" defaultValue={b.nature} className={input}>
                {BREACH_NATURES.map((n) => (
                  <option key={n} value={n}>
                    {BREACH_NATURE_LABEL[n]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Severity
              <select name="severity" defaultValue={b.severity} className={input}>
                {BREACH_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {GAP_SEVERITY_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Occurred, if known (IST)
              <input name="occurredAt" type="datetime-local" defaultValue={b.occurredAt ? instantToIstInput(b.occurredAt) : ""} className={input} />
            </label>
            <label className="block text-sm">
              People affected (approx.)
              <input name="principalsAffected" type="number" min={0} defaultValue={b.principalsAffected ?? ""} className={input} />
            </label>
          </div>
          <label className="block text-sm">
            Where
            <input name="location" maxLength={500} defaultValue={b.location ?? ""} className={input} />
          </label>
          <label className="block text-sm">
            Personal data involved
            <input name="dataCategories" maxLength={2000} defaultValue={b.dataCategories ?? ""} className={input} />
          </label>
          <label className="block text-sm">
            What happened
            <textarea name="description" rows={3} maxLength={4000} defaultValue={b.description ?? ""} className={input} />
          </label>
          <label className="block text-sm">
            Likely impact
            <textarea name="likelyImpact" rows={2} maxLength={4000} defaultValue={b.likelyImpact ?? ""} className={input} />
          </label>
          <label className="block text-sm">
            Containment
            <textarea name="containmentMeasures" rows={2} maxLength={4000} defaultValue={b.containmentMeasures ?? ""} className={input} />
          </label>
          {error && (
            <Notice tone="error" compact>
              {error}
            </Notice>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-slate-600 hover:underline">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
