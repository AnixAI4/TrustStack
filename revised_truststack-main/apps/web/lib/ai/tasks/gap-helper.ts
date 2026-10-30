import { CLOSING_REVIEW_STATUSES, GAP_ACTION_STATUS_LABEL, GAP_SEVERITY_LABEL, pickAllowed, type GapActionStatus, type GapSeverity } from "@truststack/core";
import { z } from "zod";
import { createCleaner, userTurn, type OrganisationRaw, type ShapedContext } from "./shared";

/**
 * The Gap and Action Helper (SLICE_11 §2.2, Stage 1b) — "Explain this gap" on
 * the gap register, and "Explain this action" on the Actions page. Read with
 * `gap.read` (§4.7) through the routes' own readers (`readGaps`,
 * `readGapForAction`, D-069); shaped here, pure. The target is always the GAP;
 * from the Actions page it also names the action being asked about.
 *
 * What it sends: the gap's question text, area, severity and state, the
 * finding and the recommended fix (the bank's authored wording, codes masked),
 * the evidence guidance; each action's status, due date, owner as a ROLE, and
 * how much evidence is attached and accepted; the action titles and notes as
 * untrusted data; the organisation; the person's own question.
 * Never: an owner's or closer's NAME or id, a reviewer's notes, a file's
 * contents, the adjusted score, a weight, a question or pack code (§4.5, §4.6).
 */

export const gapHelperBody = z.union([
  z
    .object({
      assessmentId: z.uuid(),
      gapId: z.uuid(),
      ask: z.string().trim().max(500).optional(),
    })
    .strict(),
  z
    .object({
      actionId: z.uuid(),
      ask: z.string().trim().max(500).optional(),
    })
    .strict(),
]);
export type GapHelperBody = z.infer<typeof gapHelperBody>;

/** What the readers return — wider than what is sent, on purpose. */
export interface GapHelperRaw {
  organisation: OrganisationRaw;
  gap: Record<string, unknown> & { actions?: Record<string, unknown>[] };
  /** The action asked about, from the Actions page; null from the gap register. */
  actionId: string | null;
  ask: string | null;
}

const ORGANISATION_FIELDS = ["name", "organizationType", "industryName"] as const;
const GAP_FIELDS = ["questionText", "domainName", "severity", "state", "finding", "recommendedFix", "evidenceGuidance"] as const;
const ACTION_FIELDS = ["id", "title", "status", "dueDate", "ownerRole", "ownerUserId", "closureBasis", "notes", "evidence"] as const;

/** core GAP_STATES: a superseded gap belongs to an earlier register (Slice 6). */
const GAP_STATE_WORDS: Record<string, string> = {
  open: "open",
  superseded: "superseded by a later gap register",
};

/** core CLOSURE_BASES, in words. */
const CLOSED_ON: Record<string, string> = {
  evidence: "accepted evidence",
  reviewer_approval: "a reviewer's approval",
  erasure_recorded: "a recorded erasure",
};

export function shapeGapHelperContext(raw: GapHelperRaw, target: { gapId: string }, untrustedJson: (value: unknown) => string): ShapedContext {
  const cleaner = createCleaner();
  const clean = cleaner.clean;
  const org = pickAllowed(raw.organisation, ORGANISATION_FIELDS);
  const g = pickAllowed(raw.gap, GAP_FIELDS);
  const actions = (raw.gap.actions ?? []).slice(0, 12).map((a) => pickAllowed(a, ACTION_FIELDS));

  const organisation = { name: clean(org.name, false), type: org.organizationType, industry: org.industryName ?? null };
  const gap = {
    question: clean(g.questionText, false),
    area: clean(g.domainName, false),
    severity: GAP_SEVERITY_LABEL[g.severity as GapSeverity] ?? null,
    state: GAP_STATE_WORDS[String(g.state)] ?? String(g.state ?? ""),
    finding: clean(g.finding, false),
    recommendedFix: clean(g.recommendedFix, false),
    evidenceGuidance: clean(g.evidenceGuidance, false),
  };
  const focus = raw.actionId === null ? -1 : actions.findIndex((a) => a.id === raw.actionId);
  const actionFacts = actions.map((a, i) => {
    const evidence = Array.isArray(a.evidence) ? (a.evidence as Record<string, unknown>[]) : [];
    return {
      item: i + 1,
      askedAbout: i === focus,
      status: GAP_ACTION_STATUS_LABEL[a.status as GapActionStatus] ?? String(a.status ?? ""),
      // `YYYY-MM-DD`, or none: the next assessment cycle (D-055).
      due: typeof a.dueDate === "string" ? a.dueDate : null,
      // A role, never a person (§4.6).
      ownerRole: clean(a.ownerRole, false),
      hasOwner: typeof a.ownerUserId === "string",
      closedOn: typeof a.closureBasis === "string" ? (CLOSED_ON[a.closureBasis] ?? null) : null,
      evidenceAttached: evidence.length,
      evidenceAccepted: evidence.filter((e) => (CLOSING_REVIEW_STATUSES as readonly unknown[]).includes(e.reviewStatus)).length,
    };
  });
  const untrusted = {
    actions: actions.map((a, i) => ({ item: i + 1, title: clean(a.title, true), notes: clean(a.notes, true) })),
  };
  const ask = clean(raw.ask, true);

  const context = { task: "gap_helper", organisation, gap, actions: actionFacts, untrusted, ask };
  const about =
    focus >= 0
      ? `The person is asking about action ${focus + 1} (askedAbout: true): explain what it is for, what "done" would look like, and what would let a person close it (accepted evidence on it, or a reviewer who is not its owner). `
      : "";
  const user = userTurn(
    `Explain this gap in the organisation's DPDP readiness: what is missing, why it matters to this organisation, and what closing it would take. ${about}You cannot close a gap or an action, accept evidence, or change a status, a due date or a score — people do that. One next step (nextStep.page: "add_evidence" if an open action has no accepted evidence, otherwise "view_gaps").`,
    [
      { tag: "organisation", value: organisation },
      { tag: "gap", value: gap },
      { tag: "actions", value: actionFacts },
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
    target: { type: "assessment_gap", id: target.gapId, key: focus >= 0 ? raw.actionId : null },
  };
}
