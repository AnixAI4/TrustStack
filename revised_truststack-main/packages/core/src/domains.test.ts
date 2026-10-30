import { describe, expect, it } from "vitest";
import {
  assertDomainWeightsTotal, DOMAIN_CODES, DOMAIN_WEIGHT_TOTAL_INVALID, domainByCode, DomainWeightTotalError,
  domainSortOrder, domainWeight, DPDP_DOMAINS, isDomainCode,
} from "./domains.js";

/**
 * The 100-point total is a DPDP invariant (CLAUDE.md): a test must FAIL if it
 * is violated. The Excel `Question_Bank` sheet carries a stale weight column
 * that totals 104, so the "it fails on 104" case uses those real numbers.
 */
describe("the 16-domain model", () => {
  it("has all 16 domains, D01–D16, in report order", () => {
    expect(DPDP_DOMAINS).toHaveLength(16);
    expect(DPDP_DOMAINS.map((d) => d.code)).toEqual([...DOMAIN_CODES]);
    expect(DPDP_DOMAINS.map((d) => d.domainId)).toEqual(
      Array.from({ length: 16 }, (_, i) => `D${String(i + 1).padStart(2, "0")}`),
    );
    expect(DPDP_DOMAINS.map((d) => d.sortOrder)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });

  it("active weights total exactly 100", () => {
    expect(DPDP_DOMAINS.reduce((n, d) => n + d.weight, 0)).toBe(100);
    expect(() => assertDomainWeightsTotal()).not.toThrow();
  });

  it("every weight is positive", () => {
    for (const d of DPDP_DOMAINS) expect(d.weight).toBeGreaterThan(0);
  });

  it("throws DOMAIN_WEIGHT_TOTAL_INVALID on the workbook's stale 104-point set (D-006)", () => {
    // Question_Bank.Domain Weight, verbatim: D01 8, D02 8, D03 6, D04 8, D05 7,
    // D06 7, D07 7, D08 5, D09 7, D10 4, D11 10, D12 8, D13 7, D14 4, D15 3, D16 5.
    const stale = [8, 8, 6, 8, 7, 7, 7, 5, 7, 4, 10, 8, 7, 4, 3, 5].map((weight) => ({ weight }));
    expect(stale.reduce((n, d) => n + d.weight, 0)).toBe(104);
    expect(() => assertDomainWeightsTotal(stale)).toThrow(DomainWeightTotalError);
    try {
      assertDomainWeightsTotal(stale);
    } catch (error) {
      expect((error as DomainWeightTotalError).code).toBe(DOMAIN_WEIGHT_TOTAL_INVALID);
      expect((error as DomainWeightTotalError).total).toBe(104);
    }
  });

  it("throws when a single weight is nudged either way", () => {
    for (const delta of [-1, 1, 0.01, -0.01]) {
      const nudged = DPDP_DOMAINS.map((d, i) => ({ weight: i === 0 ? d.weight + delta : d.weight }));
      expect(() => assertDomainWeightsTotal(nudged)).toThrow(DomainWeightTotalError);
    }
  });

  it("accepts a compensating swap — what matters is the total, not the split", () => {
    const swapped = DPDP_DOMAINS.map((d, i) =>
      i === 0 ? { weight: d.weight + 1 } : i === 1 ? { weight: d.weight - 1 } : { weight: d.weight },
    );
    expect(() => assertDomainWeightsTotal(swapped)).not.toThrow();
  });

  it("lookups agree with the table", () => {
    expect(isDomainCode("SECURITY")).toBe(true);
    expect(isDomainCode("NOT_A_DOMAIN")).toBe(false);
    expect(domainByCode("SECURITY")?.domainId).toBe("D11");
    expect(domainWeight("SECURITY")).toBe(10);
    expect(domainWeight("CROSSBORDER")).toBe(3);
    expect(domainSortOrder("GOV")).toBe(1);
    expect(domainSortOrder("SDF_AI")).toBe(16);
    expect(domainByCode("nope")).toBeUndefined();
  });

  it("SECURITY is the heaviest domain and CROSSBORDER the lightest, as Config says", () => {
    const sorted = [...DPDP_DOMAINS].sort((a, b) => b.weight - a.weight);
    expect(sorted[0]!.code).toBe("SECURITY");
    expect(sorted.at(-1)!.code).toBe("CROSSBORDER");
  });
});
