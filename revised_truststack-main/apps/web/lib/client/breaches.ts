"use client";

import type { BoardClock, BreachCounts, BreachNature, BreachSeverity, BreachStatus } from "@truststack/core";
import type { EvidenceItem } from "./assessments";
import type { GapAction, GapMember } from "./gaps";

/** Shapes the breach register API returns (Slice 10, Stage 1). Every time is a UTC instant. */

export interface RecordedBy {
  at: string;
  byUserId: string | null;
  byName: string | null;
}

export interface BreachIncident {
  id: string;
  incidentCode: string;
  title: string;
  description: string | null;
  nature: BreachNature;
  natureLabel: string;
  severity: BreachSeverity;
  status: BreachStatus;
  statusLabel: string;
  awareAt: string;
  occurredAt: string | null;
  location: string | null;
  principalsAffected: number | null;
  dataCategories: string | null;
  likelyImpact: string | null;
  containmentMeasures: string | null;
  dismissalReason: string | null;
  board: {
    dueAt: string;
    clock: BoardClock;
    extension: { until: string; reference: string | null; recorded: RecordedBy | null } | null;
    initial: { at: string; recorded: RecordedBy | null } | null;
    report: { at: string; reference: string | null; recorded: RecordedBy | null } | null;
  };
  principals: { at: string; method: string | null; recorded: RecordedBy | null } | null;
  closedAt: string | null;
  closedByName: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  actions: GapAction[];
  /** Documents on the incident itself (evidence link type `breach_incident`, Stage 6). */
  documents: EvidenceItem[];
}

export interface BreachRegisterPayload {
  organizationId: string;
  now: string;
  counts: BreachCounts;
  clockNote: string;
  incidents: BreachIncident[];
}

export interface BreachDetailPayload {
  now: string;
  incident: BreachIncident;
  members: GapMember[];
  clockNote: string;
}

export const STATUS_STYLE: Record<BreachStatus, string> = {
  open: "bg-red-100 text-red-900",
  contained: "bg-amber-100 text-amber-900",
  closed: "bg-emerald-100 text-emerald-900",
  dismissed: "bg-slate-100 text-slate-700",
};

/** TrustStack's alert bands (targets, not statute) — and the overdue state, which is the Rules'. */
export const CLOCK_STYLE: Record<string, string> = {
  normal: "text-slate-800",
  warning: "text-amber-800 font-medium",
  critical: "text-red-800 font-semibold",
  overdue: "text-red-900 font-semibold",
};

const IST = "+05:30";

/**
 * A `datetime-local` value (`2026-10-12T14:05`) read as INDIA's time, never
 * the browser's: the register records when things happened in India, and a
 * consultant's laptop abroad must not shift the Rule 7 clock.
 */
export function istInputToInstant(value: string): string {
  return `${value}:00${IST}`;
}

/** An instant as a `datetime-local` value in India's time. */
export function instantToIstInput(instant: string): string {
  return new Date(Date.parse(instant) + 330 * 60_000).toISOString().slice(0, 16);
}

/** Now, as a `datetime-local` value in India's time — a sensible default for "when did this happen". */
export function nowIstInput(): string {
  return instantToIstInput(new Date().toISOString());
}

export type { GapMember };
