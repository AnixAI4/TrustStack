import { describe, expect, it } from "vitest";
import {
  AI_INTIMATION_MODEL_KEYS,
  AI_INTIMATION_SECTIONS,
  intimationPersonFindings,
  intimationPlainText,
  intimationPrincipalsReport,
  statesRightsOutcome,
  AI_NARRATIVE_SECTION_TITLE,
  AI_TRANSLATION_LANGUAGES,
  isNoticeSource,
  narratedDocument,
  numbersNotInDocument,
  statedNumbers,
  translationKeyProblems,
} from "./ai-drafts.js";
import type { ReportDocument } from "./reports.js";
import { AI_DRAFT_TASKS, AI_INTIMATION_NO_PRINCIPALS_YET, AI_INTIMATION_PERSON_PLACEHOLDER, AI_TASK_SPECS } from "./ai-tasks.js";

describe("the drafting tasks (SLICE_11 §7b.2, §7c.2; D-129)", () => {
  it("are six, each read and decided with its register's permissions", () => {
    expect(AI_DRAFT_TASKS).toEqual([
      "ropa_draft",
      "breach_intimation_draft",
      "rights_response_draft",
      "notice_draft",
      "notice_translation_draft",
      "report_narrative_draft",
    ]);
    expect(AI_DRAFT_TASKS.map((t) => [AI_TASK_SPECS[t].readPermission, AI_TASK_SPECS[t].writePermission])).toEqual([
      ["ropa.read", "ropa.write"],
      ["breach.read", "breach.write"],
      ["rights.read", "rights.write"],
      ["consent.read", "consent.write"],
      ["consent.read", "consent.write"],
      ["report.read", "report.generate"],
    ]);
  });
  it("Stage 2b's three are legal drafts, at medium effort (§7c.2)", () => {
    for (const t of ["notice_draft", "notice_translation_draft", "report_narrative_draft"] as const) {
      expect(AI_TASK_SPECS[t]).toMatchObject({ kind: "draft", effort: "medium", legal: true });
    }
    expect([AI_TASK_SPECS.notice_draft.targetType, AI_TASK_SPECS.notice_translation_draft.targetType, AI_TASK_SPECS.report_narrative_draft.targetType]).toEqual([
      "notice_new",
      "privacy_notice",
      "report",
    ]);
  });
  it("an explain task has no write permission — it is never accepted", () => {
    for (const t of ["question_helper", "evidence_helper", "gap_helper", "score_helper"] as const) expect(AI_TASK_SPECS[t].writePermission).toBeNull();
  });
});

describe("Rule 7(2) — the sections in the Rule's order", () => {
  it("lists (a)'s five parts and (b)(i)–(vi); the model writes nine, the server (iv) and (vi)", () => {
    expect(AI_INTIMATION_SECTIONS.map((s) => s.rule)).toEqual([
      ...Array(5).fill("Rule 7(2)(a)"),
      "Rule 7(2)(b)(i)",
      "Rule 7(2)(b)(ii)",
      "Rule 7(2)(b)(iii)",
      "Rule 7(2)(b)(iv)",
      "Rule 7(2)(b)(v)",
      "Rule 7(2)(b)(vi)",
    ]);
    expect(AI_INTIMATION_MODEL_KEYS).not.toContain("personFindings");
    expect(AI_INTIMATION_MODEL_KEYS).not.toContain("principalsReport");
    expect(intimationPersonFindings()).toBe(AI_INTIMATION_PERSON_PLACEHOLDER);
  });
  it("(vi) reports the recorded intimation, or says none is recorded", () => {
    expect(intimationPrincipalsReport(null)).toBe(AI_INTIMATION_NO_PRINCIPALS_YET);
    expect(intimationPrincipalsReport({ date: "17 Sept 2026, 11:00 IST", method: "SMS" })).toMatch(/informed on 17 Sept 2026, 11:00 IST, by: SMS \(Rule 7\(1\)\)/);
  });
  it("prints as plain text in the Rule's order, with the seventy-two hours in the Rule's words", () => {
    const text = intimationPlainText(Object.fromEntries(AI_INTIMATION_SECTIONS.map((s) => [s.key, `[${s.key}]`])), "BRH-2026-002");
    expect(text.startsWith("BRH-2026-002\n")).toBe(true);
    expect(text).toContain("such longer period as the Board may allow");
    const order = AI_INTIMATION_SECTIONS.map((s) => text.indexOf(`[${s.key}]`));
    expect(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1]!))).toBe(true);
  });
});

describe("a rights response never states the outcome (D-129.2)", () => {
  it("finds a claim of what was decided or done", () => {
    for (const t of [
      "We have erased all of your personal data.",
      "Your request has been granted.",
      "Your grievance is rejected.",
      "We hereby decline your request.",
      "I have now corrected your record.",
    ]) {
      expect(statesRightsOutcome(t), t).toBe(true);
    }
  });
  it("leaves placeholders, conditions and descriptions of the right alone", () => {
    for (const t of [
      "[What we did — to be completed by the person handling this request]",
      "Once we have verified your identity, we will act on your request.",
      "We must keep data where a law requires it (s.12(3)).",
      "We have not yet erased anything while we check.",
      "You asked us to erase personal data we hold about you.",
    ]) {
      expect(statesRightsOutcome(t), t).toBe(false);
    }
  });
});

describe("a notice is drafted from the consent-based records only (D-133.3, s.5(1))", () => {
  it("consent or not yet decided — never an s.7 legitimate use or an s.17 exemption", () => {
    expect(isNoticeSource("consent")).toBe(true);
    expect(isNoticeSource(null)).toBe(true);
    for (const b of ["voluntary", "employment", "legal_obligation", "medical_emergency", "exempt"] as const) expect(isNoticeSource(b)).toBe(false);
  });
});

describe("a translation keeps every purpose's key (D-133.2)", () => {
  it("offers Hindi and Marathi only", () => {
    expect(AI_TRANSLATION_LANGUAGES).toEqual(["hi", "mr"]);
  });
  it("passes the same keys in any order; refuses a changed, missing, extra or repeated key", () => {
    expect(translationKeyProblems(["admissions", "alumni"], ["alumni", "admissions"])).toEqual([]);
    expect(translationKeyProblems(["admissions", "alumni"], ["admissions", "alumni_hi"])).toEqual([
      'The purpose "alumni" is missing.',
      '"alumni_hi" is not a purpose of the notice.',
    ]);
    expect(translationKeyProblems(["admissions", "alumni"], ["admissions"])[0]).toBe("The translation has 1 purposes; the notice has 2.");
    expect(translationKeyProblems(["a1"], ["a1", "a1"])).toContain("A purpose appears twice.");
  });
});

describe("a narrative states no number its report does not (D-133.1)", () => {
  it("reads figures as written: Indian grouping, decimals, money", () => {
    expect(statedNumbers("₹250 crore across 1,20,000 people; 24.70% confidence; 3 heads")).toEqual(["250", "120000", "24.7", "3"]);
  });
  it("a citation's numbers are not figures — s.8(6), Rule 7(2)(b), sections 11 to 14, the Act, 2023", () => {
    expect(statedNumbers("Under s.8(6) and Rule 7(2)(b), sections 11 to 14 of the Act, 2023, and G.S.R. 846(E)", { exceptCitations: true })).toEqual([]);
  });
  it("passes figures and dates the document states; flags one it does not", () => {
    const doc = "As of 22 October 2026 · 52 high · 10 critical · ₹250 crore · 24.7% · Head 3 Exposed";
    expect(numbersNotInDocument("On 22 October 2026, 10 critical findings and 52 high ones put ₹250 crore at stake (s.33, Head 3).", doc)).toEqual([]);
    expect(numbersNotInDocument("37 actions are overdue and confidence is 24.7%.", doc)).toEqual(["37"]);
    expect(numbersNotInDocument("A deadline of 30 June 2027 applies.", doc)).toEqual(["30", "2027"]);
  });
});

describe("a narrated version is version N's document with the narrative in front (D-133.1)", () => {
  const source: ReportDocument = {
    kind: "exposure_brief",
    title: "DPDP Exposure Brief",
    audience: "The Board",
    organizationName: "Mumbai University",
    meta: [
      { label: "As of", value: "22 October 2026" },
      { label: "Version", value: "4" },
      { label: "Generated", value: "22 October 2026, 10:00 IST by A. Person" },
    ],
    sections: [{ title: "Where we stand", blocks: [{ type: "paragraph", text: "Head 3 is Exposed." }] }],
    caveats: [{ title: "Not legal advice", text: "…" }],
    notes: ["How to read it."],
    footer: "TrustStack DPDP Compass · DPDP Exposure Brief v4 · Mumbai University · Confidential",
  };
  const doc = narratedDocument(source, {
    version: 5,
    sourceVersion: 4,
    sourceGeneratedAt: "2026-10-22T04:30:00Z",
    generatedAt: "2026-10-22T06:00:00Z",
    generatedByName: "B. Person",
    narrative: { headline: "One head is exposed.", paragraphs: ["Head 3 is Exposed."], bullets: ["Close the consent gap."] },
    acceptedByName: "B. Person",
    acceptedAt: "2026-10-22T05:55:00Z",
  });
  it("keeps every section, caveat and note, with ONE section in front", () => {
    expect(doc.sections.slice(1)).toEqual(source.sections);
    expect(doc.sections[0]!.title).toBe(AI_NARRATIVE_SECTION_TITLE);
    expect(doc.caveats).toEqual(source.caveats);
    expect(doc.notes).toEqual(source.notes);
  });
  it("says which version it is, and whose figures it prints", () => {
    expect(doc.meta).toContainEqual({ label: "Version", value: "5" });
    expect(doc.meta.find((m) => m.label === "Figures")?.value).toMatch(/^As recorded in version 4 \(/);
    expect(doc.footer).toContain(" v5 ");
    expect(JSON.stringify(doc.sections[0])).toContain("does not assess or certify");
  });
  it("leaves version N untouched", () => {
    expect(source.sections).toHaveLength(1);
    expect(source.meta.find((m) => m.label === "Version")?.value).toBe("4");
  });
});
