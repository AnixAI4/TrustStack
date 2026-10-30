/**
 * Slice 10.5 Batch B2 — what the assessment pages SAY. None of these rules
 * scores, caps or permits anything: they name a status, a claimed level, an
 * evidence level, and which questions a role is shown first.
 */
import { describe, expect, it } from "vitest";
import { ASSESSMENT_STATUSES } from "./assessment.js";
import {
  ASSESSMENT_STATUS_LABEL,
  assessmentStatusLabel,
  CLAIM_LEVELS,
  claimLevelLabel,
  domainShortName,
  EVIDENCE_LEVEL_MEANING,
  evidenceCapSentence,
  evidenceCode,
  evidenceFileSentence,
  isQuestionForRole,
  roleHasOwnQuestions,
  ROLE_FILTER_DEFAULT_ROLES,
  suggestedOwnerParts,
} from "./assessment-display.js";
import { MATURITY_BANDS } from "./engine.js";
import { ROLE_CODES } from "./rbac.js";
import { EVIDENCE_CAP, EVIDENCE_LEVELS, MATURITY_LEVELS } from "./scoring.js";

describe("assessment status in words (F2.1, F2.6)", () => {
  it("labels every status, and never shows a code", () => {
    for (const s of ASSESSMENT_STATUSES) {
      expect(ASSESSMENT_STATUS_LABEL[s]).toBeTruthy();
      expect(assessmentStatusLabel(s)).not.toContain("_");
    }
    expect(assessmentStatusLabel("in_progress")).toBe("In progress");
    expect(assessmentStatusLabel("draft")).toBe("Draft");
  });

  it("shows an unknown status as it came rather than hiding it", () => {
    expect(assessmentStatusLabel("archived")).toBe("archived");
  });
});

describe("the claimed level of one answer (F2.2)", () => {
  it("names every level 0–5 once, in order, each with a meaning", () => {
    expect(CLAIM_LEVELS.map((l) => l.level)).toEqual([...MATURITY_LEVELS]);
    for (const l of CLAIM_LEVELS) expect(l.meaning.length).toBeGreaterThan(10);
  });

  it("is the spec's answer scale, not the score bands — 3 is Defined, 2 is a draft", () => {
    expect(claimLevelLabel(3)).toBe("3 — Defined");
    expect(claimLevelLabel(2)).toBe("2 — Draft or partial");
    // The band names describe a score percentage; level 2's band is "Defined".
    expect(MATURITY_BANDS[2]!.label).toContain("Defined");
    expect(CLAIM_LEVELS[2]!.name).not.toContain("Defined");
  });

  it("falls back to the number for a level it does not know", () => {
    expect(claimLevelLabel(7)).toBe("7");
  });
});

describe("evidence in words (F2.3)", () => {
  it("says the answer's cap with the level out of five, from EVIDENCE_CAP", () => {
    expect(evidenceCapSentence(3, "Partial")).toBe("Reviewed: Partial (evidence level 3 of 5) — this answer counts at most 3");
    for (const level of EVIDENCE_LEVELS) {
      expect(evidenceCapSentence(level)).toContain(`counts at most ${EVIDENCE_CAP[level]}`);
    }
  });

  it("treats nothing reviewed as level 0, which counts at most 1 — never as no cap", () => {
    expect(evidenceCapSentence(null)).toBe("No reviewed evidence yet (evidence level 0 of 5) — this answer counts at most 1");
  });

  it("E1 and E2 both support at most 2 — the browser reads the cap, it does not restate it", () => {
    expect(evidenceFileSentence("Adequate", true, 1)).toContain("supports at most 2");
    expect(evidenceFileSentence("Adequate", true, 2)).toContain("supports at most 2");
  });

  it("says a file awaiting review supports nothing yet, and keeps the review word first", () => {
    expect(evidenceFileSentence("Awaiting review", false, null)).toBe("Awaiting review — supports nothing until it is reviewed");
    expect(evidenceFileSentence("Rejected", true, 0)).toBe("Reviewed: Rejected (evidence level 0 of 5) — supports at most 1");
  });

  it("keeps the E-code for the tooltip and a meaning for every level", () => {
    expect(evidenceCode(3)).toBe("E3");
    expect(evidenceCode(null)).toBe("E0");
    for (const level of EVIDENCE_LEVELS) expect(EVIDENCE_LEVEL_MEANING[level]).toBeTruthy();
  });

  it("refuses a level off the scale rather than inventing a cap", () => {
    expect(() => evidenceCapSentence(6)).toThrow(RangeError);
  });
});

describe("questions for my role (F2.4) — display only", () => {
  it("splits a suggested owner into the functions it names", () => {
    expect(suggestedOwnerParts("Legal + IT + Process Owners")).toEqual(["Legal", "IT", "Process Owners"]);
    expect(suggestedOwnerParts("IT/Security + Legal")).toEqual(["IT", "Security", "Legal"]);
    expect(suggestedOwnerParts(null)).toEqual([]);
  });

  it("matches each central function to its role", () => {
    expect(isQuestionForRole("Legal + IT", "legal_user")).toBe(true);
    expect(isQuestionForRole("Legal + IT", "it_security_user")).toBe(true);
    expect(isQuestionForRole("Legal + IT", "procurement_user")).toBe(false);
    expect(isQuestionForRole("IT / CISO / Security", "it_security_user")).toBe(true);
    expect(isQuestionForRole("Procurement + Legal + IT", "procurement_user")).toBe(true);
    expect(isQuestionForRole("Executive Sponsor / DPDP Owner", "executive_sponsor")).toBe(true);
    expect(isQuestionForRole("Executive Sponsor / DPDP Owner", "dpdp_owner")).toBe(true);
  });

  it("gives a Department Owner the departments and process owners — not the central functions", () => {
    for (const owner of [
      "DPDP Owner + Process Owners",
      "Data Owners + IT",
      "Legal + Records Owners + IT",
      "Registrar / Exam Cell",
      "Controller of Examinations",
      "Placement Head",
      "Admissions + Legal + IT",
    ]) {
      expect(isQuestionForRole(owner, "department_owner"), owner).toBe(true);
    }
    for (const owner of ["Legal + IT", "IT / CISO / Security", "Executive Sponsor / DPDP Owner", "Legal + AI Governance + IT", "Academic IT"]) {
      expect(isQuestionForRole(owner, "department_owner"), owner).toBe(false);
    }
  });

  it("matches nothing for a question with no suggested owner", () => {
    for (const role of ROLE_CODES) expect(isQuestionForRole(null, role)).toBe(false);
  });

  it("offers the filter only to roles a question can name, and opens on it only for a Department Owner", () => {
    expect(roleHasOwnQuestions("department_owner")).toBe(true);
    expect(roleHasOwnQuestions("legal_user")).toBe(true);
    expect(roleHasOwnQuestions("organization_admin")).toBe(false);
    expect(roleHasOwnQuestions("consultant")).toBe(false);
    expect(ROLE_FILTER_DEFAULT_ROLES).toEqual(["department_owner"]);
  });
});

describe("domain pills (N2)", () => {
  it("shortens a domain's name to its first phrase", () => {
    expect(domainShortName("Retention, erasure and archival")).toBe("Retention");
    expect(domainShortName("ROPA / Records of Processing Activities")).toBe("ROPA");
    expect(domainShortName("Cross-border transfer and cloud/SaaS risk")).toBe("Cross-border transfer");
    expect(domainShortName("Security safeguards")).toBe("Security safeguards");
  });
});
