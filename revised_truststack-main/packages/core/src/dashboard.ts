/**
 * Dashboards (Slice 8) — the little a dashboard may work out for itself.
 *
 * Nothing here computes a score, a severity, a completeness or a risk rating:
 * those are the engine's and the database's, and a dashboard only reports
 * them. What lives here is COUNTING rows the API already returned and placing
 * a STORED due date in a 30/60/90 window — the same rules for every view, so
 * the overview, the owner-wise view and the roadmap can never disagree.
 */
import type { BoardClockState } from "./breach.js";
import type { GapSeverity } from "./engine.js";
import {
  GAP_OPENING_SEVERITIES,
  roadmapWindow,
  ROADMAP_WINDOWS,
  type GapActionStatus,
  type GapState,
  type RoadmapWindow,
} from "./gaps.js";
import type { RightsClockState } from "./rights.js";
import { ROPA_BANDS, type RopaBand, type RopaRiskRating, type RopaStatus } from "./ropa.js";
import type { TriState } from "./scope.js";

// ---------------------------------------------------------------------------
// Actions across EVERY parent (D-060, D-062, Slice 10)
// ---------------------------------------------------------------------------

/**
 * Where an action came from. `gap_actions` holds every kind and each action
 * has exactly one parent (a CHECK): an assessment gap (`gap_id`), a ROPA gap
 * (`ropa_gap_id`, D-060), a breach (`breach_incident_id`, Slice 10), a
 * Data Principal's request or grievance (`rights_request_id`, Slice 10
 * Stage 2) or a retention schedule whose erasure is owed
 * (`retention_schedule_id`, Stage 5). One table, one workflow, one closing
 * rule — never a second action list (D-067).
 */
export const ACTION_SOURCES = ["assessment", "ropa", "breach", "rights", "retention"] as const;
export type ActionSource = (typeof ACTION_SOURCES)[number];

export const ACTION_SOURCE_LABEL: Readonly<Record<ActionSource, string>> = Object.freeze({
  assessment: "Assessment",
  ropa: "Processing register",
  breach: "Breach register",
  rights: "Rights and grievance register",
  retention: "Retention register",
});

/** What the counting needs of an action — the API's item carries more. */
export interface DashboardActionFacts {
  source: ActionSource;
  /** A PERSON. Never the question's authored owner role (pitfall 8). */
  ownerUserId: string | null;
  status: GapActionStatus;
  /** `YYYY-MM-DD`, stored (D-055). Null = next assessment cycle. */
  dueDate: string | null;
  /** The gap's stored severity. */
  severity: GapSeverity;
  /** The gap's state: an action on a superseded gap is no longer owed. */
  gapState: GapState;
}

/**
 * Still owed: its gap still applies and the action is not closed. The same
 * rule the roadmap has always used — a superseded gap is not remediation work.
 */
export function isOutstanding(action: Pick<DashboardActionFacts, "status" | "gapState">): boolean {
  return action.gapState === "open" && action.status !== "closed";
}

export interface ActionSummary {
  /** Every action given, whatever its state. */
  total: number;
  outstanding: number;
  /** Outstanding and past its due date in India — today itself is not overdue. */
  overdue: number;
  /** Outstanding with nobody named. Usually the biggest bucket. */
  unassigned: number;
  closed: number;
  /** Outstanding actions per roadmap window. */
  byWindow: Record<RoadmapWindow, number>;
  /** Outstanding actions per gap severity. */
  bySeverity: Record<(typeof GAP_OPENING_SEVERITIES)[number], number>;
  bySource: Record<ActionSource, { outstanding: number; overdue: number }>;
}

/** Counts, never scores: every figure is a number of rows the API returned. */
export function summariseActions(actions: readonly DashboardActionFacts[], today: string): ActionSummary {
  const byWindow = Object.fromEntries(ROADMAP_WINDOWS.map((w) => [w, 0])) as Record<RoadmapWindow, number>;
  const bySeverity = Object.fromEntries(GAP_OPENING_SEVERITIES.map((s) => [s, 0])) as ActionSummary["bySeverity"];
  const bySource = Object.fromEntries(ACTION_SOURCES.map((s) => [s, { outstanding: 0, overdue: 0 }])) as ActionSummary["bySource"];

  let outstanding = 0;
  let overdue = 0;
  let unassigned = 0;
  let closed = 0;
  for (const a of actions) {
    if (a.status === "closed") closed += 1;
    if (!isOutstanding(a)) continue;
    outstanding += 1;
    const window = roadmapWindow(a.dueDate, today);
    byWindow[window] += 1;
    if (a.severity in bySeverity) bySeverity[a.severity as keyof typeof bySeverity] += 1;
    bySource[a.source].outstanding += 1;
    if (window === "overdue") {
      overdue += 1;
      bySource[a.source].overdue += 1;
    }
    if (a.ownerUserId === null) unassigned += 1;
  }
  return { total: actions.length, outstanding, overdue, unassigned, closed, byWindow, bySeverity, bySource };
}

export interface OwnerGroup<T> {
  /** Null is the Unassigned bucket — a real bucket, not a missing value. */
  ownerUserId: string | null;
  items: T[];
  overdue: number;
}

/**
 * Outstanding actions grouped by the PERSON who owns them, across both
 * parents. Unassigned first (it is the bucket somebody must act on), then
 * owners by how much they hold, most first; ties by id so the order is stable.
 */
export function groupActionsByOwner<T extends DashboardActionFacts>(
  actions: readonly T[],
  today: string,
): OwnerGroup<T>[] {
  const groups = new Map<string | null, OwnerGroup<T>>();
  for (const a of actions) {
    if (!isOutstanding(a)) continue;
    const group = groups.get(a.ownerUserId) ?? { ownerUserId: a.ownerUserId, items: [], overdue: 0 };
    group.items.push(a);
    if (roadmapWindow(a.dueDate, today) === "overdue") group.overdue += 1;
    groups.set(a.ownerUserId, group);
  }
  return [...groups.values()].sort((x, y) => {
    if (x.ownerUserId === null) return -1;
    if (y.ownerUserId === null) return 1;
    return y.items.length - x.items.length || x.ownerUserId.localeCompare(y.ownerUserId);
  });
}

/** Outstanding actions placed in their roadmap window by their stored due date. */
export function bucketActionsByWindow<T extends DashboardActionFacts>(
  actions: readonly T[],
  today: string,
): Record<RoadmapWindow, T[]> {
  const out = Object.fromEntries(ROADMAP_WINDOWS.map((w) => [w, [] as T[]])) as Record<RoadmapWindow, T[]>;
  for (const a of actions) if (isOutstanding(a)) out[roadmapWindow(a.dueDate, today)].push(a);
  return out;
}

// ---------------------------------------------------------------------------
// "Your next steps" — the overview's first panel (Slice 10.5 B1, F1.1, Q5)
// ---------------------------------------------------------------------------

/**
 * The roles that run the programme: they see, beside their own actions, the
 * one register item that most needs someone. What a role SEES first, never
 * what it may see — every item comes from a section the API already gated.
 */
export const PROGRAMME_ROLE_CODES = ["dpdp_owner", "organization_admin", "consultant", "executive_sponsor"] as const;

export function isProgrammeRole(roleCode: string): boolean {
  return (PROGRAMME_ROLE_CODES as readonly string[]).includes(roleCode);
}

/**
 * The actions one PERSON owns and still owes — overdue first, then soonest
 * due, "next assessment cycle" (no date) last; ties by id so the order is
 * stable. The same `isOutstanding` rule as every count.
 */
export function ownOpenActions<T extends DashboardActionFacts & { id: string }>(
  actions: readonly T[],
  userId: string,
): T[] {
  return actions
    .filter((a) => a.ownerUserId === userId && isOutstanding(a))
    .sort((x, y) => {
      if (x.dueDate !== y.dueDate) {
        if (x.dueDate === null) return 1;
        if (y.dueDate === null) return -1;
        return x.dueDate.localeCompare(y.dueDate);
      }
      return x.id.localeCompare(y.id);
    });
}

export const URGENT_REGISTER_KINDS = [
  "board_report_overdue",
  "board_report_due",
  "rights_overdue",
  "erasure_overdue",
  "rights_past_target",
] as const;
export type UrgentRegisterKind = (typeof URGENT_REGISTER_KINDS)[number];

/**
 * The single register item that most needs someone, from what the overview's
 * sections already list (null for a section the caller may not read). The
 * order is TrustStack's, most time-critical first: a Board report past or
 * inside its 72 hours (Rule 7(2)(b)) — hours, not days; a request or
 * grievance past the Rules' ninety days (Rule 14(3)); an erasure past its
 * end date (Rule 8); then a request past TrustStack's own 30-day target,
 * which is not statute. Each list arrives oldest or soonest first.
 */
export function mostUrgentRegisterItem(facts: {
  breachClocks: readonly { id: string; clock: { state: BoardClockState } }[] | null;
  rightsAttention: readonly { id: string; clock: { state: RightsClockState } }[] | null;
  retentionOverdue: readonly { id: string }[] | null;
}): { kind: UrgentRegisterKind; id: string } | null {
  const breach = (state: BoardClockState) => facts.breachClocks?.find((c) => c.clock.state === state);
  const rights = (state: RightsClockState) => facts.rightsAttention?.find((r) => r.clock.state === state);
  const overdueBoard = breach("overdue");
  if (overdueBoard) return { kind: "board_report_overdue", id: overdueBoard.id };
  const runningBoard = breach("running");
  if (runningBoard) return { kind: "board_report_due", id: runningBoard.id };
  const overdueRequest = rights("overdue");
  if (overdueRequest) return { kind: "rights_overdue", id: overdueRequest.id };
  const erasure = facts.retentionOverdue?.[0];
  if (erasure) return { kind: "erasure_overdue", id: erasure.id };
  const pastTarget = rights("past_target");
  if (pastTarget) return { kind: "rights_past_target", id: pastTarget.id };
  return null;
}

// ---------------------------------------------------------------------------
// The ROPA dashboard's ten metrics (spec 03 §"ROPA Dashboard Metrics", 04 §Step K)
// ---------------------------------------------------------------------------

/** The stored fields the counts read. Every one was derived or entered — none is computed here. */
export interface RopaCountFacts {
  status: RopaStatus;
  completenessScore: number;
  completenessBand: RopaBand;
  /** The completeness areas the DATABASE found missing on its last write. */
  completenessMissing: readonly string[];
  riskRating: RopaRiskRating;
  childrenData: TriState;
  aiProcessing: TriState;
  crossBorder: TriState;
  vendorLinkCount: number;
  nextReviewAt: string | null;
}

export interface RopaRegisterCounts {
  /** Live records — archived ones are history, not the register. */
  total: number;
  archived: number;
  approved: number;
  /** Draft or in review: not yet accepted by a reviewer. */
  notApproved: number;
  /** Below the Usable band — the number a Registrar asks first. */
  belowUsable: number;
  highRisk: number;
  /** Children's data — yes, or not yet known (both need the review). */
  children: number;
  /** Linked to at least one Data Processor in the vendor register. */
  vendorLinked: number;
  /** AI or automated processing — yes, or not yet known. */
  ai: number;
  /** Where the data is held or sent is not known. */
  unknownLocation: number;
  /** The database found the retention area incomplete. */
  missingRetention: number;
  /** No next-review date, or one before today in India. */
  reviewOverdue: number;
  byBand: Record<RopaBand, number>;
}

/** The highest score of the bands below Usable — read from the band table, never re-typed. */
const USABLE_FLOOR = ROPA_BANDS.find((b) => b.band === "basic")!.maxScore;

/** A record's review is overdue with no next-review date, or one before today in India — one rule for the count and the owner's pack. */
export function ropaReviewOverdue(nextReviewAt: string | null, today: string): boolean {
  return nextReviewAt === null || nextReviewAt < today;
}

export function countRopaRegister(records: readonly RopaCountFacts[], today: string): RopaRegisterCounts {
  const live = records.filter((r) => r.status !== "archived");
  const count = (test: (r: RopaCountFacts) => boolean) => live.filter(test).length;
  const approved = count((r) => r.status === "approved");
  return {
    total: live.length,
    archived: records.length - live.length,
    approved,
    notApproved: live.length - approved,
    belowUsable: count((r) => r.completenessScore <= USABLE_FLOOR),
    highRisk: count((r) => r.riskRating === "high" || r.riskRating === "critical"),
    children: count((r) => r.childrenData !== "no"),
    vendorLinked: count((r) => r.vendorLinkCount > 0),
    ai: count((r) => r.aiProcessing !== "no"),
    unknownLocation: count((r) => r.crossBorder === "unknown"),
    missingRetention: count((r) => r.completenessMissing.includes("retention")),
    reviewOverdue: count((r) => ropaReviewOverdue(r.nextReviewAt, today)),
    byBand: Object.fromEntries(ROPA_BANDS.map((b) => [b.band, count((r) => r.completenessBand === b.band)])) as Record<
      RopaBand,
      number
    >,
  };
}
