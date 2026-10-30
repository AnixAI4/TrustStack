import { describe, expect, it } from "vitest";
import {
  childConsentUnverified,
  CONSENT_LANGUAGES,
  CONSENT_LANGUAGE_LABEL,
  CONSENT_LIMITS,
  consentRecordProblems,
  countConsents,
  noticeDataItems,
  noticePurposeProblems,
  VERIFICATION_METHODS,
  VERIFICATION_METHODS_FOR,
  verificationFits,
  widgetSnippet,
  widgetTranslationPending,
  type NoticePurpose,
} from "./consent.js";

const purpose = (over: Partial<NoticePurpose> = {}): NoticePurpose => ({
  key: "admissions",
  title: "Admissions",
  uses: "Processing your application for a place.",
  dataItems: ["Name", "Date of birth", "Marks"],
  ...over,
});

describe("languages (decision 6)", () => {
  it("English and the Eighth Schedule's twenty-two, each named", () => {
    expect(CONSENT_LANGUAGES).toHaveLength(23);
    expect(new Set(CONSENT_LANGUAGES).size).toBe(23);
    for (const l of CONSENT_LANGUAGES) expect(CONSENT_LANGUAGE_LABEL[l]).toBeTruthy();
  });
  it("the widget speaks English, Hindi and Marathi; every other language is translation pending, never machine-translated", () => {
    expect(CONSENT_LANGUAGES.filter((l) => !widgetTranslationPending(l))).toEqual(["en", "hi", "mr"]);
    expect(widgetTranslationPending("ta")).toBe(true);
  });
});

describe("the notice (s.5, Rule 3)", () => {
  it("a purpose itemises its data and says what it provides or enables", () => {
    expect(noticePurposeProblems([purpose()])).toEqual([]);
    expect(noticePurposeProblems([])).toEqual(["A notice names at least one purpose."]);
    expect(noticePurposeProblems([purpose({ uses: " " })]).join(" ")).toContain("Rule 3(b)(ii)");
    expect(noticePurposeProblems([purpose({ dataItems: [] })]).join(" ")).toContain("Rule 3(b)(i)");
    expect(noticePurposeProblems([purpose(), purpose()]).join(" ")).toContain("used twice");
    expect(noticePurposeProblems([purpose({ key: "Admissions" })]).join(" ")).toContain("not a purpose key");
  });
  it("the itemised data across purposes, each named once", () => {
    expect(noticeDataItems([purpose(), purpose({ key: "alumni", dataItems: ["name", "Email address"] })])).toEqual([
      "Name",
      "Date of birth",
      "Marks",
      "Email address",
    ]);
  });
});

describe("consent records (s.6, s.9, Rules 10–12)", () => {
  const offered = ["admissions", "alumni"];
  it("given names at least one offered purpose; refused and withdrawn name none", () => {
    expect(consentRecordProblems({ action: "given", purposes: ["admissions"], principalKind: "self", verificationMethod: null, offered })).toEqual([]);
    expect(consentRecordProblems({ action: "given", purposes: [], principalKind: "self", verificationMethod: null, offered })).toHaveLength(1);
    expect(consentRecordProblems({ action: "withdrawn", purposes: ["alumni"], principalKind: "self", verificationMethod: null, offered })).toHaveLength(1);
    expect(consentRecordProblems({ action: "given", purposes: ["marketing"], principalKind: "self", verificationMethod: null, offered })[0]).toContain(
      "marketing",
    );
  });
  it("Rule 10 and Rule 12 fit a child, Rule 11 a ward, nothing a Data Principal's own consent", () => {
    expect(VERIFICATION_METHODS_FOR.child).toEqual(["rule_10_1_a", "rule_10_1_b_i", "rule_10_1_b_ii", "rule_12_exempt"]);
    expect(VERIFICATION_METHODS_FOR.guardian_ward).toEqual(["rule_11_court", "rule_11_designated_authority", "rule_11_local_committee"]);
    expect([...VERIFICATION_METHODS_FOR.child, ...VERIFICATION_METHODS_FOR.guardian_ward].sort()).toEqual([...VERIFICATION_METHODS].sort());
    expect(verificationFits("self", "rule_10_1_a")).toBe(false);
    expect(verificationFits("child", "rule_11_court")).toBe(false);
    expect(verificationFits("guardian_ward", "rule_11_court")).toBe(true);
    expect(verificationFits("child", null)).toBe(true);
  });
  it("counts each principal's latest record; unverified = still given on someone's behalf, nothing recorded", () => {
    const latest = [
      { principalKind: "self", action: "given", verificationMethod: null },
      { principalKind: "self", action: "withdrawn", verificationMethod: null },
      { principalKind: "child", action: "given", verificationMethod: null },
      { principalKind: "child", action: "given", verificationMethod: "rule_12_exempt" },
      { principalKind: "guardian_ward", action: "refused", verificationMethod: null },
    ] as const;
    expect(countConsents(latest)).toEqual({ principals: 5, given: 3, refused: 1, withdrawn: 1, onBehalf: 2, unverified: 1 });
    expect(latest.filter(childConsentUnverified)).toHaveLength(1);
  });
});

describe("the widget", () => {
  it("the snippet names the slug and the versioned file", () => {
    expect(widgetSnippet("https://app.example", "mu")).toBe('<script src="https://app.example/widget/consent-v1.js" data-org="mu" async></script>');
  });
  it("limits: generous per address (a campus shares one), tight per person", () => {
    expect(CONSENT_LIMITS).toEqual({ recordsPerClientHour: 120, recordsPerPrincipalHour: 10 });
  });
});
