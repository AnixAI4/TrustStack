/**
 * The AI risk register (Slice 10, Stage 5) — one row per AI system or AI use:
 * what it is for, the personal data it uses, whether it tracks, monitors or
 * targets advertising at children (and the exemption relied on), the
 * human-review step and the last review. Data and pure functions; `today` is
 * always passed in (D-055).
 *
 * DPDP anchoring: algorithmic due diligence — verifying that technical
 * measures "including algorithmic software" are not likely to pose a risk to
 * the rights of Data Principals — binds a SIGNIFICANT DATA FIDUCIARY only
 * (Rule 13(3)). For every other organisation the register is ENABLING, never
 * a status (D-073): its only model row (1.5.0) is a reason on head 4, and head
 * 4 applies only once an SDF notification is recorded. Children: s.9(3) bars
 * tracking, behavioural monitoring and targeted advertising directed at
 * children, save under a Fourth Schedule exemption (Rule 12). The register asks
 * exactly that question and, on "yes", which exemption is relied on — the
 * processing register's vocabulary (D-096, R5). "Yes" with no exemption is a
 * warning and a count; the model reads it nowhere (counsel first).
 *
 * Written with `ropa.write` and read with `ropa.read` — the register sits
 * beside the processing register (D-094.2, D-096). It has no actions of its
 * own: its fixes are its own fields (D-094.3).
 */

import { addMonths } from "./breach.js";
import { isCalendarDate } from "./gaps.js";
import { ROPA_CHILD_EXEMPTION_CODES, type RopaChildExemption } from "./ropa.js";
import { AI_USAGE_TYPES, type AiUsageType, type TriState } from "./scope.js";

export class AiRiskInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiRiskInputError";
  }
}

export const AI_SYSTEM_STATUSES = ["in_use", "retired"] as const;
export type AiSystemStatus = (typeof AI_SYSTEM_STATUSES)[number];

export const AI_SYSTEM_STATUS_LABEL: Readonly<Record<AiSystemStatus, string>> = Object.freeze({
  in_use: "In use",
  retired: "Retired",
});

/** The scope's AI uses a register row may name — every one but "none". */
export const AI_REGISTER_USAGE_TYPES = AI_USAGE_TYPES.filter((t): t is Exclude<AiUsageType, "none"> => t !== "none");
export type AiRegisterUsageType = (typeof AI_REGISTER_USAGE_TYPES)[number];

export const AI_USAGE_LABEL: Readonly<Record<AiRegisterUsageType, string>> = Object.freeze({
  proctoring: "Proctoring",
  chatbot: "Chatbot",
  analytics: "Analytics",
  scoring: "Scoring",
  recommendation: "Recommendation",
});

/**
 * How often a system in use should be reviewed: twelve months — a TrustStack
 * DEFAULT, never statute (Rule 13(3) sets no interval; pitfall 1).
 */
export const AI_REVIEW_MONTHS = 12;
export const AI_TEXT_LIMIT = 2000;
export const AI_NAME_LIMIT = 200;
/** Nothing under the Act is reviewed before it received assent (11 Aug 2023). */
export const AI_EARLIEST_REVIEW_ON = "2023-08-11";

/** s.9(3), asked as the Act asks it (D-096, R5). */
export const AI_CHILD_TRACKING_QUESTION = "Does it track, behaviourally monitor or target advertising at children?";

export const AI_CHILD_UNEXEMPT_WARNING =
  "It tracks, monitors or targets advertising at children and no Fourth Schedule exemption is recorded: s.9(3) bars this unless an exemption applies (Rule 12). Record the exemption relied on, or stop the processing — counsel to confirm.";

/**
 * Why the children's answer is refused, in words — the CHECK's rule, earlier.
 * An exemption is recorded only when the system does track, monitor or target
 * children, and is one of the Fourth Schedule's eleven.
 */
export function aiChildProblem(childTracking: TriState, childExemption: string | null): string | null {
  if (childExemption === null) return null;
  if (childTracking !== "yes") return "An exemption is recorded only when the system tracks, monitors or targets advertising at children.";
  if (!(ROPA_CHILD_EXEMPTION_CODES as readonly string[]).includes(childExemption)) return "That is not one of the Fourth Schedule's exemptions.";
  return null;
}

/** In use, tracking children, and no exemption recorded — the register's red warning. */
export function aiChildTrackingUnexempt(f: { status: AiSystemStatus; childTracking: TriState; childExemption: RopaChildExemption | null }): boolean {
  return f.status === "in_use" && f.childTracking === "yes" && f.childExemption === null;
}

export const AI_RISK_NOTE =
  "Algorithmic due diligence binds a Significant Data Fiduciary (Rule 13(3)). For any other organisation this register is good practice, not a statutory record, and it never sets an exposure status. The twelve-month review interval is a TrustStack default.";

/** What the model reads of one row (1.5.0). */
export interface AiSystemFacts {
  status: AiSystemStatus;
  /** The last review recorded, `YYYY-MM-DD`, or null when none is. */
  lastReviewedOn: string | null;
}

/** The day the next review is due, or null when none has been recorded. */
export function aiReviewDueOn(lastReviewedOn: string | null): string | null {
  if (lastReviewedOn === null) return null;
  if (!isCalendarDate(lastReviewedOn)) throw new AiRiskInputError(`lastReviewedOn must be YYYY-MM-DD (got ${lastReviewedOn})`);
  return addMonths(lastReviewedOn, AI_REVIEW_MONTHS);
}

/**
 * Model 1.5.0's `ai_system_unreviewed`: in use, and no review recorded, or the
 * last one more than twelve months ago (strictly after the due date).
 */
export function aiSystemUnreviewed(f: AiSystemFacts, today: string): boolean {
  if (f.status !== "in_use") return false;
  const due = aiReviewDueOn(f.lastReviewedOn);
  return due === null || today > due;
}

export interface AiRegisterCounts {
  total: number;
  inUse: number;
  unreviewed: number;
  /** In use and tracking, monitoring or targeting advertising at children (s.9(3)). */
  childTracking: number;
  /** …of which no Fourth Schedule exemption is recorded — the red warning. */
  childTrackingUnexempt: number;
  /** In use and the children's question not yet answered. */
  childTrackingUnknown: number;
}

/** The register's headline, counted over rows a reader returned (D-069). */
export function countAiSystems(
  rows: readonly (AiSystemFacts & { childTracking: TriState; childExemption: RopaChildExemption | null })[],
  today: string,
): AiRegisterCounts {
  const inUse = rows.filter((r) => r.status === "in_use");
  return {
    total: rows.length,
    inUse: inUse.length,
    unreviewed: rows.filter((r) => aiSystemUnreviewed(r, today)).length,
    childTracking: inUse.filter((r) => r.childTracking === "yes").length,
    childTrackingUnexempt: rows.filter(aiChildTrackingUnexempt).length,
    childTrackingUnknown: inUse.filter((r) => r.childTracking === "unknown").length,
  };
}
