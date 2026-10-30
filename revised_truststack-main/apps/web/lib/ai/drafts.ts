import {
  AI_COUNSEL_NOTE,
  AI_INTIMATION_MODEL_KEYS,
  AI_INTIMATION_SECTIONS,
  AI_REVIEW_NOTE,
  AI_ROPA_TEXT_FIELDS,
  AI_ROPA_TRI_FIELDS,
  AI_TASK_SPECS,
  checkCitation,
  checkWording,
  DPDP_REPORT_CAVEAT,
  intimationPersonFindings,
  intimationPrincipalsReport,
  namesAnotherOrganisation,
  namesTrustStackTarget,
  AI_NARRATIVE_LIMITS,
  AI_TRANSLATION_LANGUAGES,
  NOTICE_LIMITS,
  noticePurposeProblems,
  numbersNotInDocument,
  PURPOSE_KEY_PATTERN,
  translationKeyProblems,
  type AiTranslationLanguage,
  RIGHTS_TEXT_LIMIT,
  ROPA_LAWFUL_BASIS_CODES,
  ROPA_NAME_LIMIT,
  ROPA_TEXT_LIMIT,
  statesRightsOutcome,
  AI_RIGHTS_APPLIES_PLACEHOLDER,
  AI_RIGHTS_CONTACT_PLACEHOLDER,
  rightsKindNeedsConsentBasis,
  type RightsKind,
  TRI_STATES,
  type AiRejection,
  type AiTask,
  type ProvisionIndex,
  type RopaLawfulBasis,
} from "@truststack/core";
import { z } from "zod";

/**
 * The drafts' shapes (SLICE_11 §2.3, §4.3, §7b.3; D-129) — beside `answer.ts`'s
 * explain shape. Each drafting task has a Zod schema with lengths and a hand-
 * written JSON schema for structured output (no length bounds there), kept
 * equal by a test. Every draft carries:
 *
 *   answer   — one sentence: what this draft is, for whom to check
 *   draft    — the register's own fields
 *   law      — the provisions relied on, labelled as `answer.ts` labels them (D-126.3)
 *   missingInformation, counselToConfirm, confidence
 *
 * The SERVER — never the model — sets the review flags, the caveat, the counsel
 * note, Rule 7(2)(b)(iv) (always a placeholder) and (b)(vi) (from the breach
 * register's own Rule 7(1) record). The wording, other-tenant and citation
 * checks run on every string the model wrote; a rights draft that states an
 * outcome, or drops the letter's placeholders, is refused (D-129.2).
 *
 * Pure: no database, no provider.
 */

export type DraftTask = Extract<
  AiTask,
  "ropa_draft" | "breach_intimation_draft" | "rights_response_draft" | "notice_draft" | "notice_translation_draft" | "report_narrative_draft"
>;

export function isDraftTask(task: AiTask): task is DraftTask {
  return AI_TASK_SPECS[task].kind === "draft";
}

const LAW_ITEM = z
  .object({
    citation: z.string().trim().min(1).max(80),
    point: z.string().trim().min(1).max(600),
    source: z.enum(["statute", "truststack_default"]),
  })
  .strict();

/**
 * A draft's two lists are bounded at eight for the panel (D-101). The live model lists more for
 * a long letter (D-130.13): it is asked for "at most eight, most important first", and the server
 * keeps the first eight rather than refusing a whole draft for a ninth item.
 */
const firstEight = (v: unknown) => (Array.isArray(v) ? v.slice(0, 8) : v);
/**
 * A note in "What the assistant did not know" is at most 300 characters for 2a's drafts (as
 * approved). Stage 2b's three take 600 (D-135): their prompts ask the model to say there why it left
 * out a forbidden request, and the live run (Part C, 2026-10-22) wrote correct notes of 300+.
 */
export const DRAFT_NOTE_LIMIT = 300;
export const DRAFT_NOTE_LIMIT_2B = 600;
const envelope = <T extends z.ZodTypeAny>(draft: T, noteLimit: number = DRAFT_NOTE_LIMIT) =>
  z
    .object({
      answer: z.string().trim().min(1).max(500),
      draft,
      law: z.preprocess(firstEight, z.array(LAW_ITEM).min(1).max(8)),
      missingInformation: z.preprocess(firstEight, z.array(z.string().trim().min(1).max(noteLimit)).max(8)),
      counselToConfirm: z.boolean(),
      confidence: z.enum(["high", "medium", "low"]),
    })
    .strict();

/** The lawful basis is a note for counsel (D-065): one of the register's codes, or "not sure". */
export const ROPA_LAWFUL_BASIS_CHOICES = [...ROPA_LAWFUL_BASIS_CODES, "not_sure"] as const;

const ropaText = z.string().trim().max(ROPA_TEXT_LIMIT);
const ropaModelDraft = z
  .object({
    name: z.string().trim().min(1).max(ROPA_NAME_LIMIT),
    ...Object.fromEntries(AI_ROPA_TEXT_FIELDS.filter((f) => f !== "name").map((f) => [f, ropaText])),
    lawfulBasis: z.enum(ROPA_LAWFUL_BASIS_CHOICES as unknown as [string, ...string[]]),
    ...Object.fromEntries(AI_ROPA_TRI_FIELDS.map((f) => [f, z.enum(TRI_STATES)])),
  })
  .strict();

const INTIMATION_TEXT = 3000;
const intimationModelDraft = z
  .object(Object.fromEntries(AI_INTIMATION_MODEL_KEYS.map((k) => [k, z.string().trim().min(1).max(INTIMATION_TEXT)])))
  .strict();

const RIGHTS_LETTER = 6000;
const rightsModelDraft = z
  .object({
    letter: z.string().trim().min(1).max(RIGHTS_LETTER),
    summary: z.string().trim().min(1).max(1000),
  })
  .strict();

// Stage 2b — a notice and its translation: the notice create body's own content fields
// (lib/consent/routes.ts `noticeContent`) bar the three "other means": Rule 3(c)'s withdrawal
// and Board texts are TrustStack's fixed words, and the contact and the forms' links are
// printed by TrustStack on every notice (D-133.3). Never a status: the person publishes.
const noticePurpose = z
  .object({
    key: z.string().trim().regex(PURPOSE_KEY_PATTERN),
    title: z.string().trim().min(1).max(NOTICE_LIMITS.purposeTitle),
    uses: z.string().trim().min(1).max(NOTICE_LIMITS.purposeUses),
    dataItems: z.array(z.string().trim().min(1).max(NOTICE_LIMITS.dataItem)).min(1).max(NOTICE_LIMITS.dataItems),
  })
  .strict();
const noticeModelDraft = z
  .object({
    title: z.string().trim().min(1).max(NOTICE_LIMITS.title),
    summary: z.string().trim().max(NOTICE_LIMITS.summary),
    purposes: z.array(noticePurpose).min(1).max(NOTICE_LIMITS.purposes),
  })
  .strict();

const narrativeModelDraft = z
  .object({
    headline: z.string().trim().min(1).max(AI_NARRATIVE_LIMITS.headline),
    paragraphs: z.array(z.string().trim().min(1).max(AI_NARRATIVE_LIMITS.paragraph)).min(1).max(AI_NARRATIVE_LIMITS.paragraphs),
    bullets: z.preprocess(firstEight, z.array(z.string().trim().min(1).max(AI_NARRATIVE_LIMITS.bullet)).max(AI_NARRATIVE_LIMITS.bullets)),
  })
  .strict();

export const DRAFT_MODEL_SCHEMAS = {
  ropa_draft: envelope(ropaModelDraft),
  breach_intimation_draft: envelope(intimationModelDraft),
  rights_response_draft: envelope(rightsModelDraft),
  notice_draft: envelope(noticeModelDraft, DRAFT_NOTE_LIMIT_2B),
  notice_translation_draft: envelope(noticeModelDraft, DRAFT_NOTE_LIMIT_2B),
  report_narrative_draft: envelope(narrativeModelDraft, DRAFT_NOTE_LIMIT_2B),
} as const;

// ---------------------------------------------------------------------------
// The same shapes as JSON schemas for `output_config.format` (no length bounds)
// ---------------------------------------------------------------------------

const str = (description: string) => ({ type: "string", description });
const LAW_JSON = {
  type: "array",
  description: "The provisions relied on: at least one, at most eight, the most important first.",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["citation", "point", "source"],
    properties: {
      citation: str("Exactly one provision, e.g. 's.8(6)', 'Rule 7(2)', 'Rule 14(3)'."),
      point: str("What that provision says that matters to this draft, in plain words."),
      source: { type: "string", enum: ["statute", "truststack_default"] },
    },
  },
};
const envelopeJson = (draft: Record<string, unknown>, headline: string): Record<string, unknown> => ({
  type: "object",
  additionalProperties: false,
  required: ["answer", "draft", "law", "missingInformation", "counselToConfirm", "confidence"],
  properties: {
    answer: str(headline),
    draft,
    law: LAW_JSON,
    missingInformation: {
      type: "array",
      items: { type: "string" },
      description: "What the draft could not know and a person must add or check: at most eight, the most important first.",
    },
    counselToConfirm: { type: "boolean", description: "True where the law is unclear and counsel must confirm." },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
});

const ROPA_JSON_DESCRIPTIONS: Record<string, string> = {
  name: "A short name for the processing activity, as the organisation would call it.",
  description: "What happens, in two or three plain sentences.",
  dataPrincipalTypes: "Whose personal data: the kinds of people (students, staff, applicants…), never a named person.",
  dataCategories: "The kinds of personal data (contact details, marks, bank details…).",
  purpose: "The specified purpose the data is used for (s.5, s.6).",
  collectionSource: "Where the data comes from (from the person, from a school, from a portal…).",
  sharing: "Who it is shared with, if the description says so; otherwise an empty string.",
  retentionRule: "How long it is kept, if the description says so; otherwise an empty string.",
  securitySafeguards: "The safeguards described, if any; otherwise an empty string. Never invent safeguards.",
};
const noticeJson = (inLanguage: string) => ({
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "purposes"],
  properties: {
    title: str(`The notice's title, ${inLanguage}.`),
    summary: str(`A short plain introduction ${inLanguage}: who the organisation is and why it asks for consent. No contact details.`),
    purposes: {
      type: "array",
      description: "Each specified purpose a consent is asked for (Rule 3(b)): at most twenty.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "title", "uses", "dataItems"],
        properties: {
          key: str("Lower-case letters, digits and underscores, starting with a letter (e.g. 'alumni_updates')."),
          title: str(`The purpose's name, ${inLanguage}.`),
          uses: str(`What it provides or enables for the person, ${inLanguage} (Rule 3(b)(ii)).`),
          dataItems: { type: "array", items: { type: "string" }, description: `The personal data it needs, one item each, ${inLanguage} (Rule 3(b)(i)).` },
        },
      },
    },
  },
});

export const DRAFT_JSON_SCHEMAS: Readonly<Record<DraftTask, Record<string, unknown>>> = {
  ropa_draft: envelopeJson(
    {
      type: "object",
      additionalProperties: false,
      required: [...AI_ROPA_TEXT_FIELDS, "lawfulBasis", ...AI_ROPA_TRI_FIELDS],
      properties: {
        ...Object.fromEntries(AI_ROPA_TEXT_FIELDS.map((f) => [f, str(ROPA_JSON_DESCRIPTIONS[f]!)])),
        lawfulBasis: {
          type: "string",
          enum: [...ROPA_LAWFUL_BASIS_CHOICES],
          description: "The ground the activity seems to rely on — a note for counsel to confirm, never a legal opinion. 'not_sure' when the description does not say.",
        },
        ...Object.fromEntries(
          AI_ROPA_TRI_FIELDS.map((f) => [f, { type: "string", enum: [...TRI_STATES], description: "'unknown' unless the description says." }]),
        ),
      },
    },
    "ONE sentence of at most twenty-five words: what this draft record is, for a person to check before saving.",
  ),
  breach_intimation_draft: envelopeJson(
    {
      type: "object",
      additionalProperties: false,
      required: [...AI_INTIMATION_MODEL_KEYS],
      properties: Object.fromEntries(
        AI_INTIMATION_SECTIONS.filter((s) => s.by === "model").map((s) => [s.key, str(`${s.rule}: ${s.label}. From the breach record only; "[to be confirmed]" where it does not say.`)]),
      ),
    },
    "ONE sentence of at most twenty-five words: what this draft intimation is, for a person and counsel to check before it is sent.",
  ),
  rights_response_draft: envelopeJson(
    {
      type: "object",
      additionalProperties: false,
      required: ["letter", "summary"],
      properties: {
        letter: str("The response letter. Starts 'Dear [Name],'; carries 'Our reference: [reference]', '[date]' and the Rule 9 contact line exactly as the instructions give it. The decision on the request is a placeholder for a person — never stated; nor is whether an access or s.12 right applies."),
        summary: str("One paragraph for the register: what the response covers, with [placeholders] where a person must say what was done."),
      },
    },
    "ONE sentence of at most twenty-five words: what this draft response is, for a person and counsel to check before it is sent.",
  ),
  notice_draft: envelopeJson(
    noticeJson("in plain English"),
    "ONE sentence of at most twenty-five words: what this draft notice covers, for a person and counsel to check before it is published.",
  ),
  notice_translation_draft: envelopeJson(
    noticeJson("in the target language, translated faithfully from the notice — keep every key exactly"),
    "ONE sentence of at most twenty-five words, in English: what this draft translation is, for a person and counsel to check before it is published.",
  ),
  report_narrative_draft: envelopeJson(
    {
      type: "object",
      additionalProperties: false,
      required: ["headline", "paragraphs", "bullets"],
      properties: {
        headline: str("One plain sentence for the Board: the report's main point."),
        paragraphs: { type: "array", items: { type: "string" }, description: "One to four short paragraphs reading the report's figures. Use ONLY numbers that appear in the report." },
        bullets: { type: "array", items: { type: "string" }, description: "At most eight points for the Board to act on, from the report's own actions." },
      },
    },
    "ONE sentence of at most twenty-five words: what this draft narrative is, for a person to check before it is printed.",
  ),
};
// Stage 2b's three drafts: the live model sent no provision at all for a narrative (twice) and for a
// notice (Part C), 2026-10-22, so their structured output is held to at least one, as the Zod schema
// already is (D-134.9, D-135). Only these three — the approved tasks' schemas are unchanged (§7c.9).
for (const task of ["notice_draft", "notice_translation_draft", "report_narrative_draft"] as const) {
  (DRAFT_JSON_SCHEMAS[task].properties as { law: Record<string, unknown> }).law = { ...LAW_JSON, minItems: 1 };
}

// ---------------------------------------------------------------------------
// What the API returns and the draft row stores
// ---------------------------------------------------------------------------

export interface RopaDraftFields {
  name: string;
  description: string;
  dataPrincipalTypes: string;
  dataCategories: string;
  purpose: string;
  collectionSource: string;
  sharing: string;
  retentionRule: string;
  securitySafeguards: string;
  lawfulBasis: RopaLawfulBasis | null;
  childrenData: (typeof TRI_STATES)[number];
  crossBorder: (typeof TRI_STATES)[number];
  aiProcessing: (typeof TRI_STATES)[number];
}

export interface AiDraftAnswer {
  task: DraftTask;
  kind: "draft";
  answer: string;
  draft: Record<string, unknown>;
  law: { citation: string; point: string; source: "statute" | "truststack_default" }[];
  sourceReferences: string[];
  missingInformation: string[];
  counselToConfirm: boolean;
  confidence: "high" | "medium" | "low";
  /** Server-forced, always true (§4.3). */
  requiresHumanReview: true;
  /** Server-forced: the intimation and the response are legal drafts (§4.3). */
  legalReviewRequired: boolean;
  caveat: string;
  reviewNote: string;
  counselNote: string | null;
}

/** What the server adds to a draft: facts read from the register, never from the model. */
export interface DraftFacts {
  /** Rule 7(1) as the breach register records it, for (b)(vi). */
  principals?: { date: string; method: string | null } | null;
  /** A translation: the language asked for, and the source notice's purpose keys it must keep (D-133.2). */
  language?: AiTranslationLanguage;
  sourceKeys?: readonly string[];
  /** A narrative: every word the stored report prints — its numbers are the only numbers allowed (D-133.1). */
  documentText?: string;
  /** A rights letter: the request's kind — an s.11/s.12 right needs the "does it apply" placeholder (D-137). */
  rightsKind?: RightsKind;
}

export type DraftEvaluation =
  | { ok: true; answer: AiDraftAnswer; citationFlags: { citation: string; reason: string }[]; relabelled: number }
  | { ok: false; rejection: AiRejection; detail: string; citationFlags: { citation: string; reason: string }[] };

/** Every string the model wrote — the wording and tenancy checks read all of it. */
function modelStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(modelStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(modelStrings);
  return [];
}

export function evaluateDraft(
  task: DraftTask,
  raw: string,
  options: { index: ProvisionIndex; otherOrganisationNames: readonly string[]; facts?: DraftFacts },
): DraftEvaluation {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, rejection: "invalid_output", detail: "not JSON", citationFlags: [] };
  }
  const parsed = DRAFT_MODEL_SCHEMAS[task].safeParse(json);
  if (!parsed.success) {
    return { ok: false, rejection: "invalid_output", detail: parsed.error.issues.map((i) => i.path.join(".")).join(", "), citationFlags: [] };
  }
  const model = parsed.data as z.infer<(typeof DRAFT_MODEL_SCHEMAS)["ropa_draft"]> & { draft: Record<string, string> };
  const text = [model.answer, ...modelStrings(model.draft), ...model.law.map((l) => l.point), ...model.missingInformation].join("\n");

  const wording = checkWording(text);
  if (wording.length > 0) return { ok: false, rejection: "wording", detail: wording.join(", "), citationFlags: [] };
  if (namesAnotherOrganisation(text, options.otherOrganisationNames)) {
    return { ok: false, rejection: "other_tenant", detail: "names another organisation", citationFlags: [] };
  }

  // D-129.2: the outcome is a person's; the identity stays home as placeholders.
  if (task === "rights_response_draft") {
    const letter = model.draft.letter ?? "";
    if (statesRightsOutcome(`${letter}\n${model.draft.summary ?? ""}`)) {
      return { ok: false, rejection: "wording", detail: "states_outcome", citationFlags: [] };
    }
    if (!letter.includes("[Name]") || !letter.includes("[reference]")) {
      return { ok: false, rejection: "invalid_output", detail: "draft.letter: placeholders", citationFlags: [] };
    }
    // D-137: Rule 9's contact in every response (F3); an s.11/s.12 right never asserted (F2).
    if (!letter.includes(AI_RIGHTS_CONTACT_PLACEHOLDER)) {
      return { ok: false, rejection: "invalid_output", detail: "draft.letter: rule_9_contact", citationFlags: [] };
    }
    if (options.facts?.rightsKind && rightsKindNeedsConsentBasis(options.facts.rightsKind) && !letter.includes(AI_RIGHTS_APPLIES_PLACEHOLDER)) {
      return { ok: false, rejection: "invalid_output", detail: "draft.letter: right_applies", citationFlags: [] };
    }
  }

  // Stage 2b. A notice is publishable in shape (keys, items); a translation keeps the notice's keys.
  if (task === "notice_draft" || task === "notice_translation_draft") {
    const purposes = (model.draft as unknown as { purposes: { key: string; title: string; uses: string; dataItems: string[] }[] }).purposes;
    if (noticePurposeProblems(purposes).length > 0) return { ok: false, rejection: "invalid_output", detail: "draft.purposes", citationFlags: [] };
    if (task === "notice_translation_draft") {
      if (translationKeyProblems(options.facts?.sourceKeys ?? [], purposes.map((p) => p.key)).length > 0) {
        return { ok: false, rejection: "invalid_output", detail: "translation_keys", citationFlags: [] };
      }
    }
  }
  // D-133.1: no number the stored report does not state (a citation's numbers aside).
  if (task === "report_narrative_draft") {
    const n = model.draft as unknown as { headline: string; paragraphs: string[]; bullets: string[] };
    const missing = numbersNotInDocument([n.headline, ...n.paragraphs, ...n.bullets].join("\n"), options.facts?.documentText ?? "");
    if (missing.length > 0) return { ok: false, rejection: "invalid_output", detail: "numbers_not_in_document", citationFlags: [] };
  }

  // §4.2(a), D-126.3 — as `evaluateAnswer`: drop and flag a citation the corpus lacks; relabel a mislabelled one.
  const citationFlags: { citation: string; reason: string }[] = [];
  const law: AiDraftAnswer["law"] = [];
  let relabelled = 0;
  for (const item of model.law) {
    const check = checkCitation(item.citation, options.index);
    if (!check.valid || !check.canonical) {
      citationFlags.push({ citation: item.citation, reason: check.reason ?? "not_in_corpus" });
      continue;
    }
    const source = item.source === "truststack_default" && !namesTrustStackTarget(item.point) ? "statute" : item.source;
    if (source !== item.source) relabelled += 1;
    law.push({ ...item, citation: check.canonical, source });
  }
  if (law.length === 0) return { ok: false, rejection: "citation", detail: "no provision found in the corpus", citationFlags };

  let draft: Record<string, unknown>;
  switch (task) {
    case "ropa_draft": {
      const d = model.draft as unknown as Record<string, string>;
      draft = { ...d, lawfulBasis: d.lawfulBasis === "not_sure" ? null : d.lawfulBasis };
      break;
    }
    case "breach_intimation_draft": {
      // The Rule's order; (iv) and (vi) are the server's, whatever the model sent.
      const d = model.draft as unknown as Record<string, string>;
      draft = Object.fromEntries(
        AI_INTIMATION_SECTIONS.map((s) => [
          s.key,
          s.key === "personFindings"
            ? intimationPersonFindings()
            : s.key === "principalsReport"
              ? intimationPrincipalsReport(options.facts?.principals ?? null)
              : d[s.key],
        ]),
      );
      break;
    }
    case "rights_response_draft":
      draft = { letter: model.draft.letter, summary: model.draft.summary };
      break;
    case "notice_draft":
    case "notice_translation_draft": {
      const d = model.draft as unknown as { title: string; summary: string; purposes: unknown[] };
      draft = {
        // A translation's language is the one asked for — the server's, never the model's.
        ...(task === "notice_translation_draft" ? { language: options.facts?.language ?? null } : { language: "en" }),
        title: d.title,
        summary: d.summary,
        purposes: d.purposes,
      };
      break;
    }
    case "report_narrative_draft":
      draft = { ...(model.draft as unknown as Record<string, unknown>) };
      break;
  }

  const spec = AI_TASK_SPECS[task];
  return {
    ok: true,
    citationFlags,
    relabelled,
    answer: {
      task,
      kind: "draft",
      answer: model.answer,
      draft,
      law,
      sourceReferences: [...new Set(law.map((l) => l.citation))],
      missingInformation: model.missingInformation,
      counselToConfirm: model.counselToConfirm,
      confidence: model.confidence,
      requiresHumanReview: true,
      legalReviewRequired: spec.legal,
      caveat: DPDP_REPORT_CAVEAT,
      reviewNote: AI_REVIEW_NOTE,
      counselNote: spec.legal || model.counselToConfirm ? AI_COUNSEL_NOTE : null,
    },
  };
}

// ---------------------------------------------------------------------------
// What a person may accept — their own edits, validated; never sent to a model
// ---------------------------------------------------------------------------

const ropaAccepted = z
  .object({
    name: z.string().trim().min(1).max(ROPA_NAME_LIMIT),
    ...Object.fromEntries(AI_ROPA_TEXT_FIELDS.filter((f) => f !== "name").map((f) => [f, z.string().trim().max(ROPA_TEXT_LIMIT)])),
    lawfulBasis: z.enum(ROPA_LAWFUL_BASIS_CODES as unknown as [string, ...string[]]).nullable(),
    ...Object.fromEntries(AI_ROPA_TRI_FIELDS.map((f) => [f, z.enum(TRI_STATES)])),
  })
  .strict();

const intimationAccepted = z
  .object(Object.fromEntries(AI_INTIMATION_SECTIONS.map((s) => [s.key, z.string().trim().max(4000)])))
  .strict()
  .refine((d) => Object.values(d).some((v) => String(v).trim() !== ""), "The intimation is empty.");

const rightsAccepted = z
  .object({
    letter: z.string().trim().min(1).max(8000),
    summary: z.string().trim().max(RIGHTS_TEXT_LIMIT),
  })
  .strict();

// Stage 2b: what the notice editor will be pre-filled with — the person saves and publishes there.
const noticeAcceptedContent = {
  title: z.string().trim().min(1).max(NOTICE_LIMITS.title),
  summary: z.string().trim().max(NOTICE_LIMITS.summary),
  purposes: z
    .array(
      z
        .object({
          key: z.string().trim().regex(PURPOSE_KEY_PATTERN, "Use lower-case letters, digits and underscores, starting with a letter."),
          title: z.string().trim().max(NOTICE_LIMITS.purposeTitle),
          uses: z.string().trim().max(NOTICE_LIMITS.purposeUses),
          dataItems: z.array(z.string().trim().max(NOTICE_LIMITS.dataItem)).max(NOTICE_LIMITS.dataItems),
        })
        .strict(),
    )
    .min(1)
    .max(NOTICE_LIMITS.purposes),
};
const noticeAccepted = z.object({ language: z.literal("en"), ...noticeAcceptedContent }).strict();
const translationAccepted = z.object({ language: z.enum(AI_TRANSLATION_LANGUAGES), ...noticeAcceptedContent }).strict();
const narrativeAccepted = z
  .object({
    headline: z.string().trim().min(1).max(AI_NARRATIVE_LIMITS.headline),
    paragraphs: z.array(z.string().trim().min(1).max(AI_NARRATIVE_LIMITS.paragraph)).min(1).max(AI_NARRATIVE_LIMITS.paragraphs),
    bullets: z.array(z.string().trim().min(1).max(AI_NARRATIVE_LIMITS.bullet)).max(AI_NARRATIVE_LIMITS.bullets),
  })
  .strict();

export const ACCEPTED_DRAFT_SCHEMAS = {
  ropa_draft: ropaAccepted,
  breach_intimation_draft: intimationAccepted,
  rights_response_draft: rightsAccepted,
  notice_draft: noticeAccepted,
  notice_translation_draft: translationAccepted,
  report_narrative_draft: narrativeAccepted,
} as const;
