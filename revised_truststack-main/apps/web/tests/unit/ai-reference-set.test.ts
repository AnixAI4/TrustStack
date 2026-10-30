/**
 * Slice 11 Stage 1b — the reference-answer test in CI (SLICE_11 §4.13, §8; D-126.3).
 *
 * Each case's RECORDED answer goes through the server's own guardrails
 * (`evaluateAnswer`: schema, wording, other tenant, citations, the source-label
 * rule) and then the case's checks (`checkReferenceAnswer`): one-sentence
 * headline, the provisions it rests on, statute told apart from TrustStack's
 * targets, the next step, the must-not-say lines. The live model runs the same
 * checks by hand: `node tools/ai_reference_run.mjs`.
 */
import {
  AI_DRAFT_REFERENCE_SET,
  AI_REFERENCE_SET,
  AI_REFERENCE_SET_VERSION,
  AI_TASK_SPECS,
  AI_TASKS,
  checkDraftReferenceAnswer,
  checkReferenceAnswer,
  AI_RIGHTS_APPLIES_PLACEHOLDER,
  AI_RIGHTS_CONTACT_PLACEHOLDER,
} from "@truststack/core";
import { describe, expect, it } from "vitest";
import { evaluateAnswer } from "@/lib/ai/answer";
import { evaluateDraft } from "@/lib/ai/drafts";
import { provisionIndex } from "@/lib/ai/prompt";

const options = { index: provisionIndex(), otherOrganisationNames: ["Bharat Manufacturing Ltd"] };

describe(`the reference set ${AI_REFERENCE_SET_VERSION}`, () => {
  it("has twenty-one explain cases with unique ids, every explain task covered (R21 from the expert review, D-137)", () => {
    expect(AI_REFERENCE_SET).toHaveLength(21);
    expect(new Set(AI_REFERENCE_SET.map((c) => c.id)).size).toBe(21);
    for (const task of AI_TASKS.filter((t) => AI_TASK_SPECS[t].kind === "explain")) {
      expect(AI_REFERENCE_SET.some((c) => c.task === task), task).toBe(true);
    }
  });

  for (const c of AI_REFERENCE_SET) {
    it(`${c.id} · ${c.title}`, () => {
      const evaluation = evaluateAnswer(c.task, JSON.stringify(c.recorded), options);
      expect(evaluation.ok, evaluation.ok ? "" : `${evaluation.rejection}: ${evaluation.detail}`).toBe(true);
      if (!evaluation.ok) return;
      expect(evaluation.citationFlags, "every recorded citation is in the corpus").toEqual([]);
      const check = checkReferenceAnswer(c, evaluation.answer);
      expect(check.failures).toEqual([]);
    });
  }
});

describe("D-126.3 — the server rule: a cited provision of the Act or the Rules is the law", () => {
  const r1 = AI_REFERENCE_SET.find((c) => c.id === "R1")!;
  it("R1 fails as the live model answered it — s.8(10) called a TrustStack default", () => {
    const raw = r1.recorded as unknown as Parameters<typeof checkReferenceAnswer>[1];
    expect(checkReferenceAnswer(r1, raw).failures).toContain("s.8(10) is the law but is labelled truststack_default");
  });
  it("…and passes once the server has relabelled it", () => {
    const evaluation = evaluateAnswer(r1.task, JSON.stringify(r1.recorded), options);
    expect(evaluation.ok && evaluation.relabelled).toBe(1);
    expect(evaluation.ok && evaluation.answer.law.find((l) => l.citation === "s.8(10)")?.source).toBe("statute");
  });
  it("keeps a TrustStack target a TrustStack default (R6's alerts, R20's thirty days)", () => {
    for (const id of ["R6", "R20"]) {
      const c = AI_REFERENCE_SET.find((x) => x.id === id)!;
      const evaluation = evaluateAnswer(c.task, JSON.stringify(c.recorded), options);
      expect(evaluation.ok && evaluation.relabelled, id).toBe(0);
      expect(evaluation.ok && evaluation.answer.law.some((l) => l.source === "truststack_default"), id).toBe(true);
    }
  });
});

describe(`the drafting cases ${AI_REFERENCE_SET_VERSION} (Stages 2a–2b, §7b.8, §7c.7)`, () => {
  it("has twenty drafting cases — ROPA ×3, Rule 7(2) ×4, rights ×3, notice ×4, translation ×3, narrative ×3", () => {
    expect(AI_DRAFT_REFERENCE_SET).toHaveLength(20);
    expect(new Set([...AI_REFERENCE_SET, ...AI_DRAFT_REFERENCE_SET].map((c) => c.id)).size).toBe(41);
    const count = (task: string) => AI_DRAFT_REFERENCE_SET.filter((c) => c.task === task).length;
    expect(
      ["ropa_draft", "breach_intimation_draft", "rights_response_draft", "notice_draft", "notice_translation_draft", "report_narrative_draft"].map(count),
    ).toEqual([3, 4, 3, 4, 3, 3]);
    for (const task of AI_TASKS.filter((t) => AI_TASK_SPECS[t].kind === "draft")) expect(count(task), task).toBeGreaterThan(0);
  });

  for (const c of AI_DRAFT_REFERENCE_SET) {
    it(`${c.id} · ${c.title}`, () => {
      // D6's (vi) comes from the register's own Rule 7(1) record, as the gateway hands it over.
      // Stage 2b's cases carry their own: a translation's source keys and language, a narrative's stored text.
      const facts = {
        ...(c.target.kind === "breach" && c.target.principalsTold ? { principals: { date: "17 Sept 2026, 11:00 IST", method: "Email to each student" } } : {}),
        ...(c.facts ?? {}),
      };
      const evaluation = evaluateDraft(c.task, JSON.stringify(c.recorded), { ...options, facts });
      expect(evaluation.ok, evaluation.ok ? "" : `${evaluation.rejection}: ${evaluation.detail}`).toBe(true);
      if (!evaluation.ok) return;
      expect(evaluation.citationFlags, "every recorded citation is in the corpus").toEqual([]);
      expect(checkDraftReferenceAnswer(c, evaluation.answer).failures).toEqual([]);
    });
  }

  it("the check fails a draft that names a person in (iv), states an outcome or loses a placeholder", () => {
    const d5 = AI_DRAFT_REFERENCE_SET.find((c) => c.id === "D5")!;
    const d10 = AI_DRAFT_REFERENCE_SET.find((c) => c.id === "D10")!;
    const base = { answer: "A draft.", law: [{ citation: "Rule 7(2)", point: "The Board.", source: "statute" }], missingInformation: [], counselToConfirm: true, legalReviewRequired: true };
    expect(checkDraftReferenceAnswer(d5, { ...base, draft: { personFindings: "Mr X did it.", principalsReport: "x" } }).failures).toEqual(
      expect.arrayContaining(["Rule 7(2)(b)(iv) is not the placeholder", 'says "mr "']),
    );
    const law = [{ citation: "s.12(3)", point: "Erasure.", source: "statute" }];
    expect(checkDraftReferenceAnswer(d10, { ...base, law, draft: { letter: "Dear [Name], [reference] [date]. We have erased your data.", summary: "" } }).failures).toEqual(
      expect.arrayContaining(["the draft states an outcome", 'says "we have erased"']),
    );
    expect(checkDraftReferenceAnswer(d10, { ...base, law, draft: { letter: "Dear Asha,", summary: "" } }).failures).toEqual(
      expect.arrayContaining(["the letter lacks [Name]", "the letter lacks [reference]", "the letter lacks [date]"]),
    );
  });
});

describe("Stage 2b — the server's own checks refuse what the cases forbid (D-133)", () => {
  const byId = (id: string) => AI_DRAFT_REFERENCE_SET.find((c) => c.id === id)!;
  const run = (id: string, mutate: (r: Record<string, unknown>) => Record<string, unknown>) => {
    const c = byId(id);
    return evaluateDraft(c.task, JSON.stringify(mutate(structuredClone(c.recorded))), { ...options, facts: { ...(c.facts ?? {}) } });
  };
  it("a translation that renames a key, or drops a purpose, is not kept", () => {
    const renamed = run("D15", (r) => {
      (r.draft as { purposes: { key: string }[] }).purposes[0]!.key = "pravesh";
      return r;
    });
    expect(renamed.ok === false && renamed.detail).toBe("translation_keys");
    const dropped = run("D16", (r) => {
      (r.draft as { purposes: unknown[] }).purposes.pop();
      return r;
    });
    expect(dropped.ok === false && dropped.detail).toBe("translation_keys");
  });
  it("a translation's language is the one asked for, never the model's", () => {
    const e = run("D17", (r) => r);
    expect(e.ok && e.answer.draft.language).toBe("mr");
  });
  it("a narrative stating a figure the report does not is not kept", () => {
    const e = run("D18", (r) => {
      (r.draft as { paragraphs: string[] }).paragraphs.push("9,999 actions are overdue.");
      return r;
    });
    expect(e.ok === false && e.detail).toBe("numbers_not_in_document");
  });
  it("a narrative calling the organisation compliant is not kept", () => {
    const e = run("D19", (r) => {
      (r.draft as { headline: string }).headline = "The University is now fully compliant.";
      return r;
    });
    expect(e.ok === false && e.rejection).toBe("wording");
  });
  it("a notice whose purposes are not publishable in shape is not kept", () => {
    const e = run("D11", (r) => {
      const p = (r.draft as { purposes: { key: string }[] }).purposes;
      p[1]!.key = p[0]!.key;
      return r;
    });
    expect(e.ok === false && e.detail).toBe("draft.purposes");
  });
  it("a notice draft never carries the fixed texts' fields — the server drops nothing, the schema refuses them", () => {
    const e = run("D12", (r) => {
      (r.draft as Record<string, unknown>).withdrawMeans = "Write to us.";
      return r;
    });
    expect(e.ok === false && e.rejection).toBe("invalid_output");
  });
});

describe("the expert review's rights rules (D-137) — the server refuses a letter that breaks them", () => {
  const d8 = AI_DRAFT_REFERENCE_SET.find((c) => c.id === "D8")!;
  const letterOf = (r: Record<string, unknown>) => (r.draft as { letter: string }).letter;
  const withLetter = (letter: string) => ({ ...structuredClone(d8.recorded), draft: { ...(d8.recorded.draft as object), letter } });
  it("Rule 9: a letter without the contact line is not kept (F3)", () => {
    const letter = letterOf(d8.recorded).replace(AI_RIGHTS_CONTACT_PLACEHOLDER, "our office");
    const e = evaluateDraft("rights_response_draft", JSON.stringify(withLetter(letter)), { ...options, facts: { rightsKind: "access" } });
    expect(e.ok === false && e.detail).toBe("draft.letter: rule_9_contact");
  });
  it("s.11/s.12: a letter that does not leave 'does the right apply' to a person is not kept (F2) — grievance and nomination need none", () => {
    const letter = letterOf(d8.recorded).replace(AI_RIGHTS_APPLIES_PLACEHOLDER, "");
    for (const kind of ["access", "correction", "completion", "updating", "erasure"] as const) {
      const e = evaluateDraft("rights_response_draft", JSON.stringify(withLetter(letter)), { ...options, facts: { rightsKind: kind } });
      expect(e.ok === false && e.detail, kind).toBe("draft.letter: right_applies");
    }
    for (const kind of ["grievance", "nomination"] as const) {
      expect(evaluateDraft("rights_response_draft", JSON.stringify(withLetter(letter)), { ...options, facts: { rightsKind: kind } }).ok, kind).toBe(true);
    }
  });
});
