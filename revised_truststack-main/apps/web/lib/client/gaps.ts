"use client";

import type { ClosureBasis, GapActionStatus, GapPriority, GapSeverity, GapState } from "@truststack/core";
import type { EvidenceItem } from "./assessments";

/** Shapes the gap-register API returns (Slice 6). Kept next to the client fetch helper. */

export interface GapAction {
  id: string;
  /** Exactly one is set (D-060): an assessment gap, or a ROPA gap (Slice 7). */
  gapId: string | null;
  ropaGapId: string | null;
  /** Slice 10: a breach's action (one action table, four parents). */
  breachIncidentId: string | null;
  /** Slice 10 Stage 2: a Data Principal's request's or grievance's action. */
  rightsRequestId: string | null;
  /** Slice 10 Stage 5: a retention schedule's action — an erasure that is owed. */
  retentionScheduleId: string | null;
  title: string;
  ownerUserId: string | null;
  ownerName: string | null;
  /** The question's suggested owner, as authored — a role, not a person. */
  ownerRole: string | null;
  status: GapActionStatus;
  /** `YYYY-MM-DD`, stored. Null = next assessment cycle. */
  dueDate: string | null;
  closedAt: string | null;
  closedBy: string | null;
  closedByName: string | null;
  closureBasis: ClosureBasis | null;
  notes: string | null;
  updatedAt: string;
  evidence: EvidenceItem[];
}

export interface Gap {
  id: string;
  assessmentId: string;
  questionCode: string;
  questionText: string | null;
  domainCode: string;
  domainName: string;
  severity: GapSeverity;
  priority: GapPriority;
  /** The question's own authored priority, or null — shown as "—", never guessed. */
  questionPriority: string | null;
  adjustedScore: number;
  state: GapState;
  finding: string;
  recommendedFix: string | null;
  evidenceGuidance: string | null;
  generatedAt: string;
  actions: GapAction[];
}

export interface GapCounts {
  gapCount: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  supersededCount: number;
}

export interface GapMember {
  userId: string;
  fullName: string | null;
  roleName: string;
}

export interface GapRegisterPayload {
  assessmentId: string;
  status: string;
  /** A finalised assessment's gaps were generated with its score and cannot move. */
  frozen: boolean;
  /** The answers have changed since the register was generated. */
  stale: boolean;
  answeredCount: number;
  counts: GapCounts;
  gaps: Gap[];
  members: GapMember[];
}

export const CLOSURE_BASIS_LABEL: Record<ClosureBasis, string> = {
  evidence: "reviewed evidence",
  reviewer_approval: "a reviewer's approval",
  erasure_recorded: "an erasure recorded by someone else",
};

/** What each priority means to the person doing the work — never a bare code. */
export const PRIORITY_MEANING: Record<GapPriority, string> = {
  P0: "within 30 days",
  P1: "within 60 days",
  P2: "within 90 days",
  P3: "next assessment cycle",
  Monitor: "monitor",
};

export const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-red-100 text-red-900",
  high: "bg-orange-100 text-orange-900",
  medium: "bg-amber-100 text-amber-900",
  low: "bg-slate-100 text-slate-800",
};

/** "Today" as a calendar date in India — the same day the database stamps a due date from. */
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

/** `2026-12-01` → `1 Dec 2026`. A calendar date is formatted as one, never shifted by a time zone. */
export function formatDueDate(date: string | null): string {
  if (date === null) return "Next assessment cycle";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
