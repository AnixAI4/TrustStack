import { describe, expect, it } from "vitest";
import {
  contactLine,
  fiduciaryName,
  INTAKE_LIMITS,
  INTAKE_REFUSAL,
  INTAKE_REFUSAL_STATUS,
  isIntakeCode,
  isPublicSlug,
  maskEmail,
  PUBLIC_RIGHTS_KINDS,
  PUBLIC_RIGHTS_KIND_HELP,
  publicPaths,
  suggestPublicSlug,
  surfaceOf,
} from "./intake.js";
import { RIGHTS_KINDS, RIGHTS_KIND_PROVISION } from "./rights.js";

describe("the public address", () => {
  it("accepts lower-case letters, digits and inner hyphens, 3 to 63 characters", () => {
    for (const ok of ["mu", "mumbai-university", "abc", "a1-b2", "x".repeat(63)].filter((s) => s.length >= 3)) {
      expect(isPublicSlug(ok), ok).toBe(true);
    }
    for (const bad of ["ab", "MU-Uni", "-mu", "mu-", "mu_uni", "mu uni", "x".repeat(64), "", "müu"]) {
      expect(isPublicSlug(bad), bad).toBe(false);
    }
  });

  it("suggests an address from the organisation's name, or nothing it cannot make one from", () => {
    expect(suggestPublicSlug("Mumbai University")).toBe("mumbai-university");
    expect(suggestPublicSlug("  Bharat Manufacturing Ltd. ")).toBe("bharat-manufacturing-ltd");
    expect(suggestPublicSlug("Café Mysuru")).toBe("cafe-mysuru");
    expect(suggestPublicSlug("A")).toBe("");
    expect(suggestPublicSlug("—")).toBe("");
    expect(isPublicSlug(suggestPublicSlug("x".repeat(70) + " y"))).toBe(true);
  });

  it("names the public pages from one place (the notice from Stage 3b)", () => {
    expect(publicPaths("mu-test")).toEqual({
      home: "/p/mu-test",
      rights: "/p/mu-test/rights",
      grievance: "/p/mu-test/grievance",
      notice: "/p/mu-test/notice",
    });
  });
});

describe("the forms", () => {
  it("the rights form takes the six rights; a grievance has its own form", () => {
    expect(PUBLIC_RIGHTS_KINDS).toEqual(RIGHTS_KINDS.filter((k) => k !== "grievance"));
    expect(PUBLIC_RIGHTS_KINDS).toHaveLength(6);
    expect(surfaceOf("grievance")).toBe("grievance");
    for (const k of PUBLIC_RIGHTS_KINDS) expect(surfaceOf(k)).toBe("rights");
  });

  it("explains each right with the provision the register cites", () => {
    for (const k of PUBLIC_RIGHTS_KINDS) {
      expect(PUBLIC_RIGHTS_KIND_HELP[k]).toContain(`(${RIGHTS_KIND_PROVISION[k]})`);
    }
  });
});

describe("the limits", () => {
  it("are the ones approved for Stage 3a, and the SQL mirror asserts the same", () => {
    expect(INTAKE_LIMITS).toEqual({
      submissionsPerHour: 5,
      codesPerHour: 3,
      codesPerDay: 10,
      wrongCodes: 5,
      codeMinutes: 10,
      submissionHours: 24,
    });
  });
});

describe("codes", () => {
  it("are six digits", () => {
    expect(isIntakeCode("012345")).toBe(true);
    for (const bad of ["12345", "1234567", "12345a", " 123456", ""]) expect(isIntakeCode(bad), bad).toBe(false);
  });

  it("an email address is echoed back masked, never whole", () => {
    expect(maskEmail("asha.rao@example.com")).toBe("as******@example.com");
    expect(maskEmail("ab@example.com")).toBe("a*@example.com");
    expect(maskEmail("a@example.com")).toBe("*@example.com");
    expect(maskEmail("not-an-email")).toBe("***");
  });
});

describe("refusals", () => {
  it("never say whether an organisation, a submission or a code exists", () => {
    expect(INTAKE_REFUSAL.not_found).toBe("This page is not available.");
    for (const text of Object.values(INTAKE_REFUSAL)) {
      expect(text).not.toMatch(/organisation|tenant|does not exist|unknown/i);
    }
  });

  it("travel with a status: not found 404, too many 429, a spent submission 410", () => {
    expect(INTAKE_REFUSAL_STATUS).toEqual({
      not_found: 404,
      rate_limited: 429,
      wrong_code: 422,
      code_expired: 410,
      locked: 410,
      expired: 410,
      already_confirmed: 409,
    });
  });
});

describe("the Rule 9 contact", () => {
  it("names the DPO as one, and leaves out a missing phone", () => {
    expect(contactLine({ name: "Priya Shah", email: "dpo@mu.example.com", phone: "+91 22 0000 0000", isDpo: true })).toBe(
      "Priya Shah, Data Protection Officer · dpo@mu.example.com · +91 22 0000 0000",
    );
    expect(contactLine({ name: "Grievance Officer", email: "grievance@mu.example.com", phone: null, isDpo: false })).toBe(
      "Grievance Officer · grievance@mu.example.com",
    );
  });
});

describe("fiduciaryName — one organisation, one name (Slice 10.5 B5, F5.2)", () => {
  it("adds the legal name once, in brackets, only where it differs", () => {
    expect(fiduciaryName("Mumbai University", "University of Mumbai")).toBe("Mumbai University (University of Mumbai)");
    expect(fiduciaryName("Mumbai University", null)).toBe("Mumbai University");
    expect(fiduciaryName("Mumbai University", "  ")).toBe("Mumbai University");
    expect(fiduciaryName("Acme Ltd", "ACME LTD")).toBe("Acme Ltd");
  });
});
