/**
 * Evidence-capped scoring (Slice 4). Pure functions, no I/O.
 *
 * The product thesis in one line: a claim is worth only what its evidence
 * supports. `adjusted = min(claimed, EVIDENCE_CAP[evidenceLevel])`.
 *
 * The same table lives in the database as `app.evidence_cap()`, which is what
 * actually computes `assessment_responses.adjusted_score` — a client never
 * sends it. `apps/web/tests/unit/evidence-cap.test.ts` parses the migration and
 * fails if the two tables ever differ.
 *
 * The workbook oracle (D-007) encodes the NAIVE rule, `MIN(claimed, evidence)`,
 * and its 98 samples barely separate the two (five rows: claim 2 + E1 → 1 there,
 * 2 here — D-047). So the cap is tested here directly, and Slice 5's parity gate
 * runs the samples under both rules (D-048).
 */

export const MATURITY_LEVELS = [0, 1, 2, 3, 4, 5] as const;
export type MaturityLevel = (typeof MATURITY_LEVELS)[number];

/** Evidence levels share the 0–5 scale: E0 (nothing) … E5 (strong, current, complete). */
export const EVIDENCE_LEVELS = MATURITY_LEVELS;
export type EvidenceLevel = MaturityLevel;

/**
 * The cap: the highest adjusted score a given evidence level can support.
 *
 * **E1 and E2 both cap at 2.** A naive "use the evidence level as the cap"
 * passes every workbook sample and is wrong. E0 caps at 1, not 0: an
 * unevidenced claim still says something about intent, so it scores the floor
 * of the scale rather than nothing.
 */
export const EVIDENCE_CAP: Readonly<Record<EvidenceLevel, MaturityLevel>> = Object.freeze({
  0: 1,
  1: 2,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
});

export function isMaturityLevel(value: unknown): value is MaturityLevel {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5;
}

export class ScoringInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScoringInputError";
  }
}

function assertLevel(value: number, what: string): asserts value is MaturityLevel {
  if (!isMaturityLevel(value)) throw new ScoringInputError(`${what} must be an integer 0–5 (got ${value})`);
}

/**
 * The adjusted score for one answer.
 *
 * `evidenceLevel` is the REVIEWED level. `null` means no evidence has been
 * reviewed yet, and is scored exactly as E0 — never ignored. An unevidenced
 * claim of 5 scores 1.
 */
export function adjustedScore(claimed: number, evidenceLevel: number | null): MaturityLevel {
  assertLevel(claimed, "claimed maturity");
  const level = evidenceLevel ?? 0;
  assertLevel(level, "evidence level");
  return Math.min(claimed, EVIDENCE_CAP[level]) as MaturityLevel;
}

/** Which of the two limited the adjusted score — for "claimed 5 → adjusted 1, capped by E0" in the UI. */
export function capApplied(claimed: number, evidenceLevel: number | null): boolean {
  return adjustedScore(claimed, evidenceLevel) < claimed;
}

// ---------------------------------------------------------------------------
// Responses → a domain score
// ---------------------------------------------------------------------------

export const APPLICABILITY_DECISIONS = ["applicable", "not_applicable"] as const;
export type ApplicabilityDecision = (typeof APPLICABILITY_DECISIONS)[number];

/**
 * An answered question. A question with no response is OUTSTANDING: it is
 * neither scored nor excluded — it simply is not in this list yet.
 */
export type ScoredResponse =
  | {
      applicabilityDecision: "applicable";
      claimedMaturity: number;
      /** Reviewed level, or null while nothing has been reviewed (scored as E0). */
      evidenceLevel: number | null;
    }
  | {
      applicabilityDecision: "not_applicable";
      claimedMaturity?: null;
      evidenceLevel?: number | null;
    };

const applicableOnly = (responses: readonly ScoredResponse[]) =>
  responses.filter(
    (r): r is Extract<ScoredResponse, { applicabilityDecision: "applicable" }> => r.applicabilityDecision === "applicable",
  );

/**
 * `(avg adjusted / 5) × weight`, over APPLICABLE responses only. Not Applicable
 * responses leave the question denominator (D-029.3).
 *
 * Returns `null` — "not scored", never `0` — when there is no applicable
 * response: such a domain leaves the weighted denominator across domains
 * (D-038). Returning 0 would punish an organisation for a risk surface it does
 * not have, and Slice 5 would inherit the bug.
 */
export function domainScore(responses: readonly ScoredResponse[], weight: number): number | null {
  if (!(weight > 0)) throw new ScoringInputError(`domain weight must be positive (got ${weight})`);
  const applicable = applicableOnly(responses);
  if (applicable.length === 0) return null;
  const total = applicable.reduce((sum, r) => sum + adjustedScore(r.claimedMaturity, r.evidenceLevel), 0);
  return (total / applicable.length / 5) * weight;
}

/**
 * `(avg evidence level / 5) × 100`, over applicable responses. An unreviewed
 * answer counts as E0, consistent with the cap. `null` when nothing applies.
 */
export function evidenceConfidence(responses: readonly ScoredResponse[]): number | null {
  const applicable = applicableOnly(responses);
  if (applicable.length === 0) return null;
  const total = applicable.reduce((sum, r) => {
    const level = r.evidenceLevel ?? 0;
    assertLevel(level, "evidence level");
    return sum + level;
  }, 0);
  return (total / applicable.length / 5) * 100;
}

export interface DomainScoreSummary {
  /** Out of `weight`, or null when the domain is not scored (D-038). */
  score: number | null;
  weight: number;
  evidenceConfidence: number | null;
  questionCount: number;
  applicableCount: number;
  notApplicableCount: number;
  /** Unanswered. While this is above zero the score is PROVISIONAL. */
  outstandingCount: number;
  provisional: boolean;
}

/**
 * One domain, from its snapshotted questions and whatever responses exist.
 * `weight` must come from the SNAPSHOT (`assessment_questions.domain_weight`),
 * never the live `dpdp_domains` row — a later rebalance must not rewrite an
 * existing assessment's score (D-035).
 */
export function summariseDomainScore(
  questionCount: number,
  responses: readonly ScoredResponse[],
  weight: number,
): DomainScoreSummary {
  if (responses.length > questionCount) {
    throw new ScoringInputError(`${responses.length} responses for ${questionCount} questions`);
  }
  const applicableCount = applicableOnly(responses).length;
  const outstandingCount = questionCount - responses.length;
  return {
    score: domainScore(responses, weight),
    weight,
    evidenceConfidence: evidenceConfidence(responses),
    questionCount,
    applicableCount,
    notApplicableCount: responses.length - applicableCount,
    outstandingCount,
    provisional: outstandingCount > 0,
  };
}

// ---------------------------------------------------------------------------
// Evidence review
// ---------------------------------------------------------------------------

/**
 * A reviewer's verdict on one stored artefact. There is deliberately no
 * "observed but not stored" or "attested" status: every evidence row is a
 * stored artefact, and the cap is never overridden (D-039).
 */
export const EVIDENCE_REVIEW_STATUSES = ["pending", "adequate", "strong", "partial", "rejected", "outdated"] as const;
export type EvidenceReviewStatus = (typeof EVIDENCE_REVIEW_STATUSES)[number];
export type ReviewedStatus = Exclude<EvidenceReviewStatus, "pending">;
export const REVIEWED_STATUSES = EVIDENCE_REVIEW_STATUSES.filter((s): s is ReviewedStatus => s !== "pending");

/**
 * The rules the database also enforces (CHECK): `pending` has no level and a
 * reviewed status always has one; `rejected` evidence supports nothing, so its
 * level is 0.
 */
export function assertReviewConsistent(status: EvidenceReviewStatus, level: number | null): void {
  if (status === "pending") {
    if (level !== null) throw new ScoringInputError("pending evidence has no level");
    return;
  }
  if (level === null) throw new ScoringInputError(`a ${status} review needs an evidence level`);
  assertLevel(level, "evidence level");
  if (status === "rejected" && level !== 0) throw new ScoringInputError("rejected evidence is E0");
}

/**
 * A response's evidence level is the STRONGEST reviewed artefact linked to it:
 * one good document supports the claim however many weak ones sit beside it.
 * Unreviewed links do not count. `null` when nothing linked has been reviewed.
 */
export function responseEvidenceLevel(linkedLevels: readonly (number | null)[]): EvidenceLevel | null {
  const reviewed = linkedLevels.filter((l): l is number => l !== null);
  if (reviewed.length === 0) return null;
  for (const l of reviewed) assertLevel(l, "evidence level");
  return Math.max(...reviewed) as EvidenceLevel;
}

// ---------------------------------------------------------------------------
// Evidence storage layout
// ---------------------------------------------------------------------------

export const EVIDENCE_BUCKET = "evidence";

/** 25 MiB — the bucket's `file_size_limit` and the `evidence.byte_size` CHECK agree. */
export const EVIDENCE_MAX_BYTES = 25 * 1024 * 1024;

/**
 * What an artefact may be: documents, spreadsheets, slides, images, text.
 * Mirrored in the bucket's `allowed_mime_types` and the `evidence.content_type`
 * CHECK. No archives and no executables: evidence is untrusted input.
 */
export const EVIDENCE_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;
export type EvidenceContentType = (typeof EVIDENCE_CONTENT_TYPES)[number];

/** How long a download link lives. Every issuance is audited. */
export const EVIDENCE_DOWNLOAD_URL_SECONDS = 60;

/** Keep a file name safe as one storage path segment; never trust the uploader's. */
export function sanitiseEvidenceFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._]+/, "")
    .slice(-120);
  return cleaned.length > 0 ? cleaned : "file";
}

/**
 * `organizations/{organizationId}/evidence/{evidenceId}/{fileName}` — tenancy
 * visible in the path, so a Storage policy can see it (CLAUDE.md). The
 * database CHECKs the same shape.
 */
export function evidenceStoragePath(organizationId: string, evidenceId: string, fileName: string): string {
  return `organizations/${organizationId}/evidence/${evidenceId}/${sanitiseEvidenceFileName(fileName)}`;
}
