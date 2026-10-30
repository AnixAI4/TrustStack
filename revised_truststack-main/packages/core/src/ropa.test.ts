import { describe, expect, it } from "vitest";
import { questionPriority, questionSeverity } from "./engine.js";
import {
  APPROVAL_REFUSAL_MESSAGE,
  applyMapping,
  approvalDecision,
  assertRopaWeightsTotal,
  assessorMayRate,
  canRopaTransition,
  csvCell,
  fromCsvCell,
  deriveRopaGaps,
  importedRecordFacts,
  isResolvedText,
  listItemCount,
  mapColumns,
  parseImportDate,
  parseTriState,
  ROPA_APPROVAL_MIN_SCORE,
  ROPA_AREA_CODES,
  ROPA_BANDS,
  ROPA_COMPLETENESS_AREAS,
  ROPA_GAP_CODES,
  ROPA_GAP_RULES,
  ROPA_IMPORT_FIELDS,
  ROPA_IMPORT_HEADERS,
  ROPA_LARGE_SCALE_THRESHOLD,
  ROPA_RISK_FACTORS,
  ROPA_SAFEGUARD_CODES,
  ROPA_STATUSES,
  ROPA_TRANSITIONS,
  ropaBand,
  ropaCompleteness,
  ropaRecordGaps,
  ropaRisk,
  ropaRiskFactors,
  ropaRiskPoints,
  ropaRiskRating,
  validateRopaRow,
  vendorCount,
  vendorInvolved,
  type RopaAreaCode,
  type RopaRecordFacts,
  type RopaRecordForGaps,
} from "./ropa.js";

/** A record with NOTHING in it: every text blank, every tri-state unknown, no links. */
const EMPTY: RopaRecordFacts = Object.freeze({
  name: null,
  departmentId: null,
  departmentText: null,
  ownerUserId: null,
  dataPrincipalTypes: null,
  dataCategories: null,
  estimatedDataPrincipals: null,
  purpose: null,
  legalBasisNote: null,
  collectionSource: null,
  systemsText: null,
  systemLinkCount: 0,
  vendorsText: null,
  vendorLinkCount: 0,
  noticeLinked: null,
  consentLinked: null,
  retentionRule: null,
  securitySafeguards: null,
  childrenData: "unknown",
  crossBorder: "unknown",
  aiProcessing: "unknown",
  highRiskDocuments: "unknown",
  evidenceCount: 0,
  nextReviewAt: null,
  lawfulBasis: null,
  childParentalConsent: "unknown",
  childExemption: null,
  childTracking: "unknown",
  retentionTrigger: null,
  retentionLaw: null,
  safeguards: [],
  vendorContractGaps: 0,
});

/** Exactly what makes each area complete, and nothing else. */
const COMPLETE_IN: Record<RopaAreaCode, Partial<RopaRecordFacts>> = {
  identity: { name: "Online admission application" },
  department_owner: { departmentText: "Admissions", ownerUserId: "u-1" },
  data_principals: { dataPrincipalTypes: "Applicants" },
  data_categories: { dataCategories: "Name, DOB, email" },
  purpose_basis: { purpose: "Admission eligibility", lawfulBasis: "consent" },
  collection_source: { collectionSource: "Admission portal" },
  systems: { systemsText: "ERP" },
  vendors: { vendorsText: "Cloud provider" },
  notice_consent: { noticeLinked: "Admission notice v1", consentLinked: "Consent at application" },
  retention: { retentionRule: "Seven years after graduation", retentionTrigger: "purpose_served" },
  security: { securitySafeguards: "RBAC, encryption" },
  risk_review: { nextReviewAt: "2027-01-31" },
  evidence: { evidenceCount: 1 },
};

/** Every area complete, every Rule 6 safeguard confirmed. Children/AI/docs "no", cross-border known. */
const FULL: RopaRecordFacts = Object.freeze(
  Object.assign(
    {
      ...EMPTY,
      childrenData: "no",
      crossBorder: "no",
      aiProcessing: "no",
      highRiskDocuments: "no",
      safeguards: [...ROPA_SAFEGUARD_CODES],
    } as RopaRecordFacts,
    ...Object.values(COMPLETE_IN),
  ),
);

const TODAY = "2026-10-03";

describe("the thirteen completeness areas (spec Step I)", () => {
  it("are the spec's areas, with the spec's weights", () => {
    expect(ROPA_COMPLETENESS_AREAS.map((a) => [a.code, a.weight])).toEqual([
      ["identity", 8],
      ["department_owner", 8],
      ["data_principals", 8],
      ["data_categories", 10],
      ["purpose_basis", 10],
      ["collection_source", 6],
      ["systems", 8],
      ["vendors", 8],
      ["notice_consent", 8],
      ["retention", 8],
      ["security", 8],
      ["risk_review", 6],
      ["evidence", 4],
    ]);
    expect(ROPA_COMPLETENESS_AREAS.map((a) => a.code)).toEqual([...ROPA_AREA_CODES]);
  });

  it("total EXACTLY 100 — and a change that breaks it fails", () => {
    expect(ROPA_COMPLETENESS_AREAS.reduce((n, a) => n + a.weight, 0)).toBe(100);
    expect(() => assertRopaWeightsTotal()).not.toThrow();
    const broken = ROPA_COMPLETENESS_AREAS.map((a) => ({ weight: a.code === "evidence" ? 5 : a.weight }));
    expect(() => assertRopaWeightsTotal(broken)).toThrow(/ROPA_COMPLETENESS_TOTAL_INVALID: the areas total 101/);
  });

  it("are whole numbers, so the score is an exact sum (Slice 6 pitfall 16)", () => {
    for (const a of ROPA_COMPLETENESS_AREAS) expect(Number.isInteger(a.weight)).toBe(true);
    expect(() => assertRopaWeightsTotal([{ weight: 99.5 }, { weight: 0.5 }])).toThrow(/whole numbers/);
  });

  it("an empty record scores 0 and misses every area", () => {
    expect(ropaCompleteness(EMPTY)).toEqual({ score: 0, band: "incomplete", missing: [...ROPA_AREA_CODES] });
  });

  it("a record complete in every area scores 100 — Strong", () => {
    expect(ropaCompleteness(FULL)).toEqual({ score: 100, band: "strong", missing: [] });
  });

  for (const area of ROPA_COMPLETENESS_AREAS) {
    it(`complete in ${area.code} ALONE scores exactly ${area.weight}`, () => {
      const result = ropaCompleteness({ ...EMPTY, ...COMPLETE_IN[area.code] });
      expect(result.score).toBe(area.weight);
      expect(result.missing).not.toContain(area.code);
      expect(result.missing).toHaveLength(12);
    });
  }

  it("the score is always an integer", () => {
    for (const area of ROPA_COMPLETENESS_AREAS) {
      const { score } = ropaCompleteness({ ...FULL, ...{ [area.code === "evidence" ? "evidenceCount" : "name"]: area.code === "evidence" ? 0 : null } });
      expect(Number.isInteger(score)).toBe(true);
    }
  });
});

describe("what 'complete' means for a field", () => {
  it("blank, whitespace and placeholders are not complete", () => {
    for (const v of [null, undefined, "", "   ", "-", "—", "?", " \n\t "]) expect(isResolvedText(v)).toBe(false);
  });

  it("'Unknown' is NOT complete — it is honest, and it is the gap (D-026)", () => {
    for (const v of ["Unknown", "UNKNOWN", "Likely / Unknown", "unknown at present"]) expect(isResolvedText(v)).toBe(false);
  });

  it("'To be legally reviewed' and its family are NOT complete", () => {
    for (const v of [
      "To be legally reviewed",
      "Consent/legitimate use to be reviewed",
      "Usually not consent basis; review needed",
      "Yes / Needs review",
      "To be confirmed",
      "TBC",
      "tbd",
      "Not defined",
      "not   known",
    ]) {
      expect(isResolvedText(v), v).toBe(false);
    }
  });

  it("a to-do is not a rule: 'Define retention for chat logs'", () => {
    expect(isResolvedText("Define retention for chat logs")).toBe(false);
    expect(isResolvedText("  define  retention")).toBe(false);
    // …but a rule that merely USES the word is a rule.
    expect(isResolvedText("Retention as defined in the academic schedule")).toBe(true);
  });

  it("ordinary answers are complete — including a basis note that names a review already done", () => {
    for (const v of [
      "As per academic/legal retention schedule",
      "Employment/statutory basis; legal review",
      "Consent where applicable",
      "None",
      "N/A",
    ]) {
      expect(isResolvedText(v), v).toBe(true);
    }
  });

  it("Unknown is incomplete in EVERY text-backed area", () => {
    for (const area of ROPA_COMPLETENESS_AREAS) {
      const fields = COMPLETE_IN[area.code];
      const codes = ["consent", "purpose_served"];
      const textual = Object.entries(fields).filter(
        ([, v]) => typeof v === "string" && v !== "u-1" && !/^\d{4}-/.test(v) && !codes.includes(v),
      );
      if (textual.length === 0) continue;
      const unknown = Object.fromEntries(textual.map(([k]) => [k, "Unknown"]));
      expect(ropaCompleteness({ ...EMPTY, ...fields, ...unknown }).missing, area.code).toContain(area.code);
    }
  });
});

describe("area rules that are more than 'a field is filled in'", () => {
  it("department AND owner: a department with no named person is not complete", () => {
    expect(ropaCompleteness({ ...EMPTY, departmentText: "Admissions" }).missing).toContain("department_owner");
    expect(ropaCompleteness({ ...EMPTY, ownerUserId: "u-1" }).missing).toContain("department_owner");
    expect(ropaCompleteness({ ...EMPTY, departmentId: "d-1", ownerUserId: "u-1" }).missing).not.toContain("department_owner");
  });

  it("purpose AND a lawful ground: a basis NOTE alone is not a decision", () => {
    expect(
      ropaCompleteness({ ...EMPTY, purpose: "Admissions", legalBasisNote: "Consent at application" }).missing,
    ).toContain("purpose_basis");
    expect(ropaCompleteness({ ...EMPTY, purpose: "Admissions", lawfulBasis: "employment" }).missing).not.toContain("purpose_basis");
  });

  it("notice AND consent — while the ground is undecided, both are needed (D-026)", () => {
    expect(ropaCompleteness({ ...EMPTY, noticeLinked: "Notice v1" }).missing).toContain("notice_consent");
  });

  it("a legitimate use needs neither a notice nor consent (s.5 and s.6 apply to consent)", () => {
    for (const basis of ["employment", "voluntary", "legal_obligation", "court_order", "exempt"] as const) {
      expect(ropaCompleteness({ ...EMPTY, lawfulBasis: basis }).missing, basis).not.toContain("notice_consent");
    }
  });

  it("consent needs both; a s.7(b) benefit needs the notice (the Second Schedule intimation) but not consent", () => {
    expect(ropaCompleteness({ ...EMPTY, lawfulBasis: "consent", noticeLinked: "Notice v1" }).missing).toContain("notice_consent");
    expect(ropaCompleteness({ ...EMPTY, lawfulBasis: "state_benefit", noticeLinked: "Notice v1" }).missing).not.toContain("notice_consent");
    expect(ropaCompleteness({ ...EMPTY, lawfulBasis: "state_benefit" }).missing).toContain("notice_consent");
  });

  it("retention needs a rule AND what ends it — and the law, when a law requires keeping it", () => {
    expect(ropaCompleteness({ ...EMPTY, retentionRule: "Seven years" }).missing).toContain("retention");
    expect(ropaCompleteness({ ...EMPTY, retentionRule: "Seven years", retentionTrigger: "law_requires" }).missing).toContain("retention");
    expect(
      ropaCompleteness({ ...EMPTY, retentionRule: "Eight years", retentionTrigger: "law_requires", retentionLaw: "Income-tax Act, 1961" }).missing,
    ).not.toContain("retention");
  });

  it("security: ticking Rule 6 safeguards completes it, as a description does", () => {
    expect(ropaCompleteness({ ...EMPTY, safeguards: ["encryption"] }).missing).not.toContain("security");
    expect(ropaCompleteness({ ...EMPTY, securitySafeguards: "RBAC" }).missing).not.toContain("security");
  });

  it("systems and vendors: named in text OR linked — text alone counts, with no partial credit", () => {
    expect(ropaCompleteness({ ...EMPTY, systemLinkCount: 1 }).score).toBe(8);
    expect(ropaCompleteness({ ...EMPTY, systemsText: "ERP" }).score).toBe(8);
    expect(ropaCompleteness({ ...EMPTY, vendorLinkCount: 2 }).score).toBe(8);
  });

  it("an explicit 'None' is a complete vendor answer — and involves no vendor", () => {
    expect(ropaCompleteness({ ...EMPTY, vendorsText: "None" }).missing).not.toContain("vendors");
    expect(vendorInvolved({ vendorsText: "None", vendorLinkCount: 0 })).toBe(false);
    expect(vendorInvolved({ vendorsText: "Cloud provider", vendorLinkCount: 0 })).toBe(true);
    expect(vendorInvolved({ vendorsText: null, vendorLinkCount: 1 })).toBe(true);
  });

  it("the risk/review area needs a next review date; the rating itself is always derived", () => {
    expect(ropaCompleteness({ ...EMPTY, nextReviewAt: "2026-12-31" }).score).toBe(6);
  });

  it("evidence linkage means a STORED artefact attached — not the Evidence column's description", () => {
    expect(ropaCompleteness({ ...EMPTY, evidenceCount: 0 }).missing).toContain("evidence");
    expect(ropaCompleteness({ ...EMPTY, evidenceCount: 3 }).score).toBe(4);
  });
});

describe("the bands — each boundary belongs to the LOWER band", () => {
  it.each([
    [0, "incomplete"],
    [30, "incomplete"],
    [31, "basic"],
    [60, "basic"],
    [61, "usable"],
    [80, "usable"],
    [81, "strong"],
    [100, "strong"],
  ] as const)("%i is %s", (score, band) => {
    expect(ropaBand(score)).toBe(band);
  });

  it("are the spec's four, in order", () => {
    expect(ROPA_BANDS.map((b) => [b.label, b.maxScore])).toEqual([
      ["Incomplete", 30],
      ["Basic", 60],
      ["Usable", 80],
      ["Strong", 100],
    ]);
  });

  it("refuse anything but an integer 0–100", () => {
    for (const bad of [-1, 101, 30.5, Number.NaN]) expect(() => ropaBand(bad)).toThrow();
  });

  it("approval needs Usable: 61, the lowest Usable score", () => {
    expect(ROPA_APPROVAL_MIN_SCORE).toBe(61);
    expect(ropaBand(ROPA_APPROVAL_MIN_SCORE)).toBe("usable");
    expect(ropaBand(ROPA_APPROVAL_MIN_SCORE - 1)).toBe("basic");
  });
});

describe("risk — a derived floor", () => {
  /** A record with no risk at all: every factor's opposite. */
  const SAFE: RopaRecordFacts = { ...FULL, vendorsText: "One provider", vendorLinkCount: 0 };

  it("a record with no factor is Low with 0 points", () => {
    expect(ropaRisk(SAFE)).toEqual({ factors: [], points: 0, derived: "low", assessor: null, rating: "low" });
  });

  it("the spec's ten factors are all present (thirteen codes: three tri-states have an 'unknown' variant)", () => {
    expect(ROPA_RISK_FACTORS.map((f) => f.code)).toEqual([
      "children_data",
      "children_data_unknown",
      "large_scale",
      "high_risk_documents",
      "high_risk_documents_unknown",
      "multiple_vendors",
      "cross_border_unknown",
      "ai_processing",
      "ai_processing_unknown",
      "no_notice",
      "no_retention",
      "no_security_evidence",
      "no_owner_or_review",
    ]);
  });

  const ALONE: [string, Partial<RopaRecordFacts>, number][] = [
    ["children_data", { childrenData: "yes" }, 3],
    ["children_data_unknown", { childrenData: "unknown" }, 1],
    ["large_scale", { estimatedDataPrincipals: ROPA_LARGE_SCALE_THRESHOLD }, 2],
    ["high_risk_documents", { highRiskDocuments: "yes" }, 2],
    ["high_risk_documents_unknown", { highRiskDocuments: "unknown" }, 1],
    ["multiple_vendors", { vendorsText: "Cloud provider, SMS vendor" }, 1],
    ["cross_border_unknown", { crossBorder: "unknown" }, 1],
    ["ai_processing", { aiProcessing: "yes" }, 2],
    ["ai_processing_unknown", { aiProcessing: "unknown" }, 1],
    ["no_notice", { noticeLinked: "Unknown" }, 1],
    ["no_retention", { retentionRule: null }, 1],
    ["no_security_evidence", { evidenceCount: 0 }, 1],
    ["no_owner_or_review", { ownerUserId: null }, 1],
  ];

  for (const [factor, change, points] of ALONE) {
    it(`${factor} alone fires, scores ${points}, and RAISES the risk`, () => {
      const risk = ropaRisk({ ...SAFE, ...change });
      expect(risk.factors).toEqual([factor]);
      expect(risk.points).toBe(points);
      expect(risk.points).toBeGreaterThan(ropaRisk(SAFE).points);
    });
  }

  it("together, the points add up — every factor at once is 15, Critical", () => {
    const worst = ropaRisk({
      ...EMPTY,
      childrenData: "yes",
      estimatedDataPrincipals: 250_000,
      highRiskDocuments: "yes",
      vendorsText: "A, B, C",
      aiProcessing: "yes",
    });
    expect(worst.points).toBe(3 + 2 + 2 + 1 + 1 + 2 + 1 + 1 + 1 + 1);
    expect(worst.derived).toBe("critical");
  });

  it("no factor ever lowers the risk: adding any one to any record never reduces its points", () => {
    for (const [, change] of ALONE) {
      for (const [, other] of ALONE) {
        // A tri-state has one value at a time: yes and unknown are not both "added".
        if (Object.keys(change).some((k) => k in other)) continue;
        const base = ropaRiskPoints(ropaRiskFactors({ ...SAFE, ...other }));
        expect(ropaRiskPoints(ropaRiskFactors({ ...SAFE, ...other, ...change }))).toBeGreaterThanOrEqual(base);
      }
    }
  });

  it("unknown behaves as risk, never as 'no' (D-026)", () => {
    expect(ropaRisk({ ...SAFE, childrenData: "unknown" }).points).toBeGreaterThan(ropaRisk({ ...SAFE, childrenData: "no" }).points);
  });

  it("a KNOWN cross-border transfer is not flagged as unknown — questions assess it (D-026)", () => {
    expect(ropaRiskFactors({ ...SAFE, crossBorder: "yes" })).toEqual([]);
  });

  it("the large-scale trigger is the scope wizard's (D-028): 1,00,000, not one fewer", () => {
    expect(ROPA_LARGE_SCALE_THRESHOLD).toBe(100_000);
    expect(ropaRiskFactors({ ...SAFE, estimatedDataPrincipals: 99_999 })).toEqual([]);
    expect(ropaRiskFactors({ ...SAFE, estimatedDataPrincipals: null })).toEqual([]);
  });

  it("vendors: the linked count or the named count, whichever is more", () => {
    expect(vendorCount({ vendorsText: "A, B; C\nD", vendorLinkCount: 1 })).toBe(4);
    expect(vendorCount({ vendorsText: "A", vendorLinkCount: 3 })).toBe(3);
    expect(vendorCount({ vendorsText: "None", vendorLinkCount: 0 })).toBe(0);
    expect(vendorCount({ vendorsText: "Unknown", vendorLinkCount: 0 })).toBe(0);
    expect(listItemCount("A, , B,")).toBe(2);
  });

  it.each([
    [0, "low"],
    [2, "low"],
    [3, "medium"],
    [5, "medium"],
    [6, "high"],
    [8, "high"],
    [9, "critical"],
    [15, "critical"],
  ] as const)("%i points is %s — each boundary belongs to the LOWER rating", (points, rating) => {
    expect(ropaRiskRating(points)).toBe(rating);
  });
});

describe("an assessor may RAISE the rating, never lower it (D-039's direction)", () => {
  // children 3 + AI 2 + documents 2 = 7 points: High.
  const facts: RopaRecordFacts = { ...FULL, vendorsText: "One provider", childrenData: "yes", aiProcessing: "yes", highRiskDocuments: "yes" };

  it("raising is kept", () => {
    const risk = ropaRisk(facts, "critical");
    expect(risk.derived).toBe("high");
    expect(risk).toMatchObject({ assessor: "critical", rating: "critical" });
  });

  it("lowering is ignored — what is shown never falls below the derived floor", () => {
    for (const lower of ["low", "medium"] as const) {
      expect(ropaRisk(facts, lower)).toMatchObject({ derived: "high", assessor: null, rating: "high" });
    }
  });

  it("an equal rating adds nothing", () => {
    expect(ropaRisk(facts, "high")).toMatchObject({ assessor: null, rating: "high" });
  });

  it("assessorMayRate is the API's check", () => {
    expect(assessorMayRate("high", "critical")).toBe(true);
    expect(assessorMayRate("high", "high")).toBe(true);
    expect(assessorMayRate("high", "medium")).toBe(false);
  });
});

describe("the lifecycle", () => {
  it("four statuses", () => {
    expect([...ROPA_STATUSES]).toEqual(["draft", "in_review", "approved", "archived"]);
  });

  it("the legal moves, and only those", () => {
    const allowed = ROPA_STATUSES.flatMap((from) =>
      ROPA_STATUSES.filter((to) => to !== from && canRopaTransition(from, to)).map((to) => `${from}→${to}`),
    );
    expect(allowed).toEqual([
      "draft→in_review",
      "draft→archived",
      "in_review→draft",
      "in_review→approved",
      "in_review→archived",
      "approved→draft",
      "approved→archived",
      "archived→draft",
    ]);
    expect(Object.keys(ROPA_TRANSITIONS)).toEqual([...ROPA_STATUSES]);
  });

  it("never approved straight from Draft", () => {
    expect(canRopaTransition("draft", "approved")).toBe(false);
    expect(canRopaTransition("archived", "approved")).toBe(false);
  });

  describe("approval takes two people", () => {
    const base = { ownerUserId: "owner", approverUserId: "reviewer", approverCanReview: true, completenessScore: 78 };

    it("a reviewer who is not the owner, on a Usable record: allowed", () => {
      expect(approvalDecision(base)).toEqual({ allowed: true });
    });

    it("the owner cannot approve their own record", () => {
      expect(approvalDecision({ ...base, approverUserId: "owner" })).toEqual({ allowed: false, reason: "self_approval" });
    });

    it("an unowned record cannot be approved", () => {
      expect(approvalDecision({ ...base, ownerUserId: null })).toEqual({ allowed: false, reason: "no_owner" });
    });

    it("a contributor without evidence.review cannot approve", () => {
      expect(approvalDecision({ ...base, approverCanReview: false })).toEqual({ allowed: false, reason: "not_a_reviewer" });
    });

    it("a record below Usable cannot be approved: 60 refused, 61 allowed", () => {
      expect(approvalDecision({ ...base, completenessScore: 60 })).toEqual({ allowed: false, reason: "incomplete" });
      expect(approvalDecision({ ...base, completenessScore: 61 })).toEqual({ allowed: true });
    });

    it("every refusal has a plain-language message", () => {
      for (const reason of ["no_owner", "self_approval", "not_a_reviewer", "incomplete"] as const) {
        expect(APPROVAL_REFUSAL_MESSAGE[reason].length).toBeGreaterThan(10);
      }
    });
  });
});

describe("ROPA-driven gaps — the spec's twelve conditions", () => {
  const record = (over: Partial<RopaRecordForGaps>): RopaRecordForGaps => ({
    ...FULL,
    vendorLinkCount: 1,
    id: "r-1",
    status: "approved",
    ...over,
  });

  it("are fifteen — the spec's twelve, with children's data split by duty and two more from the Act — each with a fix", () => {
    expect(ROPA_GAP_CODES).toHaveLength(15);
    for (const rule of ROPA_GAP_RULES) expect(rule.fix.length).toBeGreaterThan(10);
  });

  it("a complete, linked, approved record that is not overdue opens none", () => {
    expect(ropaRecordGaps(record({}), TODAY)).toEqual([]);
  });

  const CASES: [string, Partial<RopaRecordForGaps>][] = [
    ["no_owner", { ownerUserId: null }],
    ["categories_missing", { dataCategories: "Unknown" }],
    ["purpose_missing", { lawfulBasis: null }],
    ["vendor_unmapped", { vendorLinkCount: 0 }],
    ["notice_missing", { noticeLinked: null }],
    ["consent_missing", { consentLinked: "review needed" }],
    ["retention_missing", { retentionRule: "Define retention" }],
    ["safeguards_missing", { securitySafeguards: "", safeguards: [] }],
    ["rule6_unconfirmed", { safeguards: ["encryption", "access_control"] }],
    ["processor_contract_missing", { vendorContractGaps: 1 }],
    ["child_consent_missing", { childrenData: "yes", childTracking: "no" }],
    ["child_tracking", { childrenData: "yes", childParentalConsent: "yes" }],
    ["ai_unreviewed", { aiProcessing: "unknown", status: "draft" }],
    ["review_overdue", { nextReviewAt: "2026-10-02" }],
  ];
  for (const [code, change] of CASES) {
    it(`${code} — alone`, () => {
      expect(ropaRecordGaps(record(change), TODAY)).toEqual([code]);
    });
  }

  it("a review due TODAY is not overdue; yesterday's is (the roadmap's rule)", () => {
    expect(ropaRecordGaps(record({ nextReviewAt: TODAY }), TODAY)).toEqual([]);
    expect(ropaRecordGaps(record({ nextReviewAt: null }), TODAY)).toEqual(["review_overdue"]);
  });

  it("AI processing stops being a gap once the record is APPROVED — the review is the approval", () => {
    expect(ropaRecordGaps(record({ aiProcessing: "yes" }), TODAY)).toEqual([]);
  });

  it("children's data: approval is NOT enough — the duties are parental consent and no tracking (s.9)", () => {
    expect(ropaRecordGaps(record({ childrenData: "yes" }), TODAY)).toEqual(["child_consent_missing", "child_tracking"]);
    expect(ropaRecordGaps(record({ childrenData: "yes", childParentalConsent: "yes", childTracking: "no" }), TODAY)).toEqual([]);
  });

  it("an 'unknown' children's answer counts as children's data (D-026)", () => {
    expect(ropaRecordGaps(record({ childrenData: "unknown", status: "draft" }), TODAY)).toContain("child_consent_missing");
  });

  it("a Fourth Schedule exemption lifts both children's duties (Rule 12)", () => {
    expect(ropaRecordGaps(record({ childrenData: "yes", childExemption: "education" }), TODAY)).toEqual([]);
  });

  it("a legitimate use asks for no notice and no consent", () => {
    expect(ropaRecordGaps(record({ lawfulBasis: "employment", noticeLinked: null, consentLinked: null }), TODAY)).toEqual([]);
  });

  it("an undecided ground asks for both — unknown behaves as risk (D-026)", () => {
    expect(ropaRecordGaps(record({ lawfulBasis: null, noticeLinked: null, consentLinked: null }), TODAY)).toEqual([
      "purpose_missing",
      "notice_missing",
      "consent_missing",
    ]);
  });

  it("'None' named as the vendor does not ask for a vendor to be mapped", () => {
    expect(ropaRecordGaps(record({ vendorsText: "None", vendorLinkCount: 0 }), TODAY)).toEqual([]);
  });

  it("an archived record opens no gap at all", () => {
    expect(ropaRecordGaps(record({ ...EMPTY, status: "archived" }), TODAY)).toEqual([]);
  });

  it("an empty register — or an all-archived one — opens ONE critical, organisation-level gap", () => {
    for (const records of [[], [record({ status: "archived" })]]) {
      expect(deriveRopaGaps(records, TODAY)).toEqual([
        { recordId: null, code: "no_records", severity: "critical", priority: "P0" },
      ]);
    }
  });

  it("severity is this slice's own ladder — NEVER questionSeverity() of a score", () => {
    for (const rule of ROPA_GAP_RULES) {
      expect(["critical", "high", "medium", "low"]).toContain(rule.severity);
    }
    // There is no adjusted score to ask about: the same severity word is reached by a different route.
    expect(questionSeverity(0)).toBe("critical");
  });

  it("priority follows the SHARED severity → priority table, so ROPA actions sit on the same roadmap", () => {
    const gaps = deriveRopaGaps(
      [record({ ownerUserId: null, childrenData: "yes", childTracking: "no", status: "draft", vendorLinkCount: 0 })],
      TODAY,
    );
    for (const g of gaps) expect(g.priority).toBe(questionPriority(g.severity));
    expect(gaps.map((g) => `${g.code}:${g.priority}`)).toEqual(["no_owner:P1", "vendor_unmapped:P2", "child_consent_missing:P0"]);
  });

  it("refuses a 'today' that is not a calendar date", () => {
    expect(() => ropaRecordGaps(record({}), "03/10/2026")).toThrow();
  });
});

describe("import — mapping columns by NAME", () => {
  const WORKBOOK = [
    "ROPA ID", "Processing Activity", "Department / Owner", "Data Principal Type", "Personal Data Categories",
    "Purpose", "DPDP Basis / Legal Review", "Collection Source", "System(s)", "Processor / Vendor",
    "Sharing / Disclosure", "Retention Rule", "Security Safeguards", "Notice Linked", "Consent Linked",
    "Rights Workflow", "Grievance Linked", "Children Data?", "Cross-Border?", "AI / Automated?", "Evidence",
    "Risk Rating", "Last Reviewed", "Next Review",
  ];

  it("maps all 24 workbook columns, leaving nothing unmapped", () => {
    const m = mapColumns(WORKBOOK);
    expect(m.unmapped).toEqual([]);
    expect(m.missingRequired).toEqual([]);
    expect(Object.keys(m.fields)).toHaveLength(24);
    expect(m.fields.name).toBe(1);
    expect(m.fields.vendorsText).toBe(9);
  });

  it("is by NAME, not position: shuffled columns map the same", () => {
    const shuffled = [...WORKBOOK].reverse();
    const m = mapColumns(shuffled);
    expect(shuffled[m.fields.name!]).toBe("Processing Activity");
    expect(shuffled[m.fields.retentionRule!]).toBe("Retention Rule");
  });

  it("ignores case, spacing and punctuation — and accepts aliases", () => {
    const m = mapColumns(["processing   activity", "SYSTEMS", "cross border", "Vendors"]);
    expect(m.fields).toEqual({ name: 0, systemsText: 1, crossBorder: 2, vendorsText: 3 });
  });

  it("reports what it cannot map, and a missing required column", () => {
    const m = mapColumns(["Something else", "Purpose"]);
    expect(m.unmapped).toEqual(["Something else"]);
    expect(m.missingRequired).toEqual(["name"]);
  });

  it("the first of two matching columns wins; the second is reported unmapped", () => {
    const m = mapColumns(["Activity", "Name"]);
    expect(m.fields.name).toBe(0);
    expect(m.unmapped).toEqual(["Name"]);
  });

  it("every field has its workbook header first", () => {
    for (const f of ROPA_IMPORT_FIELDS) expect(ROPA_IMPORT_HEADERS[f].length).toBeGreaterThan(0);
  });

  it("a confirmed mapping is applied as given, and a field mapped twice is refused", () => {
    const m = applyMapping(["Col A", "Col B", "Col C"], { "Col A": "name", "Col B": null });
    expect(m).toEqual({ fields: { name: 0 }, unmapped: ["Col B", "Col C"], missingRequired: [] });
    expect(() => applyMapping(["A", "B"], { A: "name", B: "name" })).toThrow(/two columns/);
  });
});

describe("import — validating a row", () => {
  const good = { name: "Online admission application", purpose: "Admissions" };

  it("a minimal row is valid", () => {
    const r = validateRopaRow(good);
    expect(r.ok).toBe(true);
  });

  it("a row with no name is rejected with the reason — never silently skipped", () => {
    const r = validateRopaRow({ purpose: "x" });
    expect(r).toEqual({ ok: false, errors: [{ field: "name", issue: "The processing activity needs a name." }] });
  });

  it("returns EVERY problem at once", () => {
    const r = validateRopaRow({ name: "", nextReviewAt: "31-31-2026", riskRating: "Severe", estimatedDataPrincipals: "lots" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.field).sort()).toEqual(["estimatedDataPrincipals", "name", "nextReviewAt", "riskRating"]);
  });

  it("a formula is TEXT: '=HYPERLINK(...)' is kept verbatim and never evaluated", () => {
    const formula = '=HYPERLINK("http://evil.example","click")';
    const r = validateRopaRow({ ...good, evidenceNote: formula, purpose: "=1+1" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.record.text.evidenceNote).toBe(formula);
    expect(r.record.text.purpose).toBe("=1+1");
  });

  it("the workbook's 'yes/no' columns are tri-states, and anything uncertain is unknown", () => {
    expect(parseTriState("Yes / Needs review")).toBe("yes");
    expect(parseTriState("YES")).toBe("yes");
    expect(parseTriState("No")).toBe("no");
    expect(parseTriState("Possible under-18 / Needs review")).toBe("unknown");
    expect(parseTriState("Possible")).toBe("unknown");
    expect(parseTriState("Likely / Unknown")).toBe("unknown");
    expect(parseTriState("Possible analytics")).toBe("unknown");
    expect(parseTriState("Not now")).toBe("unknown");
    expect(parseTriState("")).toBe("unknown");
    expect(parseTriState(undefined)).toBe("unknown");
  });

  it("dates: ISO, a spreadsheet date-time, and India's day-first forms", () => {
    expect(parseImportDate("2026-10-03")).toBe("2026-10-03");
    expect(parseImportDate("2026-10-03 00:00:00")).toBe("2026-10-03");
    expect(parseImportDate("3/10/2026")).toBe("2026-10-03");
    expect(parseImportDate("03-10-2026")).toBe("2026-10-03");
    expect(parseImportDate("31/02/2026")).toBeNull();
    expect(parseImportDate("tomorrow")).toBeNull();
  });

  it("numbers may carry Indian digit grouping", () => {
    const r = validateRopaRow({ ...good, estimatedDataPrincipals: "1,00,000" });
    expect(r.ok && r.record.estimatedDataPrincipals).toBe(100_000);
  });

  it("a risk rating is any case of the four", () => {
    const r = validateRopaRow({ ...good, riskRating: "CRITICAL" });
    expect(r.ok && r.record.riskRating).toBe("critical");
  });

  it("over-long text is rejected, not truncated", () => {
    const r = validateRopaRow({ ...good, purpose: "x".repeat(2001) });
    expect(r.ok).toBe(false);
  });

  it("a record code must look like an id", () => {
    expect(validateRopaRow({ ...good, recordCode: "ROPA-ADM-001" }).ok).toBe(true);
    expect(validateRopaRow({ ...good, recordCode: "<script>" }).ok).toBe(false);
  });

  it("an imported record has no owner, no links and no evidence yet", () => {
    const r = validateRopaRow(good);
    if (!r.ok) throw new Error("expected ok");
    const facts = importedRecordFacts(r.record);
    expect(facts).toMatchObject({ ownerUserId: null, systemLinkCount: 0, vendorLinkCount: 0, evidenceCount: 0 });
  });
});

describe("export — CSV that cannot execute in someone else's spreadsheet", () => {
  it("prefixes anything a spreadsheet would read as a formula", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("quotes commas, quotes and new lines", () => {
    expect(csvCell("a, b")).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
  });

  it("an export read back loses only its guard", () => {
    for (const v of ['=HYPERLINK("x")', "+91 22 1234", "-", "@team", "plain"]) {
      const cell = csvCell(v);
      const unquoted = cell.startsWith('"') ? cell.slice(1, -1).replace(/""/g, '"') : cell;
      expect(fromCsvCell(unquoted)).toBe(v);
    }
  });

  it("writes nothing for null, and numbers as numbers", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(78)).toBe("78");
  });
});

describe("D-065 — the DPDP structure", () => {
  it("eleven lawful grounds: consent, the nine s.7 legitimate uses, and the s.17 exemption", async () => {
    const { ROPA_LAWFUL_BASES } = await import("./ropa.js");
    expect(ROPA_LAWFUL_BASES.map((b) => b.section)).toEqual([
      "s.6", "s.7(a)", "s.7(b)", "s.7(c)", "s.7(d)", "s.7(e)", "s.7(f)", "s.7(g)", "s.7(h)", "s.7(i)", "s.17",
    ]);
  });

  it("the Fourth Schedule's eleven exemptions, Part A then Part B", async () => {
    const { ROPA_CHILD_EXEMPTIONS } = await import("./ropa.js");
    expect(ROPA_CHILD_EXEMPTIONS.map((e) => e.part)).toEqual(["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6"]);
  });

  it("Rule 6(1)'s minimum, less (f), which the vendor contracts answer", () => {
    expect([...ROPA_SAFEGUARD_CODES]).toEqual(["encryption", "access_control", "logging", "backups", "log_retention", "organisational"]);
  });

  it("an undecided ground needs a notice; only consent itself needs consent", async () => {
    const { noticeRequired, consentRequired } = await import("./ropa.js");
    expect([noticeRequired(null), noticeRequired("consent"), noticeRequired("state_benefit"), noticeRequired("employment")]).toEqual([true, true, true, false]);
    expect([consentRequired(null), consentRequired("consent"), consentRequired("state_benefit"), consentRequired("voluntary")]).toEqual([true, true, false, false]);
  });

  it("a notice is a risk only where one is required", () => {
    const employment = { ...FULL, lawfulBasis: "employment" as const, noticeLinked: null };
    expect(ropaRiskFactors(employment)).not.toContain("no_notice");
    expect(ropaRiskFactors({ ...employment, lawfulBasis: "consent" })).toContain("no_notice");
  });

  it("an import reads a ground by code, section or label — exactly, never a guess", async () => {
    const { parseLawfulBasis, parseRetentionTrigger } = await import("./ropa.js");
    expect(parseLawfulBasis("employment")).toBe("employment");
    expect(parseLawfulBasis("s.7(i)")).toBe("employment");
    expect(parseLawfulBasis("7(i)")).toBe("employment");
    expect(parseLawfulBasis("Consent of the person")).toBe("consent");
    expect(parseLawfulBasis("legitimate interest")).toBeNull();
    expect(parseRetentionTrigger("law_requires")).toBe("law_requires");
    expect(parseRetentionTrigger("forever")).toBeNull();
    const bad = validateRopaRow({ name: "x", lawfulBasis: "legitimate interest" });
    expect(bad.ok).toBe(false);
  });

  it("templates: the industry's own first, then the common ones, and never a lawful ground", async () => {
    const { ropaTemplatesFor, ROPA_COMMON_TEMPLATES } = await import("./ropa.js");
    const uni = ropaTemplatesFor("university");
    expect(uni[0]!.name).toBe("Online admission application");
    expect(uni.length).toBeGreaterThan(ROPA_COMMON_TEMPLATES.length);
    expect(ropaTemplatesFor("manufacturing")).toEqual([...ROPA_COMMON_TEMPLATES]);
    expect(ropaTemplatesFor(null)).toEqual([...ROPA_COMMON_TEMPLATES]);
    for (const t of uni) expect(Object.keys(t).sort()).toEqual(["dataPrincipalTypes", "name", "purpose"]);
  });
});
