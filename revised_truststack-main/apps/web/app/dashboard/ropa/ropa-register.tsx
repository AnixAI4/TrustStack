"use client";

import { ROPA_BANDS, ROPA_RISK_LABEL, ROPA_RISK_RATINGS, ROPA_STATUS_LABEL, ROPA_STATUSES } from "@truststack/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DraftButton } from "@/components/ai/draft-panel";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { MoreMenu } from "@/components/ui/more-menu";
import { apiFetch } from "@/lib/client/api";
import { formatDueDate, todayInIndia } from "@/lib/client/gaps";
import { Can, usePermissions } from "@/lib/client/permissions";
import { BAND_STYLE, RISK_STYLE, ROPA_POSITIONING, type RopaRegisterPayload } from "@/lib/client/ropa";

/**
 * The ROPA / Processing Activity Register (Slice 7): one row per processing
 * activity, with how complete its record is, how risky the processing is,
 * who owns it and when it is next reviewed.
 *
 * Every number here was derived by the database. Nothing says "compliant": a
 * Strong record is a complete RECORD, which is a statement about the
 * register, not about the processing (D-011).
 */
export function RopaRegister() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const router = useRouter();
  const [payload, setPayload] = useState<RopaRegisterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [band, setBand] = useState("");
  const [risk, setRisk] = useState("");
  const [status, setStatus] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    apiFetch<RopaRegisterPayload>(`/api/v1/organizations/${organizationId}/ropa`).then((r) => {
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
  }, [organizationId]);

  const records = useMemo(() => payload?.records ?? [], [payload]);
  const filtered = records.filter(
    (r) =>
      (showArchived || r.status !== "archived" || status === "archived") &&
      (band === "" || r.completenessBand === band) &&
      (risk === "" || r.riskRating === risk) &&
      (status === "" || r.status === status),
  );
  const today = todayInIndia();

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="ropa-error">
        {error}
      </Notice>
    );
  }
  if (!payload || !organizationId) return <p className="text-sm text-slate-500">Loading the register…</p>;
  const { counts } = payload;

  return (
    <div className="space-y-6">
      <div>
        <p data-testid="ropa-positioning" className="text-sm text-slate-600">
          {ROPA_POSITIONING}
        </p>
      </div>

      <section data-testid="ropa-summary" className="rounded-xl border border-slate-200 p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <Stat label="Processing activities" value={counts.total} testId="ropa-count-total" />
          <Stat label="Not yet usable" value={counts.belowUsable} testId="ropa-count-below-usable" hint="Scored 60 or below out of 100" />
          <Stat label="High or critical risk" value={counts.highRisk} testId="ropa-count-high-risk" />
          <Stat label="Approved" value={counts.approved} testId="ropa-count-approved" />
          <Stat label="Review overdue" value={counts.reviewOverdue} testId="ropa-count-overdue" />
        </dl>
        <p className="mt-3 flex flex-wrap gap-2 text-xs">
          {ROPA_BANDS.map((b) => (
            <span key={b.band} data-testid={`ropa-band-count-${b.band}`} className={`rounded-full px-2 py-0.5 ${BAND_STYLE[b.band]}`}>
              {counts.byBand[b.band] ?? 0} {b.label}
            </span>
          ))}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Completeness is out of 100, over thirteen areas — who, what, why, where and with whom, and how long. It is
          separate from the DPDP Compass Readiness Score and never changes it.
        </p>
        {/* Slice 10.5 B3 (F3.3): one primary action; the rest under More. */}
        <div className="mt-3 flex flex-wrap items-start gap-2 text-sm">
          <Can permission="ropa.write">
            <Link href="/dashboard/ropa/new" data-testid="ropa-new" className="rounded-md bg-indigo-700 px-3 py-1.5 font-medium text-white hover:bg-indigo-800">
              Add a processing activity
            </Link>
          </Can>
          {/* Slice 11 Stage 2a: a record drafted from a description; accepting pre-fills the new-record form (D-129). */}
          {organizationId && (
            <DraftButton
              organizationId={organizationId}
              task="ropa_draft"
              subject="A new processing record, drafted from your description"
              onAccepted={(d) => router.push(`/dashboard/ropa/new?draft=${d.id}`)}
              testId="ropa-ai-draft"
            />
          )}
          <MoreMenu testId="ropa-more">
            <Can permission="ropa.write">
              <Link href="/dashboard/ropa/import" data-testid="ropa-import-link">
                Import from a spreadsheet
              </Link>
            </Can>
            <a href={`/api/v1/organizations/${organizationId}/ropa/export`} data-testid="ropa-export">
              Export (CSV)
            </a>
            <Link href="/dashboard/ropa/lookup" data-testid="ropa-lookup-link">
              Ask the register
            </Link>
            <Can permission="gap.read">
              <Link href="/dashboard/ropa/gaps" data-testid="ropa-gaps-link">
                Gaps and actions
              </Link>
            </Can>
          </MoreMenu>
        </div>
      </section>

      {records.length === 0 ? (
        <p data-testid="ropa-empty" className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-700">
          No processing activities are recorded yet. Start with the ones that touch the most people — admissions,
          customer onboarding, payroll — or import the register you already keep in a spreadsheet.
        </p>
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end gap-3 text-xs text-slate-600">
            <Filter label="Completeness" testId="ropa-filter-band" value={band} onChange={setBand}>
              {ROPA_BANDS.map((b) => (
                <option key={b.band} value={b.band}>
                  {b.label}
                </option>
              ))}
            </Filter>
            <Filter label="Risk" testId="ropa-filter-risk" value={risk} onChange={setRisk}>
              {ROPA_RISK_RATINGS.map((r) => (
                <option key={r} value={r}>
                  {ROPA_RISK_LABEL[r]}
                </option>
              ))}
            </Filter>
            <Filter label="Status" testId="ropa-filter-status" value={status} onChange={setStatus}>
              {ROPA_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ROPA_STATUS_LABEL[s]}
                </option>
              ))}
            </Filter>
            {counts.archived > 0 && (
              <label className="flex items-center gap-1 pb-1">
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Show {counts.archived} archived
              </label>
            )}
            <p data-testid="ropa-shown-count" className="pb-1">
              Showing {filtered.length} of {records.length}
            </p>
          </div>

          <DataTable
            testId="ropa-table"
            rows={filtered}
            rowKey={(r) => r.id}
            rowTestId={(r) => `ropa-row-${r.recordCode}`}
            noun="records"
            search={{
              label: "Search the register",
              placeholder: "Search by name, code, department or owner",
              text: (r) => [r.name, r.recordCode, r.departmentText, r.ownerName].filter(Boolean).join(" "),
            }}
            columns={[
              {
                key: "name",
                header: "Processing activity",
                sortValue: (r) => r.name,
                cell: (r) => (
                  <>
                    <Link href={`/dashboard/ropa/${r.id}`} className="font-medium text-indigo-800 hover:underline">
                      {r.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {r.recordCode}
                      {r.departmentText ? ` · ${r.departmentText}` : ""}
                    </p>
                  </>
                ),
              },
              {
                key: "completeness",
                header: "Completeness",
                sortValue: (r) => r.completenessScore,
                cell: (r) => (
                  <>
                    <span data-testid={`ropa-score-${r.recordCode}`} className="font-semibold">
                      {r.completenessScore}
                    </span>
                    <span className="text-xs text-slate-500">/100</span>{" "}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${BAND_STYLE[r.completenessBand]}`}>{r.completenessBandLabel}</span>
                  </>
                ),
              },
              {
                key: "risk",
                header: "Risk",
                sortValue: (r) => ROPA_RISK_RATINGS.indexOf(r.riskRating),
                cell: (r) => (
                  <span data-testid={`ropa-risk-${r.recordCode}`} className={`rounded-full px-2 py-0.5 text-xs ${RISK_STYLE[r.riskRating]}`}>
                    {r.riskRatingLabel}
                  </span>
                ),
              },
              {
                key: "owner",
                header: "Owner",
                className: "text-xs",
                sortValue: (r) => r.ownerName,
                cell: (r) => r.ownerName ?? <span className="text-red-700">No owner</span>,
              },
              {
                key: "status",
                header: "Status",
                className: "text-xs",
                sortValue: (r) => r.statusLabel,
                cellTestId: (r) => `ropa-status-${r.recordCode}`,
                cell: (r) => (
                  <>
                    {r.statusLabel}
                    {r.version > 1 ? ` · v${r.version}` : ""}
                  </>
                ),
              },
              {
                key: "review",
                header: "Next review",
                sortValue: (r) => r.nextReviewAt,
                cell: (r) => {
                  const overdue = r.status !== "archived" && (r.nextReviewAt === null || r.nextReviewAt < today);
                  return (
                    <span className={`text-xs ${overdue ? "font-semibold text-red-800" : ""}`}>
                      {r.nextReviewAt ? formatDueDate(r.nextReviewAt) : "Not set"}
                    </span>
                  );
                },
              },
            ]}
          />
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, testId, hint }: { label: string; value: number; testId: string; hint?: string }) {
  return (
    <div title={hint}>
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd data-testid={testId} className="text-lg font-semibold">
        {value}
      </dd>
    </div>
  );
}

function Filter({
  label,
  testId,
  value,
  onChange,
  children,
}: {
  label: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col">
      {label}
      <select
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
      >
        <option value="">All</option>
        {children}
      </select>
    </label>
  );
}
