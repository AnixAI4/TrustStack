/**
 * Slice 11, Stage 2a — the drafts for the registers (SLICE_11 §2.3, §7b; D-129).
 * Framework-free: the gateway's drafting schemas (apps/web/lib/ai/drafts.ts), the
 * panel's drafting mode, the reference set and the tests share these.
 *
 * Every draft is for a person: they edit it, accept or discard it, and save
 * through the register's own form. Nothing here writes a register row.
 */
import { AI_INTIMATION_NO_PRINCIPALS_YET, AI_INTIMATION_PERSON_PLACEHOLDER } from "./ai-tasks.js";
import type { ConsentLanguage } from "./consent.js";
import type { RightsKind } from "./rights.js";
import { timestampLabel, type ReportDocument, type ReportSection } from "./reports.js";
import type { RopaLawfulBasis } from "./ropa.js";

// ---------------------------------------------------------------------------
// A processing record from a description
// ---------------------------------------------------------------------------

/**
 * The create form's own text fields a draft fills (lib/ropa/routes.ts `fields`).
 * Never `riskRatingAssessor` or `status`: those are derived or a person's (D-061).
 */
export const AI_ROPA_TEXT_FIELDS = [
  "name",
  "description",
  "dataPrincipalTypes",
  "dataCategories",
  "purpose",
  "collectionSource",
  "sharing",
  "retentionRule",
  "securitySafeguards",
] as const;
export type AiRopaTextField = (typeof AI_ROPA_TEXT_FIELDS)[number];

/** The record's yes / no / not sure answers a draft may suggest. */
export const AI_ROPA_TRI_FIELDS = ["childrenData", "crossBorder", "aiProcessing"] as const;
export type AiRopaTriField = (typeof AI_ROPA_TRI_FIELDS)[number];

/** Plain labels, as the record's own form words them. */
export const AI_ROPA_FIELD_LABEL: Readonly<Record<AiRopaTextField | AiRopaTriField | "lawfulBasis", string>> = Object.freeze({
  name: "Processing activity",
  description: "Description",
  dataPrincipalTypes: "Whose data",
  dataCategories: "Kinds of personal data",
  purpose: "Purpose",
  collectionSource: "Where the data comes from",
  sharing: "Who it is shared with",
  retentionRule: "How long it is kept",
  securitySafeguards: "Security safeguards",
  lawfulBasis: "Lawful basis — a note for counsel",
  childrenData: "Children's data",
  crossBorder: "Leaves India",
  aiProcessing: "AI or automated processing",
});

// ---------------------------------------------------------------------------
// The Board intimation under Rule 7(2)
// ---------------------------------------------------------------------------

/**
 * Rule 7(2) in the order the Rule lists it: (a) without delay; (b)(i)–(vi) within
 * seventy-two hours, or such longer period as the Board may allow on a written
 * request. (iv) and (vi) are written by the SERVER, never the model.
 */
export const AI_INTIMATION_SECTIONS = [
  { key: "nature", rule: "Rule 7(2)(a)", label: "Nature of the breach", by: "model" },
  { key: "extent", rule: "Rule 7(2)(a)", label: "Extent", by: "model" },
  { key: "timing", rule: "Rule 7(2)(a)", label: "Timing", by: "model" },
  { key: "location", rule: "Rule 7(2)(a)", label: "Location of occurrence", by: "model" },
  { key: "likelyImpact", rule: "Rule 7(2)(a)", label: "Likely impact", by: "model" },
  { key: "updatedDetail", rule: "Rule 7(2)(b)(i)", label: "Updated and detailed information", by: "model" },
  { key: "eventsAndReasons", rule: "Rule 7(2)(b)(ii)", label: "Events, circumstances and reasons leading to the breach", by: "model" },
  { key: "mitigation", rule: "Rule 7(2)(b)(iii)", label: "Measures implemented or proposed to mitigate risk", by: "model" },
  { key: "personFindings", rule: "Rule 7(2)(b)(iv)", label: "Findings regarding the person who caused the breach", by: "server" },
  { key: "remedialMeasures", rule: "Rule 7(2)(b)(v)", label: "Remedial measures taken to prevent recurrence", by: "model" },
  { key: "principalsReport", rule: "Rule 7(2)(b)(vi)", label: "Report on the intimations given to affected Data Principals", by: "server" },
] as const;
export type AiIntimationKey = (typeof AI_INTIMATION_SECTIONS)[number]["key"];
export const AI_INTIMATION_MODEL_KEYS = AI_INTIMATION_SECTIONS.filter((s) => s.by === "model").map((s) => s.key) as Exclude<
  AiIntimationKey,
  "personFindings" | "principalsReport"
>[];

/** (vi), written from the breach register's own record of Rule 7(1) — never from the model. */
export function intimationPrincipalsReport(principals: { date: string; method: string | null } | null): string {
  if (!principals) return AI_INTIMATION_NO_PRINCIPALS_YET;
  return `The affected Data Principals were informed on ${principals.date}${principals.method ? `, by: ${principals.method}` : ""} (Rule 7(1)). [Add what they were told, if the Board asks.]`;
}

/** (iv) — always the placeholder (D-129, §7b.3). */
export const intimationPersonFindings = (): string => AI_INTIMATION_PERSON_PLACEHOLDER;

/** The intimation as plain text, for Copy and Download: the Rule's own order and words. */
export function intimationPlainText(fields: Readonly<Record<string, string>>, heading?: string): string {
  const lines: string[] = [];
  if (heading) lines.push(heading, "");
  lines.push("Intimation of personal data breach to the Data Protection Board of India — Rule 7(2)", "");
  lines.push("(a) Description of the breach", "");
  for (const s of AI_INTIMATION_SECTIONS.filter((x) => x.rule === "Rule 7(2)(a)")) {
    lines.push(`${s.label}:`, (fields[s.key] ?? "").trim(), "");
  }
  lines.push("(b) Within seventy-two hours of becoming aware, or such longer period as the Board may allow", "");
  for (const s of AI_INTIMATION_SECTIONS.filter((x) => x.rule !== "Rule 7(2)(a)")) {
    lines.push(`${s.rule.replace("Rule 7(2)(b)", "")} ${s.label}:`, (fields[s.key] ?? "").trim(), "");
  }
  return `${lines.join("\n").trim()}\n`;
}

// ---------------------------------------------------------------------------
// A response to a rights request
// ---------------------------------------------------------------------------

/**
 * The outcome — fulfilled, partly fulfilled or declined — is a person's decision
 * (D-129.2; s.12(3)). A draft that states one is refused: these find a claim of
 * what was decided or done, not a placeholder or a condition ("once we have…").
 */
const OUTCOME_CLAIMS: readonly RegExp[] = [
  /\b(?:we|i) have (?:now |already )?(?:erased|deleted|corrected|updated|completed|fulfilled|granted|declined|refused|rejected)\b/i,
  /\byour (?:request|grievance|application) (?:has been|is|was|stands) (?:now )?(?:granted|fulfilled|completed|approved|declined|refused|rejected|denied|partly fulfilled|partially fulfilled)\b/i,
  /\b(?:we|i) (?:hereby )?(?:decline|refuse|reject|deny) (?:your|this|the) (?:request|grievance|application)\b/i,
];

export function statesRightsOutcome(text: string): boolean {
  return OUTCOME_CLAIMS.some((re) => re.test(text));
}

/**
 * s.11(1), s.12(1) (D-137, F2): the rights that exist only for consent-based processing (including
 * s.7(a)). Grievance (s.13) and nomination (s.14) are not so limited.
 */
export function rightsKindNeedsConsentBasis(kind: RightsKind): boolean {
  return kind === "access" || kind === "correction" || kind === "completion" || kind === "updating" || kind === "erasure";
}

// ---------------------------------------------------------------------------
// Stage 2b — a privacy notice from the processing register (D-133.3)
// ---------------------------------------------------------------------------

/**
 * s.5(1) ties a notice to "every request … under section 6 for consent". So a notice is
 * drafted from the records whose lawful basis is consent, or not yet decided — never an
 * s.7 legitimate use or an s.17 exemption, which make no consent request.
 */
export function isNoticeSource(lawfulBasis: RopaLawfulBasis | null): boolean {
  return lawfulBasis === null || lawfulBasis === "consent";
}

/** How many records a notice draft reads, at most — the notice itself names at most twenty purposes. */
export const AI_NOTICE_SOURCE_RECORDS = 30;

// ---------------------------------------------------------------------------
// Stage 2b — a translation (D-133.2)
// ---------------------------------------------------------------------------

/** Hindi and Marathi first; another language joins once its own reference cases pass live. */
export const AI_TRANSLATION_LANGUAGES = ["hi", "mr"] as const satisfies readonly ConsentLanguage[];
export type AiTranslationLanguage = (typeof AI_TRANSLATION_LANGUAGES)[number];

export function isAiTranslationLanguage(value: string): value is AiTranslationLanguage {
  return (AI_TRANSLATION_LANGUAGES as readonly string[]).includes(value);
}

/**
 * A translation keeps every purpose's key — what the widget and the consent records name it
 * by — and the purposes' count. Empty when it does; otherwise each problem in words.
 */
export function translationKeyProblems(sourceKeys: readonly string[], draftKeys: readonly string[]): string[] {
  const problems: string[] = [];
  if (draftKeys.length !== sourceKeys.length) {
    problems.push(`The translation has ${draftKeys.length} purposes; the notice has ${sourceKeys.length}.`);
  }
  for (const k of sourceKeys) if (!draftKeys.includes(k)) problems.push(`The purpose "${k}" is missing.`);
  for (const k of draftKeys) if (!sourceKeys.includes(k)) problems.push(`"${k}" is not a purpose of the notice.`);
  if (new Set(draftKeys).size !== draftKeys.length) problems.push("A purpose appears twice.");
  return problems;
}

// ---------------------------------------------------------------------------
// Stage 2b — a report's narrative (D-133.1)
// ---------------------------------------------------------------------------

export const AI_NARRATIVE_LIMITS = Object.freeze({ headline: 200, paragraphs: 4, paragraph: 1200, bullets: 8, bullet: 300 });

export interface ReportNarrative {
  headline: string;
  paragraphs: string[];
  bullets: string[];
}

/**
 * A legal citation's numbers ("s.8(6)", "Rule 7(2)(b)", "sections 11 to 14", "the Act, 2023")
 * are not figures: they are taken out before the number check, or every narrative that cites
 * the law would be refused.
 */
const CITATION =
  /\b(?:ss?|sec|secs|sections?|rules?|schedules?|clauses?|sub-sections?|sub-rules?|heads?)\.?\s*\d+[A-Z]?(?:\s*\(\s*[0-9a-z]{1,4}\s*\))*(?:\s*(?:,|and|or|to|–|-)\s*\d+[A-Z]?(?:\s*\(\s*[0-9a-z]{1,4}\s*\))*)*|\b(?:Act|Rules)\s*,?\s*20\d\d\b|G\.S\.R\.\s*\d+\s*\(E\)/gi;

/** Every number a text states, as written figures: "1,20,000" → "120000", "24.70" → "24.7". */
export function statedNumbers(text: string, options: { exceptCitations?: boolean } = {}): string[] {
  const body = options.exceptCitations ? text.replace(CITATION, " ") : text;
  const out: string[] = [];
  for (const m of body.matchAll(/(?<![\w.])\d{1,3}(?:,\d{2,3})+(?:\.\d+)?(?!\d)|(?<![\w.,])\d+(?:\.\d+)?/g)) {
    let n = m[0].replaceAll(",", "");
    if (n.includes(".")) n = n.replace(/0+$/, "").replace(/\.$/, "");
    out.push(n.replace(/^0+(?=\d)/, ""));
  }
  return out;
}

/**
 * D-133.1: every number in the narrative must appear in the stored document — else the draft
 * is not kept. A set check, not a reading: it catches a figure the document never states, not
 * a true figure put to the wrong use (a person and counsel read the narrative for that).
 * Returns the numbers that are not in the document; empty when the narrative passes.
 */
export function numbersNotInDocument(narrativeText: string, documentText: string): string[] {
  const known = new Set(statedNumbers(documentText));
  return [...new Set(statedNumbers(narrativeText, { exceptCitations: true }))].filter((n) => !known.has(n));
}

export function narrativeText(n: ReportNarrative): string {
  return [n.headline, ...n.paragraphs, ...n.bullets].join("\n");
}

export const AI_NARRATIVE_SECTION_TITLE = "Executive narrative";

/** The narrative as the report prints it, at the front, with who accepted it and what it is. */
export function narrativeSection(n: ReportNarrative, accepted: { byName: string | null; at: string; sourceVersion: number }): ReportSection {
  const blocks: ReportSection["blocks"] = [
    {
      type: "notice",
      tone: "info",
      text: `Drafted with the TrustStack AI assistant and accepted${accepted.byName ? ` by ${accepted.byName}` : ""} on ${timestampLabel(accepted.at)}. It reads the figures below, which are this report's own as recorded in version ${accepted.sourceVersion}. It does not assess or certify the organisation's position under the Act.`,
    },
    { type: "subheading", text: n.headline },
    ...n.paragraphs.map((text) => ({ type: "paragraph" as const, text })),
  ];
  if (n.bullets.length > 0) blocks.push({ type: "bullets", items: [...n.bullets] });
  return { title: AI_NARRATIVE_SECTION_TITLE, blocks };
}

/**
 * Version N+1 = version N's stored document with the narrative in front (D-133.1): the same
 * sections, caveats and notes — the database refuses anything else — under a header that
 * says which version it is, when it was made, and which version's figures it prints.
 */
export function narratedDocument(
  source: ReportDocument,
  input: {
    version: number;
    sourceVersion: number;
    sourceGeneratedAt: string | null;
    generatedAt: string;
    generatedByName: string | null;
    narrative: ReportNarrative;
    acceptedByName: string | null;
    acceptedAt: string;
  },
): ReportDocument {
  const meta: ReportDocument["meta"] = [];
  for (const m of source.meta) {
    if (m.label === "Version") {
      meta.push({ label: "Version", value: String(input.version) });
      meta.push({
        label: "Figures",
        value: `As recorded in version ${input.sourceVersion}${input.sourceGeneratedAt ? ` (${timestampLabel(input.sourceGeneratedAt)})` : ""}`,
      });
    } else if (m.label === "Generated") {
      meta.push({ label: "Generated", value: `${timestampLabel(input.generatedAt)}${input.generatedByName ? ` by ${input.generatedByName}` : ""}` });
    } else {
      meta.push(m);
    }
  }
  return {
    ...source,
    meta,
    sections: [narrativeSection(input.narrative, { byName: input.acceptedByName, at: input.acceptedAt, sourceVersion: input.sourceVersion }), ...source.sections],
    footer: source.footer.replace(` v${input.sourceVersion} `, ` v${input.version} `),
  };
}
