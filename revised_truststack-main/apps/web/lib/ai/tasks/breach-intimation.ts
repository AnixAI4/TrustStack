import { BREACH_NATURE_LABEL, formatInIndia, GAP_SEVERITY_LABEL, pickAllowed, type BreachNature, type GapSeverity } from "@truststack/core";
import { z } from "zod";
import { createCleaner, userTurn, type OrganisationRaw, type ShapedContext } from "./shared";

/**
 * "Draft the Board intimation (Rule 7(2))" (SLICE_11 §2.3, §7b.4; Stage 2a) — on
 * the breach's "Detailed report to the Board — Rule 7(2)(b)" step. Read with
 * `breach.read`, decided with `breach.write` (§4.7, D-129.3), through the
 * register's own reader (`readBreaches`, D-069); shaped here, pure.
 *
 * What it sends: the breach's nature, severity and status, the clock facts in
 * India Standard Time (aware, occurred, the due time the database derived, an
 * extension the Board allowed), the count affected, whether the Board was told
 * under 7(2)(a) and the affected people under 7(1); the title, description,
 * location, data categories, likely impact and containment as untrusted data,
 * scrubbed. Never: a recorder, a closer, a dismissal reason, an action's owner,
 * or any person's name (§4.6) — the Rule 7 draft is written from the breach's
 * nature, categories, counts and times, never the people.
 *
 * Rule 7(2)(b)(iv) and (vi) are not asked of the model: the server writes them
 * (drafts.ts) — (iv) always a placeholder, (vi) from the register's own record.
 */

export const breachIntimationBody = z
  .object({
    breachId: z.uuid(),
    ask: z.string().trim().max(500).optional(),
  })
  .strict();
export type BreachIntimationBody = z.infer<typeof breachIntimationBody>;

export interface BreachIntimationRaw {
  organisation: OrganisationRaw;
  breach: Record<string, unknown> & {
    board?: { dueAt?: string; extension?: { until: string } | null; initial?: { at: string } | null; report?: { at: string } | null };
    principals?: { at: string; method: string | null } | null;
  };
  ask: string | null;
}

const ORGANISATION_FIELDS = ["name", "organizationType", "industryName"] as const;
const BREACH_FIELDS = [
  "nature",
  "severity",
  "status",
  "awareAt",
  "occurredAt",
  "principalsAffected",
  "title",
  "description",
  "location",
  "dataCategories",
  "likelyImpact",
  "containmentMeasures",
] as const;

// core `formatInIndia` prints the zone ("… IST").
const ist = (instant: unknown) => (typeof instant === "string" ? formatInIndia(instant) : null);

export function shapeBreachIntimationContext(raw: BreachIntimationRaw, target: { breachId: string }, untrustedJson: (value: unknown) => string): ShapedContext {
  const cleaner = createCleaner();
  const clean = cleaner.clean;
  const org = pickAllowed(raw.organisation, ORGANISATION_FIELDS);
  const b = pickAllowed(raw.breach, BREACH_FIELDS);
  const board = raw.breach.board ?? {};

  const organisation = { name: clean(org.name, false), type: org.organizationType, industry: org.industryName ?? null };
  const facts = {
    nature: BREACH_NATURE_LABEL[b.nature as BreachNature] ?? null,
    severity: GAP_SEVERITY_LABEL[b.severity as GapSeverity] ?? null,
    status: typeof b.status === "string" ? b.status : null,
    becameAware: ist(b.awareAt),
    occurred: ist(b.occurredAt),
    peopleAffected: typeof b.principalsAffected === "number" ? b.principalsAffected : null,
    // The database's: aware + 72 hours, or the Board's extension (Rule 7(2)(b)).
    detailedReportDue: ist(board.dueAt),
    boardAllowedLongerUntil: ist(board.extension?.until),
    boardToldWithoutDelay: ist(board.initial?.at),
    detailedReportAlreadyMade: board.report ? ist(board.report.at) : null,
    affectedPeopleTold: raw.breach.principals ? ist(raw.breach.principals.at) : null,
  };
  const principalsMethod = raw.breach.principals ? clean(raw.breach.principals.method, true) : null;
  const untrusted = {
    title: clean(b.title, true),
    description: clean(b.description, true),
    location: clean(b.location, true),
    dataCategories: clean(b.dataCategories, true),
    likelyImpact: clean(b.likelyImpact, true),
    containmentMeasures: clean(b.containmentMeasures, true),
  };
  const ask = clean(raw.ask, true);

  const context = { task: "breach_intimation_draft", organisation, breach: facts, untrusted, ask };
  const user = userTurn(
    "Draft the organisation's intimation of this personal data breach to the Data Protection Board of India under Rule 7(2): (a) the description — nature, extent, timing, location and likely impact; and (b)(i) updated and detailed information, (ii) the broad facts on the events, circumstances and reasons, (iii) measures implemented or proposed to mitigate risk, (v) remedial measures to prevent recurrence. Do NOT draft (iv) or (vi): the organisation completes them. Write only from the breach record; where it does not say, write \"[to be confirmed]\" — never invent a fact, a cause, a number or a measure. Name no individual. The detailed report is due within seventy-two hours of becoming aware, or such longer period as the Board may allow on a written request (Rule 7(2)(b)) — use the due time given; it is the law, not a TrustStack target. Never call the organisation compliant or say the breach is resolved unless the record says it is contained. A person and counsel check it before anything is sent; you send nothing.",
    [
      { tag: "organisation", value: organisation },
      { tag: "breach", value: facts },
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
    target: { type: "breach_incident", id: target.breachId, key: null },
    facts: {
      principals: raw.breach.principals ? { date: ist(raw.breach.principals.at)!, method: principalsMethod } : null,
    },
  };
}
