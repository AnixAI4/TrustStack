"use client";

import type {
  ExposureChanges,
  ExposureResult,
  ExposureStatus,
  ForecastResult,
  HeadExposure,
  LeverageEntry,
  PositionBand,
  SlippageWarning,
  WhatIfDelta,
} from "@truststack/core";

/** Shapes the exposure API returns (Slice 9). Every figure in them came from the model or the database. */

/** One open action, in plain words — never a question code, pack or trigger (D-071). */
export interface ExposureActionView {
  title: string;
  ownerUserId: string | null;
  ownerName: string | null;
  status: string;
  dueDate: string | null;
  source: string;
  sourceLabel: string;
  context: string;
  href: string;
  severity: string;
}

export interface ExposurePayload extends ExposureResult {
  organizationId: string;
  live: true;
  assessment: { id: string; name: string; status: string; createdAt: string } | null;
  freshness: {
    scopeSaved: boolean;
    assessmentProvisional: boolean | null;
    outstandingQuestions: number | null;
    assessmentGapsStale: boolean | null;
    registerGapsGenerated: boolean;
    registerGapsStale: boolean;
  };
  intelligence: {
    forecast: ForecastResult;
    leverage: (Omit<LeverageEntry, "gapIndex"> & { action: ExposureActionView | null })[];
    slippage: SlippageWarning[];
    changes: ExposureChanges | null;
  };
  lastSnapshot: { id: string; recordedAt: string; modelVersion: string; ceilingsAtStakeCrore: number; exposedHeads: number } | null;
}

export interface WhatIfHeadView {
  code: HeadExposure["code"];
  title: string;
  status: ExposureStatus;
  statusLabel: string;
  atStake: boolean;
  position: { band: PositionBand; bandLabel: string; rangeLabel: string; points: number } | null;
}

export interface WhatIfPayload {
  actions: { actionId: string; action: ExposureActionView | null }[];
  unknownActionIds: string[];
  before: { headline: ExposureResult["headline"]; heads: WhatIfHeadView[] };
  after: { headline: ExposureResult["headline"]; heads: WhatIfHeadView[] };
  change: WhatIfDelta;
  forecast: { before: ForecastResult; after: ForecastResult };
}

export interface ExposureSnapshotSummary {
  id: string;
  recordedAt: string;
  recordedByName: string | null;
  asOf: string;
  modelVersion: string;
  basis: string;
  ceilingsAtStakeCrore: number;
  exposedHeads: number;
  applicableHeads: number;
  heads: { code: string; title: string; status: ExposureStatus; statusLabel: string; atStake: boolean; band: PositionBand | null }[];
}

/** Status chips. "Not yet assessed" is never styled as "Exposed" (decision 3). */
export const EXPOSURE_STATUS_STYLE: Readonly<Record<ExposureStatus, string>> = Object.freeze({
  exposed: "bg-red-100 text-red-900 ring-1 ring-red-300",
  partially_mitigated: "bg-amber-100 text-amber-900 ring-1 ring-amber-300",
  not_yet_assessed: "bg-slate-100 text-slate-800 ring-1 ring-slate-300 border-dashed",
  mitigated: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300",
  not_applicable: "bg-white text-slate-500 ring-1 ring-slate-200",
});

/** ₹ crore, Indian grouping. A CEILING when it is a sum — callers say so. */
export function formatCrore(crore: number): string {
  return `₹${crore.toLocaleString("en-IN", { maximumFractionDigits: 2 })} crore`;
}

/** `YYYY-MM-DD` → "13 May 2027". */
export function formatDate(day: string | null): string {
  if (!day) return "—";
  const [y, m, d] = day.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export const headLabel = (serial: number) => `Penalty head ${serial}`;

/** "208 days to 13 May 2027" (Slice 10.5 B1, F1.3) — the number and the date are the model's, unchanged. */
export function daysToDeadlineText(days: number, deadline: string): string {
  const date = formatDate(deadline);
  if (days === 0) return `${date} is today`;
  const n = Math.abs(days);
  const unit = n === 1 ? "day" : "days";
  return days > 0 ? `${n.toLocaleString("en-IN")} ${unit} to ${date}` : `${n.toLocaleString("en-IN")} ${unit} past ${date}`;
}

/** "finish date: not enough history yet" (F1.3) — the forecast's own state, in words. */
export function finishDateText(forecast: { outstanding: number; p50Date: string | null }, notEnoughHistory: boolean): string {
  if (forecast.outstanding === 0) return "finish date: nothing open";
  if (notEnoughHistory) return "finish date: not enough history yet";
  return `finish date: ${forecast.p50Date ? formatDate(forecast.p50Date) : "beyond five years"}`;
}
