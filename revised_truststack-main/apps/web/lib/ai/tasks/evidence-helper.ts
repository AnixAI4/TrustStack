import { CLOSING_REVIEW_STATUSES, DPDP_DOMAINS, pickAllowed } from "@truststack/core";
import { z } from "zod";
import { createCleaner, userTurn, type OrganisationRaw, type ShapedContext } from "./shared";

/**
 * The Evidence Helper (SLICE_11 §2.2, Stage 1b) — "Is this evidence enough?"
 * on an answer. Read with `evidence.read` (§4.7) through the routes' own
 * readers (`readAssessmentQuestion`, `readResponseForQuestion`, D-069); shaped
 * here, pure.
 *
 * What it sends: the question's text and evidence guidance, its area's NAME;
 * the organisation's name, type and industry; whether the answer applies, the
 * level claimed (0–5) and WHETHER the evidence held it down (from the stored
 * answer, pitfall 1); each attached file's review verdict, and its NAME as
 * untrusted data; the person's own question.
 * Never: a file's contents, who uploaded or reviewed it, a reviewer's notes, an
 * evidence level, the adjusted score, the cap, a storage path, a question or
 * pack code (§4.5, §4.6). The verdicts and "held down" are facts the answer
 * panel already shows the person; the levels and the cap table are the bank's.
 */

export const evidenceHelperBody = z
  .object({
    assessmentId: z.uuid(),
    questionCode: z.string().min(1).max(64).regex(/^[A-Za-z0-9._-]+$/),
    ask: z.string().trim().max(500).optional(),
  })
  .strict();
export type EvidenceHelperBody = z.infer<typeof evidenceHelperBody>;

/** What the readers return — wider than what is sent, on purpose. */
export interface EvidenceHelperRaw {
  organisation: OrganisationRaw;
  question: Record<string, unknown> & { questionText: string };
  response: Record<string, unknown> & { evidence?: Record<string, unknown>[] };
  ask: string | null;
}

const QUESTION_FIELDS = ["questionText", "evidenceGuidance", "domainCode"] as const;
const RESPONSE_FIELDS = ["applicabilityDecision", "claimedMaturity", "capApplied"] as const;
const EVIDENCE_FIELDS = ["fileName", "reviewStatus"] as const;
const ORGANISATION_FIELDS = ["name", "organizationType", "industryName"] as const;

/** The verdicts in the words the answer panel uses. */
const VERDICT: Record<string, string> = {
  pending: "awaiting review",
  adequate: "reviewed: adequate",
  strong: "reviewed: strong",
  partial: "reviewed: partial",
  rejected: "reviewed: rejected",
  outdated: "reviewed: outdated",
};

export function shapeEvidenceHelperContext(
  raw: EvidenceHelperRaw,
  target: { assessmentId: string; questionCode: string },
  untrustedJson: (value: unknown) => string,
): ShapedContext {
  // Not destructured: the flag and the counts are read after every text is cleaned.
  const cleaner = createCleaner();
  const clean = cleaner.clean;
  const org = pickAllowed(raw.organisation, ORGANISATION_FIELDS);
  const q = pickAllowed(raw.question, QUESTION_FIELDS);
  const r = pickAllowed(raw.response, RESPONSE_FIELDS);
  const files = (raw.response.evidence ?? []).slice(0, 10).map((e) => pickAllowed(e, EVIDENCE_FIELDS));

  const organisation = { name: clean(org.name, false), type: org.organizationType, industry: org.industryName ?? null };
  const question = {
    text: clean(q.questionText, false),
    evidenceGuidance: clean(q.evidenceGuidance, false),
    area: DPDP_DOMAINS.find((d) => d.code === q.domainCode)?.name ?? null,
  };
  const answer = {
    applies: r.applicabilityDecision === "applicable",
    // 0–5, as the person chose it; and whether the reviewed evidence held it down — never by how much (§4.5).
    claimedMaturity: typeof r.claimedMaturity === "number" ? r.claimedMaturity : null,
    heldDownByEvidence: r.capApplied === true,
  };
  const evidence = {
    attached: files.length,
    awaitingReview: files.filter((f) => f.reviewStatus === "pending").length,
    // Adequate or Strong — core's "accepted evidence" (D-056).
    accepted: files.filter((f) => (CLOSING_REVIEW_STATUSES as readonly unknown[]).includes(f.reviewStatus)).length,
    items: files.map((f, i) => ({ item: i + 1, verdict: VERDICT[String(f.reviewStatus)] ?? "awaiting review" })),
  };
  const untrusted = {
    fileNames: files.map((f, i) => ({ item: i + 1, name: clean(f.fileName, true) })),
  };
  const ask = clean(raw.ask, true);

  const context = { task: "evidence_helper", organisation, question, answer, evidence, untrusted, ask };
  const user = userTurn(
    'Explain whether the evidence attached to this answer is likely to support it, and what would strengthen it — from the file NAMES and review verdicts only (you cannot see inside a file; never guess its contents). A reviewer, not you, decides whether evidence is accepted. If the evidence held the claim down, say so plainly and say what kind of evidence a reviewer would look for. One next step (nextStep.page: "add_evidence" if nothing is attached or nothing is accepted yet, otherwise "none").',
    [
      { tag: "organisation", value: organisation },
      { tag: "question", value: question },
      { tag: "answer", value: answer },
      { tag: "evidence", value: evidence },
      { tag: "untrusted_data", value: untrusted, untrusted: true },
    ],
    ask,
    untrustedJson,
  );
  return {
    context,
    user,
    injectionFlagged: cleaner.injectionFlagged,
    scrubbed: cleaner.scrubbed,
    target: { type: "assessment_response", id: target.assessmentId, key: target.questionCode },
  };
}
