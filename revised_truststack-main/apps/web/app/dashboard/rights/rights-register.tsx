"use client";

import { RIGHTS_STATUS_LABEL, RIGHTS_STATUSES, rightsStatusText } from "@truststack/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { Can, usePermissions } from "@/lib/client/permissions";
import { formatDay, RIGHTS_CLOCK_STYLE, RIGHTS_STATUS_STYLE, type RightsRegisterPayload } from "@/lib/client/rights";

/**
 * The rights and grievance register (Slice 10, Stage 2): every request a Data
 * Principal made to exercise a right (s.11, s.12, s.14) and every grievance
 * (s.13), with where its response stands against the Rules' ninety days.
 *
 * Staff record what arrived by email, letter, phone or in person; the public
 * forms come in Stage 3. The respond-by date is the database's (receipt + 90
 * days); the clock is core's, read on the day in India the API answered.
 * Nothing here decides anything — it shows what was recorded.
 */
export function RightsRegister() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [payload, setPayload] = useState<RightsRegisterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [family, setFamily] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!organizationId) return;
    apiFetch<RightsRegisterPayload>(`/api/v1/organizations/${organizationId}/rights-requests`).then((r) => {
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
  }, [organizationId]);

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="rights-error">
        {error}
      </Notice>
    );
  }
  if (!payload) return <p className="text-sm text-slate-500">Loading the register…</p>;
  const { counts } = payload;
  const requests = payload.requests.filter((r) => (family === "" || r.family === family) && (status === "" || r.status === status));
  const select = "mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Every request a Data Principal has made to access, correct, complete, update or erase their personal data or to
          nominate someone (sections 11, 12 and 14), and every grievance (section 13) — with where the response stands. The
          Rules allow a reasonable period not exceeding ninety days from receipt (Rule 14(3)).
        </p>
      </div>

      <section data-testid="rights-summary" className="rounded-xl border border-slate-200 p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <Stat label="Open requests" value={counts.openRequests} testId="rights-count-open-requests" />
          <Stat label="Open grievances" value={counts.openGrievances} testId="rights-count-open-grievances" />
          <Stat label="Past TrustStack's 30-day target" value={counts.pastTarget} testId="rights-count-past-target" alert={counts.pastTarget > 0} />
          <Stat label="Open past the 90 days" value={counts.overdue} testId="rights-count-overdue" alert={counts.overdue > 0} />
          <Stat label="Responded after the 90 days" value={counts.respondedLate} testId="rights-count-responded-late" alert={counts.respondedLate > 0} />
        </dl>
        <p data-testid="rights-clock-note" className="mt-3 text-xs text-slate-500">
          {payload.clockNote}
        </p>
        <Can permission="rights.write">
          <div className="mt-3">
            <Link href="/dashboard/rights/new" data-testid="rights-new" className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800">
              Record a request or grievance
            </Link>
          </div>
        </Can>
      </section>

      {payload.requests.length === 0 ? (
        <p data-testid="rights-empty" className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-700">
          No request or grievance is recorded. When a Data Principal writes, calls or visits to exercise a right or to
          complain, record it here on the day it arrives: the ninety days run from the date of receipt.
        </p>
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <label className="flex w-48 flex-col text-xs text-slate-600">
              Show
              <select data-testid="rights-filter-family" value={family} onChange={(e) => setFamily(e.target.value)} className={select}>
                <option value="">Requests and grievances</option>
                <option value="request">Requests only</option>
                <option value="grievance">Grievances only</option>
              </select>
            </label>
            <label className="flex w-48 flex-col text-xs text-slate-600">
              Status
              <select data-testid="rights-filter-status" value={status} onChange={(e) => setStatus(e.target.value)} className={select}>
                <option value="">All</option>
                {RIGHTS_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {RIGHTS_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DataTable
            testId="rights-list"
            rows={requests}
            rowKey={(r) => r.id}
            rowTestId={(r) => `rights-${r.requestCode}`}
            noun="requests"
            search={{
              label: "Search requests and grievances",
              placeholder: "Search by code, name or summary",
              text: (r) => `${r.requestCode} ${r.requester.name} ${r.summary} ${r.kindLabel}`,
            }}
            columns={[
              {
                key: "request",
                header: "Request",
                sortValue: (r) => r.requestCode,
                cell: (r) => (
                  <>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-slate-800">{r.requestCode}</span>
                      <span className="text-slate-600">
                        {r.kindLabel} · {r.provision}
                      </span>
                      {r.channel === "web_form" && (
                        <span data-testid={`rights-web-form-${r.requestCode}`} className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-800">
                          {r.channelLabel}
                        </span>
                      )}
                    </div>
                    <Link href={`/dashboard/rights/${r.id}`} className="mt-0.5 block font-medium text-indigo-800 hover:underline">
                      {r.summary.length > 140 ? `${r.summary.slice(0, 140)}…` : r.summary}
                    </Link>
                  </>
                ),
              },
              {
                key: "status",
                header: "Status",
                // Slice 10.5 B3 (F3.11): the filter's word first, then the outcome — as the record says it.
                sortValue: (r) => rightsStatusText(r.statusLabel, r.response?.outcomeLabel),
                cellTestId: (r) => `rights-status-${r.requestCode}`,
                cell: (r) => (
                  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${RIGHTS_STATUS_STYLE[r.status]}`}>
                    {rightsStatusText(r.statusLabel, r.response?.outcomeLabel)}
                  </span>
                ),
              },
              {
                key: "from",
                header: "From",
                className: "text-xs",
                sortValue: (r) => r.requester.name,
                cell: (r) => (
                  <>
                    {r.requester.name}
                    {r.requester.capacity !== "self" ? ` (${r.requester.capacityLabel.toLowerCase()})` : ""}
                  </>
                ),
              },
              { key: "received", header: "Received", className: "text-xs whitespace-nowrap", sortValue: (r) => r.receivedOn, cell: (r) => formatDay(r.receivedOn) },
              {
                key: "response",
                header: "Response",
                className: "text-xs",
                cellTestId: (r) => `rights-clock-${r.requestCode}`,
                cell: (r) => <span className={RIGHTS_CLOCK_STYLE[r.clock.state]}>{r.clock.label}</span>,
              },
              { key: "owner", header: "Owner", className: "text-xs", sortValue: (r) => r.ownerName, cell: (r) => r.ownerName ?? "Unassigned" },
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
