"use client";

import type {
  ActionSource,
  ActionSummary,
  BoardClock,
  BreachCounts,
  GapPriority,
  GapSeverity,
  GapState,
  RetentionCounts,
  RightsClock,
  RightsCounts,
  RopaRegisterCounts,
} from "@truststack/core";
import type { AssessmentScorePayload } from "./assessments";
import type { GapAction, GapCounts } from "./gaps";

/** The shape `GET …/dashboard` returns (Slice 8). Every number in it was produced by the engine or the database. */

export interface DashboardReadiness {
  assessment: { id: string; name: string; status: string; assessmentType: string; createdAt: string };
  score: AssessmentScorePayload;
  /** Null when the caller cannot read gaps. */
  gaps: { frozen: boolean; stale: boolean; generated: boolean; counts: GapCounts } | null;
}

/** One action owed, from either parent, labelled by where it came from. */
export interface DashboardActionItem extends GapAction {
  source: ActionSource;
  sourceLabel: string;
  /** The domain (assessment), the record and rule (register), or the breach's code and nature — never a question code. */
  context: string;
  parentName: string;
  href: string;
  gapState: GapState;
  severity: GapSeverity;
  priority: GapPriority;
}

export interface DashboardPayload {
  organizationId: string;
  today: string;
  omitted: string[];
  readiness: { finalised: DashboardReadiness | null; inProgress: DashboardReadiness | null } | null;
  actions: { sources: ActionSource[]; summary: ActionSummary; items: DashboardActionItem[] } | null;
  ropa: {
    positioning: string;
    counts: RopaRegisterCounts;
    gaps: { counts: GapCounts; stale: boolean; generated: boolean } | null;
  } | null;
  /** Slice 10: null when the caller cannot read the breach register. */
  breaches: {
    now: string;
    counts: BreachCounts;
    clocks: { id: string; incidentCode: string; title: string; clock: BoardClock }[];
    clockNote: string;
  } | null;
  /** Slice 10 Stage 2: null when the caller cannot read the rights register. */
  rights: {
    today: string;
    counts: RightsCounts;
    attention: { id: string; requestCode: string; kindLabel: string; clock: RightsClock }[];
    clockNote: string;
  } | null;
  /** Slice 10 Stage 5 (D-096): null when the caller cannot read the retention register. */
  retention: {
    today: string;
    counts: RetentionCounts;
    overdue: { id: string; recordCode: string | null; endsOn: string | null; erasureIncomplete: boolean }[];
    note: string;
  } | null;
}

/** `2026-10-03T…` → `3 Oct 2026`, India's calendar. */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
