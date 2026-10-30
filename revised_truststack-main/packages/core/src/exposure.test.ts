import { describe, expect, it } from "vitest";
import { DOMAIN_CODES, type DomainCode } from "./domains.js";
import { RED_FLAGS } from "./engine.js";
import {
  AT_STAKE_STATUSES,
  bandRangeCrore,
  bandRangeLabel,
  COMMENCEMENT,
  daysBetween,
  directDomains,
  directRegisterRules,
  EXPOSURE_CAVEAT,
  EXPOSURE_HEADS,
  EXPOSURE_MAPPING,
  EXPOSURE_MODEL_VERSION,
  EXPOSURE_STATUS_LABEL,
  EXPOSURE_THRESHOLDS,
  exposureCaveat,
  exposureFor,
  ExposureInputError,
  MODULE_INPUTS,
  MODULE_INPUT_CODES,
  moduleInputCounts,
  recentBreachCount,
  REPETITION_WINDOW_MONTHS,
  type ExposureBreachInput,
  type ExposureRightsInput,
  type ExposureConsentInput,
  childrenAndGuardianFacts,
  directHeadsOf,
  gapIsOutstanding,
  MODELLED_HEAD_CODES,
  POSITION_BANDS,
  POSITION_FACTORS,
  positionBand,
  strongestTriState,
  type ExposureDomainInput,
  type ExposureGapInput,
  type ExposureInput,
  type ExposureResult,
  type ExposureVendorInput,
  type ExposureRetentionInput,
  type ExposureAiSystemInput,
  type ModelledHeadCode,
} from "./exposure.js";
import { DPDP_REPORT_CAVEAT } from "./caveat.js";
import { ROPA_GAP_CODES, type RopaGapCode } from "./ropa.js";

const TODAY = "2026-10-05";
/** Noon in India on TODAY — the instant a breach clock is read at. */
const NOW = "2026-10-05T06:30:00.000Z";

/** Every domain answered, 80% of its weight, 80% confidence — nothing at stake. */
function domain(code: DomainCode, over: Partial<ExposureDomainInput> = {}): ExposureDomainInput {
  return { code, state: "scored", weight: 5, questionCount: 5, outstandingCount: 0, percent: 0.8, evidenceConfidence: 80, ...over };
}

function input(over: Partial<ExposureInput> = {}): ExposureInput {
  return {
    today: TODAY,
    now: NOW,
    basis: "finalised",
    assessment: { domains: DOMAIN_CODES.map((c) => domain(c)), redFlags: [] },
    gaps: [],
    registerActions: [],
    scope: { childrenData: "no", guardianData: "no", sensitiveDocuments: "no", largeScale: false, locationUnknown: false },
    register: { childrenData: [], crossBorder: [] },
    sdf: { notifiedOn: null },
    breaches: [],
    rights: [],
    consents: [],
    vendors: [],
    retention: [],
    aiSystems: [],
    ...over,
  };
}

/** The baseline with some domains overridden. */
function withDomains(overrides: Partial<Record<DomainCode, Partial<ExposureDomainInput>>>, over: Partial<ExposureInput> = {}): ExposureInput {
  return input({
    assessment: { domains: DOMAIN_CODES.map((c) => domain(c, overrides[c] ?? {})), redFlags: [] },
    ...over,
  });
}

const withChildren = (over: Partial<ExposureInput["scope"]> = {}): ExposureInput["scope"] => ({
  childrenData: "yes",
  guardianData: "no",
  sensitiveDocuments: "no",
  largeScale: false,
  locationUnknown: false,
  ...over,
});

function assessmentGap(domainCode: DomainCode, severity: ExposureGapInput["severity"], over: Partial<ExposureGapInput> = {}): ExposureGapInput {
  return {
    source: "assessment",
    domainCode,
    severity,
    state: "open",
    actions: [{ ownerUserId: null, dueDate: null, status: "open" }],
    ...over,
  } as ExposureGapInput;
}

function ropaGap(gapCode: RopaGapCode, severity: ExposureGapInput["severity"], over: Partial<ExposureGapInput> = {}): ExposureGapInput {
  return {
    source: "ropa",
    gapCode,
    severity,
    state: "open",
    actions: [{ ownerUserId: null, dueDate: null, status: "open" }],
    ...over,
  } as ExposureGapInput;
}

const head = (r: ExposureResult, code: ModelledHeadCode) => r.heads.find((h) => h.code === code)!;
const statuses = (r: ExposureResult) => Object.fromEntries(r.heads.map((h) => [h.code, h.status]));

// ---------------------------------------------------------------------------

describe("the heads are the Schedule's (s.33(1))", () => {
  it("carries the seven heads and their ceilings verbatim", () => {
    const crore = (n: number) => n * 10_000_000;
    expect(EXPOSURE_HEADS.map((h) => [h.code, h.provision, h.ceilingRupees])).toEqual([
      ["H1", "s.8(5)", crore(250)],
      ["H2", "s.8(6)", crore(200)],
      ["H3", "s.9", crore(200)],
      ["H4", "s.10", crore(150)],
      ["H5", "s.15", 10_000],
      ["H6", "s.32", null],
      ["H7", "Any other provision", crore(50)],
    ]);
  });

  it("never evaluates H5 (a Data Principal's duty) or H6 (no undertaking exists), and says why", () => {
    const r = exposureFor(input());
    expect(r.heads.map((h) => h.code)).toEqual([...MODELLED_HEAD_CODES]);
    expect(r.notModelled.map((h) => h.code)).toEqual(["H5", "H6"]);
    for (const h of r.notModelled) expect(h.reason.length).toBeGreaterThan(20);
  });

  it("stamps the model version", () => {
    // 1.1.0: the breach register's rows (Slice 10, Stage 1, D-080); 1.2.0: the rights register's (Stage 2);
    // 1.3.0: the consent register's (Stage 3b); 1.4.0: the processor register's (Stage 4a);
    // 1.5.0: the retention register's and the AI risk register's (Stage 5);
    // 1.6.0: a recorded breach assesses head 2 (Stage 6, Aniket's change, D-098).
    // 1.7.0: breach, rights and retention actions count in the forecast's outstanding work (Q1, D-104.1).
    expect(EXPOSURE_MODEL_VERSION).toBe("1.7.0");
    expect(exposureFor(input()).modelVersion).toBe("1.7.0");
  });
});

describe("mapping complete (§6.2)", () => {
  const PROVISION = /(s\.\d|Rule \d)/;

  it("classifies every Compass domain as DIRECT (heads + provisions) or ENABLING (with a reason)", () => {
    expect(Object.keys(EXPOSURE_MAPPING.domains).sort()).toEqual([...DOMAIN_CODES].sort());
    for (const code of DOMAIN_CODES) {
      const c = EXPOSURE_MAPPING.domains[code];
      if (c.kind === "direct") {
        expect(c.links.length, code).toBeGreaterThan(0);
        for (const l of c.links) expect(l.provision, code).toMatch(PROVISION);
      } else {
        expect(c.reason.length, code).toBeGreaterThan(20);
        expect(c.supports.length, code).toBeGreaterThan(0);
      }
    }
  });

  it("classifies every register gap rule the same way", () => {
    expect(Object.keys(EXPOSURE_MAPPING.registerRules).sort()).toEqual([...ROPA_GAP_CODES].sort());
    for (const code of ROPA_GAP_CODES) {
      const c = EXPOSURE_MAPPING.registerRules[code];
      if (c.kind === "direct") {
        expect(c.links.length, code).toBeGreaterThan(0);
        for (const l of c.links) expect(l.provision, code).toMatch(PROVISION);
      } else {
        expect(c.reason.length, code).toBeGreaterThan(10);
      }
    }
  });

  it("matches the approved table: governance, inventory, the register and cross-border are enabling", () => {
    const enabling = DOMAIN_CODES.filter((c) => EXPOSURE_MAPPING.domains[c].kind === "enabling");
    expect(enabling).toEqual(["GOV", "INV", "ROPA", "CROSSBORDER"]);
    expect(directDomains("H1")).toEqual(["SECURITY", "VENDOR"]);
    expect(directDomains("H2")).toEqual(["BREACH"]);
    expect(directDomains("H3")).toEqual(["CHILD"]);
    expect(directDomains("H4")).toEqual(["SDF_AI"]);
    expect(directDomains("H7")).toEqual(["PURPOSE", "NOTICE", "CONSENT", "RIGHTS", "GRIEVANCE", "RETENTION", "ACCURACY", "VENDOR"]);
    expect(directRegisterRules("H1")).toEqual(["processor_contract_missing", "safeguards_missing", "rule6_unconfirmed"]);
    expect(directRegisterRules("H2")).toEqual([]);
    expect(directRegisterRules("H3")).toEqual(["child_consent_missing", "child_tracking"]);
    expect(directRegisterRules("H4")).toEqual(["ai_unreviewed"]);
    expect(directRegisterRules("H7")).toEqual(["purpose_missing", "processor_contract_missing", "notice_missing", "consent_missing", "retention_missing"]);
    const enablingRules = ROPA_GAP_CODES.filter((c) => EXPOSURE_MAPPING.registerRules[c].kind === "enabling");
    expect(enablingRules).toEqual(["no_records", "no_owner", "categories_missing", "vendor_unmapped", "review_overdue"]);
  });

  it("every modelled head has direct evidence of its own", () => {
    for (const h of MODELLED_HEAD_CODES) expect(directDomains(h).length, h).toBeGreaterThan(0);
  });

  it("every red flag sits in a classified domain", () => {
    for (const f of RED_FLAGS) expect(EXPOSURE_MAPPING.domains[f.domainCode]).toBeDefined();
  });

  it("no enabling control can change a status — domain scores, red flags or register gaps", () => {
    const enablingDomains = DOMAIN_CODES.filter((c) => EXPOSURE_MAPPING.domains[c].kind === "enabling");
    const enablingRules = ROPA_GAP_CODES.filter((c) => EXPOSURE_MAPPING.registerRules[c].kind === "enabling");
    // From each of three starting points, so a status can move in either direction.
    const starts = [
      input(),
      withDomains({ SECURITY: { percent: 0.5 } }, { scope: withChildren() }),
      input({ basis: "none", assessment: null, scope: withChildren({ childrenData: "unknown" }) }),
    ];
    for (const start of starts) {
      const before = statuses(exposureFor(start));
      const weakened: ExposureInput = {
        ...start,
        assessment: start.assessment && {
          domains: start.assessment.domains.map((d) => (enablingDomains.includes(d.code) ? { ...d, percent: 0, evidenceConfidence: 0 } : d)),
          redFlags: RED_FLAGS.filter((f) => enablingDomains.includes(f.domainCode)).map((f) => ({ code: f.code, domainCode: f.domainCode, label: f.label })),
        },
        gaps: [...start.gaps, ...enablingRules.map((c) => ropaGap(c, "critical"))],
      };
      expect(statuses(exposureFor(weakened))).toEqual(before);
    }
  });

  it("enabling controls DO appear as root causes", () => {
    const r = exposureFor({
      ...withDomains({ SECURITY: { percent: 0.3 } }),
      assessment: {
        domains: DOMAIN_CODES.map((c) => domain(c, c === "SECURITY" ? { percent: 0.3 } : {})),
        redFlags: [{ code: "weak_data_inventory", domainCode: "INV", label: "Personal data discovery and inventory is weak or unevidenced" }],
      },
      gaps: [ropaGap("no_owner", "high")],
    });
    const reasons = head(r, "H1").reasons.filter((x) => x.kind === "root_cause").map((x) => x.text);
    expect(reasons).toEqual([
      "Root cause: Personal data discovery and inventory is weak or unevidenced.",
      "Root cause: processing register — No owner (1 open gap).",
    ]);
  });
});

describe("applies when (§6.2)", () => {
  it("H1, H2 and H7 always apply", () => {
    const r = exposureFor(input());
    for (const h of ["H1", "H2", "H7"] as const) expect(head(r, h).applies).toBe(true);
  });

  it("H3 applies when children's OR guardian data is yes or unknown, in the scope or the register", () => {
    expect(head(exposureFor(input()), "H3").status).toBe("not_applicable");
    for (const scope of [
      withChildren({ childrenData: "yes" }),
      withChildren({ childrenData: "unknown" }),
      withChildren({ childrenData: "no", guardianData: "yes" }),
      withChildren({ childrenData: "no", guardianData: "unknown" }),
    ]) {
      expect(head(exposureFor(input({ scope })), "H3").applies, JSON.stringify(scope)).toBe(true);
    }
    for (const childrenData of [["yes"], ["no", "unknown"]] as const) {
      expect(head(exposureFor(input({ register: { childrenData, crossBorder: [] } })), "H3").applies).toBe(true);
    }
    expect(head(exposureFor(input({ register: { childrenData: ["no", "no"], crossBorder: [] } })), "H3").applies).toBe(false);
  });

  it("H3 says why it applies, in words — guardian data included (s.9(1))", () => {
    const h3 = head(exposureFor(input({ scope: withChildren({ childrenData: "no", guardianData: "yes" }) })), "H3");
    expect(h3.reasons[0]).toEqual({
      kind: "applies",
      text: "Applies because data of persons with disability who have a lawful guardian is processed.",
    });
  });

  it("H4 applies ONLY once an SDF notification is recorded — never inferred from scale (D-028)", () => {
    const largeScale = { ...input().scope, largeScale: true, sensitiveDocuments: "yes" as const };
    expect(head(exposureFor(input({ scope: largeScale })), "H4").status).toBe("not_applicable");
    expect(head(exposureFor(input({ scope: largeScale })), "H4").reasons[0]!.text).toContain("never infers");
    const notified = head(exposureFor(input({ sdf: { notifiedOn: "2026-09-01" } })), "H4");
    expect(notified.applies).toBe(true);
    expect(notified.status).toBe("mitigated");
  });

  it("ai_unreviewed counts against H4 only when H4 applies", () => {
    const gaps = [ropaGap("ai_unreviewed", "high")];
    expect(statuses(exposureFor(input({ gaps })))).toEqual(statuses(exposureFor(input())));
    expect(head(exposureFor(input({ gaps, sdf: { notifiedOn: "2026-09-01" } })), "H4").status).toBe("partially_mitigated");
  });
});

describe("status rules, in order (§6.3)", () => {
  it("the baseline is mitigated on every applicable head", () => {
    expect(statuses(exposureFor(input()))).toEqual({
      H1: "mitigated",
      H2: "mitigated",
      H3: "not_applicable",
      H4: "not_applicable",
      H7: "mitigated",
    });
  });

  it("not yet assessed: no assessment and no direct register gap", () => {
    const r = exposureFor(input({ basis: "none", assessment: null }));
    expect(statuses(r)).toEqual({ H1: "not_yet_assessed", H2: "not_yet_assessed", H3: "not_applicable", H4: "not_applicable", H7: "not_yet_assessed" });
  });

  it("not yet assessed: every direct domain unanswered — and an ENABLING register gap does not change that", () => {
    const unanswered = { outstandingCount: 5, percent: null, evidenceConfidence: null };
    const r = exposureFor(withDomains({ SECURITY: unanswered, VENDOR: unanswered }, { gaps: [ropaGap("no_owner", "high")] }));
    expect(head(r, "H1").status).toBe("not_yet_assessed");
    // VENDOR is H7 evidence too (s.8(2)): with it unanswered, H7 cannot be mitigated.
    expect(head(r, "H7").status).toBe("partially_mitigated");
    expect(head(r, "H7").reasons).toContainEqual({
      kind: "status",
      text: "Vendor / Data Processor governance has not been answered yet.",
    });
  });

  it("a direct register gap means the head is assessed, even with no assessment", () => {
    const r = exposureFor(input({ basis: "none", assessment: null, gaps: [ropaGap("safeguards_missing", "high")] }));
    expect(head(r, "H1").status).toBe("partially_mitigated");
    expect(head(r, "H2").status).toBe("not_yet_assessed");
  });

  it("exposed: a red flag in a DIRECT domain", () => {
    const r = exposureFor({
      ...input(),
      assessment: {
        domains: DOMAIN_CODES.map((c) => domain(c)),
        redFlags: [{ code: "weak_security_safeguards", domainCode: "SECURITY", label: "Security safeguards are weak or unevidenced" }],
      },
    });
    expect(statuses(r)).toMatchObject({ H1: "exposed", H2: "mitigated", H7: "mitigated" });
    expect(head(r, "H1").reasons).toContainEqual({ kind: "status", text: "Red flag: Security safeguards are weak or unevidenced." });
  });

  it("exposed: an open CRITICAL direct gap, from the assessment or the register", () => {
    expect(head(exposureFor(input({ gaps: [assessmentGap("BREACH", "critical")] })), "H2").status).toBe("exposed");
    const h3 = head(exposureFor(input({ scope: withChildren(), gaps: [ropaGap("child_tracking", "critical")] })), "H3");
    expect(h3.status).toBe("exposed");
  });

  it("exposed: a direct scored domain below 40% — the boundary is 40", () => {
    expect(EXPOSURE_THRESHOLDS.exposedBelowPercent).toBe(0.4);
    expect(head(exposureFor(withDomains({ SECURITY: { percent: 0.39 } })), "H1").status).toBe("exposed");
    expect(head(exposureFor(withDomains({ SECURITY: { percent: 0.4 } })), "H1").status).toBe("partially_mitigated");
  });

  it("VENDOR evidences both H1 (Rule 6(1)(f)) and H7 (s.8(2))", () => {
    const r = exposureFor(withDomains({ VENDOR: { percent: 0.2 } }));
    expect(statuses(r)).toMatchObject({ H1: "exposed", H2: "mitigated", H7: "exposed" });
  });

  it("mitigated: every direct domain ≥ 60% — the boundary is 60", () => {
    expect(EXPOSURE_THRESHOLDS.mitigatedMinPercent).toBe(0.6);
    expect(head(exposureFor(withDomains({ BREACH: { percent: 0.59 } })), "H2").status).toBe("partially_mitigated");
    expect(head(exposureFor(withDomains({ BREACH: { percent: 0.6 } })), "H2").status).toBe("mitigated");
  });

  it("mitigated: evidence confidence ≥ 60% — the boundary is 60", () => {
    expect(EXPOSURE_THRESHOLDS.mitigatedMinConfidence).toBe(60);
    expect(head(exposureFor(withDomains({ BREACH: { evidenceConfidence: 59 } })), "H2").status).toBe("partially_mitigated");
    expect(head(exposureFor(withDomains({ BREACH: { evidenceConfidence: 60 } })), "H2").status).toBe("mitigated");
  });

  it("mitigated: no open critical or HIGH direct gap — a medium one does not block it", () => {
    expect(head(exposureFor(input({ gaps: [assessmentGap("BREACH", "high")] })), "H2").status).toBe("partially_mitigated");
    const withMedium = head(exposureFor(input({ gaps: [assessmentGap("BREACH", "medium")] })), "H2");
    expect(withMedium.status).toBe("mitigated");
    // Why it is mitigated comes first; the work still open follows.
    expect(withMedium.reasons.map((x) => x.text)).toEqual([
      "Every area that evidences this head scored at least 60% with evidence confidence of at least 60%, and no critical or high gap is open.",
      "Personal data breach readiness: 1 open gap (1 medium).",
    ]);
    expect(head(exposureFor(input({ gaps: [ropaGap("notice_missing", "high")] })), "H7").status).toBe("partially_mitigated");
  });

  it("a gap whose every action is closed, or that is superseded, no longer counts", () => {
    const closed = assessmentGap("BREACH", "critical", { actions: [{ ownerUserId: "u", dueDate: "2026-10-20", status: "closed" }] });
    const superseded = assessmentGap("BREACH", "critical", { state: "superseded" });
    expect(gapIsOutstanding(closed)).toBe(false);
    expect(gapIsOutstanding(superseded)).toBe(false);
    expect(gapIsOutstanding(assessmentGap("BREACH", "critical", { actions: [] }))).toBe(true);
    expect(head(exposureFor(input({ gaps: [closed, superseded] })), "H2").status).toBe("mitigated");
  });

  it("a scoped-out or all-N/A domain evidences nothing (D-038)", () => {
    const r = exposureFor(withDomains({ VENDOR: { state: "scoped_out", questionCount: 0, percent: null, evidenceConfidence: null } }));
    expect(head(r, "H1").status).toBe("mitigated");
    // H3 applies but its only domain was excluded in full: nothing evidences it.
    const h3 = head(
      exposureFor(
        withDomains({ CHILD: { state: "all_not_applicable", percent: null, evidenceConfidence: null } }, { scope: withChildren() }),
      ),
      "H3",
    );
    expect(h3.status).toBe("partially_mitigated");
  });

  it("a partly answered direct domain blocks Mitigated", () => {
    const r = exposureFor(withDomains({ SECURITY: { outstandingCount: 5, percent: null, evidenceConfidence: null } }));
    expect(head(r, "H1").status).toBe("partially_mitigated");
    expect(head(r, "H1").reasons).toContainEqual({ kind: "status", text: "Security safeguards has not been answered yet." });
  });

  it("'Not yet assessed' is labelled apart from 'Exposed' — but counts in the headline", () => {
    expect(EXPOSURE_STATUS_LABEL.not_yet_assessed).toBe("Not yet assessed");
    expect(EXPOSURE_STATUS_LABEL.exposed).toBe("Exposed");
    expect(AT_STAKE_STATUSES).toContain("not_yet_assessed");
    const r = exposureFor(input({ basis: "none", assessment: null }));
    expect(r.headline.ceilingsAtStakeCrore).toBe(250 + 200 + 50);
    expect(r.headline.exposedHeads).toBe(3);
    expect(r.headline.byStatus.exposed).toBe(0);
    expect(r.headline.byStatus.not_yet_assessed).toBe(3);
  });

  it("never says compliant", () => {
    for (const label of Object.values(EXPOSURE_STATUS_LABEL)) expect(label.toLowerCase()).not.toContain("compliant");
  });
});

describe("indicative position (§6.4)", () => {
  /** H1 partially mitigated with no factor firing: 0 points, lower third. */
  const quiet = () =>
    withDomains({ SECURITY: { percent: 0.5, evidenceConfidence: 50 }, VENDOR: { percent: 0.5, evidenceConfidence: 50 } });

  it("only for Exposed, Partially mitigated and Not yet assessed", () => {
    expect(head(exposureFor(input()), "H1").position).toBeNull();
    expect(head(exposureFor(input()), "H3").position).toBeNull();
    expect(head(exposureFor(quiet()), "H1").position).not.toBeNull();
    expect(head(exposureFor(input({ basis: "none", assessment: null })), "H1").position).not.toBeNull();
  });

  it("starts at zero points, lower third", () => {
    const p = head(exposureFor(quiet()), "H1").position!;
    expect(p.points).toBe(0);
    expect(p.factors).toEqual([]);
    expect(p.band).toBe("lower");
  });

  const pointsFor = (i: ExposureInput, h: ModelledHeadCode = "H1") => head(exposureFor(i), h).position!.points;

  it("each factor alone", () => {
    const q = quiet();
    expect(pointsFor({ ...q, scope: { ...q.scope, childrenData: "yes" } })).toBe(2);
    expect(pointsFor({ ...q, scope: { ...q.scope, childrenData: "unknown" } })).toBe(1);
    expect(pointsFor({ ...q, register: { childrenData: ["yes"], crossBorder: [] } })).toBe(2);
    expect(pointsFor({ ...q, scope: { ...q.scope, sensitiveDocuments: "yes" } })).toBe(1);
    expect(pointsFor({ ...q, scope: { ...q.scope, sensitiveDocuments: "unknown" } })).toBe(1);
    expect(pointsFor({ ...q, scope: { ...q.scope, largeScale: true } })).toBe(1);
    expect(pointsFor({ ...q, scope: { ...q.scope, locationUnknown: true } })).toBe(1);
    expect(pointsFor({ ...q, register: { childrenData: [], crossBorder: ["unknown"] } })).toBe(1);
  });

  it("children's data weighs more on H3: +3 yes / +2 unknown", () => {
    const q = withDomains({ CHILD: { percent: 0.5, evidenceConfidence: 50 } });
    expect(pointsFor({ ...q, scope: withChildren({ childrenData: "yes" }) }, "H3")).toBe(3);
    expect(pointsFor({ ...q, scope: withChildren({ childrenData: "unknown" }) }, "H3")).toBe(2);
  });

  it("location unknown reads on H1 only", () => {
    const q = withDomains({ SECURITY: { percent: 0.5, evidenceConfidence: 50 }, PURPOSE: { percent: 0.5, evidenceConfidence: 50 } });
    const located = { ...q, scope: { ...q.scope, locationUnknown: true } };
    expect(pointsFor(located, "H1")).toBe(1);
    expect(pointsFor(located, "H7")).toBe(0);
  });

  it("Exposed rather than partial: +1", () => {
    expect(pointsFor(withDomains({ SECURITY: { percent: 0.3, evidenceConfidence: 50 } }))).toBe(1);
  });

  it("an owned, dated plan for every open gap: −1 (a Low gap needs an owner only — D-055)", () => {
    const q = quiet();
    const owned = { ownerUserId: "u", dueDate: "2026-11-01", status: "in_progress" as const };
    expect(pointsFor({ ...q, gaps: [assessmentGap("SECURITY", "medium", { actions: [owned] })] })).toBe(-1);
    expect(pointsFor({ ...q, gaps: [assessmentGap("SECURITY", "low", { actions: [{ ...owned, dueDate: null }] })] })).toBe(-1);
    expect(pointsFor({ ...q, gaps: [assessmentGap("SECURITY", "medium", { actions: [{ ...owned, dueDate: null }] })] })).toBe(0);
    expect(pointsFor({ ...q, gaps: [assessmentGap("SECURITY", "medium", { actions: [{ ...owned, ownerUserId: null }] })] })).toBe(0);
    // No gap at all is not a plan.
    expect(pointsFor(q)).toBe(0);
  });

  it("evidence confidence ≥ 60% in every direct area: −1", () => {
    expect(pointsFor(withDomains({ SECURITY: { percent: 0.5, evidenceConfidence: 60 }, VENDOR: { percent: 0.5, evidenceConfidence: 70 } }))).toBe(-1);
    expect(pointsFor(withDomains({ SECURITY: { percent: 0.5, evidenceConfidence: 60 }, VENDOR: { percent: 0.5, evidenceConfidence: 59 } }))).toBe(0);
  });

  it("repetition (c) is scored from 1.1.0 — +1 once, +2 twice or more, head 2 only — and the factors it cannot observe are stated", () => {
    expect(POSITION_FACTORS.find((f) => f.code === "repetition")).toMatchObject({ clause: "(c)", points: 1, repeatedPoints: 2, onlyHeads: ["H2"] });
    expect(exposureFor(input()).unscoredFactors.map((f) => f.clause)).toEqual(["(d)", "(f)", "(g)"]);
  });

  it("bands at the boundaries: ≤ 1 lower · 2–3 middle · ≥ 4 upper", () => {
    expect([-2, 0, 1, 2, 3, 4, 7].map((p) => positionBand(p).band)).toEqual(["lower", "lower", "lower", "middle", "middle", "upper", "upper"]);
    expect(POSITION_BANDS.map((b) => b.label)).toEqual(["Lower third", "Middle third", "Upper third"]);
  });

  it("bands are thirds of the ceiling, rounded to whole crore", () => {
    const crore = (n: number) => n * 10_000_000;
    const thirds = (c: number) => (["lower", "middle", "upper"] as const).map((b) => bandRangeCrore(crore(c), b));
    expect(thirds(250)).toEqual([{ fromCrore: 0, toCrore: 83 }, { fromCrore: 83, toCrore: 167 }, { fromCrore: 167, toCrore: 250 }]);
    expect(thirds(200)).toEqual([{ fromCrore: 0, toCrore: 67 }, { fromCrore: 67, toCrore: 133 }, { fromCrore: 133, toCrore: 200 }]);
    expect(thirds(150)).toEqual([{ fromCrore: 0, toCrore: 50 }, { fromCrore: 50, toCrore: 100 }, { fromCrore: 100, toCrore: 150 }]);
    expect(thirds(50)).toEqual([{ fromCrore: 0, toCrore: 17 }, { fromCrore: 17, toCrore: 33 }, { fromCrore: 33, toCrore: 50 }]);
    expect(bandRangeLabel({ fromCrore: 167, toCrore: 250 })).toBe("₹167–250 crore");
    expect(bandRangeLabel({ fromCrore: 0, toCrore: 83 })).toBe("up to ₹83 crore");
  });

  it("an upper-third position lists its reasons in plain words", () => {
    const r = exposureFor({
      ...withDomains({ SECURITY: { percent: 0.3, evidenceConfidence: 20 } }),
      scope: withChildren({ sensitiveDocuments: "yes", largeScale: true, locationUnknown: true }),
    });
    const p = head(r, "H1").position!;
    expect(p.points).toBe(6);
    expect(p.band).toBe("upper");
    expect(p.rangeLabel).toBe("₹167–250 crore");
    expect(p.factors.map((f) => f.text)).toEqual([
      "Children's data is processed.",
      "Identity, financial or health documents are collected.",
      "A large number of Data Principals (a TrustStack trigger, not a statutory classification).",
      "Where personal data is held or sent is not known.",
      "Exposed rather than partly mitigated.",
    ]);
  });
});

describe("headline (§6.5)", () => {
  it("sums CEILINGS of the heads at stake, labelled as ceilings", () => {
    const r = exposureFor(withDomains({ SECURITY: { percent: 0.3 }, BREACH: { percent: 0.5 } }, { scope: withChildren() }));
    expect(statuses(r)).toMatchObject({ H1: "exposed", H2: "partially_mitigated", H3: "mitigated", H7: "mitigated" });
    expect(r.headline.ceilingsAtStakeCrore).toBe(250 + 200);
    expect(r.headline.ceilingsLabel).toBe("Statutory ceilings, not a predicted fine; penalties are per breach.");
    expect(r.headline.exposedHeads).toBe(2);
    expect(r.headline.applicableHeads).toBe(4);
  });

  it("shows the s.37 flag once any head is at stake, and not before", () => {
    expect(exposureFor(input()).s37.shown).toBe(false);
    const r = exposureFor(withDomains({ BREACH: { percent: 0.5 } }));
    expect(r.s37.shown).toBe(true);
    expect(r.s37.text).toContain("blocking of public access");
  });

  it("counts the days to 13 May 2027 from the day it is given — no clock inside", () => {
    expect(COMMENCEMENT.substantive).toBe("2027-05-13");
    expect(exposureFor(input()).headline.daysToDeadline).toBe(220);
    expect(exposureFor(input({ today: "2027-05-13" })).headline.daysToDeadline).toBe(0);
    expect(daysBetween("2027-05-14", "2027-05-13")).toBe(-1);
    for (const h of exposureFor(input()).heads) expect(h.deadline).toBe("2027-05-13");
  });
});

describe("caveats (§6.6, D-011)", () => {
  it("carries both, verbatim", () => {
    const r = exposureFor(input());
    expect(r.caveats.readiness).toBe(
      "This report is a DPDP readiness and assessment output based on information, responses and evidence made available during the assessment. It is not a final legal opinion, statutory certification or guarantee of compliance. Final legal interpretation, policy approval and contractual sign-off should be reviewed by authorised legal counsel.",
    );
    expect(r.caveats.readiness).toBe(DPDP_REPORT_CAVEAT);
    expect(r.caveats.exposure).toBe(
      "Exposure figures are indicative positions within statutory ceilings in the Schedule to the DPDP Act 2023, derived from your own assessment, register and remediation data under TrustStack exposure model 1.7.0. They are not a prediction of any decision of the Data Protection Board, which imposes a penalty only after an inquiry finds a breach significant and weighs the factors in section 33(2). They are not legal advice.",
    );
    expect(EXPOSURE_CAVEAT).toBe(exposureCaveat("1.7.0"));
  });
});

describe("black box and determinism", () => {
  /** Everything firing at once — the most text the model can produce. */
  const loud = (): ExposureInput => ({
    ...input({
      assessment: {
        domains: DOMAIN_CODES.map((c) => domain(c, { percent: 0.3, evidenceConfidence: 10 })),
        redFlags: RED_FLAGS.map((f) => ({ code: f.code, domainCode: f.domainCode, label: f.label })),
      },
      gaps: [
        ...DOMAIN_CODES.map((c) => assessmentGap(c, "critical")),
        ...ROPA_GAP_CODES.map((c) => ropaGap(c, "high")),
      ],
      scope: withChildren({ childrenData: "unknown", guardianData: "yes", sensitiveDocuments: "unknown", largeScale: true, locationUnknown: true }),
      sdf: { notifiedOn: "2026-09-01" },
    }),
  });

  it("no question code, pack code or trigger in the output", () => {
    const text = JSON.stringify(exposureFor(loud()));
    expect(text).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/); // G1.2, CB1.4…
    expect(text).not.toMatch(/_V\d\b/); // CORE_DPDP_V1…
    expect(text).not.toContain("trigger:");
    expect(text.toLowerCase()).not.toMatch(/\bcompliant\b/);
  });

  it("the same input always gives the same output", () => {
    expect(exposureFor(loud())).toEqual(exposureFor(loud()));
  });

  it("refuses a malformed input rather than guessing", () => {
    expect(() => exposureFor(input({ today: "2026-13-01" }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ basis: "none" }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ basis: "finalised", assessment: null }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ sdf: { notifiedOn: "yesterday" } }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ gaps: [ropaGap("made_up" as RopaGapCode, "high")] }))).toThrow(ExposureInputError);
  });

  it("strongestTriState: yes beats unknown beats no", () => {
    expect(strongestTriState([])).toBe("no");
    expect(strongestTriState(["no", "unknown"])).toBe("unknown");
    expect(strongestTriState(["unknown", "yes", "no"])).toBe("yes");
  });
});

// ---------------------------------------------------------------------------
// 1.1.0 — the breach register (SLICE_10 §6, Stage 1)
// ---------------------------------------------------------------------------

/** Became aware 1 Oct 2026, 10:00 IST; the Board report and the intimations were made in time. NOW is 5 Oct 2026, 12:00 IST. */
function incident(over: Partial<ExposureBreachInput> = {}): ExposureBreachInput {
  return {
    status: "open",
    awareAt: "2026-10-01T04:30:00.000Z",
    boardReportDueAt: "2026-10-04T04:30:00.000Z",
    boardReportAt: "2026-10-03T10:00:00.000Z",
    principalsIntimatedAt: "2026-10-02T10:00:00.000Z",
    ...over,
  };
}

describe("1.1.0: breach facts feed head 2 (s.8(6), Rule 7)", () => {
  it("every module row is classified, cites its provision, and reads one head", () => {
    // A fact may be read on more than one head (1.4.0), one row per head.
    expect([...new Set(MODULE_INPUTS.map((m) => m.code))]).toEqual([...MODULE_INPUT_CODES]);
    expect(new Set(MODULE_INPUTS.map((m) => `${m.code}:${m.head}`)).size).toBe(MODULE_INPUTS.length);
    for (const m of MODULE_INPUTS.filter((x) => x.register === "Breach register")) {
      expect(m.provision).toMatch(/^s\.8\(6\), Rule 7/);
      expect(["exposed", "not_mitigated", "assessed"]).toContain(m.effect);
      expect(m.head).toBe("H2");
      expect(m.reasonMany).toContain("{n}");
    }
    const h2 = head(exposureFor(input()), "H2");
    expect(h2.evidencedBy.moduleInputs.map((m) => m.code)).toEqual(["breach_board_overdue", "breach_principals_pending", "breach_recorded"]);
    expect(head(exposureFor(input()), "H1").evidencedBy.moduleInputs.map((m) => m.code)).not.toContain("breach_board_overdue");
  });

  it("a Board report past its due time and not recorded as made → Exposed, with the reason in words", () => {
    const overdue = incident({ boardReportAt: null });
    const h2 = head(exposureFor(input({ breaches: [overdue] })), "H2");
    expect(h2.status).toBe("exposed");
    expect(h2.reasons.map((r) => r.text)).toContain(
      "1 personal data breach: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b)).",
    );
    const two = head(exposureFor(input({ breaches: [overdue, overdue] })), "H2");
    expect(two.reasons.map((r) => r.text)).toContain(
      "2 personal data breaches: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b)).",
    );
    // Head 2 only.
    expect(head(exposureFor(input({ breaches: [overdue] })), "H1").status).toBe("mitigated");
  });

  it("exactly 72 hours is in time; the instant after is overdue (boundary)", () => {
    const pending = incident({ boardReportAt: null, boardReportDueAt: "2026-10-05T06:30:00.000Z" });
    expect(head(exposureFor(input({ breaches: [pending], now: "2026-10-05T06:30:00.000Z" })), "H2").status).not.toBe("exposed");
    expect(head(exposureFor(input({ breaches: [pending], now: "2026-10-05T06:30:00.001Z" })), "H2").status).toBe("exposed");
  });

  it("the Board's extension moves the due time — the model reads the derived due time only", () => {
    const extended = incident({ boardReportAt: null, boardReportDueAt: "2026-10-20T00:00:00.000Z" });
    expect(moduleInputCounts(input({ breaches: [extended] })).breach_board_overdue).toBe(0);
  });

  it("an overdue report sets Exposed even with no assessment — it is direct evidence, not silence", () => {
    const none = input({ basis: "none", assessment: null, breaches: [incident({ boardReportAt: null })] });
    expect(head(exposureFor(none), "H2").status).toBe("exposed");
    expect(head(exposureFor(input({ basis: "none", assessment: null })), "H2").status).toBe("not_yet_assessed");
  });

  it("affected Data Principals not yet intimated cap head 2 at Partially mitigated — a cap, not a status", () => {
    const untold = incident({ principalsIntimatedAt: null });
    const h2 = head(exposureFor(input({ breaches: [untold] })), "H2");
    expect(h2.status).toBe("partially_mitigated");
    expect(h2.reasons.map((r) => r.text)).toContain(
      "1 personal data breach: affected Data Principals are not recorded as intimated (Rule 7(1)).",
    );
    // 1.6.0 (D-098): with no assessment, the recorded breach still assesses head 2 — Partially mitigated, never Mitigated…
    const unassessed = input({ basis: "none", assessment: null, breaches: [untold] });
    expect(head(exposureFor(unassessed), "H2").status).toBe("partially_mitigated");
    // …and never lowers one that is Exposed.
    const weak = withDomains({ BREACH: { percent: 0.2 } }, { breaches: [untold] });
    expect(head(exposureFor(weak), "H2").status).toBe("exposed");
  });

  it("a breach dismissed as not a personal data breach counts for nothing", () => {
    const dismissed = incident({ status: "dismissed", boardReportAt: null, principalsIntimatedAt: null });
    const result = exposureFor(input({ breaches: [dismissed] }));
    expect(head(result, "H2").status).toBe("mitigated");
    expect(head(result, "H2").position).toBeNull();
    expect(recentBreachCount(input({ breaches: [dismissed] }))).toBe(0);
  });

  it("closed and properly intimated breaches leave head 2 Mitigated (the model judges the facts, not the count)", () => {
    expect(head(exposureFor(input({ breaches: [incident({ status: "closed" })] })), "H2").status).toBe("mitigated");
  });
});

describe("1.6.0: a recorded breach assesses head 2 (Aniket's change, D-098)", () => {
  const noAssessment = (breaches: ExposureBreachInput[]) => head(exposureFor(input({ basis: "none", assessment: null, breaches })), "H2");

  it("a breach recorded and handled, with nothing else known: Partially mitigated, saying why", () => {
    const h2 = noAssessment([incident({ status: "closed" })]);
    expect(h2.status).toBe("partially_mitigated");
    expect(h2.reasons.map((r) => r.text)).toContain(
      "1 personal data breach is recorded in the breach register (s.8(6), Rule 7), so this head is assessed from it.",
    );
    expect(h2.reasons.map((r) => r.text).join(" ")).not.toContain("No assessment has been started");
  });

  it("a breach dismissed as not a personal data breach assesses nothing", () => {
    expect(noAssessment([incident({ status: "dismissed", boardReportAt: null, principalsIntimatedAt: null })]).status).toBe("not_yet_assessed");
  });

  it("it sets no status of its own: an overdue Board report is still Exposed, and a handled breach never bars Mitigated", () => {
    expect(noAssessment([incident({ boardReportAt: null, boardReportDueAt: "2026-01-01T00:00:00.000Z" })]).status).toBe("exposed");
    expect(head(exposureFor(input({ breaches: [incident({ status: "closed" })] })), "H2").status).toBe("mitigated");
  });

  it("it reads head 2 only", () => {
    const r = exposureFor(input({ basis: "none", assessment: null, breaches: [incident({ status: "closed" })] }));
    for (const code of ["H1", "H7"] as const) expect(head(r, code).status).toBe("not_yet_assessed");
  });
});

describe("1.1.0: s.33(2)(c) repetition, from the breach register", () => {
  const atStake = (breaches: ExposureBreachInput[]) =>
    exposureFor(withDomains({ BREACH: { percent: 0.5 } }, { breaches })); // H2 Partially mitigated → has a position

  it("one breach in the last 24 months +1, two or more +2 — head 2 only", () => {
    const zero = head(atStake([]), "H2").position!;
    expect(zero.factors.map((f) => f.code)).not.toContain("repetition");
    const one = head(atStake([incident()]), "H2").position!;
    expect(one.factors.find((f) => f.code === "repetition")).toEqual({
      code: "repetition",
      clause: "(c)",
      points: 1,
      text: "1 personal data breach recorded in the last 24 months.",
    });
    expect(one.points).toBe(zero.points + 1);
    const three = head(atStake([incident(), incident(), incident()]), "H2").position!;
    expect(three.factors.find((f) => f.code === "repetition")).toMatchObject({ points: 2, text: "3 personal data breaches recorded in the last 24 months." });
    // Another head at stake never reads it.
    const h1 = head(exposureFor(withDomains({ SECURITY: { percent: 0.5 } }, { breaches: [incident(), incident()] })), "H1").position!;
    expect(h1.factors.map((f) => f.code)).not.toContain("repetition");
  });

  it("the window is 24 calendar months ending today, both ends included, dated in India", () => {
    expect(REPETITION_WINDOW_MONTHS).toBe(24);
    // TODAY is 2026-10-05: the window opens on 2024-10-05 (IST).
    const on = (instant: string) => recentBreachCount(input({ breaches: [incident({ awareAt: instant })] }));
    expect(on("2024-10-04T18:30:00.000Z")).toBe(1); // 5 Oct 2024, 00:00 IST
    expect(on("2024-10-04T18:29:59.999Z")).toBe(0); // 4 Oct 2024, 23:59 IST
    expect(on("2026-10-05T18:29:59.999Z")).toBe(1); // today, 23:59 IST
    expect(on("2026-10-05T18:30:00.000Z")).toBe(0); // tomorrow in India
  });
});

describe("1.1.0 refuses malformed breach facts", () => {
  it("now and every breach time are instants; the status is known", () => {
    expect(() => exposureFor(input({ now: "2026-10-05" }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ breaches: [incident({ awareAt: "2026-10-01" })] }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ breaches: [incident({ status: "lost" as ExposureBreachInput["status"] })] }))).toThrow(ExposureInputError);
  });
});

// ---------------------------------------------------------------------------
// 1.2.0 — the rights and grievance register (SLICE_10 §6, Stage 2)
// ---------------------------------------------------------------------------

/** TODAY is 5 Oct 2026. */
function request(over: Partial<ExposureRightsInput> = {}): ExposureRightsInput {
  return { kind: "access", status: "open", receivedOn: "2026-09-20", ...over };
}

describe("1.2.0: rights requests and grievances feed head 7 (s.11–14, Rule 14(3))", () => {
  it("two rows on head 7: the ninety days set Exposed; the 30-day target is a reason, never a status", () => {
    const rows = MODULE_INPUTS.filter((m) => m.register === "Rights and grievance register");
    expect(rows.map((m) => [m.code, m.head, m.effect])).toEqual([
      ["rights_ceiling_overdue", "H7", "exposed"],
      ["rights_target_overdue", "H7", "reason"],
    ]);
    for (const m of rows) {
      expect(m.provision).toContain("Rule 14(3)");
      expect(m.reasonMany).toContain("{n}");
    }
    // The target row says it is TrustStack's, everywhere it speaks (pitfall 1).
    const target = rows[1]!;
    for (const text of [target.provision, target.label, target.reasonOne, target.reasonMany]) expect(text).toMatch(/TrustStack/);
    expect(target.reasonOne).toContain("not a statutory period");
    expect(head(exposureFor(input()), "H7").evidencedBy.moduleInputs.map((m) => m.code).slice(0, 2)).toEqual(["rights_ceiling_overdue", "rights_target_overdue"]);
    expect(head(exposureFor(input()), "H2").evidencedBy.moduleInputs.map((m) => m.code)).not.toContain("rights_ceiling_overdue");
  });

  it("open past ninety days → head 7 Exposed, with the reason in words; head 7 only", () => {
    const late = request({ receivedOn: "2026-06-01" }); // 126 days
    const h7 = head(exposureFor(input({ rights: [late] })), "H7");
    expect(h7.status).toBe("exposed");
    expect(h7.reasons.map((r) => r.text)).toContain("1 rights request or grievance has been open for more than ninety days since it was received (Rule 14(3)).");
    const two = head(exposureFor(input({ rights: [late, request({ kind: "grievance", receivedOn: "2026-05-01" })] })), "H7");
    expect(two.reasons.map((r) => r.text)).toContain("2 rights requests or grievances have been open for more than ninety days since they were received (Rule 14(3)).");
    expect(head(exposureFor(input({ rights: [late] })), "H2").status).toBe("mitigated");
  });

  it("day 90 is in time; day 91 is overdue (boundary, from the date of receipt)", () => {
    // TODAY 2026-10-05 − 90 days = 2026-07-07.
    expect(head(exposureFor(input({ rights: [request({ receivedOn: "2026-07-07" })] })), "H7").status).not.toBe("exposed");
    expect(head(exposureFor(input({ rights: [request({ receivedOn: "2026-07-06" })] })), "H7").status).toBe("exposed");
    expect(moduleInputCounts(input({ rights: [request({ receivedOn: "2026-07-07" })] })).rights_ceiling_overdue).toBe(0);
    expect(moduleInputCounts(input({ rights: [request({ receivedOn: "2026-07-06" })] })).rights_ceiling_overdue).toBe(1);
  });

  it("past the 30-day target but inside ninety: a reason, the status untouched (day 30 is on target)", () => {
    // TODAY − 30 = 2026-09-05.
    const onTarget = moduleInputCounts(input({ rights: [request({ receivedOn: "2026-09-05" })] }));
    expect(onTarget.rights_target_overdue).toBe(0);
    const past = input({ rights: [request({ receivedOn: "2026-09-04" })] });
    expect(moduleInputCounts(past).rights_target_overdue).toBe(1);
    // Said, and nothing more: a Mitigated head stays Mitigated, with the target among its reasons.
    const h7 = head(exposureFor(past), "H7");
    expect(h7.status).toBe("mitigated");
    expect(h7.reasons.map((r) => r.text)).toContain(
      "1 rights request or grievance is open past TrustStack's 30-day response target (a target, not a statutory period).",
    );
    expect(h7.position).toBeNull();
    // A Partially mitigated head likewise: the target is among its reasons and moves nothing.
    const partial = withDomains({ RIGHTS: { percent: 0.5 } }, { rights: [request({ receivedOn: "2026-09-04" })] });
    const p7 = head(exposureFor(partial), "H7");
    expect(p7.status).toBe("partially_mitigated");
    expect(p7.reasons.map((r) => r.text)).toContain(
      "1 rights request or grievance is open past TrustStack's 30-day response target (a target, not a statutory period).",
    );
    // It never raises a head from Not yet assessed.
    expect(head(exposureFor(input({ basis: "none", assessment: null, rights: [request({ receivedOn: "2026-09-04" })] })), "H7").status).toBe(
      "not_yet_assessed",
    );
    // Overdue past ninety is not ALSO past the target: each request counts once.
    expect(moduleInputCounts(input({ rights: [request({ receivedOn: "2026-06-01" })] })).rights_target_overdue).toBe(0);
  });

  it("an overdue request sets Exposed even with no assessment — direct evidence, not silence", () => {
    expect(head(exposureFor(input({ basis: "none", assessment: null, rights: [request({ receivedOn: "2026-06-01" })] })), "H7").status).toBe("exposed");
  });

  it("responded, withdrawn and void requests count for nothing, however old", () => {
    for (const status of ["responded", "withdrawn", "void"] as const) {
      const counts = moduleInputCounts(input({ rights: [request({ status, receivedOn: "2026-01-01" })] }));
      expect(counts.rights_ceiling_overdue + counts.rights_target_overdue, status).toBe(0);
    }
  });

  it("grievances and requests count alike — every request runs through the grievance system", () => {
    for (const kind of ["access", "erasure", "nomination", "grievance"] as const) {
      expect(moduleInputCounts(input({ rights: [request({ kind, receivedOn: "2026-06-01" })] })).rights_ceiling_overdue, kind).toBe(1);
    }
  });

  it("a request's remediation evidences head 7 directly, never as an enabling control", () => {
    expect(directHeadsOf({ source: "rights" })).toEqual(["H7"]);
  });

  it("refuses malformed rights facts", () => {
    expect(() => exposureFor(input({ rights: [request({ receivedOn: "5 Oct 2026" })] }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ rights: [request({ status: "lost" as ExposureRightsInput["status"] })] }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ rights: [request({ kind: "restrict" as ExposureRightsInput["kind"] })] }))).toThrow(ExposureInputError);
  });
});

// ---------------------------------------------------------------------------
// 1.3.0 — the consent register (SLICE_10 §6, §7a, Stage 3b)
// ---------------------------------------------------------------------------

function consent(over: Partial<ExposureConsentInput> = {}): ExposureConsentInput {
  return { principalKind: "child", action: "given", verificationMethod: null, ...over };
}

describe("1.3.0: consents given on behalf of a child or a ward feed head 3 (s.9(1), Rules 10–11)", () => {
  it("one row on head 3, Exposed, citing s.9(1) and Rules 10–11", () => {
    const rows = MODULE_INPUTS.filter((m) => m.register === "Consent register");
    expect(rows.map((m) => [m.code, m.head, m.effect, m.provision])).toEqual([
      ["child_consent_unverified", "H3", "exposed", "s.9(1), Rules 10–11"],
    ]);
    expect(rows[0]!.reasonMany).toContain("{n}");
    expect(MODULE_INPUT_CODES).toContain("child_consent_unverified");
    expect(head(exposureFor(input({ scope: withChildren() })), "H3").evidencedBy.moduleInputs.map((m) => m.code)).toEqual(["child_consent_unverified"]);
  });

  it("an unverified child's consent, still given → head 3 Exposed, with the reason in words", () => {
    const h3 = head(exposureFor(input({ scope: withChildren(), consents: [consent()] })), "H3");
    expect(h3.status).toBe("exposed");
    expect(h3.reasons.map((r) => r.text)).toContain(
      "1 consent given on behalf of a child or a person with disability has no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).",
    );
    const two = head(exposureFor(input({ scope: withChildren(), consents: [consent(), consent({ principalKind: "guardian_ward" })] })), "H3");
    expect(two.reasons.map((r) => r.text)).toContain(
      "2 consents given on behalf of a child or a person with disability have no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).",
    );
    // Head 3 only.
    expect(head(exposureFor(input({ scope: withChildren(), consents: [consent()] })), "H7").status).toBe("mitigated");
  });

  it("a recorded verification or Rule 12 exemption, a refusal or a withdrawal counts nothing", () => {
    for (const c of [
      consent({ verificationMethod: "rule_10_1_a" }),
      consent({ verificationMethod: "rule_10_1_b_ii" }),
      consent({ verificationMethod: "rule_12_exempt" }),
      consent({ principalKind: "guardian_ward", verificationMethod: "rule_11_court" }),
      consent({ action: "refused" }),
      consent({ action: "withdrawn" }),
      consent({ principalKind: "self" }),
    ]) {
      expect(moduleInputCounts(input({ consents: [c] })).child_consent_unverified, JSON.stringify(c)).toBe(0);
    }
    expect(head(exposureFor(input({ scope: withChildren(), consents: [consent({ verificationMethod: "rule_10_1_a" })] })), "H3").status).toBe("mitigated");
  });

  it("a consent still given for a child makes head 3 apply, and children's data a position factor, whatever the scope said", () => {
    expect(head(exposureFor(input()), "H3").applies).toBe(false);
    const verified = exposureFor(input({ consents: [consent({ verificationMethod: "rule_10_1_b_i" })] }));
    expect(head(verified, "H3").applies).toBe(true);
    expect(head(verified, "H3").reasons[0]!.text).toBe("Applies because children's data is processed.");
    const ward = exposureFor(input({ consents: [consent({ principalKind: "guardian_ward", verificationMethod: "rule_11_local_committee" })] }));
    expect(head(ward, "H3").reasons[0]!.text).toBe("Applies because data of persons with disability who have a lawful guardian is processed.");
    // A withdrawn or refused consent says nothing about today's processing.
    expect(head(exposureFor(input({ consents: [consent({ action: "withdrawn" })] })), "H3").applies).toBe(false);
    expect(childrenAndGuardianFacts(input({ consents: [consent({ action: "refused" })] }))).toEqual({ children: "no", guardian: "no" });
    // Unverified with no other evidence: exposed, and the children's-data factor fires on head 3.
    const exposed = head(exposureFor(input({ consents: [consent()] })), "H3");
    expect(exposed.status).toBe("exposed");
    expect(exposed.position!.factors.map((f) => f.code)).toContain("children_data");
  });

  it("sets Exposed even with no assessment — direct evidence, not silence", () => {
    expect(head(exposureFor(input({ basis: "none", assessment: null, consents: [consent()] })), "H3").status).toBe("exposed");
  });

  it("refuses malformed consent facts", () => {
    expect(() => exposureFor(input({ consents: [consent({ principalKind: "adult" as ExposureConsentInput["principalKind"] })] }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ consents: [consent({ action: "maybe" as ExposureConsentInput["action"] })] }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ consents: [consent({ verificationMethod: "aadhaar" as ExposureConsentInput["verificationMethod"] })] }))).toThrow(
      ExposureInputError,
    );
  });
});

describe("1.4.0: the processor register feeds heads 1 and 7 (s.8(2), s.8(5), Rule 6(1)(f))", () => {
  const vendor = (over: Partial<ExposureVendorInput> = {}): ExposureVendorInput => ({
    role: "data_processor",
    contractExists: "yes",
    dpdpClauses: "yes",
    assessmentReviewBy: null,
    ...over,
  });

  it("four rows: the contract gap bars Mitigated on heads 1 and 7; an out-of-date assessment is a reason on both", () => {
    const rows = MODULE_INPUTS.filter((m) => m.register === "Processor register");
    expect(rows.map((m) => [m.code, m.head, m.effect, m.provision])).toEqual([
      ["vendor_contract_missing", "H1", "not_mitigated", "s.8(5), Rule 6(1)(f)"],
      ["vendor_contract_missing", "H7", "not_mitigated", "s.8(2)"],
      ["vendor_assessment_out_of_date", "H1", "reason", "Twelve months is a TrustStack default; the Act sets no interval"],
      ["vendor_assessment_out_of_date", "H7", "reason", "Twelve months is a TrustStack default; the Act sets no interval"],
    ]);
    for (const m of rows) expect(m.reasonMany).toContain("{n}");
    // The review default is TrustStack's, everywhere it speaks (pitfall 1).
    for (const m of rows.filter((x) => x.effect === "reason")) {
      for (const text of [m.provision, m.reasonOne, m.reasonMany]) expect(text).toMatch(/TrustStack/);
    }
    expect(head(exposureFor(input()), "H1").evidencedBy.moduleInputs.map((m) => m.code)).toEqual(["vendor_contract_missing", "vendor_assessment_out_of_date"]);
    expect(head(exposureFor(input()), "H7").evidencedBy.moduleInputs.map((m) => m.code)).toEqual([
      "rights_ceiling_overdue",
      "rights_target_overdue",
      "vendor_contract_missing",
      "vendor_assessment_out_of_date",
      "retention_overdue",
      "retention_end_unrecorded",
    ]);
  });

  it("a processor with no contract, or no DPDP clauses → heads 1 and 7 Partially mitigated, never Exposed", () => {
    const r = exposureFor(input({ vendors: [vendor({ dpdpClauses: "no" })] }));
    for (const h of ["H1", "H7"] as const) expect(head(r, h).status).toBe("partially_mitigated");
    expect(head(r, "H1").reasons.map((x) => x.text)).toContain(
      "1 processor has no contract with DPDP clauses recorded — the contract is where reasonable security safeguards are provided for (Rule 6(1)(f)).",
    );
    expect(head(r, "H7").reasons.map((x) => x.text)).toContain(
      "1 processor has no contract with DPDP clauses recorded — a processor is engaged only under a valid contract (s.8(2)).",
    );
    const two = exposureFor(input({ vendors: [vendor({ contractExists: "unknown" }), vendor({ role: "unknown", contractExists: "no" })] }));
    expect(head(two, "H7").reasons.map((x) => x.text)).toContain(
      "2 processors have no contract with DPDP clauses recorded — a processor is engaged only under a valid contract (s.8(2)).",
    );
    expect(head(two, "H2").status).toBe("mitigated");
  });

  it("never counts an independent fiduciary, nor a processor whose contract and clauses are recorded", () => {
    const r = exposureFor(input({ vendors: [vendor({ role: "independent", contractExists: "no" }), vendor()] }));
    expect(moduleInputCounts(input({ vendors: [vendor({ role: "independent", contractExists: "no" }), vendor()] })).vendor_contract_missing).toBe(0);
    expect(head(r, "H1").status).toBe("mitigated");
    expect(head(r, "H7").status).toBe("mitigated");
  });

  it("does not set Exposed, nor make a head assessed, on its own", () => {
    const none = exposureFor(input({ basis: "none", assessment: null, vendors: [vendor({ contractExists: "no" })] }));
    expect(head(none, "H1").status).toBe("not_yet_assessed");
    expect(head(none, "H7").status).toBe("not_yet_assessed");
  });

  it("an accepted assessment past its review-by date is a reason, never a status — strictly after the date", () => {
    const stale = exposureFor(input({ vendors: [vendor({ assessmentReviewBy: "2026-10-04" })] }));
    expect(head(stale, "H1").status).toBe("mitigated");
    expect(head(stale, "H1").reasons.map((x) => x.text)).toContain(
      "1 processor's accepted assessment is past its review-by date (a TrustStack default, not a statutory period).",
    );
    expect(moduleInputCounts(input({ vendors: [vendor({ assessmentReviewBy: TODAY })] })).vendor_assessment_out_of_date).toBe(0);
    expect(moduleInputCounts(input({ vendors: [vendor({ role: "independent", assessmentReviewBy: "2026-01-01" })] })).vendor_assessment_out_of_date).toBe(0);
  });

  it("refuses malformed vendor facts", () => {
    expect(() => exposureFor(input({ vendors: [vendor({ role: "processor" as ExposureVendorInput["role"] })] }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ vendors: [vendor({ dpdpClauses: "maybe" as ExposureVendorInput["dpdpClauses"] })] }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ vendors: [vendor({ assessmentReviewBy: "13/10/2027" })] }))).toThrow(ExposureInputError);
  });
});


describe("1.5.0: the retention register feeds head 7; the AI risk register speaks on head 4 only (s.8(7), Rule 8(3), Rule 13(3))", () => {
  const schedule = (over: Partial<ExposureRetentionInput> = {}): ExposureRetentionInput => ({
    startsOn: "2025-06-30",
    endsOn: "2026-06-30",
    lastErasedOn: null,
    ...over,
  });
  const ai = (over: Partial<ExposureAiSystemInput> = {}): ExposureAiSystemInput => ({ status: "in_use", lastReviewedOn: null, ...over });

  it("three rows: overdue erasure sets Exposed; no end recorded is a reason (D-094.1); an unreviewed AI system is a reason on head 4", () => {
    const rows = MODULE_INPUTS.filter((m) => m.register === "Retention register" || m.register === "AI risk register");
    expect(rows.map((m) => [m.code, m.head, m.effect, m.provision])).toEqual([
      ["retention_overdue", "H7", "exposed", "s.8(7), Rule 8(3)"],
      ["retention_end_unrecorded", "H7", "reason", "s.8(7)"],
      ["ai_system_unreviewed", "H4", "reason", "Rule 13(3); twelve months is a TrustStack default"],
    ]);
    for (const m of rows) expect(m.reasonMany).toContain("{n}");
    // The review interval is TrustStack's, everywhere it speaks (pitfall 1).
    const aiRow = rows[2]!;
    for (const text of [aiRow.provision, aiRow.reasonOne, aiRow.reasonMany]) expect(text).toMatch(/TrustStack/);
    expect(directHeadsOf({ source: "retention" })).toEqual(["H7"]);
  });

  it("a schedule past its end with no erasure → head 7 Exposed, with the reason; strictly after the end date", () => {
    const h7 = head(exposureFor(input({ retention: [schedule()] })), "H7");
    expect(h7.status).toBe("exposed");
    expect(h7.reasons.map((r) => r.text)).toContain("1 retention schedule is past its end date with no erasure recorded (s.8(7)).");
    const two = head(exposureFor(input({ retention: [schedule(), schedule({ endsOn: "2026-01-01" })] })), "H7");
    expect(two.reasons.map((r) => r.text)).toContain("2 retention schedules are past their end dates with no erasure recorded (s.8(7)).");
    expect(head(exposureFor(input({ retention: [schedule({ endsOn: TODAY })] })), "H7").status).toBe("mitigated");
    expect(moduleInputCounts(input({ retention: [schedule({ endsOn: "2026-10-04" })] })).retention_overdue).toBe(1);
    expect(head(exposureFor(input({ retention: [schedule()] })), "H1").status).toBe("mitigated");
  });

  it("an erasure recorded for the current cycle clears it; one from before the cycle does not", () => {
    expect(head(exposureFor(input({ retention: [schedule({ lastErasedOn: "2026-07-10" })] })), "H7").status).toBe("mitigated");
    expect(head(exposureFor(input({ retention: [schedule({ lastErasedOn: "2025-06-01" })] })), "H7").status).toBe("exposed");
  });

  it("an overdue erasure makes a head assessed on its own, as any `exposed` row does", () => {
    expect(head(exposureFor(input({ basis: "none", assessment: null, retention: [schedule()] })), "H7").status).toBe("exposed");
  });

  it("no end recorded is a reason, never a status (D-094.1)", () => {
    const r = exposureFor(input({ retention: [schedule({ startsOn: null, endsOn: null })] }));
    expect(head(r, "H7").status).toBe("mitigated");
    expect(head(r, "H7").reasons.map((x) => x.text)).toContain(
      "1 retention schedule has no end date recorded, so its erasure cannot be shown to follow (s.8(7)).",
    );
    const none = exposureFor(input({ basis: "none", assessment: null, retention: [schedule({ startsOn: null, endsOn: null })] }));
    expect(head(none, "H7").status).toBe("not_yet_assessed");
  });

  it("an unreviewed AI system says nothing unless head 4 applies — and then is a reason, never a status", () => {
    const notSdf = exposureFor(input({ aiSystems: [ai()] }));
    expect(head(notSdf, "H4").status).toBe("not_applicable");
    expect(head(notSdf, "H4").reasons.map((x) => x.text).join(" ")).not.toContain("AI system");
    const sdf = exposureFor(input({ sdf: { notifiedOn: "2026-09-01" }, aiSystems: [ai(), ai({ status: "retired" }), ai({ lastReviewedOn: "2026-09-01" })] }));
    expect(head(sdf, "H4").status).toBe("mitigated");
    expect(head(sdf, "H4").reasons.map((x) => x.text)).toContain(
      "1 AI system in use has no review recorded in the last twelve months (Rule 13(3) due diligence; the interval is a TrustStack default).",
    );
  });

  it("refuses malformed retention and AI facts", () => {
    expect(() => exposureFor(input({ retention: [schedule({ endsOn: null })] }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ retention: [schedule({ lastErasedOn: "10/07/2026" })] }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ aiSystems: [ai({ status: "paused" as ExposureAiSystemInput["status"] })] }))).toThrow(ExposureInputError);
    expect(() => exposureFor(input({ aiSystems: [ai({ lastReviewedOn: "2026-02-30" })] }))).toThrow(ExposureInputError);
  });
});
