"use client";

import { BREACH_STATUS_LABEL, BREACH_STATUSES, formatInIndia, GAP_SEVERITY_LABEL } from "@truststack/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { CLOCK_STYLE, STATUS_STYLE, type BreachRegisterPayload } from "@/lib/client/breaches";
import { SEVERITY_STYLE } from "@/lib/client/gaps";
import { Can, usePermissions } from "@/lib/client/permissions";

/**
 * The breach register (Slice 10, Stage 1): every personal data breach the
 * organisation has recorded, with where its Rule 7 timeline stands.
 *
 * The due time of the Board report is the database's (aware + 72 hours, or the
 * time the Board allowed); the clock is core's, read at the instant the API
 * returned. Nothing here decides anything — it shows what was recorded.
 */
export function BreachRegister() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [payload, setPayload] = useState<BreachRegisterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!organizationId) return;
    apiFetch<BreachRegisterPayload>(`/api/v1/organizations/${organizationId}/breaches`).then((r) => {
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
  }, [organizationId]);

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="breaches-error">
        {error}
      </Notice>
    );
  }
  if (!payload) return <p className="text-sm text-slate-500">Loading the register…</p>;
  const { counts } = payload;
  const incidents = payload.incidents.filter((b) => status === "" || b.status === status);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Every personal data breach the organisation has become aware of, and where its intimations stand: to each
          affected Data Principal without delay (Rule 7(1)), and to the Data Protection Board — without delay, then the
          detailed report within seventy-two hours (Rule 7(2)).
        </p>
      </div>

      <section data-testid="breach-summary" className="rounded-xl border border-slate-200 p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <Stat label="Recorded" value={counts.total} testId="breach-count-total" />
          <Stat label="Open or contained" value={counts.active} testId="breach-count-active" />
          <Stat label="Board report due — inside the window" value={counts.insideWindow} testId="breach-count-inside-window" />
          <Stat label="Board report overdue" value={counts.overdue} testId="breach-count-overdue" alert={counts.overdue > 0} />
          <Stat label="People not yet told" value={counts.principalsPending} testId="breach-count-principals-pending" alert={counts.principalsPending > 0} />
        </dl>
        <p data-testid="breach-clock-note" className="mt-3 text-xs text-slate-500">
          {payload.clockNote}
        </p>
        <Can permission="breach.write">
          <div className="mt-3">
            <Link href="/dashboard/breaches/new" data-testid="breach-new" className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800">
              Record a breach
            </Link>
          </div>
        </Can>
      </section>

      {payload.incidents.length === 0 ? (
        <p data-testid="breaches-empty" className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-700">
          No breach is recorded. When the organisation becomes aware of one, record it here straight away: the
          seventy-two hours for the detailed report to the Board run from that moment.
        </p>
      ) : (
        <section className="space-y-3">
          <label className="flex w-48 flex-col text-xs text-slate-600">
            Status
            <select
              data-testid="breaches-filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
            >
              <option value="">All</option>
              {BREACH_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BREACH_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <DataTable
            testId="breach-list"
            rows={incidents}
            rowKey={(b) => b.id}
            rowTestId={(b) => `breach-${b.incidentCode}`}
            noun="breaches"
            search={{ label: "Search breaches", placeholder: "Search by code, title or nature", text: (b) => `${b.incidentCode} ${b.title} ${b.natureLabel}` }}
            columns={[
              {
                key: "breach",
                header: "Breach",
                sortValue: (b) => b.incidentCode,
                cell: (b) => (
                  <>
                    <span className="font-mono text-xs font-semibold text-slate-800">{b.incidentCode}</span>
                    <Link href={`/dashboard/breaches/${b.id}`} className="block font-medium text-indigo-800 hover:underline">
                      {b.title}
                    </Link>
                    <span className="text-xs text-slate-600">{b.natureLabel}</span>
                  </>
                ),
              },
              {
                key: "status",
                header: "Status",
                sortValue: (b) => b.statusLabel,
                cell: (b) => (
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLE[b.status]}`}>{b.statusLabel}</span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${SEVERITY_STYLE[b.severity] ?? ""}`}>{GAP_SEVERITY_LABEL[b.severity]}</span>
                  </div>
                ),
              },
              { key: "aware", header: "Became aware", className: "text-xs", sortValue: (b) => b.awareAt, cell: (b) => formatInIndia(b.awareAt) },
              {
                key: "board",
                header: "Detailed report to the Board",
                className: "text-xs",
                cellTestId: (b) => `breach-clock-${b.incidentCode}`,
                cell: (b) => <span className={b.board.clock.urgency ? CLOCK_STYLE[b.board.clock.urgency] : undefined}>{b.board.clock.label}</span>,
              },
              {
                key: "principals",
                header: "Affected Data Principals",
                className: "text-xs",
                cellTestId: (b) => `breach-principals-${b.incidentCode}`,
                cell: (b) =>
                  b.status === "dismissed" ? "—" : b.principals ? `Told ${formatInIndia(b.principals.at)}` : "Not yet recorded as told",
              },
            ]}
          />
        </section>
      )}
    </div>
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
