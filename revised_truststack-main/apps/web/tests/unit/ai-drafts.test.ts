/**
 * Slice 11 Stage 2a — the drafting guardrails (SLICE_11 §4.3, §7b.3, §8; D-129).
 * `evaluateDraft` is driven with the recorded fake's drafts and hostile variants:
 * the server — never the model — sets the review flags, the caveat, the counsel
 * note, Rule 7(2)(b)(iv) and (b)(vi); a rights draft that states an outcome or
 * drops its placeholders is refused; the wording, other-tenant and citation checks
 * run on every string. And what a person may accept.
 */
import {
  AI_COUNSEL_NOTE,
  AI_INTIMATION_NO_PRINCIPALS_YET,
  AI_INTIMATION_PERSON_PLACEHOLDER,
  AI_INTIMATION_SECTIONS,
  AI_TASK_SPECS,
  DPDP_REPORT_CAVEAT,
  type AiTask,
} from "@truststack/core";
import { describe, expect, it } from "vitest";
import { ACCEPTED_DRAFT_SCHEMAS, DRAFT_JSON_SCHEMAS, DRAFT_MODEL_SCHEMAS, evaluateDraft, type DraftFacts, type DraftTask } from "@/lib/ai/drafts";
import { createFakeProvider } from "@/lib/ai/fake";
import { provisionIndex } from "@/lib/ai/prompt";

const OPTIONS = { index: provisionIndex(), otherOrganisationNames: ["Bharat Manufacturing Ltd"] };
const DRAFT_TASKS: DraftTask[] = ["ropa_draft", "breach_intimation_draft", "rights_response_draft"];

async function fakeText(task: AiTask, scenario = "ok"): Promise<string> {
  const result = await createFakeProvider().complete({
    task,
    system: "",
    user: `<person_question>[fake:${scenario}]</person_question>`,
    schema: {},
    effort: "medium",
    maxTokens: 1000,
  });
  if (result.kind !== "answer") throw new Error(`scenario ${scenario} gave ${result.kind}`);
  return result.text;
}
const evaluate = async (task: DraftTask, scenario = "ok", facts?: DraftFacts) => evaluateDraft(task, await fakeText(task, scenario), { ...OPTIONS, facts });

describe("a good draft comes back with the server's flags, never the model's", () => {
  for (const task of DRAFT_TASKS) {
    it(`${task}: forces review, sets the counsel note from the task, adds the caveat`, async () => {
      const r = await evaluate(task);
      expect(r.ok, r.ok ? "" : `${r.rejection}: ${r.detail}`).toBe(true);
      if (!r.ok) return;
      expect(r.answer.kind).toBe("draft");
      expect(r.answer.requiresHumanReview).toBe(true);
      expect(r.answer.legalReviewRequired).toBe(AI_TASK_SPECS[task].legal);
      expect(r.answer.caveat).toBe(DPDP_REPORT_CAVEAT);
      if (AI_TASK_SPECS[task].legal) expect(r.answer.counselNote).toBe(AI_COUNSEL_NOTE);
      expect(r.citationFlags).toEqual([]);
    });
  }
  it("the intimation and the response are legal drafts; a processing record is not (§4.3)", () => {
    expect(AI_TASK_SPECS.breach_intimation_draft.legal).toBe(true);
    expect(AI_TASK_SPECS.rights_response_draft.legal).toBe(true);
    expect(AI_TASK_SPECS.ropa_draft.legal).toBe(false);
  });
});

describe("Rule 7(2): (iv) is always a placeholder and (vi) comes from the register", () => {
  it("lays the draft out in the Rule's order, with (iv) the placeholder", async () => {
    const r = await evaluate("breach_intimation_draft");
    if (!r.ok) throw new Error(r.detail);
    expect(Object.keys(r.answer.draft)).toEqual(AI_INTIMATION_SECTIONS.map((s) => s.key));
    expect(r.answer.draft.personFindings).toBe(AI_INTIMATION_PERSON_PLACEHOLDER);
  });
  it("(vi) says nobody is recorded as told yet — or reports the recorded intimation", async () => {
    const none = await evaluate("breach_intimation_draft", "ok", { principals: null });
    expect(none.ok && none.answer.draft.principalsReport).toBe(AI_INTIMATION_NO_PRINCIPALS_YET);
    const told = await evaluate("breach_intimation_draft", "ok", { principals: { date: "17 Sept 2026, 11:00 IST", method: "Email to each student" } });
    expect(told.ok && told.answer.draft.principalsReport).toMatch(/^The affected Data Principals were informed on 17 Sept 2026, 11:00 IST, by: Email to each student/);
  });
  it("a model that tries to write (iv) itself is refused — the schema has no room for it", async () => {
    const raw = JSON.parse(await fakeText("breach_intimation_draft"));
    raw.draft.personFindings = "Mr A. Clerk reused his password.";
    const r = evaluateDraft("breach_intimation_draft", JSON.stringify(raw), OPTIONS);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.rejection).toBe("invalid_output");
  });
});

describe("a rights response never decides the outcome, and keeps the person's identity home (D-129.2)", () => {
  it("refuses a letter that states the outcome", async () => {
    const r = await evaluate("rights_response_draft", "states_outcome");
    expect(r.ok).toBe(false);
    expect(!r.ok && [r.rejection, r.detail]).toEqual(["wording", "states_outcome"]);
  });
  it("refuses a letter without its [Name] and [reference] placeholders", async () => {
    const r = await evaluate("rights_response_draft", "no_placeholders");
    expect(!r.ok && [r.rejection, r.detail]).toEqual(["invalid_output", "draft.letter: placeholders"]);
  });
  it("has no outcome field for the model to fill", () => {
    const keys = Object.keys((DRAFT_JSON_SCHEMAS.rights_response_draft.properties as { draft: { properties: object } }).draft.properties);
    expect(keys).toEqual(["letter", "summary"]);
  });
});

describe("the guardrails every draft passes, on every string", () => {
  for (const task of DRAFT_TASKS) {
    it(`${task}: "compliant", another organisation, an invented citation`, async () => {
      expect(await evaluate(task, "certifies")).toMatchObject({ ok: false, rejection: "wording" });
      expect(await evaluate(task, "other_tenant")).toMatchObject({ ok: false, rejection: "other_tenant" });
      expect(await evaluate(task, "bad_citation")).toMatchObject({ ok: false, rejection: "citation" });
    });
  }
  it("is not JSON, or not the task's shape: invalid_output", () => {
    expect(evaluateDraft("ropa_draft", "{ nope", OPTIONS)).toMatchObject({ ok: false, rejection: "invalid_output" });
    expect(evaluateDraft("ropa_draft", JSON.stringify({ answer: "x" }), OPTIONS)).toMatchObject({ ok: false, rejection: "invalid_output" });
  });
  it("a ROPA draft never carries a risk rating or a status (D-061)", async () => {
    const raw = JSON.parse(await fakeText("ropa_draft"));
    for (const extra of [{ riskRatingAssessor: "high" }, { status: "approved" }]) {
      const r = evaluateDraft("ropa_draft", JSON.stringify({ ...raw, draft: { ...raw.draft, ...extra } }), OPTIONS);
      expect(r).toMatchObject({ ok: false, rejection: "invalid_output" });
    }
  });
  it("a ROPA draft's 'not sure' lawful basis is stored as none chosen — a note for counsel", async () => {
    const raw = JSON.parse(await fakeText("ropa_draft"));
    const r = evaluateDraft("ropa_draft", JSON.stringify({ ...raw, draft: { ...raw.draft, lawfulBasis: "not_sure" } }), OPTIONS);
    expect(r.ok && r.answer.draft.lawfulBasis).toBeNull();
  });
});

describe("a long draft's lists are kept to the first eight, never refused for a ninth (D-130.13)", () => {
  it("keeps the first eight provisions and the first eight unknowns", async () => {
    const raw = JSON.parse(await fakeText("rights_response_draft"));
    const law = Array.from({ length: 10 }, () => ({ citation: "s.11(1)", point: "Access to a summary.", source: "statute" }));
    const missing = Array.from({ length: 11 }, (_, i) => `Unknown ${i + 1}`);
    const r = evaluateDraft("rights_response_draft", JSON.stringify({ ...raw, law, missingInformation: missing }), OPTIONS);
    expect(r.ok, r.ok ? "" : r.detail).toBe(true);
    expect(r.ok && r.answer.law).toHaveLength(8);
    expect(r.ok && r.answer.missingInformation).toEqual(missing.slice(0, 8));
  });
});

describe("the structured-output schemas and the Zod checks describe the same shapes", () => {
  for (const task of DRAFT_TASKS) {
    it(`${task}: the same required keys, and no others`, () => {
      const json = DRAFT_JSON_SCHEMAS[task] as { required: string[]; properties: Record<string, { required?: string[]; properties?: object }>; additionalProperties: boolean };
      const zod = DRAFT_MODEL_SCHEMAS[task];
      expect([...json.required].sort()).toEqual(Object.keys(zod.shape).sort());
      expect(Object.keys(json.properties).sort()).toEqual(Object.keys(zod.shape).sort());
      expect(json.additionalProperties).toBe(false);
      const draftZod = zod.shape.draft as unknown as { shape: Record<string, unknown> };
      expect([...json.properties.draft!.required!].sort()).toEqual(Object.keys(draftZod.shape).sort());
      expect(Object.keys(json.properties.draft!.properties!).sort()).toEqual(Object.keys(draftZod.shape).sort());
      expect(JSON.stringify(json)).not.toMatch(/maxLength|minLength|maxItems|minItems/);
    });
  }
});

describe("what a person may accept — their own edits, validated (never sent to a model)", () => {
  it("a ROPA record: the create form's fields; a lawful basis is a register code or none", () => {
    const ok = {
      name: "Admissions",
      description: "",
      dataPrincipalTypes: "Applicants",
      dataCategories: "",
      purpose: "Admission",
      collectionSource: "",
      sharing: "",
      retentionRule: "",
      securitySafeguards: "",
      lawfulBasis: null,
      childrenData: "unknown",
      crossBorder: "no",
      aiProcessing: "unknown",
    };
    expect(ACCEPTED_DRAFT_SCHEMAS.ropa_draft.safeParse(ok).success).toBe(true);
    expect(ACCEPTED_DRAFT_SCHEMAS.ropa_draft.safeParse({ ...ok, lawfulBasis: "not_sure" }).success).toBe(false);
    expect(ACCEPTED_DRAFT_SCHEMAS.ropa_draft.safeParse({ ...ok, name: "" }).success).toBe(false);
    expect(ACCEPTED_DRAFT_SCHEMAS.ropa_draft.safeParse({ ...ok, status: "approved" }).success).toBe(false);
  });
  it("an intimation: the eleven sections, and the person may complete (iv)", () => {
    const fields = Object.fromEntries(AI_INTIMATION_SECTIONS.map((s) => [s.key, "text"]));
    expect(ACCEPTED_DRAFT_SCHEMAS.breach_intimation_draft.safeParse(fields).success).toBe(true);
    expect(ACCEPTED_DRAFT_SCHEMAS.breach_intimation_draft.safeParse(Object.fromEntries(AI_INTIMATION_SECTIONS.map((s) => [s.key, ""]))).success).toBe(false);
  });
  it("a response: the letter and a summary that fits the register (≤ 4,000) — and no outcome", () => {
    expect(ACCEPTED_DRAFT_SCHEMAS.rights_response_draft.safeParse({ letter: "Dear [Name],", summary: "x".repeat(4000) }).success).toBe(true);
    expect(ACCEPTED_DRAFT_SCHEMAS.rights_response_draft.safeParse({ letter: "Dear [Name],", summary: "x".repeat(4001) }).success).toBe(false);
    expect(ACCEPTED_DRAFT_SCHEMAS.rights_response_draft.safeParse({ letter: "Dear [Name],", summary: "", outcome: "fulfilled" }).success).toBe(false);
  });
});

describe("Stage 2b's envelope (D-135): a provision required, and room for a note — 2a's drafts unchanged", () => {
  const note = (n: number) => "x".repeat(n);
  const withNote = (task: DraftTask, length: number) => {
    const base = DRAFT_MODEL_SCHEMAS[task];
    const shape = (base as unknown as { shape: Record<string, unknown> }).shape;
    return { shape, length };
  };
  it("2b's three accept a 600-character note and refuse 601; 2a's keep 300", () => {
    for (const task of ["notice_draft", "notice_translation_draft", "report_narrative_draft"] as const) {
      const { shape } = withNote(task, 0);
      const field = shape.missingInformation as import("zod").ZodType;
      expect(field.safeParse([note(600)]).success, task).toBe(true);
      expect(field.safeParse([note(601)]).success, task).toBe(false);
    }
    for (const task of ["ropa_draft", "breach_intimation_draft", "rights_response_draft"] as const) {
      const field = (DRAFT_MODEL_SCHEMAS[task] as unknown as { shape: Record<string, import("zod").ZodType> }).shape.missingInformation!;
      expect(field.safeParse([note(300)]).success, task).toBe(true);
      expect(field.safeParse([note(301)]).success, task).toBe(false);
    }
  });
  it("structured output asks for at least one provision on 2b's three only", () => {
    const law = (task: DraftTask) => (DRAFT_JSON_SCHEMAS[task].properties as { law: { minItems?: number } }).law.minItems;
    for (const task of ["notice_draft", "notice_translation_draft", "report_narrative_draft"] as const) expect(law(task), task).toBe(1);
    for (const task of ["ropa_draft", "breach_intimation_draft", "rights_response_draft"] as const) expect(law(task), task).toBeUndefined();
  });
});
