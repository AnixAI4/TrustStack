/**
 * TrustStack Intelligence over the exposure model (Slice 9, Stage 2): which
 * actions retire the most exposure, what closing some of them would change,
 * where the programme is slipping, and what moved since the last snapshot.
 *
 * Pure, like `exposureFor`: no I/O, no clock. Every figure here is either a
 * count of rows the readers returned or the model run again on a changed
 * input — never a new score, severity or ceiling.
 */

import type { GapSeverity } from "./engine.js";
import {
  COMMENCEMENT,
  EXPOSURE_STATUS_LABEL,
  exposureFor,
  gapDirectHeads,
  gapIsOutstanding,
  type ExposureGapInput,
  type ExposureInput,
  type ExposureRegisterActionInput,
  type ExposureResult,
  type ExposureStatus,
  type ModelledHeadCode,
  type PositionBand,
} from "./exposure.js";
import { forecast, type ForecastResult, type ForecastWork } from "./forecast.js";
import { countNoun } from "./words.js";

// ---------------------------------------------------------------------------
// The outstanding work the forecast projects
// ---------------------------------------------------------------------------

const CRITICAL_HIGH: readonly GapSeverity[] = ["critical", "high"];

/**
 * Units of work still owed: each OUTSTANDING gap the model reads
 * (`gapIsOutstanding`) counts its actions that are not closed — or one, if it
 * has no action yet — and (1.7.0) each action on a breach, a request or a
 * retention schedule counts one while its record stands and it is not closed,
 * the Actions page's own rule. Mirrored in SQL by `app.exposure_outstanding_work`.
 */
export function outstandingWork(gaps: readonly ExposureGapInput[], registerActions: readonly ExposureRegisterActionInput[] = []): ForecastWork {
  let criticalHigh = 0;
  let all = 0;
  for (const g of gaps) {
    if (!gapIsOutstanding(g)) continue;
    const units = Math.max(1, g.actions.filter((a) => a.status !== "closed").length);
    all += units;
    if (CRITICAL_HIGH.includes(g.severity)) criticalHigh += units;
  }
  for (const a of registerActions) {
    if (!registerActionIsOutstanding(a)) continue;
    all += 1;
    if (CRITICAL_HIGH.includes(a.severity)) criticalHigh += 1;
  }
  return { criticalHigh, all };
}

/** Still owed: its breach, request or schedule stands (not dismissed or void) and it is not closed. */
export function registerActionIsOutstanding(a: Pick<ExposureRegisterActionInput, "state" | "status">): boolean {
  return a.state === "open" && a.status !== "closed";
}

/** The forecast for this input: its own outstanding work, the organisation's closure history. */
export function exposureForecast(input: ExposureInput, closedOn: readonly string[]): ForecastResult {
  return forecast({
    closedOn,
    work: outstandingWork(input.gaps, input.registerActions),
    today: input.today,
    deadline: COMMENCEMENT.substantive,
  });
}

// ---------------------------------------------------------------------------
// Leverage — the actions that retire the most exposure
// ---------------------------------------------------------------------------

/** How much a gap's severity weighs in leverage. Model data, with the model version. */
export const LEVERAGE_SEVERITY_WEIGHT: Readonly<Record<GapSeverity, number>> = Object.freeze({
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  improvement: 0,
  no_gap: 0,
});

export interface LeverageEntry {
  actionId: string;
  /** Index into `input.gaps` — the reader uses it to attach the title, owner and context. */
  gapIndex: number;
  severity: GapSeverity;
  /** The heads at stake this action's gap counts against, directly. */
  heads: ModelledHeadCode[];
  /** Σ (ceiling in crore of each head at stake) × the severity's weight. A ranking, never a rupee figure. */
  weight: number;
  dueDate: string | null;
  ownerUserId: string | null;
  /** What closing this action ALONE would change (the model, run again). */
  alone: WhatIfDelta;
}

/**
 * Every open action on a gap the model reads, weighted by the ceilings of the
 * heads it counts against that are AT STAKE × its gap's severity, highest
 * first (§8). An action whose heads are all mitigated or not applicable — or
 * whose gap is an enabling control only — retires nothing and is not listed.
 * Ties: the earlier due date (none last), then the action id, so the order is
 * stable.
 */
export function leverage(input: ExposureInput, exposure: ExposureResult, limit = 10): LeverageEntry[] {
  const atStake = new Map(exposure.heads.filter((h) => h.atStake).map((h) => [h.code, h.ceilingCrore]));
  const entries: Omit<LeverageEntry, "alone">[] = [];
  input.gaps.forEach((gap, gapIndex) => {
    if (!gapIsOutstanding(gap)) return;
    const heads = gapDirectHeads(gap).filter((h) => atStake.has(h));
    const ceilings = heads.reduce((sum, h) => sum + atStake.get(h)!, 0);
    const weight = ceilings * LEVERAGE_SEVERITY_WEIGHT[gap.severity];
    if (weight <= 0) return;
    for (const action of gap.actions) {
      if (action.status === "closed" || !action.id) continue;
      entries.push({
        actionId: action.id,
        gapIndex,
        severity: gap.severity,
        heads,
        weight,
        dueDate: action.dueDate,
        ownerUserId: action.ownerUserId,
      });
    }
  });
  entries.sort(
    (a, b) =>
      b.weight - a.weight ||
      (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") ||
      a.actionId.localeCompare(b.actionId),
  );
  return entries.slice(0, limit).map((e) => ({ ...e, alone: delta(exposure, exposureFor(closeActions(input, [e.actionId]).input)) }));
}

// ---------------------------------------------------------------------------
// What-if — the model again, with some actions treated as closed
// ---------------------------------------------------------------------------

/** The input with these actions closed. Never mutates the input; ids not on it are returned. */
export function closeActions(input: ExposureInput, actionIds: readonly string[]): { input: ExposureInput; closed: string[]; unknown: string[] } {
  const wanted = new Set(actionIds);
  const closed = new Set<string>();
  const gaps = input.gaps.map((g) => ({
    ...g,
    actions: g.actions.map((a) => {
      if (!a.id || !wanted.has(a.id)) return a;
      closed.add(a.id);
      return { ...a, status: "closed" as const };
    }),
  })) as ExposureGapInput[];
  return {
    input: { ...input, gaps },
    closed: [...closed],
    unknown: [...wanted].filter((id) => !closed.has(id)),
  };
}

export interface HeadChange {
  code: ModelledHeadCode;
  title: string;
  fromStatus: ExposureStatus;
  toStatus: ExposureStatus;
  fromLabel: string;
  toLabel: string;
  fromBand: PositionBand | null;
  toBand: PositionBand | null;
}

export interface WhatIfDelta {
  ceilingsAtStakeCrore: { from: number; to: number };
  exposedHeads: { from: number; to: number };
  /** Only the heads whose status or band moved. */
  heads: HeadChange[];
}

/** How the second model run differs from the first. */
export function delta(from: Pick<ExposureResult, "heads" | "headline">, to: Pick<ExposureResult, "heads" | "headline">): WhatIfDelta {
  const before = new Map(from.heads.map((h) => [h.code, h]));
  const heads: HeadChange[] = [];
  for (const h of to.heads) {
    const b = before.get(h.code);
    if (!b) continue;
    const fromBand = b.position?.band ?? null;
    const toBand = h.position?.band ?? null;
    if (b.status === h.status && fromBand === toBand) continue;
    heads.push({
      code: h.code,
      title: h.title,
      fromStatus: b.status,
      toStatus: h.status,
      fromLabel: EXPOSURE_STATUS_LABEL[b.status],
      toLabel: EXPOSURE_STATUS_LABEL[h.status],
      fromBand,
      toBand,
    });
  }
  return {
    ceilingsAtStakeCrore: { from: from.headline.ceilingsAtStakeCrore, to: to.headline.ceilingsAtStakeCrore },
    exposedHeads: { from: from.headline.exposedHeads, to: to.headline.exposedHeads },
    heads,
  };
}

export interface WhatIfResult {
  actionIds: string[];
  /** Ids asked for that are not open actions on a gap the model reads. */
  unknownActionIds: string[];
  before: ExposureResult;
  after: ExposureResult;
  change: WhatIfDelta;
  forecast: { before: ForecastResult; after: ForecastResult };
}

/**
 * `exposureFor` + the forecast with these actions treated as closed (§8).
 * Read-only by construction: it is a pure function over a copy of the input.
 */
export function whatIf(input: ExposureInput, actionIds: readonly string[], closedOn: readonly string[]): WhatIfResult {
  const before = exposureFor(input);
  const changed = closeActions(input, actionIds);
  const after = exposureFor(changed.input);
  return {
    actionIds: changed.closed,
    unknownActionIds: changed.unknown,
    before,
    after,
    change: delta(before, after),
    forecast: { before: exposureForecast(input, closedOn), after: exposureForecast(changed.input, closedOn) },
  };
}

// ---------------------------------------------------------------------------
// Slippage — where the programme is falling behind
// ---------------------------------------------------------------------------

export const SLIPPAGE_CODES = [
  "not_enough_history",
  "critical_high_after_deadline",
  "all_work_after_deadline",
  "pace_below_required",
  "overdue_on_heads_at_stake",
  "unassigned_on_heads_at_stake",
] as const;
export type SlippageCode = (typeof SLIPPAGE_CODES)[number];

export interface SlippageWarning {
  code: SlippageCode;
  /** `warning` needs action; `notice` is information the reader should have. */
  level: "warning" | "notice";
  text: string;
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-IN")} ${n === 1 ? one : many}`;
const DEADLINE_LABEL = "13 May 2027";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** `2027-05-18` → "18 May 2027": plain words for a warning, the same on server and client. */
export const dayLabel = (day: string) => `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1]} ${day.slice(0, 4)}`;

/**
 * Plain-language warnings from the forecast and the open actions on heads at
 * stake. Counts only; `today` is passed in (an overdue action is one whose
 * stored due date is before today in India — today itself is not overdue).
 */
export function slippage(input: ExposureInput, exposure: ExposureResult, projection: ForecastResult): SlippageWarning[] {
  const out: SlippageWarning[] = [];
  const { criticalHigh, all } = projection;

  if (projection.notEnoughHistory && all.outstanding > 0) {
    out.push({
      code: "not_enough_history",
      level: "notice",
      text: "Fewer than two of the last eight weeks closed an action, so there is not enough history to forecast a finish date.",
    });
  }
  if (criticalHigh.outstanding > 0 && (criticalHigh.meetsDeadline.p50 === false || criticalHigh.beyondHorizon.p50)) {
    out.push({
      code: "critical_high_after_deadline",
      level: "warning",
      text: criticalHigh.p50Date
        ? `At the current pace, critical and high work is likely to finish around ${dayLabel(criticalHigh.p50Date)} — after ${DEADLINE_LABEL}.`
        : `At the current pace, critical and high work would not finish within five years — long after ${DEADLINE_LABEL}.`,
    });
  }
  if (all.outstanding > 0 && (all.meetsDeadline.p85 === false || all.beyondHorizon.p85)) {
    out.push({
      code: "all_work_after_deadline",
      level: "warning",
      text: all.p85Date
        ? `There is a real risk (1 in 7 or more) that all work finishes after ${DEADLINE_LABEL}: the cautious projection is ${dayLabel(all.p85Date)}.`
        : `At the current pace, all work would not finish within five years.`,
    });
  }
  if (all.requiredPerWeek !== null && all.outstanding > 0 && projection.averagePerWeek < all.requiredPerWeek) {
    out.push({
      code: "pace_below_required",
      level: "warning",
      text: `The organisation closes about ${countNoun(projection.averagePerWeek, "action", "actions")} a week; ${all.requiredPerWeek} a week are needed to finish all work by ${DEADLINE_LABEL}.`,
    });
  }

  const atStake = new Set(exposure.heads.filter((h) => h.atStake).map((h) => h.code));
  let overdue = 0;
  let unassigned = 0;
  for (const g of input.gaps) {
    if (!gapIsOutstanding(g) || !gapDirectHeads(g).some((h) => atStake.has(h))) continue;
    for (const a of g.actions) {
      if (a.status === "closed") continue;
      if (a.dueDate !== null && a.dueDate < input.today) overdue += 1;
      if (a.ownerUserId === null) unassigned += 1;
    }
  }
  if (overdue > 0) {
    out.push({
      code: "overdue_on_heads_at_stake",
      level: "warning",
      text: `${plural(overdue, "action is", "actions are")} past due on penalty heads that are at stake.`,
    });
  }
  if (unassigned > 0) {
    out.push({
      code: "unassigned_on_heads_at_stake",
      level: "warning",
      text: `${plural(unassigned, "action has", "actions have")} no owner on penalty heads that are at stake.`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// What changed since the last stored snapshot
// ---------------------------------------------------------------------------

/** What a stored snapshot keeps per head — `app.exposure_evaluate`'s shape. */
export interface StoredHead {
  code: ModelledHeadCode;
  status: ExposureStatus;
  position: { band: PositionBand } | null;
}

export interface StoredSnapshotSummary {
  id: string;
  recordedAt: string;
  modelVersion: string;
  ceilingsAtStakeCrore: number;
  exposedHeads: number;
  heads: readonly StoredHead[];
}

export interface ExposureChanges {
  since: { snapshotId: string; recordedAt: string; modelVersion: string };
  /** True when the snapshot was recorded under another model version: a move may be the model, not the organisation. */
  modelChanged: boolean;
  change: WhatIfDelta;
}

/** The live model against the newest stored snapshot. Null when none is stored. */
export function exposureChanges(last: StoredSnapshotSummary | null, now: ExposureResult): ExposureChanges | null {
  if (last === null) return null;
  const titles = new Map(now.heads.map((h) => [h.code, h.title]));
  const from = {
    heads: last.heads.map((h) => ({ code: h.code, status: h.status, title: titles.get(h.code) ?? h.code, position: h.position })),
    headline: { ceilingsAtStakeCrore: last.ceilingsAtStakeCrore, exposedHeads: last.exposedHeads },
  } as unknown as Pick<ExposureResult, "heads" | "headline">;
  return {
    since: { snapshotId: last.id, recordedAt: last.recordedAt, modelVersion: last.modelVersion },
    modelChanged: last.modelVersion !== now.modelVersion,
    change: delta(from, now),
  };
}
