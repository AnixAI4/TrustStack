import { describe, expect, it } from "vitest";
import {
  adjustedScore,
  assertReviewConsistent,
  capApplied,
  domainScore,
  EVIDENCE_CAP,
  EVIDENCE_CONTENT_TYPES,
  EVIDENCE_LEVELS,
  evidenceConfidence,
  evidenceStoragePath,
  MATURITY_LEVELS,
  responseEvidenceLevel,
  REVIEWED_STATUSES,
  sanitiseEvidenceFileName,
  ScoringInputError,
  summariseDomainScore,
  type ScoredResponse,
} from "./scoring.js";

const answered = (claimed: number, level: number | null): ScoredResponse => ({
  applicabilityDecision: "applicable",
  claimedMaturity: claimed,
  evidenceLevel: level,
});
const na: ScoredResponse = { applicabilityDecision: "not_applicable" };

describe("the evidence cap", () => {
  it("is exactly E0→1, E1→2, E2→2, E3→3, E4→4, E5→5", () => {
    expect(EVIDENCE_CAP).toEqual({ 0: 1, 1: 2, 2: 2, 3: 3, 4: 4, 5: 5 });
  });

  // The three cap cases the workbook cannot check: it encodes the naive
  // MIN(claimed, evidence), under which these would be 0, 1 and 2 (D-045, D-047).
  it("claim 5 + E0 → 1", () => expect(adjustedScore(5, 0)).toBe(1));
  it("claim 4 + E1 → 2", () => expect(adjustedScore(4, 1)).toBe(2));
  it("claim 4 + E2 → 2 — E1 and E2 BOTH cap at 2", () => expect(adjustedScore(4, 2)).toBe(2));

  it("is never 'use the evidence level as the cap' — that naive version differs at E0 and E1", () => {
    const naive = (claimed: number, level: number) => Math.min(claimed, level);
    expect(adjustedScore(5, 0)).not.toBe(naive(5, 0));
    expect(adjustedScore(4, 1)).not.toBe(naive(4, 1));
  });

  it("an UNREVIEWED claim is scored as E0, never ignored: claim 5 with nothing reviewed → 1", () => {
    expect(adjustedScore(5, null)).toBe(1);
    expect(adjustedScore(5, null)).toBe(adjustedScore(5, 0));
  });

  it("the full 6 × 6 table: adjusted = min(claimed, cap(level))", () => {
    const expected = [
      // level: 0  1  2  3  4  5   (rows: claimed 0…5)
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [1, 2, 2, 2, 2, 2],
      [1, 2, 2, 3, 3, 3],
      [1, 2, 2, 3, 4, 4],
      [1, 2, 2, 3, 4, 5],
    ];
    for (const claimed of MATURITY_LEVELS) {
      for (const level of EVIDENCE_LEVELS) {
        expect(adjustedScore(claimed, level), `claimed ${claimed}, E${level}`).toBe(expected[claimed]![level]);
      }
    }
  });

  it("never raises a claim: adjusted ≤ claimed, always", () => {
    for (const claimed of MATURITY_LEVELS) {
      for (const level of EVIDENCE_LEVELS) expect(adjustedScore(claimed, level)).toBeLessThanOrEqual(claimed);
    }
  });

  it("says when the cap applied", () => {
    expect(capApplied(5, 0)).toBe(true);
    expect(capApplied(3, 3)).toBe(false);
    expect(capApplied(2, 1)).toBe(false); // E1 caps at 2; a claim of 2 is untouched
  });

  it("refuses anything off the 0–5 integer scale", () => {
    for (const bad of [-1, 6, 2.5, Number.NaN]) {
      expect(() => adjustedScore(bad, 3)).toThrow(ScoringInputError);
      expect(() => adjustedScore(3, bad)).toThrow(ScoringInputError);
    }
  });
});

describe("domainScore — (avg adjusted / 5) × weight", () => {
  it("the keystone: GOV (weight 7), one answer, claim 5 capped by E0 → 1.4", () => {
    expect(domainScore([answered(5, 0)], 7)).toBeCloseTo(1.4, 10);
  });

  it("the same answer with E5 evidence → the full 7, so a downgrade to E0 MOVES the domain", () => {
    expect(domainScore([answered(5, 5)], 7)).toBe(7);
    expect(domainScore([answered(5, 0)], 7)!).toBeLessThan(domainScore([answered(5, 5)], 7)!);
  });

  it("averages ADJUSTED scores, not claims", () => {
    // adjusted 1, 2, 5 → avg 8/3 → (8/3 / 5) × 7
    expect(domainScore([answered(5, 0), answered(4, 2), answered(5, 5)], 7)).toBeCloseTo((8 / 3 / 5) * 7, 10);
  });

  it("excludes Not Applicable from the denominator (D-029.3)", () => {
    expect(domainScore([answered(5, 5), na, na], 7)).toBe(7);
    expect(domainScore([answered(5, 5), na], 7)).toBe(domainScore([answered(5, 5)], 7));
  });

  it("returns null — not scored, never 0 — when no applicable response exists (D-038)", () => {
    expect(domainScore([], 7)).toBeNull();
    expect(domainScore([na, na], 7)).toBeNull();
    expect(domainScore([na], 7)).not.toBe(0);
  });

  it("a genuine zero is still zero: an applicable claim of 0 scores 0, not null", () => {
    expect(domainScore([answered(0, 5)], 7)).toBe(0);
  });

  it("refuses a non-positive weight", () => {
    expect(() => domainScore([answered(5, 5)], 0)).toThrow(ScoringInputError);
  });
});

describe("evidenceConfidence — (avg evidence level / 5) × 100", () => {
  it("averages levels over applicable responses", () => {
    expect(evidenceConfidence([answered(5, 5), answered(3, 0)])).toBe(50);
    expect(evidenceConfidence([answered(5, 3)])).toBe(60);
  });

  it("counts an unreviewed answer as E0, consistent with the cap", () => {
    expect(evidenceConfidence([answered(5, null), answered(5, 5)])).toBe(50);
  });

  it("ignores N/A, and is null when nothing applies", () => {
    expect(evidenceConfidence([answered(5, 5), na])).toBe(100);
    expect(evidenceConfidence([na])).toBeNull();
    expect(evidenceConfidence([])).toBeNull();
  });
});

describe("summariseDomainScore — outstanding is neither scored nor excluded", () => {
  it("GOV: 7 questions, 1 answered → a provisional score over the one answer, 6 outstanding", () => {
    const s = summariseDomainScore(7, [answered(5, 0)], 7);
    expect(s).toMatchObject({
      score: expect.closeTo(1.4, 10),
      weight: 7,
      evidenceConfidence: 0,
      questionCount: 7,
      applicableCount: 1,
      notApplicableCount: 0,
      outstandingCount: 6,
      provisional: true,
    });
  });

  it("nothing answered yet: not scored, everything outstanding", () => {
    expect(summariseDomainScore(7, [], 7)).toMatchObject({ score: null, outstandingCount: 7, provisional: true });
  });

  it("all answered: not provisional", () => {
    expect(summariseDomainScore(2, [answered(4, 4), na], 7)).toMatchObject({
      provisional: false,
      outstandingCount: 0,
      notApplicableCount: 1,
      score: expect.closeTo((4 / 5) * 7, 10),
    });
  });

  it("refuses more responses than questions", () => {
    expect(() => summariseDomainScore(1, [answered(1, 1), answered(1, 1)], 7)).toThrow(ScoringInputError);
  });
});

describe("evidence review rules (mirrored by database CHECKs)", () => {
  it("pending has no level; every reviewed status needs one", () => {
    expect(() => assertReviewConsistent("pending", null)).not.toThrow();
    expect(() => assertReviewConsistent("pending", 3)).toThrow(ScoringInputError);
    for (const status of REVIEWED_STATUSES) expect(() => assertReviewConsistent(status, null)).toThrow();
  });

  it("rejected evidence is E0", () => {
    expect(() => assertReviewConsistent("rejected", 0)).not.toThrow();
    expect(() => assertReviewConsistent("rejected", 2)).toThrow(/E0/);
  });

  it("has no attested or observed-but-not-stored status (D-039)", () => {
    expect(REVIEWED_STATUSES).toEqual(["adequate", "strong", "partial", "rejected", "outdated"]);
  });

  it("a response takes the STRONGEST reviewed artefact; unreviewed links do not count", () => {
    expect(responseEvidenceLevel([])).toBeNull();
    expect(responseEvidenceLevel([null, null])).toBeNull();
    expect(responseEvidenceLevel([0, 4, null, 2])).toBe(4);
    expect(responseEvidenceLevel([0])).toBe(0);
  });
});

describe("evidence storage layout", () => {
  const ORG = "0b000000-0000-4000-8000-000000000001";
  const ID = "0b000008-0000-4000-8000-000000000001";

  it("puts tenancy in the path: organizations/{org}/evidence/{id}/{file}", () => {
    expect(evidenceStoragePath(ORG, ID, "Office order.pdf")).toBe(`organizations/${ORG}/evidence/${ID}/Office_order.pdf`);
  });

  it("never lets a file name escape its segment", () => {
    for (const hostile of ["../../other-org/secret.pdf", "a/b\\\\c.pdf", "..", "/etc/passwd", ""]) {
      const name = sanitiseEvidenceFileName(hostile);
      expect(name).not.toMatch(/[\\/]/);
      expect(name).toMatch(/^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,119}$/); // the evidence_file_name_safe CHECK
    }
  });

  it("keeps the extension of a long name and stays within 120 characters", () => {
    const name = sanitiseEvidenceFileName(`${"x".repeat(300)}.pdf`);
    expect(name.length).toBeLessThanOrEqual(120);
    expect(name.endsWith(".pdf")).toBe(true);
  });

  it("allows documents and images, never archives or executables", () => {
    expect(EVIDENCE_CONTENT_TYPES).toContain("application/pdf");
    for (const bad of ["application/zip", "application/x-msdownload", "text/html", "image/svg+xml"]) {
      expect(EVIDENCE_CONTENT_TYPES as readonly string[]).not.toContain(bad);
    }
  });
});
