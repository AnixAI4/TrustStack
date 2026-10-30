"use client";

import { GAP_OPENING_SEVERITIES, GAP_SEVERITY_LABEL, isOverdue } from "@truststack/core";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { PRIORITY_MEANING, SEVERITY_STYLE, todayInIndia } from "@/lib/client/gaps";
import { Can, usePermissions } from "@/lib/client/permissions";
import type { RopaGapsPayload } from "@/lib/client/ropa";
import { ActionEditor } from "../../assessments/[assessmentId]/gaps/action-editor";
import { Roadmap } from "../../assessments/[assessmentId]/gaps/roadmap";

/**
 * The gaps the REGISTER opens (Slice 7) — a record with no owner, no
 * retention rule, children's data not yet reviewed — and their actions.
 *
 * The actions live in the same table as an assessment's, so they are edited
 * with the same editor, close under the same rule (D-056), and sit on the
 * same 30/60/90-day roadmap. The register belongs to the organisation, not to
 * an assessment, so its actions are shown here rather than on an
 * assessment's page (D-062).
 */
export function RopaGaps() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [payload, setPayload] = useState<RopaGapsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"register" | "roadmap">("register");
  const [severity, setSeverity] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!organizationId) return Promise.resolve();
    return apiFetch<RopaGapsPayload>(`/api/v1/organizations/${organizationId}/ropa/gaps`).then((r) => {
      if (r.success) {
        setPayload(r.data);
        setError(null);
      } else setError(r.error.message);
    });
  }, [organizationId]);

  useEffect(() => {
    void load();
    apiFetch<{ user: { id: string } }>("/api/v1/auth/me").then((r) => {
      if (r.success) setCurrentUserId(r.data.user.id);
    });
  }, [load]);

  const gaps = useMemo(() => payload?.gaps ?? [], [payload]);
  const today = todayInIndia();

  async function generate() {
    if (!organizationId) return;
    setGenerateError(null);
    setGenerating(true);
    // No body: every gap is derived from the register in SQL.
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/ropa/gaps/generate`, { method: "POST" });
    setGenerating(false);
    if (!r.success) return setGenerateError(r.error.message);
    await load();
  }

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="ropa-gaps-error">
        {error}
      </Notice>
    );
  }
  if (!payload || !organizationId) return <p className="text-sm text-slate-500">Loading the gaps…</p>;

  const filtered = gaps.filter((g) => severity === "" || g.severity === severity);
  const actions = gaps.filter((g) => g.state === "open").flatMap((g) => g.actions);
  const overdue = actions.filter((a) => isOverdue(a.status, a.dueDate, today)).length;
  const roadmapGaps = gaps.map((g) => ({
    ...g,
    domainName: g.recordCode ? `${g.recordCode} · ${g.label}` : g.label,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/ropa" className="text-xs text-indigo-700 hover:underline">
          ← Back to the register
        </Link>
        <h2 className="mt-1 text-lg font-semibold">Register gaps and actions</h2>
        <p className="text-sm text-slate-600">
          What the processing register is missing, and who is fixing it. Each gap has one action — an owner, a due
          date and a status — on the same workflow as the assessment's gaps. These gaps do not change the DPDP
          Compass Readiness Score; that is scored from the assessment's answered, evidenced questions.
        </p>
      </div>

      <section data-testid="ropa-gaps-summary" className="rounded-xl border border-slate-200 p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <div>
            <dt className="text-xs text-slate-600">Open gaps</dt>
            <dd data-testid="ropa-gap-count" className="text-lg font-semibold">
              {payload.counts.gapCount}
            </dd>
          </div>
          {GAP_OPENING_SEVERITIES.map((s) => (
            <div key={s}>
              <dt className="text-xs text-slate-600">{GAP_SEVERITY_LABEL[s]}</dt>
              <dd data-testid={`ropa-gap-count-${s}`} className="text-lg font-semibold">
                {payload.counts[s]}
              </dd>
            </div>
          ))}
        </dl>
        {overdue > 0 && (
          <p data-testid="ropa-gaps-overdue" className="mt-2 text-sm font-medium text-red-800">
            {overdue} action{overdue === 1 ? " is" : "s are"} past the due date.
          </p>
        )}
        {!payload.generated && (
          <p data-testid="ropa-gaps-empty" className="mt-3 text-sm text-slate-700">
            The register's gaps have not been generated yet.
          </p>
        )}
        {payload.generated && payload.stale && (
          <Notice tone="warning" compact testId="ropa-gaps-stale" className="mt-3">
            The register has changed since these gaps were generated. Regenerate to bring them up to date — work
            already recorded on an action is always kept.
          </Notice>
        )}
        <Can permission="ropa.write">
          <div className="mt-3">
            <button
              type="button"
              data-testid="ropa-generate-gaps"
              onClick={generate}
              disabled={generating}
              className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {generating ? "Generating…" : payload.generated ? "Regenerate from the register" : "Generate the register's gaps"}
            </button>
            {generateError && (
              <Notice tone="error" compact className="mt-1">
                {generateError}
              </Notice>
            )}
          </div>
        </Can>
      </section>

      {gaps.length > 0 && (
        <>
          <div role="tablist" aria-label="Views" className="flex gap-2 border-b border-slate-200 text-sm">
            {(
              [
                ["register", "Gaps"],
                ["roadmap", "30 / 60 / 90-day roadmap"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                data-testid={`ropa-gaps-view-${key}`}
                onClick={() => setView(key)}
                className={view === key ? "border-b-2 border-indigo-700 px-3 py-2 font-medium text-indigo-800" : "px-3 py-2 text-slate-600 hover:text-slate-900"}
              >
                {label}
              </button>
            ))}
          </div>

          {view === "roadmap" ? (
            <Roadmap gaps={roadmapGaps} today={today} />
          ) : (
            <section className="space-y-3">
              <label className="flex w-40 flex-col text-xs text-slate-600">
                Severity
                <select
                  data-testid="ropa-gaps-filter-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
                >
                  <option value="">All</option>
                  {GAP_OPENING_SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {GAP_SEVERITY_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              {/* Paged, searchable, sortable (F2.5). */}
              <DataTable
                testId="ropa-gap-list"
                caption="Register gaps"
                noun="gaps"
                rows={filtered}
                rowKey={(g) => g.id}
                search={{
                  label: "Search the register's gaps",
                  placeholder: "Search by record, gap or owner",
                  text: (g) =>
                    [g.recordCode ?? "", g.recordName ?? "", g.label, g.recommendedFix, GAP_SEVERITY_LABEL[g.severity], ...g.actions.map((a) => a.ownerName ?? "Unassigned")].join(" "),
                }}
                columns={[
                  {
                    key: "gap",
                    header: "Gap — most severe first when sorted",
                    sortValue: (g) => {
                      const i = (GAP_OPENING_SEVERITIES as readonly string[]).indexOf(g.severity);
                      return i < 0 ? GAP_OPENING_SEVERITIES.length : i;
                    },
                    cell: (gap) => (
                      <div data-testid={`ropa-gap-${gap.id}`} data-code={gap.gapCode}>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`rounded-full px-2 py-0.5 font-medium ${SEVERITY_STYLE[gap.severity] ?? ""}`}>
                            {GAP_SEVERITY_LABEL[gap.severity]}
                          </span>
                          <span className="text-slate-700">
                            Priority {gap.priority} · {PRIORITY_MEANING[gap.priority]}
                          </span>
                          {gap.recordId && (
                            <Link href={`/dashboard/ropa/${gap.recordId}`} className="text-indigo-700 hover:underline">
                              {gap.recordCode} · {gap.recordName}
                            </Link>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium">{gap.label}</p>
                        <p className="mt-1 text-sm text-slate-700">
                          <span className="text-xs font-semibold text-slate-600">What to do: </span>
                          {gap.recommendedFix}
                        </p>
                        {gap.state === "superseded" && (
                          <p className="mt-2 rounded-md bg-slate-100 p-2 text-xs text-slate-700">
                            No longer a gap — the record has been fixed. It is kept because work was already recorded on its action.
                          </p>
                        )}
                        {gap.actions.map((action) => (
                          <ActionEditor
                            key={action.id}
                            organizationId={organizationId}
                            gap={gap}
                            actionUrl={`/api/v1/organizations/${organizationId}/ropa/gaps/${gap.id}/actions/${action.id}`}
                            action={action}
                            members={payload.members}
                            currentUserId={currentUserId}
                            today={today}
                            onChanged={load}
                          />
                        ))}
                      </div>
                    ),
                  },
                  {
                    key: "record",
                    header: "Record",
                    sortValue: (g) => g.recordCode,
                    className: "hidden w-40 text-xs text-slate-700 md:table-cell",
                    headerClassName: "hidden md:table-cell",
                    cell: (g) => g.recordCode ?? "The whole register",
                  },
                ]}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
