import { describe, expect, it } from "vitest";
import { isGeneratablePack, packForQuestion, QUESTION_PACKS, questionPack, UNIVERSITY_BASELINE_QUESTIONS,
  UNIVERSITY_CONDITIONAL_PACK, UNIVERSITY_CONDITIONAL_QUESTIONS, UNIVERSITY_OVERLAY_PACK,
  UNIVERSITY_PROCTORING_PACK, UNIVERSITY_PROCTORING_QUESTIONS, UNIVERSITY_REFERENCE_PACK,
  universityPackFor } from "./packs.js";
import { CORE_PACK_CODE, INDUSTRIES } from "./scope.js";

/**
 * These assertions are D-029.1 in executable form. If the baseline stops being
 * 98 core + 10 University questions, this file fails — which is the point: the
 * "108 questions" in the PRD, the pitch deck and the ₹9.75–12L proposal is a
 * commitment, not an implementation detail.
 */
describe("the confirmed University overlay (D-029.1)", () => {
  it("is exactly 10 questions", () => {
    expect(UNIVERSITY_BASELINE_QUESTIONS).toHaveLength(10);
  });

  it("covers ten DIFFERENT domains, so the overlay lifts the whole model", () => {
    // The domain is authored in the Markdown, so the codes carry it: one
    // UNI-<domain>-nnn per domain family.
    const families = UNIVERSITY_BASELINE_QUESTIONS.map((c) => c.split("-")[1]);
    expect(new Set(families).size).toBe(10);
  });

  it("has no duplicates, and no question is in two packs", () => {
    const all = [
      ...UNIVERSITY_BASELINE_QUESTIONS,
      ...UNIVERSITY_PROCTORING_QUESTIONS,
      ...UNIVERSITY_CONDITIONAL_QUESTIONS,
    ];
    expect(new Set(all).size).toBe(all.length);
  });

  it("assigns every other University question to the reference pool", () => {
    expect(universityPackFor("UNI-SEC-002")).toBe(UNIVERSITY_OVERLAY_PACK);
    expect(universityPackFor("UNI-RET-003")).toBe(UNIVERSITY_PROCTORING_PACK);
    expect(universityPackFor("UNI-GOV-009")).toBe(UNIVERSITY_CONDITIONAL_PACK);
    // UNI-GOV-001 is an exact overlap with core G1.2 — in the bank, never asked.
    expect(universityPackFor("UNI-GOV-001")).toBe(UNIVERSITY_REFERENCE_PACK);
    expect(universityPackFor("UNI-CB-004")).toBe(UNIVERSITY_REFERENCE_PACK);
  });

  it("carries UNI-GOV-009, authored for Excel MU_Overlay U3", () => {
    expect(UNIVERSITY_CONDITIONAL_QUESTIONS).toContain("UNI-GOV-009");
  });
});

describe("packForQuestion", () => {
  it("routes the core pack and each industry overlay", () => {
    expect(packForQuestion("core", "G1.1")).toBe(CORE_PACK_CODE);
    expect(packForQuestion("edtech", "EDU-GOV-001")).toBe("EDTECH_OVERLAY_V1");
    expect(packForQuestion("bfsi", "BFSI-GOV-001")).toBe("BFSI_OVERLAY_V1");
    expect(packForQuestion("general", "GEN-GOV-001")).toBe("GENERAL_ORGANISATION_V1");
  });

  it("routes a University question per question, not per file", () => {
    expect(packForQuestion("university", "UNI-ACC-001")).toBe(UNIVERSITY_OVERLAY_PACK);
    expect(packForQuestion("university", "UNI-ACC-003")).toBe(UNIVERSITY_REFERENCE_PACK);
  });

  it("names a pack that exists for every industry in the scope model", () => {
    for (const industry of INDUSTRIES) {
      expect(questionPack(industry.overlayPackCode), industry.code).toBeDefined();
    }
  });
});

describe("pack reference data", () => {
  it("every pack code is unique", () => {
    const codes = QUESTION_PACKS.map((p) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("only the core pack and the University packs are approved", () => {
    const approved = QUESTION_PACKS.filter((p) => p.status === "approved").map((p) => p.code).sort();
    expect(approved).toEqual(
      [CORE_PACK_CODE, UNIVERSITY_OVERLAY_PACK, UNIVERSITY_PROCTORING_PACK, UNIVERSITY_CONDITIONAL_PACK, UNIVERSITY_REFERENCE_PACK].sort(),
    );
  });

  it("the other nine industry overlays stay draft until each has its own overlap map", () => {
    // Loading all 162 EdTech questions on top of core would give a
    // 260-question assessment. Draft means the generator refuses them.
    const drafts = QUESTION_PACKS.filter((p) => p.tier === "overlay" && p.status === "draft");
    expect(drafts).toHaveLength(9);
    for (const p of drafts) expect(isGeneratablePack(p)).toBe(false);
  });

  it("a reference pack is never generatable, even though it is approved", () => {
    const reference = questionPack(UNIVERSITY_REFERENCE_PACK)!;
    expect(reference.status).toBe("approved");
    expect(isGeneratablePack(reference)).toBe(false);
  });

  it("an industry overlay names a real industry; a cross-industry pack names none", () => {
    const industryCodes = new Set(INDUSTRIES.map((i) => i.code));
    for (const p of QUESTION_PACKS) {
      if (p.industryCode !== null) expect(industryCodes, p.code).toContain(p.industryCode);
      else expect(["core", "conditional"], p.code).toContain(p.tier);
    }
  });

  it("an authored pack cites its source file; an unauthored one admits it has none", () => {
    for (const p of QUESTION_PACKS) {
      if (p.tier === "conditional" && p.industryCode === null) expect(p.sourceFile, p.code).toBeNull();
      else expect(p.sourceFile, p.code).toBeTruthy();
    }
  });

  it("questionPack returns undefined for an unknown code", () => {
    expect(questionPack("NOT_A_PACK")).toBeUndefined();
  });
});
