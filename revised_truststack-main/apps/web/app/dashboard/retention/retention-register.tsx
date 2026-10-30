"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ERASURE_STANDING_LABEL, formatRetentionPeriod, RETENTION_DEEMED_NOTE } from "@truststack/core";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { Can, usePermissions } from "@/lib/client/permissions";
import { RETENTION_STATE_STYLE, type RetentionDetailPayload, type RetentionRegisterPayload } from "@/lib/client/retention";
import type { RopaRegisterPayload } from "@/lib/client/ropa";
import { formatDay } from "@/lib/client/rights";
import { ScheduleFields, scheduleBody } from "./schedule-fields";

/**
 * The retention register (Slice 10, Stage 5): for each processing activity,
 * what ends the retention, for how long, the end date the database derived,
 * and whether the erasure is recorded (s.8(7), Rule 8). Nothing here decides
 * anything — it shows what was recorded and where each schedule stands today.
 */
export function RetentionRegister() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [payload, setPayload] = useState<RetentionRegisterPayload | null>(null);
  const [records, setRecords] = useState<{ id: string; recordCode: string; name: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState("");

  const load = useCallback(() => {
    if (!organizationId) return;
    apiFetch<RetentionRegisterPayload>(`/api/v1/organizations/${organizationId}/retention-schedules`).then((r) => {
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
  }, [organizationId]);

  useEffect(() => {
    load();
    if (!organizationId) return;
    apiFetch<RopaRegisterPayload>(`/api/v1/organizations/${organizationId}/ropa`).then((r) => {
      if (r.success) setRecords(r.data.records.filter((x) => x.status !== "archived").map((x) => ({ id: x.id, recordCode: x.recordCode, name: x.name })));
    });
  }, [organizationId, load]);

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="retention-error">
        {error}
      </Notice>
    );
  }
  if (!payload || !organizationId) return <p className="text-sm text-slate-500">Loading the register…</p>;
  const { counts } = payload;
  const scheduled = new Set(payload.schedules.map((s) => s.ropaRecordId));
  const unscheduled = (records ?? []).filter((r) => !scheduled.has(r.id));
  const schedules = payload.schedules.filter((s) => state === "" || s.clock.state === state);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          How long each processing activity&apos;s personal data is kept, when it ends, and the record that it was erased —
          by the organisation and by its processors (section 8(7)).
        </p>
      </div>

      <section data-testid="retention-summary" className="rounded-xl border border-slate-200 p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <Stat label="Schedules" value={counts.total} testId="retention-count-total" />
          <Stat label="Erasure overdue" value={counts.overdue} testId="retention-count-overdue" alert={counts.overdue > 0} />
          <Stat label="Ending in 30 days" value={counts.endingSoon} testId="retention-count-ending-soon" />
          <Stat label="No end recorded" value={counts.noEnd} testId="retention-count-no-end" />
          <Stat label="Erased" value={counts.erased} testId="retention-count-erased" />
        </dl>
        <p data-testid="retention-note" className="mt-3 text-xs text-slate-500">
          {payload.note}
        </p>
        {payload.thirdSchedule && (
          <Notice tone="warning" compact testId="retention-third-schedule" className="mt-2">
            Recorded as a Third-Schedule class: {payload.thirdSchedule.label}. Rule 8(1)&apos;s three-year period and Rule 8(2)&apos;s
            48-hour notice apply.
            <span data-testid="retention-deemed-note" className="mt-1 block">
              {RETENTION_DEEMED_NOTE}
            </span>
          </Notice>
        )}
      </section>

      <Can permission="retention.write">
        <AddSchedule
          organizationId={organizationId}
          records={unscheduled}
          loading={records === null}
          thirdSchedule={payload.thirdSchedule !== null}
          today={payload.today}
          onAdded={load}
        />
      </Can>

      {payload.schedules.length === 0 ? (
        <p data-testid="retention-empty" className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-700">
          No retention schedule is recorded. Add one for each processing activity in the register: what ends the retention,
          how long the data is kept (at least a year — Rule 8(3)), and when the clock started.
        </p>
      ) : (
        <section className="space-y-3">
          <label className="flex w-56 flex-col text-xs text-slate-600">
            Show
            <select data-testid="retention-filter-state" value={state} onChange={(e) => setState(e.target.value)} className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900">
              <option value="">Every schedule</option>
              <option value="overdue">Erasure overdue</option>
              <option value="running">Retained</option>
              <option value="no_end">No end recorded</option>
              <option value="erased">Erased</option>
            </select>
          </label>
          <DataTable
            testId="retention-list"
            rows={schedules}
            rowKey={(s) => s.id}
            rowTestId={(s) => `retention-${s.record?.recordCode ?? s.id}`}
            noun="schedules"
            search={{
              label: "Search schedules",
              placeholder: "Search by record code or name",
              text: (s) => `${s.record?.recordCode ?? ""} ${s.record?.name ?? ""} ${s.basisLabel}`,
            }}
            columns={[
              {
                key: "record",
                header: "Processing activity",
                sortValue: (s) => s.record?.recordCode ?? null,
                cell: (s) => (
                  <>
                    <span className="font-mono text-xs font-semibold text-slate-800">{s.record?.recordCode ?? "—"}</span>
                    <Link href={`/dashboard/retention/${s.id}`} className="block font-medium text-indigo-800 hover:underline">
                      {s.record?.name ?? "A processing activity"}
                    </Link>
                    <span className="text-xs text-slate-600">
                      {s.basisLabel} · {s.provision}
                    </span>
                  </>
                ),
              },
              {
                key: "state",
                header: "Where it stands",
                sortValue: (s) => s.clock.label,
                cell: (s) => (
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span data-testid={`retention-state-${s.record?.recordCode ?? s.id}`} className={`rounded-full px-2 py-0.5 font-medium ${RETENTION_STATE_STYLE[s.clock.state]}`}>
                      {s.clock.label}
                    </span>
                    {s.erasureIncomplete && (
                      <span data-testid={`retention-incomplete-${s.record?.recordCode ?? s.id}`} className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-900 ring-1 ring-red-200">
                        {ERASURE_STANDING_LABEL.incomplete}
                      </span>
                    )}
                    {s.clock.endingSoon && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900">Ends within 30 days</span>}
                  </div>
                ),
              },
              { key: "period", header: "Kept for", className: "text-xs whitespace-nowrap", sortValue: (s) => s.periodMonths, cell: (s) => formatRetentionPeriod(s.periodMonths) },
              { key: "start", header: "Clock started", className: "text-xs whitespace-nowrap", sortValue: (s) => s.startsOn, cell: (s) => (s.startsOn ? formatDay(s.startsOn) : "Not yet") },
              { key: "ends", header: "Ends", className: "text-xs whitespace-nowrap", sortValue: (s) => s.endsOn, cell: (s) => (s.endsOn ? formatDay(s.endsOn) : "No end recorded") },
              {
                key: "erased",
                header: "Last erasure",
                className: "text-xs whitespace-nowrap",
                sortValue: (s) => s.lastErasedOn,
                cell: (s) => (s.lastErasedOn ? formatDay(s.lastErasedOn) : "None recorded"),
              },
            ]}
          />
        </section>
      )}
    </div>
  );
}

function AddSchedule({
  organizationId,
  records,
  loading,
  thirdSchedule,
  today,
  onAdded,
}: {
  organizationId: string;
  records: { id: string; recordCode: string; name: string }[];
  loading: boolean;
  thirdSchedule: boolean;
  today: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const r = await apiFetch<RetentionDetailPayload>(`/api/v1/organizations/${organizationId}/retention-schedules`, {
      method: "POST",
      body: JSON.stringify({ ropaRecordId: String(form.get("ropaRecordId")), ...scheduleBody(form) }),
    });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button type="button" data-testid="retention-add" onClick={() => setOpen(true)} className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800">
        Add a retention schedule
      </button>
    );
  }
  if (!loading && records.length === 0) {
    return (
      <p data-testid="retention-add-none" className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        Every processing activity in the register already has a schedule. Add the activity to the processing register first.{" "}
        <button type="button" onClick={() => setOpen(false)} className="text-indigo-700 hover:underline">
          Close
        </button>
      </p>
    );
  }
  const input = "mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
  return (
    <form data-testid="retention-add-form" onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label className="flex flex-col text-xs text-slate-600">
        Processing activity
        <select name="ropaRecordId" data-testid="retention-record" required className={`${input} w-80`}>
          {records.map((r) => (
            <option key={r.id} value={r.id}>
              {r.recordCode} — {r.name}
            </option>
          ))}
        </select>
      </label>
      <ScheduleFields thirdSchedule={thirdSchedule} today={today} />
      <button type="submit" data-testid="retention-add-save" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-sm font-medium text-white disabled:opacity-50">
        {busy ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-600 hover:underline">
        Cancel
      </button>
      {error && (
        <Notice tone="error" compact testId="retention-add-error" className="w-full">
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
