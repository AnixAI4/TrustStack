"use client";

import {
  ERASURE_METHOD_LABEL,
  ERASURE_METHODS,
  ERASURE_STANDING_LABEL,
  ERASURE_VOID_REASON_LIMIT,
  formatRetentionPeriod,
  PROCESSOR_ERASURE_ANSWERS,
  PROCESSOR_ERASURE_LABEL,
  RETENTION_DEEMED_NOTE,
} from "@truststack/core";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Notice } from "@/components/feedback/notice";
import { Tabs } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/client/api";
import { todayInIndia } from "@/lib/client/gaps";
import { Can, usePermissions } from "@/lib/client/permissions";
import { RETENTION_STATE_STYLE, type RetentionDetailPayload, type RetentionSchedule } from "@/lib/client/retention";
import { formatDay } from "@/lib/client/rights";
import { AddAction } from "../../add-action";
import { ActionEditor } from "../../assessments/[assessmentId]/gaps/action-editor";
import { RegisterDocuments } from "../../register-documents";
import { ScheduleFields, scheduleBody } from "../schedule-fields";

/**
 * One retention schedule (Slice 10, Stage 5): what ends the retention, the end
 * date the database derived, the erasures recorded (never changed — one
 * recorded wrongly is marked "recorded in error" by someone else, D-096), the
 * erasure certificate, and the actions an overdue erasure needs — on the one
 * action list, closing on an erasure that counts, recorded by someone other
 * than the owner (D-095, D-096).
 */
export function ScheduleDetail({ scheduleId }: { scheduleId: string }) {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canWrite = permissions.kind === "ready" && permissions.value.permissions.includes("retention.write");
  const [payload, setPayload] = useState<RetentionDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const url = organizationId ? `/api/v1/organizations/${organizationId}/retention-schedules/${scheduleId}` : null;
  const load = useCallback(() => {
    if (!url) return Promise.resolve();
    return apiFetch<RetentionDetailPayload>(url).then((r) => {
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

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="retention-error">
        {error}
      </Notice>
    );
  }
  if (!payload || !organizationId || !url) return <p className="text-sm text-slate-500">Loading the schedule…</p>;
  const s = payload.schedule;

  return (
    <div className="space-y-6" data-testid="retention-detail" data-state={s.clock.state}>
      <div>
        <Link href="/dashboard/retention" className="text-xs text-indigo-700 hover:underline">
          ← Back to the register
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono font-semibold text-slate-800">{s.record?.recordCode ?? "—"}</span>
          <span data-testid="retention-state" className={`rounded-full px-2 py-0.5 font-medium ${RETENTION_STATE_STYLE[s.clock.state]}`}>
            {s.clock.label}
          </span>
          {s.erasureIncomplete && (
            <span data-testid="retention-incomplete" className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-900 ring-1 ring-red-200">
              {ERASURE_STANDING_LABEL.incomplete}
            </span>
          )}
          <span className="text-slate-600">
            {s.basisLabel} · {s.provision}
          </span>
        </div>
        <h2 className="mt-1 text-lg font-semibold">{s.record?.name ?? "A processing activity"}</h2>
        {s.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{s.notes}</p>}
      </div>

      <Tabs
        label="Retention schedule"
        tabs={[
          {
            id: "erasure",
            label: "Erasure",
            attention: s.clock.state === "overdue",
            badge: s.clock.state === "overdue" ? "Overdue" : undefined,
            content: (
              <>
                <Clock s={s} note={payload.note} />
                <Erasures s={s} url={url} canWrite={canWrite} currentUserId={currentUserId} today={payload.today} onSaved={setPayload} />
              </>
            ),
          },
          {
            id: "documents",
            label: "Documents",
            badge: s.documents.length,
            content: (
              <RegisterDocuments
                organizationId={organizationId}
                documents={s.documents}
                link={{ retentionScheduleId: s.id }}
                detachUrl={`${url}/evidence`}
                canWrite={canWrite}
                hint="Nothing attached yet. An erasure certificate, or a processor's confirmation that it erased the data, is good evidence here."
                testIdPrefix="retention"
                onChanged={load}
              />
            ),
          },
          {
            id: "actions",
            label: "Actions",
            badge: s.actions.length,
            content: (
              <section data-testid="retention-actions" className="space-y-2 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold">Actions</h3>
                <p className="text-xs text-slate-600">
                  The work an overdue erasure needs — finding every copy, erasing it, telling the processors. These are on the same
                  action list as every other gap. An action here closes on reviewed evidence, on a complete erasure recorded above
                  (the processors told, not marked in error) by someone other than its owner, or on a reviewer who is not its owner.
                </p>
                {s.actions.length === 0 && <p className="text-sm text-slate-600">No action yet.</p>}
                {s.actions.map((action) => (
                  <ActionEditor
                    key={action.id}
                    organizationId={organizationId}
                    gap={{ id: s.id }}
                    actionUrl={`${url}/actions/${action.id}`}
                    action={action}
                    members={payload.members}
                    currentUserId={currentUserId}
                    today={todayInIndia()}
                    onChanged={load}
                  />
                ))}
                <Can permission="retention.write">
                  <Can permission="gap.write">
                    <AddAction<RetentionDetailPayload> url={`${url}/actions`} members={payload.members} onAdded={setPayload} testIdPrefix="retention" />
                  </Can>
                </Can>
              </section>
            ),
          },
          {
            id: "schedule",
            label: "Schedule",
            hidden: !canWrite,
            content: <Edit s={s} url={url} canWrite={canWrite} thirdSchedule={payload.thirdSchedule !== null} today={payload.today} onSaved={setPayload} />,
          },
        ]}
      />
    </div>
  );
}

function Clock({ s, note }: { s: RetentionSchedule; note: string }) {
  return (
    <section data-testid="retention-clock" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">When the data must go</h3>
      <dl className="grid gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-500">{s.startLabel}</dt>
          <dd>{s.startsOn ? formatDay(s.startsOn) : "Not yet recorded"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Kept for</dt>
          <dd>
            {formatRetentionPeriod(s.periodMonths)}{s.lawName ? ` — ${s.lawName}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">End date (worked out from the start and the period)</dt>
          <dd data-testid="retention-ends-on">{s.endsOn ? formatDay(s.endsOn) : "No end recorded"}</dd>
        </div>
        {s.informBy && (
          <div>
            <dt className="text-xs text-slate-500">Tell the Data Principals by (Rule 8(2))</dt>
            <dd data-testid="retention-inform-by">{formatDay(s.informBy)}</dd>
          </div>
        )}
      </dl>
      {s.clock.state === "overdue" && (
        <Notice tone="error" compact testId="retention-overdue">
          {s.erasureIncomplete
            ? "The end date has passed and the erasure recorded is incomplete: the processors that held the data have not been told to erase it (s.8(7)(b)). Tell them, then record the erasure again with the processors told."
            : "The end date has passed and no erasure is recorded. Erase the data — and have every processor that holds it erase it (s.8(7)(b)) — then record it below."}
        </Notice>
      )}
      {s.clock.state === "no_end" && (
        <Notice tone="warning" compact>
          No end is recorded yet, so the register cannot show when this data will be erased.{" "}
          {s.basis === "deemed_inactivity"
            ? "Record the day the Data Principals last approached the organisation."
            : "Record the last day this data was processed, once the processing stops."}
        </Notice>
      )}
      {s.basis === "deemed_inactivity" && (
        <p data-testid="retention-deemed-note" className="text-xs text-amber-900">
          {RETENTION_DEEMED_NOTE}
        </p>
      )}
      <p className="text-xs text-slate-500">{note}</p>
    </section>
  );
}

function Edit({
  s,
  url,
  canWrite,
  thirdSchedule,
  today,
  onSaved,
}: {
  s: RetentionSchedule;
  url: string;
  canWrite: boolean;
  thirdSchedule: boolean;
  today: string;
  onSaved: (p: RetentionDetailPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!canWrite) return null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await apiFetch<RetentionDetailPayload>(url, { method: "PATCH", body: JSON.stringify(scheduleBody(new FormData(e.currentTarget))) });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    onSaved(r.data);
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" data-testid="retention-edit" onClick={() => setOpen(true)} className="text-sm font-medium text-indigo-700 hover:underline">
        Change the schedule
      </button>
    );
  }
  return (
    <form data-testid="retention-edit-form" onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <ScheduleFields initial={s} thirdSchedule={thirdSchedule} today={today} />
      <button type="submit" data-testid="retention-edit-save" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-sm font-medium text-white disabled:opacity-50">
        {busy ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-600 hover:underline">
        Cancel
      </button>
      {error && (
        <Notice tone="error" compact testId="retention-edit-error" className="w-full">
          {error}
        </Notice>
      )}
    </form>
  );
}

function Erasures({
  s,
  url,
  canWrite,
  currentUserId,
  today,
  onSaved,
}: {
  s: RetentionSchedule;
  url: string;
  canWrite: boolean;
  currentUserId: string | null;
  today: string;
  onSaved: (p: RetentionDetailPayload) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState("deleted");
  const deemed = s.basis === "deemed_inactivity";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = e.currentTarget;
    const form = new FormData(el);
    setBusy(true);
    setError(null);
    const note = String(form.get("methodNote") ?? "").trim();
    const r = await apiFetch<RetentionDetailPayload>(`${url}/erasures`, {
      method: "POST",
      body: JSON.stringify({
        erasedOn: String(form.get("erasedOn")),
        method,
        methodNote: note || null,
        processorsTold: String(form.get("processorsTold")),
        principalsInformedOn: deemed ? String(form.get("principalsInformedOn") ?? "") || null : null,
      }),
    });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    onSaved(r.data);
    el.reset();
    setMethod("deleted");
  }

  const input = "mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
  return (
    <section data-testid="retention-erasures" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">Erasures</h3>
      <p className="text-xs text-slate-600">
        An erasure is recorded once and never changed. One recorded wrongly is marked &ldquo;recorded in error&rdquo; by someone other
        than the person who recorded it — it stays here, struck through, and no longer counts. An erasure counts only when every
        processor that held the data was told to erase it, or none held it (s.8(7)(b)).
      </p>
      {s.erasures.length === 0 ? (
        <p className="text-sm text-slate-600">No erasure recorded.</p>
      ) : (
        <ul className="space-y-2">
          {s.erasures.map((x) => (
            <li
              key={x.id}
              data-testid={`retention-erasure-${x.id}`}
              data-standing={x.standing}
              className={`rounded-md border p-2 text-sm ${x.standing === "voided" ? "border-slate-200 bg-slate-50 text-slate-500" : x.standing === "incomplete" ? "border-red-200 bg-white" : "border-slate-200 bg-white"}`}
            >
              <span className={x.standing === "voided" ? "line-through" : ""}>
                <strong>{formatDay(x.erasedOn)}</strong> — {x.methodLabel}
                {x.methodNote ? ` (${x.methodNote})` : ""}. Processors: {x.processorsToldLabel.toLowerCase()}.
                {x.principalsInformedOn && ` Data Principals told on ${formatDay(x.principalsInformedOn)}.`}
              </span>
              {x.standing !== "counts" && (
                <span
                  data-testid={`retention-erasure-standing-${x.id}`}
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${x.standing === "voided" ? "bg-slate-200 text-slate-700" : "bg-red-50 text-red-900"}`}
                >
                  {x.standingLabel}
                </span>
              )}
              <span className="block text-xs text-slate-500">
                Recorded by {x.recorded.byName ?? "a former member"} on {formatDay(x.recorded.at.slice(0, 10))}
              </span>
              {x.void && (
                <span data-testid={`retention-erasure-void-${x.id}`} className="block text-xs text-slate-600">
                  Marked as recorded in error by {x.void.byName ?? "a former member"} on {formatDay(x.void.at.slice(0, 10))}: {x.void.reason}
                </span>
              )}
              {canWrite && x.void === null && (
                <VoidErasure erasureId={x.id} url={url} ownRecord={currentUserId !== null && x.recorded.byUserId === currentUserId} onSaved={onSaved} />
              )}
            </li>
          ))}
        </ul>
      )}
      {canWrite && (
        <form data-testid="retention-erasure-form" onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-md bg-slate-50 p-2">
          <label className="flex flex-col text-xs text-slate-600">
            Erased on
            <input name="erasedOn" data-testid="retention-erased-on" type="date" required max={today} className={input} />
          </label>
          <label className="flex flex-col text-xs text-slate-600">
            How
            <select data-testid="retention-erasure-method" value={method} onChange={(e) => setMethod(e.target.value)} className={input}>
              {ERASURE_METHODS.map((m) => (
                <option key={m} value={m}>
                  {ERASURE_METHOD_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
          {method === "other" && (
            <label className="flex flex-col text-xs text-slate-600">
              Say how
              <input name="methodNote" data-testid="retention-method-note" required maxLength={500} className={`${input} w-56`} />
              <span className="mt-0.5 text-[11px] text-slate-500">Describe the method only — never type the erased personal data here.</span>
            </label>
          )}
          <label className="flex flex-col text-xs text-slate-600">
            Processors told to erase it (s.8(7)(b))
            <select name="processorsTold" data-testid="retention-processors-told" className={input} defaultValue="yes">
              {PROCESSOR_ERASURE_ANSWERS.map((a) => (
                <option key={a} value={a}>
                  {PROCESSOR_ERASURE_LABEL[a]}
                </option>
              ))}
            </select>
          </label>
          {deemed && (
            <label className="flex flex-col text-xs text-slate-600">
              Data Principals told on (Rule 8(2))
              <input name="principalsInformedOn" data-testid="retention-informed-on" type="date" required max={today} className={input} />
            </label>
          )}
          <button type="submit" data-testid="retention-erasure-save" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-sm font-medium text-white disabled:opacity-50">
            {busy ? "Recording…" : "Record the erasure"}
          </button>
          {error && (
            <Notice tone="error" compact testId="retention-erasure-error" className="w-full">
              {error}
            </Notice>
          )}
        </form>
      )}
    </section>
  );
}

/**
 * "Recorded in error" (D-096, R4): someone other than the person who recorded
 * the erasure marks it, with a reason. The erasure stays, struck through.
 */
function VoidErasure({
  erasureId,
  url,
  ownRecord,
  onSaved,
}: {
  erasureId: string;
  url: string;
  ownRecord: boolean;
  onSaved: (p: RetentionDetailPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (ownRecord) {
    return <span className="block text-xs text-slate-500">You recorded this erasure: if it is wrong, someone else marks it as recorded in error.</span>;
  }
  if (!open) {
    return (
      <button type="button" data-testid={`retention-void-${erasureId}`} onClick={() => setOpen(true)} className="mt-1 text-xs font-medium text-indigo-700 hover:underline">
        Mark as recorded in error
      </button>
    );
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const reason = String(new FormData(e.currentTarget).get("reason") ?? "").trim();
    setBusy(true);
    setError(null);
    const r = await apiFetch<RetentionDetailPayload>(`${url}/erasures/${erasureId}/void`, { method: "POST", body: JSON.stringify({ reason }) });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    onSaved(r.data);
  }

  const input = "mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
  return (
    <form data-testid={`retention-void-form-${erasureId}`} onSubmit={submit} className="mt-2 flex flex-wrap items-end gap-2">
      <label className="flex flex-col text-xs text-slate-600">
        Why it was recorded in error
        <input name="reason" data-testid={`retention-void-reason-${erasureId}`} required maxLength={ERASURE_VOID_REASON_LIMIT} className={`${input} w-80`} />
        <span className="mt-0.5 text-[11px] text-slate-500">Never type the erased personal data here.</span>
      </label>
      <button type="submit" data-testid={`retention-void-save-${erasureId}`} disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">
        {busy ? "Saving…" : "Mark as recorded in error"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-600 hover:underline">
        Cancel
      </button>
      {error && (
        <Notice tone="error" compact testId={`retention-void-error-${erasureId}`} className="w-full">
          {error}
        </Notice>
      )}
    </form>
  );
}
