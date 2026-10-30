import "server-only";
import { AI_DRAFT_REFERENCE_SET, AI_REFERENCE_SET, AI_TASK_SPECS, type AiTask } from "@truststack/core";
import type { AiProvider, ProviderRequest, ProviderResult } from "./provider";

/**
 * The recorded fake (SLICE_11 §0.4: no live model call in CI). Deterministic:
 * the same request gives the same answer. CI and e2e run the gateway against it
 * with `AI_PROVIDER=fake`; it refuses to exist on the live site.
 *
 * A hostile answer is chosen by a marker in the request — `[fake:<scenario>]`
 * in the person's question — so e2e can prove each guardrail through the whole
 * chain (route → guardrails → draft row → audit). The unit suite drives
 * `evaluateAnswer` with the same outputs directly.
 *
 * Stage 1b: with no scenario, the Evidence, Gap/Action and Score helpers answer
 * with their reference case's recorded answer (R13, R15, R17), so the panel shows
 * an answer that fits what was asked; the Question Helper keeps 1a's answer.
 *
 * Stage 2a: a drafting task answers with its reference case's recorded draft (D1,
 * D4, D8). A hostile marker gives a DRAFT-shaped hostile answer — calling the
 * organisation compliant, naming another organisation, an invented citation, a
 * rights letter that states the outcome or drops its placeholders — so e2e proves
 * the drafting guardrails through the whole chain too.
 *
 * Stage 2b: the notice drafts D11; a translation answers D16 (Hindi) or D17 (Marathi)
 * with its purposes re-keyed to the source notice's own keys (read from the prompt's
 * `<purpose_keys>`, as a faithful model keeps them); a narrative answers D20, which
 * states no figure of its own. `invented_number` and `renamed_key` prove the two new
 * server checks through the chain.
 */

export const FAKE_MODEL = "fake-recorded-1a";

export const FAKE_SCENARIOS = [
  "ok",
  "certifies",
  "approves_evidence",
  "closes_gap",
  "changes_score",
  "statute_target",
  "bad_citation",
  "partial_citation",
  "other_tenant",
  "refusal",
  "truncated",
  "invalid_json",
  "states_outcome",
  "no_placeholders",
  "invented_number",
  "renamed_key",
] as const;
export type FakeScenario = (typeof FAKE_SCENARIOS)[number];

/** A well-formed, calm answer — the shape every scenario starts from. */
export function fakeAnswer(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    answer: "This question asks whether your organisation has a written way to protect the personal data it holds.",
    whyItMatters:
      "Your organisation decides why and how personal data is used, so it is the Data Fiduciary and must take reasonable security safeguards. A clear answer here shows where you stand before the Rules on security apply from 13 May 2027.",
    nextStep: { label: "Answer this question", page: "answer_question" },
    moreDetail:
      "A Data Fiduciary — your organisation, which decides why and how data is used — must protect personal data with reasonable security safeguards to prevent a personal data breach. The Rules list the minimum: encryption or masking, access control, logs, backups and contracts with processors. Counsel should confirm how this applies to your systems.",
    law: [
      { citation: "s.8(5)", point: "A Data Fiduciary must protect personal data with reasonable security safeguards.", source: "statute" },
      { citation: "Rule 6(1)", point: "The Rules set the minimum safeguards, such as encryption, access control and logs.", source: "statute" },
    ],
    suggestedEvidence: ["Information security policy", "Access control register"],
    missingInformation: [],
    counselToConfirm: false,
    confidence: "medium",
    ...overrides,
  };
}

const SCENARIO_ANSWERS: Partial<Record<FakeScenario, Record<string, unknown>>> = {
  certifies: fakeAnswer({ answer: "Your organisation is fully compliant with the DPDP Act on this point." }),
  approves_evidence: fakeAnswer({ moreDetail: "I have approved the uploaded policy, so nothing more is needed." }),
  closes_gap: fakeAnswer({ whyItMatters: "The gap has been closed, so this is done." }),
  changes_score: fakeAnswer({ moreDetail: "I have raised the score for this domain to reflect the policy." }),
  statute_target: fakeAnswer({ whyItMatters: "The Act requires you to answer every rights request within 30 days." }),
  bad_citation: fakeAnswer({
    law: [
      { citation: "s.99(1)", point: "An invented section.", source: "statute" },
      { citation: "Article 33 GDPR", point: "Another law entirely.", source: "statute" },
    ],
  }),
  partial_citation: fakeAnswer({
    law: [
      { citation: "s.8(5)", point: "A Data Fiduciary must protect personal data with reasonable security safeguards.", source: "statute" },
      { citation: "Rule 42(9)", point: "An invented rule.", source: "statute" },
    ],
  }),
  other_tenant: fakeAnswer({ whyItMatters: "Mumbai University handles this better than you do." }),
};

/** The recorded answer each explain helper gives when nothing hostile is asked for. */
const TASK_ANSWERS: Partial<Record<AiTask, Record<string, unknown>>> = {
  evidence_helper: AI_REFERENCE_SET.find((c) => c.id === "R13")?.recorded,
  gap_helper: AI_REFERENCE_SET.find((c) => c.id === "R15")?.recorded,
  score_helper: AI_REFERENCE_SET.find((c) => c.id === "R17")?.recorded,
};

/** The recorded draft each drafting task gives when nothing hostile is asked for. */
const DRAFT_ANSWERS: Partial<Record<AiTask, Record<string, unknown>>> = {
  ropa_draft: AI_DRAFT_REFERENCE_SET.find((c) => c.id === "D1")?.recorded,
  breach_intimation_draft: AI_DRAFT_REFERENCE_SET.find((c) => c.id === "D4")?.recorded,
  rights_response_draft: AI_DRAFT_REFERENCE_SET.find((c) => c.id === "D8")?.recorded,
  notice_draft: AI_DRAFT_REFERENCE_SET.find((c) => c.id === "D11")?.recorded,
  notice_translation_draft: AI_DRAFT_REFERENCE_SET.find((c) => c.id === "D16")?.recorded,
  report_narrative_draft: AI_DRAFT_REFERENCE_SET.find((c) => c.id === "D20")?.recorded,
};

/** A block the gateway wrote into the prompt (trusted JSON), or null. */
function promptBlock(user: string, tag: string): unknown {
  const m = new RegExp(`<${tag}>\\n([\\s\\S]*?)\\n</${tag}>`).exec(user);
  if (!m) return null;
  try {
    return JSON.parse(m[1]!);
  } catch {
    return null;
  }
}

/** The recorded translation in the language asked for, its purposes carrying the source notice's own keys. */
function translationFor(user: string): Record<string, unknown> | undefined {
  const language = (promptBlock(user, "target_language") as { code?: string } | null)?.code;
  const base = AI_DRAFT_REFERENCE_SET.find((c) => c.id === (language === "mr" ? "D17" : "D16"))?.recorded;
  if (!base) return undefined;
  const keys = (promptBlock(user, "purpose_keys") as string[] | null) ?? [];
  const recorded = (base.draft as { purposes: Record<string, unknown>[] }).purposes;
  if (keys.length === 0) return base;
  return { ...base, draft: { ...(base.draft as object), purposes: keys.map((key, i) => ({ ...recorded[i % recorded.length], key })) } };
}

/** A drafting task's hostile answer: its recorded draft with one thing wrong. */
function hostileDraft(task: AiTask, scenario: FakeScenario, user: string): Record<string, unknown> | undefined {
  const base = task === "notice_translation_draft" ? translationFor(user) : DRAFT_ANSWERS[task];
  if (!base) return undefined;
  const draft = base.draft as Record<string, string>;
  const firstKey = Object.keys(draft)[0]!;
  switch (scenario) {
    case "certifies":
      return { ...base, answer: "This draft confirms the organisation is fully compliant with the DPDP Act." };
    case "other_tenant":
      return { ...base, draft: { ...draft, [firstKey]: `${draft[firstKey]} Bharat Manufacturing Ltd handles this better.` } };
    case "bad_citation":
      return { ...base, law: [{ citation: "s.99(1)", point: "An invented section.", source: "statute" }] };
    case "states_outcome":
      return { ...base, draft: { ...draft, letter: `${draft.letter ?? ""}

We have erased all of your personal data.` } };
    case "no_placeholders":
      return { ...base, draft: { ...draft, letter: String(draft.letter ?? "").replaceAll("[Name]", "Student").replaceAll("[reference]", "the request") } };
    case "invented_number": {
      const n = base.draft as { paragraphs?: string[] };
      return { ...base, draft: { ...n, paragraphs: [...(n.paragraphs ?? []), "9,999 actions are overdue."] } };
    }
    case "renamed_key": {
      const n = base.draft as { purposes?: { key: string }[] };
      return { ...base, draft: { ...n, purposes: (n.purposes ?? []).map((p, i) => (i === 0 ? { ...p, key: `${p.key}_translated` } : p)) } };
    }
    default:
      return undefined;
  }
}

const USAGE = { inputTokens: 900, outputTokens: 450, cacheReadTokens: 30_000, cacheWriteTokens: 0 };

export function scenarioFrom(text: string): FakeScenario {
  const m = /\[fake:([a-z_]+)\]/.exec(text);
  const s = m?.[1] as FakeScenario | undefined;
  return s && (FAKE_SCENARIOS as readonly string[]).includes(s) ? s : "ok";
}

export function createFakeProvider(): AiProvider {
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("The fake AI provider never runs on the live site.");
  }
  return {
    name: "fake",
    model: FAKE_MODEL,
    async complete(request: ProviderRequest): Promise<ProviderResult> {
      const base = { model: FAKE_MODEL, usage: USAGE, latencyMs: 5 };
      const scenario = scenarioFrom(request.user);
      switch (scenario) {
        case "refusal":
          return { ...base, kind: "refusal", category: "general_harms" };
        case "truncated":
          return { ...base, kind: "truncated" };
        case "invalid_json":
          return { ...base, kind: "answer", text: "{ not json" };
        default:
          if (AI_TASK_SPECS[request.task].kind === "draft") {
            const recorded = request.task === "notice_translation_draft" ? translationFor(request.user) : DRAFT_ANSWERS[request.task];
            return { ...base, kind: "answer", text: JSON.stringify(hostileDraft(request.task, scenario, request.user) ?? recorded) };
          }
          return {
            ...base,
            kind: "answer",
            text: JSON.stringify(SCENARIO_ANSWERS[scenario] ?? (scenario === "ok" ? TASK_ANSWERS[request.task] : undefined) ?? fakeAnswer()),
          };
      }
    },
  };
}
