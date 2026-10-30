import "server-only";
import {
  ACTION_SOURCE_LABEL,
  BREACH_CLOCK_NOTE,
  countBreaches,
  countRetention,
  countRights,
  RETENTION_NOTE,
  RIGHTS_CLOCK_NOTE,
  summariseActions,
  type ActionSource,
  type GapActionStatus,
  type GapSeverity,
  type GapState,
} from "@truststack/core";
import type { TenantContext } from "@/lib/api/guard";
import { breachItems, clockFactsOf, readBreaches, type BreachApi } from "@/lib/breach/shape";
import { clockFactsOf as rightsClockFactsOf, readRights, rightsItems, type RightsApi } from "@/lib/rights/shape";
import { factsOf as retentionFactsOf, readRetention, retentionItems, type ScheduleApi } from "@/lib/retention/shape";
import { ok } from "@/lib/api/envelope";
import { listAssessments, type AssessmentRow } from "@/lib/assessments/routes";
import { readAssessmentScore } from "@/lib/assessments/score";
import { readGapRegister } from "@/lib/gaps/routes";
import { activeMembers, readGaps, type GapApi, type Member } from "@/lib/gaps/shape";
import {
  readAllRecords,
  readRopaGapRegister,
  ropaRegisterCounts,
  todayInIndia,
  type RecordRow,
  type RopaGapApi,
} from "@/lib/ropa/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * The dashboard (Slice 8): ONE request that returns what the overview, the
 * owner-wise view and the roadmap need, read through the SAME readers the
 * score, gap and ROPA routes use — so a tile and the page it links to can
 * never disagree.
 *
 * It adds no arithmetic of its own. Every score, severity, completeness and
 * risk rating comes from the engine or the database; the only thing done here
 * is placing rows side by side, and the only counting is core's
 * `summariseActions` / `countRopaRegister` over rows those readers returned.
 * `tests/unit/dashboard-no-recompute.test.ts` fails if this file ever imports
 * a scoring, completeness or risk function.
 *
 * A section the caller has no permission for is OMITTED (null, and named in
 * `omitted`), never an error: an executive and a department owner open the
 * same page. An organisation with nothing yet — no assessment, no record —
 * gets empty sections, not a 404.
 */

/** What the overview says about one assessment. */
async function readinessOf(
  ctx: TenantContext<undefined, undefined>,
  assessment: AssessmentRow,
  members: readonly Member[],
  canReadGaps: boolean,
) {
  const [score, register] = await Promise.all([
    readAssessmentScore(ctx.supabase, ctx.organizationId, assessment),
    canReadGaps ? readGapRegister(ctx.supabase, ctx.organizationId, assessment, members) : Promise.resolve(null),
  ]);
  return {
    assessment: {
      id: assessment.id,
      name: assessment.name,
      status: assessment.status,
      assessmentType: assessment.assessment_type,
      createdAt: assessment.created_at,
    },
    score,
    gaps: register && {
      frozen: register.frozen,
      stale: register.stale,
      /** False until somebody generates the register (D-057). */
      generated: register.gaps.length > 0 || !register.stale,
      counts: register.counts,
    },
  };
}

/**
 * Which assessments the overview shows (D-068): the newest FINALISED one, as
 * its frozen snapshot — and the assessment in progress after it, as a live,
 * provisional score. Two tiles, never one blended number.
 *
 * "In progress" = a non-finalised assessment created after the newest
 * finalised one (all of them, when none is finalised): the newest with
 * answers, else the newest — the rule the Slice 5 tile used.
 */
export function pickAssessments(assessments: readonly AssessmentRow[]) {
  const newestFirst = [...assessments].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const finalised = newestFirst.find((a) => a.status === "finalised") ?? null;
  const later = newestFirst.filter(
    (a) => a.status !== "finalised" && (finalised === null || a.created_at > finalised.created_at),
  );
  const inProgress = later.find((a) => a.status !== "draft") ?? later[0] ?? null;
  return { finalised, inProgress };
}

/** One action, wherever it came from, labelled by its source and its context. Shared with the exposure view (Slice 9). */
export function assessmentItems(assessment: AssessmentRow, gaps: readonly GapApi[]) {
  return gaps.flatMap((gap) =>
    gap.actions.map((action) => ({
      ...action,
      source: "assessment" as ActionSource,
      sourceLabel: ACTION_SOURCE_LABEL.assessment,
      /** Plain language: the domain, never a question code. */
      context: gap.domainName,
      parentName: assessment.name,
      href: `/dashboard/assessments/${assessment.id}/gaps`,
      gapState: gap.state as GapState,
      severity: gap.severity as GapSeverity,
      priority: gap.priority,
    })),
  );
}

export function ropaItems(gaps: readonly RopaGapApi[]) {
  return gaps.flatMap((gap) =>
    gap.actions.map((action) => ({
      ...action,
      source: "ropa" as ActionSource,
      sourceLabel: ACTION_SOURCE_LABEL.ropa,
      /** The record and the rule — as the register's own roadmap labels it. */
      context: gap.recordCode ? `${gap.recordCode} · ${gap.label}` : gap.label,
      parentName: gap.recordName ?? "The whole register",
      href: "/dashboard/ropa/gaps",
      gapState: gap.state as GapState,
      severity: gap.severity as GapSeverity,
      priority: gap.priority,
    })),
  );
}

export type DashboardActionItem = ReturnType<typeof assessmentItems>[number];

/**
 * Every gap, with its actions, from EVERY assessment (actions live on after a
 * gap is frozen, D-058), from the register and (Slice 10) from the breach
 * register, the rights register and the retention register — what the
 * overview's action list and the Stage 4 reports (the tracker, the owner's
 * pack, the evidence pack) all read, so none of them can list a different set
 * of actions. A parent the caller may not read is null.
 */
export async function readRemediation(
  supabase: AppSupabaseClient,
  organizationId: string,
  members: readonly Member[],
  assessments: readonly AssessmentRow[],
  records: readonly RecordRow[],
  can: { assessmentGaps: boolean; ropaGaps: boolean; breaches: boolean; rights: boolean; retention: boolean },
  now: string = new Date().toISOString(),
) {
  const today = todayInIndia(new Date(now));
  const [assessmentGaps, ropaRegister, breaches, rights, retention] = await Promise.all([
    can.assessmentGaps
      ? Promise.all(assessments.map(async (assessment) => ({ assessment, gaps: await readGaps(supabase, organizationId, assessment.id, members) })))
      : Promise.resolve(null),
    can.ropaGaps ? readRopaGapRegister(supabase, organizationId, members, records) : Promise.resolve(null),
    can.breaches ? readBreaches(supabase, organizationId, members, now) : Promise.resolve(null),
    can.rights ? readRights(supabase, organizationId, members, today) : Promise.resolve(null),
    // Slice 10 Stage 5: the retention register — its actions and (D-096, R6) its section.
    can.retention ? readRetention(supabase, organizationId, members, today) : Promise.resolve(null),
  ]);
  return { assessmentGaps, ropaRegister, breaches, rights, retention };
}

export type Remediation = Awaited<ReturnType<typeof readRemediation>>;

/**
 * Everything the overview shows, as `GET …/dashboard` returns it — and as the
 * Programme Status Report reads it (Slice 9, Stage 3), so the report and the
 * overview can never disagree.
 */
export async function readDashboard(ctx: TenantContext<undefined, undefined>) {
  const { supabase, organizationId, permissions } = ctx;
  const has = (p: string) => permissions.has(p);
  const canAssessments = has("assessment.read");
  const canScore = canAssessments && has("score.read");
  const canGaps = has("gap.read");
  const canRopa = has("ropa.read");
  const canBreaches = has("breach.read");
  const canRights = has("rights.read");
  const canRetention = has("retention.read");
  const now = new Date().toISOString();
  const today = todayInIndia(new Date(now));

  const [members, assessments, records] = await Promise.all([
    canGaps ? activeMembers(supabase, organizationId) : Promise.resolve([] as Member[]),
    canAssessments ? listAssessments(supabase, organizationId) : Promise.resolve([] as AssessmentRow[]),
    canRopa ? readAllRecords(supabase, organizationId) : Promise.resolve([] as RecordRow[]),
  ]);

  const { finalised, inProgress } = pickAssessments(assessments);
  const [finalisedView, inProgressView, { assessmentGaps, ropaRegister, breaches, rights, retention }] = await Promise.all([
    canScore && finalised ? readinessOf(ctx, finalised, members, canGaps) : Promise.resolve(null),
    canScore && inProgress ? readinessOf(ctx, inProgress, members, canGaps) : Promise.resolve(null),
    // Actions live on after a gap is frozen (D-058): every assessment's, not only the two above.
    readRemediation(supabase, organizationId, members, assessments, records, {
      assessmentGaps: canGaps && canAssessments,
      ropaGaps: canGaps && canRopa,
      // The breach and rights registers are read once, for both their actions and their sections.
      breaches: canBreaches,
      rights: canRights,
      // Read once, for both its actions and its section (D-096, R6).
      retention: canRetention,
    }, now),
  ]);

  // A breach's actions need both: the breach (breach.read) and the action list (gap.read).
  const breachActions = canGaps && breaches !== null ? breaches : null;
  // Likewise a request's: rights.read and gap.read.
  const rightsActions = canGaps && rights !== null ? rights : null;
  // And a retention schedule's: retention.read and gap.read.
  const retentionActions = canGaps && retention !== null ? retention : null;
  const items =
    assessmentGaps === null && ropaRegister === null && breachActions === null && rightsActions === null && retentionActions === null
      ? null
      : [
          ...(assessmentGaps ?? []).flatMap(({ assessment, gaps }) => assessmentItems(assessment, gaps)),
          ...(ropaRegister ? ropaItems(ropaRegister.gaps) : []),
          ...(breachActions ? breachItems(breachActions) : []),
          ...(rightsActions ? rightsItems(rightsActions) : []),
          ...(retentionActions ? retentionItems(retentionActions) : []),
        ];

  const omitted = [
    !canScore && "readiness",
    items === null && "actions",
    !canRopa && "ropa",
    !canBreaches && "breaches",
    !canRights && "rights",
    !canRetention && "retention",
  ].filter((s): s is string => typeof s === "string");

  return {
    organizationId,
    /** The day every window and "overdue" is measured from — India's (D-055). */
    today,
    omitted,
    readiness: canScore
      ? {
          /** The frozen snapshot of the newest finalised assessment, or null. */
          finalised: finalisedView,
          /** The live, provisional score of the assessment in progress, or null. */
          inProgress: inProgressView,
        }
      : null,
    actions:
      items === null
        ? null
        : {
            /** Which parents these actions were read from — a source you cannot read is not in the list. */
            sources: [
              ...(assessmentGaps !== null ? (["assessment"] as const) : []),
              ...(ropaRegister !== null ? (["ropa"] as const) : []),
              ...(breachActions !== null ? (["breach"] as const) : []),
              ...(rightsActions !== null ? (["rights"] as const) : []),
              ...(retentionActions !== null ? (["retention"] as const) : []),
            ],
            summary: summariseActions(
              items.map((i) => ({ ...i, status: i.status as GapActionStatus })),
              today,
            ),
            items,
          },
    ropa: canRopa
      ? {
          /** The register is a readiness artefact, not a statutory record (D-011). */
          positioning: "DPDP readiness register — not a statutory record.",
          counts: ropaRegisterCounts(records, today),
          gaps: ropaRegister && {
            counts: ropaRegister.counts,
            stale: ropaRegister.stale,
            generated: ropaRegister.generated,
          },
        }
      : null,
    /**
     * Slice 10: the breach register's headline — counted in core over the rows
     * the register's own reader returned, never on the readiness tile (D-069).
     */
    breaches: breaches === null ? null : breachSection(breaches, now),
    /**
     * Slice 10 Stage 2: the rights register's headline — counted in core over
     * the rows the register's own reader returned, never on the readiness tile.
     */
    rights: rights === null ? null : rightsSection(rights, today),
    /**
     * Slice 10 Stage 5 (D-096, R6): the retention register's headline —
     * counted in core over the rows the register's own reader returned.
     */
    retention: retention === null ? null : retentionSection(retention, today),
  };
}

/**
 * The overview's retention section: core's counts, and the schedules whose
 * erasure is overdue, the oldest end first — the ones that need someone now.
 */
export function retentionSection(schedules: readonly ScheduleApi[], today: string) {
  return {
    today,
    counts: countRetention(schedules.map(retentionFactsOf), today),
    overdue: schedules
      .filter((s) => s.clock.state === "overdue")
      .sort((x, y) => (x.endsOn ?? "").localeCompare(y.endsOn ?? ""))
      .map((s) => ({ id: s.id, recordCode: s.record?.recordCode ?? null, endsOn: s.endsOn, erasureIncomplete: s.erasureIncomplete })),
    note: RETENTION_NOTE,
  };
}

/**
 * The overview's rights section: counts, the day they were read on, and the
 * open requests past TrustStack's 30-day target or the Rules' ninety days —
 * oldest first, the ones that need someone now.
 */
export function rightsSection(requests: readonly RightsApi[], today: string) {
  return {
    today,
    counts: countRights(requests.map(rightsClockFactsOf), today),
    attention: requests
      .filter((r) => r.clock.state === "past_target" || r.clock.state === "overdue")
      .sort((x, y) => x.receivedOn.localeCompare(y.receivedOn) || x.requestCode.localeCompare(y.requestCode))
      .map((r) => ({ id: r.id, requestCode: r.requestCode, kindLabel: r.kindLabel, clock: r.clock })),
    clockNote: RIGHTS_CLOCK_NOTE,
  };
}

/** The overview's breach section: counts, the instant they were read at, and the clocks still running. */
export function breachSection(incidents: readonly BreachApi[], now: string) {
  return {
    now,
    counts: countBreaches(incidents.map(clockFactsOf), now),
    /** Every breach whose Board clock is running or overdue, soonest due first — what needs someone now. */
    clocks: incidents
      .filter((b) => b.board.clock.state === "running" || b.board.clock.state === "overdue")
      .sort((x, y) => x.board.dueAt.localeCompare(y.board.dueAt))
      .map((b) => ({ id: b.id, incidentCode: b.incidentCode, title: b.title, clock: b.board.clock })),
    clockNote: BREACH_CLOCK_NOTE,
  };
}

export type DashboardPayload = Awaited<ReturnType<typeof readDashboard>>;

export const dashboard = {
  read: {
    // Every role holds organization.read; each section checks its own permission.
    options: { auth: "required", tenant: "fromParam", permission: "organization.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => ok(await readDashboard(ctx), ctx.request),
  },
};
