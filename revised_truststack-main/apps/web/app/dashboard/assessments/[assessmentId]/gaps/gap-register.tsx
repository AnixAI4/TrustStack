"use client";

import {
  GAP_ACTION_STATUS_LABEL,
  GAP_ACTION_STATUSES,
  GAP_OPENING_SEVERITIES,
  GAP_SEVERITY_LABEL,
  isOverdue,
  type GapActionStatus,
} from "@truststack/core";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExplainButton } from "@/components/ai/assistant-panel";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import {
  formatDueDate,
  PRIORITY_MEANING,
  SEVERITY_STYLE,
  todayInIndia,
  type Gap,
  type GapRegisterPayload,
} from "@/lib/client/gaps";
import { Can, usePermissions } from "@/lib/client/permissions";
import { ActionEditor } from "./action-editor";
import { Roadmap } from "./roadmap";

const UNASSIGNED = "__unassigned__";

/** Critical first when sorted by severity. */
const SEVERITY_RANK = (g: Gap) => {
  const i = (GAP_OPENING_SEVERITIES as readonly string[]).indexOf(g.severity);
  return i < 0 ? GAP_OPENING_SEVERITIES.length : i;
};

/** The earliest date an unfinished action on the gap is due; null when none is dated. */
const NEXT_DUE = (g: Gap) =>
  g.actions
    .filter((a) => a.status !== "closed" && a.dueDate)
    .map((a) => a.dueDate!)
    .sort()[0] ?? null;

/**
 * The gap register and the 30/60/90 roadmap for one assessment.
 *
 * Every gap here was derived by the database from a stored adjusted score;
 * the browser neither computes a severity nor decides whether an action may
 * close. Nothing on this page shows a question code, a pack code or a trigger
 * expression — the client sees the question, its domain and what to do (D-040).
 */
export function GapRegister({ assessmentId }: { assessmentId: string }) {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;

  const [payload, setPayload] = useState<GapRegisterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [view, setView] = useState<"register" | "roadmap">("register");
  const [severity, setSeverity] = useState("");
  const [domain, setDomain] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    if (!organizationId) return Promise.resolve();
    return apiFetch<GapRegisterPayload>(`/api/v1/organizations/${organizationId}/assessments/${assessmentId}/gaps`).then(
      (r) => {
        if (r.success) {
          setPayload(r.data);
          setError(null);
        } else setError(r.error.message);
      },
    );
  }, [organizationId, assessmentId]);

  useEffect(() => {
    void load();
    apiFetch<{ user: { id: string } }>("/api/v1/auth/me").then((r) => {
      if (r.success) setCurrentUserId(r.data.user.id);
    });
  }, [load]);

  const today = todayInIndia();
  const gaps = useMemo(() => payload?.gaps ?? [], [payload]);

  const domains = useMemo(() => [...new Map(gaps.map((g) => [g.domainCode, g.domainName])).entries()], [gaps]);
  const owners = useMemo(
    () =>
      [
        ...new Map(
          gaps.flatMap((g) => g.actions).flatMap((a) => (a.ownerUserId ? [[a.ownerUserId, a.ownerName ?? "Unnamed member"] as const] : [])),
        ).entries(),
      ].sort((a, b) => a[1].localeCompare(b[1])),
    [gaps],
  );

  const filtered = gaps.filter(
    (g) =>
      (severity === "" || g.severity === severity) &&
      (domain === "" || g.domainCode === domain) &&
      (status === "" || g.actions.some((a) => a.status === status)) &&
      (owner === "" ||
        g.actions.some((a) => (owner === UNASSIGNED ? a.ownerUserId === null : a.ownerUserId === owner))),
  );

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <div className="space-y-3">
        <Notice tone="error" testId="gap-register-error">
          {error}
        </Notice>
        <Link href={`/dashboard/assessments/${assessmentId}`} className="text-sm text-indigo-700 hover:underline">
          Back to the assessment
        </Link>
      </div>
    );
  }
  if (!payload || !organizationId) return <p className="text-sm text-slate-500">Loading the gap register…</p>;

  const { counts, frozen, stale } = payload;
  const actions = gaps.filter((g) => g.state === "open").flatMap((g) => g.actions);
  const closed = actions.filter((a) => a.status === "closed").length;
  const overdue = actions.filter((a) => isOverdue(a.status, a.dueDate, today)).length;
  const neverGenerated = gaps.length === 0 && stale;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/assessments/${assessmentId}`} className="text-xs text-indigo-700 hover:underline">
          ← Back to the assessment
        </Link>
        <h2 className="mt-1 text-lg font-semibold">Gap register and remediation roadmap</h2>
        <p className="text-sm text-slate-600">
          A gap is opened for every answer scoring 3 or below out of 5 — on what the reviewed evidence supports, not on
          what was claimed. Each gap has one action: an owner, a due date and a status.
        </p>
      </div>

      <section data-testid="gap-summary" className="rounded-xl border border-slate-200 p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-6">
          <Stat label="Open gaps" value={counts.gapCount} testId="gap-count" />
          {GAP_OPENING_SEVERITIES.map((s) => (
            <Stat key={s} label={GAP_SEVERITY_LABEL[s]} value={counts[s]} testId={`gap-count-${s}`} />
          ))}
          <Stat label="Actions closed" value={`${closed} of ${actions.length}`} testId="gap-closed-count" />
        </dl>
        {overdue > 0 && (
          <p data-testid="gap-overdue" className="mt-2 text-sm font-medium text-red-800">
            {overdue} action{overdue === 1 ? " is" : "s are"} past the due date.
          </p>
        )}

        {frozen ? (
          <p data-testid="gap-frozen" className="mt-3 text-xs text-slate-600">
            This assessment is finalised. Its gaps are frozen with its score — they record what was found, and when.
            Remediation continues: actions can still be assigned, evidenced and closed.
          </p>
        ) : (
          <>
            {stale && !neverGenerated && (
              <Notice tone="warning" compact testId="gap-stale" className="mt-3">
                Answers or evidence have changed since this register was generated. Regenerate it to bring it up to
                date — work already recorded on an action is always kept.
              </Notice>
            )}
            {neverGenerated && (
              <p data-testid="gap-empty" className="mt-3 text-sm text-slate-700">
                {payload.answeredCount === 0
                  ? "No questions have been answered yet, so there is nothing to build a register from."
                  : "No gap register has been generated for this assessment yet."}
              </p>
            )}
            {!stale && gaps.length === 0 && (
              <p data-testid="gap-none" className="mt-3 text-sm text-slate-700">
                No gaps: every answered question scores 4 or 5 on reviewed evidence.
              </p>
            )}
            <Can permission="gap.write">
              <GenerateButton
                organizationId={organizationId}
                assessmentId={assessmentId}
                regenerate={gaps.length > 0}
                onGenerated={load}
              />
            </Can>
          </>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Unanswered questions and questions marked Not Applicable have no gap: one has not been assessed yet, the other
          was excluded with a reason. A domain that does not apply to this organisation has none either.
        </p>
      </section>

      {gaps.length > 0 && (
        <>
          <div role="tablist" aria-label="Views" className="flex gap-2 border-b border-slate-200 text-sm">
            {(
              [
                ["register", "Register"],
                ["roadmap", "30 / 60 / 90-day roadmap"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                data-testid={`gap-view-${key}`}
                onClick={() => setView(key)}
                className={
                  view === key
                    ? "border-b-2 border-indigo-700 px-3 py-2 font-medium text-indigo-800"
                    : "px-3 py-2 text-slate-600 hover:text-slate-900"
                }
              >
                {label}
              </button>
            ))}
          </div>

          {view === "roadmap" ? (
            <Roadmap gaps={gaps} today={today} />
          ) : (
            <section className="space-y-3">
              <div className="flex flex-wrap items-end gap-3 text-xs text-slate-600">
                <Filter label="Severity" testId="gap-filter-severity" value={severity} onChange={setSeverity}>
                  {GAP_OPENING_SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {GAP_SEVERITY_LABEL[s]}
                    </option>
                  ))}
                </Filter>
                <Filter label="Domain" testId="gap-filter-domain" value={domain} onChange={setDomain}>
                  {domains.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </Filter>
                <Filter label="Owner" testId="gap-filter-owner" value={owner} onChange={setOwner}>
                  <option value={UNASSIGNED}>Unassigned</option>
                  {owners.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </Filter>
                <Filter label="Status" testId="gap-filter-status" value={status} onChange={setStatus}>
                  {GAP_ACTION_STATUSES.map((s: GapActionStatus) => (
                    <option key={s} value={s}>
                      {GAP_ACTION_STATUS_LABEL[s]}
                    </option>
                  ))}
                </Filter>
                <p data-testid="gap-shown-count" className="pb-1">
                  Showing {filtered.length} of {gaps.length}
                </p>
              </div>

              {/* Paged, searchable, sortable (F2.5): 25 a page, in the reader's order until someone sorts. */}
              <DataTable
                testId="gap-list"
                caption="Gaps"
                noun="gaps"
                rows={filtered}
                rowKey={(g) => g.id}
                search={{
                  label: "Search the gaps",
                  placeholder: "Search by question, domain, fix or owner",
                  // Never the question code: the client sees the question, not its code (D-040).
                  text: (g) =>
                    [
                      g.questionText ?? g.finding,
                      g.domainName,
                      GAP_SEVERITY_LABEL[g.severity],
                      g.recommendedFix ?? "",
                      ...g.actions.map((a) => a.ownerName ?? "Unassigned"),
                    ].join(" "),
                }}
                columns={[
                  {
                    key: "gap",
                    header: "Gap — most severe first when sorted",
                    sortValue: SEVERITY_RANK,
                    cell: (gap) => (
                      <GapCard
                        gap={gap}
                        organizationId={organizationId}
                        assessmentId={assessmentId}
                        members={payload.members}
                        currentUserId={currentUserId}
                        today={today}
                        onChanged={load}
                      />
                    ),
                  },
                  {
                    key: "domain",
                    header: "Domain",
                    sortValue: (g) => g.domainName,
                    className: "hidden w-44 text-xs text-slate-700 md:table-cell",
                    headerClassName: "hidden md:table-cell",
                    cell: (g) => g.domainName,
                  },
                  {
                    key: "due",
                    header: "Next due",
                    sortValue: NEXT_DUE,
                    className: "hidden w-32 whitespace-nowrap text-xs text-slate-700 md:table-cell",
                    headerClassName: "hidden md:table-cell",
                    cell: (g) => (g.actions.every((a) => a.status === "closed") ? "All closed" : formatDueDate(NEXT_DUE(g))),
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

function Stat({ label, value, testId }: { label: string; value: number | string; testId: string }) {
  return (
    <div>
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

function GenerateButton({
  organizationId,
  assessmentId,
  regenerate,
  onGenerated,
}: {
  organizationId: string;
  assessmentId: string;
  regenerate: boolean;
  onGenerated: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setBusy(true);
    // No body: a gap is derived from the stored scores, never typed in.
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/assessments/${assessmentId}/gaps/generate`, {
      method: "POST",
    });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    await onGenerated();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        data-testid="generate-gaps"
        onClick={generate}
        disabled={busy}
        className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        {busy ? "Generating…" : regenerate ? "Regenerate from the current answers" : "Generate the gap register"}
      </button>
      {error && (
        <Notice tone="error" compact testId="generate-gaps-error" className="mt-1">
          {error}
        </Notice>
      )}
    </div>
  );
}

function GapCard({
  gap,
  organizationId,
  assessmentId,
  members,
  currentUserId,
  today,
  onChanged,
}: {
  gap: Gap;
  organizationId: string;
  assessmentId: string;
  members: GapRegisterPayload["members"];
  currentUserId: string | null;
  today: string;
  onChanged: () => void | Promise<void>;
}) {
  return (
    <div data-testid={`gap-${gap.id}`} data-severity={gap.severity}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          data-testid={`gap-severity-${gap.id}`}
          className={`rounded-full px-2 py-0.5 font-medium ${SEVERITY_STYLE[gap.severity] ?? ""}`}
        >
          {GAP_SEVERITY_LABEL[gap.severity]}
        </span>
        <span data-testid={`gap-priority-${gap.id}`} className="text-slate-700">
          Priority {gap.priority} · {PRIORITY_MEANING[gap.priority]}
        </span>
        {/* On a laptop the Domain column names it. */}
        <span className="text-slate-500 md:hidden">{gap.domainName}</span>
        <span data-testid={`gap-score-${gap.id}`} className="text-slate-500">
          scored {gap.adjustedScore} of 5
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium">{gap.questionText ?? gap.finding}</p>
        <ExplainButton
          organizationId={organizationId}
          task="gap_helper"
          body={{ assessmentId, gapId: gap.id }}
          subject={gap.questionText ?? gap.finding}
          testId={`ai-explain-gap-${gap.id}`}
          nextSteps={gapNextSteps(gap)}
        />
      </div>
      {gap.recommendedFix && (
        <p className="mt-1 text-sm text-slate-700">
          <span className="text-xs font-semibold text-slate-600">Recommended fix: </span>
          {gap.recommendedFix}
        </p>
      )}
      {gap.evidenceGuidance && (
        <p className="mt-1 text-xs text-slate-600">
          <span className="font-semibold">Evidence that would show it is done: </span>
          {gap.evidenceGuidance}
        </p>
      )}

      {gap.state === "superseded" && (
        // Kept, not hidden: somebody had already worked on its action (D-057).
        <p data-testid={`gap-superseded-${gap.id}`} className="mt-2 rounded-md bg-slate-100 p-2 text-xs text-slate-700">
          No longer a gap — the answer now scores above 3, or no longer applies. It is kept here because work was
          already recorded on its action.
        </p>
      )}

      {gap.actions.map((action) => (
        <ActionEditor
          key={action.id}
          organizationId={organizationId}
          assessmentId={assessmentId}
          gap={gap}
          action={action}
          members={members}
          currentUserId={currentUserId}
          today={today}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}

/** Where a gap answer's next step leads on the register (Slice 11 Stage 1b): its first action, or the gap itself. */
function gapNextSteps(gap: Gap) {
  const focus = (testId: string) => () => document.querySelector(`[data-testid="${testId}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  const first = gap.actions[0];
  return {
    add_evidence: { onSelect: focus(first ? `action-${first.id}` : `gap-${gap.id}`) },
    view_gaps: { onSelect: focus(`gap-${gap.id}`) },
  };
}
