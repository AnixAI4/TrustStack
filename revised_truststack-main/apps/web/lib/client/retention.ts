"use client";

import type {
  AiRegisterCounts,
  AiRegisterUsageType,
  AiSystemStatus,
  ErasureMethod,
  ErasureStanding,
  ProcessorErasureAnswer,
  RetentionBasis,
  RetentionCounts,
  RetentionState,
  RopaChildExemption,
  ThirdScheduleClass,
  TriState,
} from "@truststack/core";
import type { EvidenceItem } from "./assessments";
import type { RecordedBy } from "./breaches";
import type { GapAction, GapMember } from "./gaps";

/** Shapes the retention register and the AI risk register APIs return (Slice 10, Stage 5). Every date is India's calendar. */

export interface RetentionErasure {
  id: string;
  erasedOn: string;
  method: ErasureMethod;
  methodLabel: string;
  methodNote: string | null;
  processorsTold: ProcessorErasureAnswer;
  processorsToldLabel: string;
  principalsInformedOn: string | null;
  recorded: RecordedBy;
  /** Only "counts" clears the overdue state and closes an action (D-096). */
  standing: ErasureStanding;
  standingLabel: string;
  /** Marked as recorded in error — the erasure stays, struck through. */
  void: (RecordedBy & { reason: string }) | null;
}

export interface RetentionSchedule {
  id: string;
  ropaRecordId: string;
  record: { id: string; recordCode: string; name: string; status: string } | null;
  basis: RetentionBasis;
  basisLabel: string;
  provision: string;
  startLabel: string;
  periodMonths: number;
  lawName: string | null;
  startsOn: string | null;
  /** The database's: start + period. */
  endsOn: string | null;
  /** The database's: two days before the end, the Third-Schedule period only (Rule 8(2)). */
  informBy: string | null;
  notes: string | null;
  clock: { state: RetentionState; label: string; endsOn: string | null; daysToEnd: number | null; endingSoon: boolean };
  /** The latest erasure that counts (D-096). */
  lastErasedOn: string | null;
  /** "Erasure incomplete — processors not told" (s.8(7)(b)). */
  erasureIncomplete: boolean;
  erasures: RetentionErasure[];
  documents: EvidenceItem[];
  actions: GapAction[];
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThirdScheduleFact {
  class: ThirdScheduleClass;
  label: string;
}

export interface RetentionRegisterPayload {
  organizationId: string;
  today: string;
  counts: RetentionCounts;
  note: string;
  thirdSchedule: ThirdScheduleFact | null;
  schedules: RetentionSchedule[];
}

export interface RetentionDetailPayload {
  today: string;
  schedule: RetentionSchedule;
  members: GapMember[];
  note: string;
  thirdSchedule: ThirdScheduleFact | null;
}

export interface AiSystem {
  id: string;
  name: string;
  systemId: string | null;
  system: { id: string; name: string; systemType: string } | null;
  usageType: AiRegisterUsageType | null;
  usageLabel: string | null;
  purpose: string;
  personalData: string;
  childTracking: TriState;
  childExemption: RopaChildExemption | null;
  childExemptionLabel: string | null;
  childTrackingUnexempt: boolean;
  humanReview: string | null;
  status: AiSystemStatus;
  statusLabel: string;
  lastReviewedOn: string | null;
  reviewDueOn: string | null;
  reviewDue: boolean;
  review: RecordedBy | null;
  documents: EvidenceItem[];
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiRegisterPayload {
  organizationId: string;
  today: string;
  counts: AiRegisterCounts;
  note: string;
  sdfNotified: boolean;
  scopeSystems: { id: string; name: string; systemType: string }[];
  systems: AiSystem[];
}

export interface AiDetailPayload {
  today: string;
  system: AiSystem;
  note: string;
}

export const RETENTION_STATE_STYLE: Record<RetentionState, string> = {
  no_end: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  running: "bg-slate-100 text-slate-800",
  overdue: "bg-red-100 text-red-900",
  erased: "bg-emerald-100 text-emerald-900",
};

export const TRI_LABEL: Record<TriState, string> = { yes: "Yes", no: "No", unknown: "Not known" };
