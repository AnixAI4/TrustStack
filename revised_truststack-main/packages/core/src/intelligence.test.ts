import { describe, expect, it } from "vitest";
import { DOMAIN_CODES, type DomainCode } from "./domains.js";
import { RED_FLAGS } from "./engine.js";
import {
  exposureFor,
  type ExposureDomainInput,
  type ExposureGapInput,
  type ExposureInput,
  type ExposureRegisterActionInput,
  type ExposureStatus,
} from "./exposure.js";
import { addDays } from "./forecast.js";
import {
  closeActions,
  dayLabel,
  delta,
  exposureChanges,
  exposureForecast,
  leverage,
  LEVERAGE_SEVERITY_WEIGHT,
  outstandingWork,
  registerActionIsOutstanding,
  slippage,
  whatIf,
} from "./intelligence.js";
import type { RopaGapCode } from "./ropa.js";

const TODAY = "2026-10-06";
/** Noon in India on TODAY — the instant a breach clock is read at. */
const NOW = "2026-10-06T06:30:00.000Z";
const OWNER = "11111111-1111-4111-8111-111111111111";

function domain(code: DomainCode, over: Partial<ExposureDomainInput> = {}): ExposureDomainInput {
  return { code, state: "scored", weight: 5, questionCount: 5, outstandingCount: 0, percent: 0.8, evidenceConfidence: 80, ...over };
}

let nextId = 0;
const action = (over: Partial<ExposureGapInput["actions"][number]> = {}) => ({
  id: `00000000-0000-4000-8000-${String(++nextId).padStart(12, "0")}`,
  ownerUserId: null,
  dueDate: null,
  status: "open" as const,
  ...over,
});

const aGap = (domainCode: DomainCode, severity: ExposureGapInput["severity"], actions = [action()]): ExposureGapInput => ({
  source: "assessment",
  domainCode,
  severity,
  state: "open",
  actions,
});
const rGap = (gapCode: RopaGapCode, severity: ExposureGapInput["severity"], actions = [action()]): ExposureGapInput => ({
  source: "ropa",
  gapCode,
  severity,
  state: "open",
  actions,
});

function input(over: Partial<ExposureInput> = {}, domains: Partial<Record<DomainCode, Partial<ExposureDomainInput>>> = {}): ExposureInput {
  return {
    today: TODAY,
    now: NOW,
    basis: "finalised",
    assessment: { domains: DOMAIN_CODES.map((c) => domain(c, domains[c] ?? {})), redFlags: [] },
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

const RANK: Record<ExposureStatus, number> = { not_applicable: 0, mitigated: 1, partially_mitigated: 2, not_yet_assessed: 2, exposed: 3 };

describe("outstanding work — what the forecast projects", () => {
  it("counts the unclosed actions of outstanding gaps; a gap with no action is one unit", () => {
    const gaps = [
      aGap("SECURITY", "critical", [action(), action({ status: "closed" }), action({ status: "blocked" })]),
      rGap("notice_missing", "high", []),
      rGap("consent_missing", "medium"),
      { ...aGap("NOTICE", "low"), state: "superseded" as const },
      aGap("RIGHTS", "high", [action({ status: "closed" })]), // remediated, not owed
    ];
    expect(outstandingWork(gaps)).toEqual({ criticalHigh: 3, all: 4 });
  });

  it("1.7.0 (Q1): an action on a breach, a request or a retention schedule is one unit while its record stands and it is not closed", () => {
    const reg = (source: "breach" | "rights" | "retention", severity: ExposureGapInput["severity"], over: Partial<ExposureRegisterActionInput> = {}): ExposureRegisterActionInput => ({
      ...action(),
      source,
      severity,
      state: "open",
      ...over,
    });
    const registerActions = [
      reg("breach", "critical"),
      reg("rights", "high"), // a grievance
      reg("retention", "medium"),
      reg("breach", "high", { state: "superseded" }), // dismissed — not work owed
      reg("rights", "medium", { status: "closed" }),
    ];
    expect(outstandingWork([], registerActions)).toEqual({ criticalHigh: 2, all: 3 });
    expect(outstandingWork([aGap("SECURITY", "critical", [])], registerActions)).toEqual({ criticalHigh: 3, all: 4 });
    expect(registerActionIsOutstanding({ state: "open", status: "blocked" })).toBe(true);
    // The forecast reads them; the model's heads and its leverage do not.
    const withRegister = input({ gaps: [aGap("SECURITY", "critical")], registerActions }, { SECURITY: { percent: 0.3 } });
    const without = { ...withRegister, registerActions: [] };
    expect(exposureForecast(withRegister, []).all.outstanding).toBe(4);
    expect(exposureForecast(withRegister, []).criticalHigh.outstanding).toBe(3);
    expect(exposureForecast(without, []).all.outstanding).toBe(1);
    expect(exposureFor(withRegister).heads).toEqual(exposureFor(without).heads);
    expect(exposureFor(withRegister).headline).toEqual(exposureFor(without).headline);
    expect(leverage(withRegister, exposureFor(withRegister))).toEqual(leverage(without, exposureFor(without)));
    expect(leverage(withRegister, exposureFor(withRegister)).map((e) => e.actionId)).not.toContain(registerActions[0]!.id);
  });

  it("the forecast reads it, and the organisation's closures", () => {
    const f = exposureForecast(input({ gaps: [aGap("SECURITY", "critical")] }), [TODAY, addDays(TODAY, -7)]);
    expect(f.all.outstanding).toBe(1);
    expect(f.notEnoughHistory).toBe(false);
  });
});

describe("leverage — the actions that retire the most exposure", () => {
  it("weights each open action by the ceilings of its heads at stake × its severity, highest first", () => {
    const security = aGap("SECURITY", "critical"); // H1 ₹250 cr × 4
    const notice = rGap("notice_missing", "high"); // H7 ₹50 cr × 3
    const contract = rGap("processor_contract_missing", "high"); // H1 + H7 (300) × 3
    const i = input({ gaps: [notice, security, contract] }, { SECURITY: { percent: 0.3 }, NOTICE: { percent: 0.3 } });
    const ranked = leverage(i, exposureFor(i));
    expect(ranked.map((r) => r.weight)).toEqual([1000, 900, 150]);
    expect(ranked[0]!.actionId).toBe(security.actions[0]!.id);
    expect(ranked[1]!.heads).toEqual(["H1", "H7"]);
    expect(LEVERAGE_SEVERITY_WEIGHT.critical).toBe(4);
  });

  it("an action whose heads are all mitigated, not applicable, or only enabling retires nothing and is not listed", () => {
    const child = rGap("child_tracking", "critical"); // H3 does not apply here
    const housekeeping = rGap("no_owner", "high"); // enabling only
    const closedGap = aGap("SECURITY", "critical", [action({ status: "closed" })]);
    const i = input({ gaps: [child, housekeeping, closedGap] });
    expect(leverage(i, exposureFor(i))).toEqual([]);
  });

  it("is capped (top 10 by default), stable on ties by due date then id", () => {
    const gaps = Array.from({ length: 12 }, (_, n) => aGap("SECURITY", "high", [action({ dueDate: n % 2 ? "2026-12-01" : null })]));
    const i = input({ gaps }, { SECURITY: { percent: 0.3 } });
    const ranked = leverage(i, exposureFor(i));
    expect(ranked).toHaveLength(10);
    expect(ranked.slice(0, 6).every((r) => r.dueDate === "2026-12-01")).toBe(true);
    expect(leverage(i, exposureFor(i), 3)).toHaveLength(3);
  });

  it("says what closing each action ALONE would change", () => {
    const only = aGap("SECURITY", "critical");
    const i = input({ gaps: [only] });
    const [top] = leverage(i, exposureFor(i));
    expect(top!.alone.heads).toEqual([
      expect.objectContaining({ code: "H1", fromStatus: "exposed", toStatus: "mitigated" }),
    ]);
    expect(top!.alone.ceilingsAtStakeCrore).toEqual({ from: 250, to: 0 });
  });
});

describe("closing the top leverage action never raises exposure", () => {
  // A spread of starting points: every head status, both parents, red flags.
  const scenarios: ExposureInput[] = [
    input({ gaps: [aGap("SECURITY", "critical"), rGap("processor_contract_missing", "high"), aGap("BREACH", "medium")] }),
    input({ gaps: [rGap("safeguards_missing", "high"), rGap("notice_missing", "high", [action(), action()])] }, { SECURITY: { percent: 0.5 } }),
    input(
      {
        scope: { childrenData: "yes", guardianData: "unknown", sensitiveDocuments: "yes", largeScale: true, locationUnknown: true },
        gaps: [rGap("child_consent_missing", "critical"), aGap("CHILD", "high"), aGap("SECURITY", "low", [action({ ownerUserId: OWNER })])],
      },
      { CHILD: { percent: 0.2, evidenceConfidence: 20 } },
    ),
    input({
      assessment: {
        domains: DOMAIN_CODES.map((c) => domain(c, c === "BREACH" ? { percent: 0.35 } : {})),
        redFlags: RED_FLAGS.filter((f) => f.domainCode === "SECURITY").map((f) => ({ code: f.code, domainCode: f.domainCode, label: f.label })),
      },
      gaps: [aGap("SECURITY", "high"), aGap("BREACH", "critical"), rGap("rule6_unconfirmed", "medium")],
    }),
  ];

  scenarios.forEach((scenario, n) => {
    it(`scenario ${n + 1}: ceilings at stake never rise and no head's status gets worse`, () => {
      const before = exposureFor(scenario);
      for (const entry of leverage(scenario, before)) {
        const after = exposureFor(closeActions(scenario, [entry.actionId]).input);
        expect(after.headline.ceilingsAtStakeCrore).toBeLessThanOrEqual(before.headline.ceilingsAtStakeCrore);
        for (const h of after.heads) {
          const b = before.heads.find((x) => x.code === h.code)!;
          expect(RANK[h.status], `${h.code} ${b.status} → ${h.status}`).toBeLessThanOrEqual(RANK[b.status]);
        }
      }
    });
  });
});

describe("what-if — read-only, by construction", () => {
  it("never mutates its input, and reports ids it does not know", () => {
    const gap = aGap("SECURITY", "critical");
    const i = input({ gaps: [gap] });
    const frozen = JSON.stringify(i);
    const result = whatIf(i, [gap.actions[0]!.id!, "not-an-action"], [TODAY, addDays(TODAY, -7)]);
    expect(JSON.stringify(i)).toBe(frozen);
    expect(result.actionIds).toEqual([gap.actions[0]!.id]);
    expect(result.unknownActionIds).toEqual(["not-an-action"]);
  });

  it("moves the heads and the forecast together", () => {
    const a = aGap("SECURITY", "critical");
    const b = rGap("notice_missing", "high");
    const i = input({ gaps: [a, b] }, { NOTICE: { percent: 0.5 } });
    const result = whatIf(i, [a.actions[0]!.id!], [TODAY, addDays(TODAY, -7)]);
    expect(result.change.heads.map((h) => [h.code, h.toStatus])).toEqual([["H1", "mitigated"]]);
    expect(result.forecast.before.all.outstanding).toBe(2);
    expect(result.forecast.after.all.outstanding).toBe(1);
    expect(result.after.headline.ceilingsAtStakeCrore).toBeLessThan(result.before.headline.ceilingsAtStakeCrore);
  });

  it("an empty list changes nothing", () => {
    const i = input({ gaps: [aGap("SECURITY", "critical")] });
    const result = whatIf(i, [], []);
    expect(result.change.heads).toEqual([]);
    expect(result.after).toEqual(result.before);
  });
});

describe("slippage warnings", () => {
  it("says when there is not enough history", () => {
    const i = input({ gaps: [aGap("SECURITY", "critical")] });
    const codes = slippage(i, exposureFor(i), exposureForecast(i, [TODAY])).map((w) => w.code);
    expect(codes).toContain("not_enough_history");
  });

  it("warns when the pace misses 13 May 2027, and when the pace is below the rate needed", () => {
    const gaps = Array.from({ length: 80 }, () => aGap("SECURITY", "critical"));
    const i = input({ gaps });
    const w = slippage(i, exposureFor(i), exposureForecast(i, [TODAY, addDays(TODAY, -7)]));
    expect(w.map((x) => x.code)).toEqual(
      expect.arrayContaining(["critical_high_after_deadline", "all_work_after_deadline", "pace_below_required"]),
    );
    expect(w.find((x) => x.code === "pace_below_required")!.text).toMatch(/0\.3 actions a week; .* a week are needed/);
  });

  it("counts overdue and unowned actions on heads at stake only", () => {
    const overdue = aGap("SECURITY", "critical", [action({ ownerUserId: OWNER, dueDate: addDays(TODAY, -1) })]);
    const dueToday = aGap("SECURITY", "high", [action({ ownerUserId: OWNER, dueDate: TODAY })]);
    const unowned = rGap("notice_missing", "high");
    const notAtStake = rGap("child_tracking", "critical", [action({ dueDate: addDays(TODAY, -30) })]); // H3 does not apply
    const i = input({ gaps: [overdue, dueToday, unowned, notAtStake] });
    const w = slippage(i, exposureFor(i), exposureForecast(i, []));
    expect(w.find((x) => x.code === "overdue_on_heads_at_stake")!.text).toBe("1 action is past due on penalty heads that are at stake.");
    expect(w.find((x) => x.code === "unassigned_on_heads_at_stake")!.text).toBe("1 action has no owner on penalty heads that are at stake.");
  });

  it("names dates in words, never as ISO codes", () => {
    const gaps = Array.from({ length: 80 }, () => aGap("SECURITY", "critical"));
    const i = input({ gaps });
    for (const w of slippage(i, exposureFor(i), exposureForecast(i, [TODAY, addDays(TODAY, -7)]))) {
      expect(w.text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    }
    expect(dayLabel("2027-05-18")).toBe("18 May 2027");
  });

  it("is silent when nothing is outstanding", () => {
    const i = input();
    expect(slippage(i, exposureFor(i), exposureForecast(i, []))).toEqual([]);
  });

  it("never names a code, a pack or a trigger (D-071)", () => {
    const i = input({ gaps: Array.from({ length: 30 }, () => aGap("SECURITY", "critical")) });
    for (const w of slippage(i, exposureFor(i), exposureForecast(i, [TODAY]))) {
      expect(w.text).not.toMatch(/[A-Z]\d+\.\d+|_V1|trigger:|H\d/);
    }
  });
});

describe("what changed since the last snapshot", () => {
  it("null with no snapshot", () => {
    expect(exposureChanges(null, exposureFor(input()))).toBeNull();
  });

  it("names the heads whose status or band moved, and the headline either side", () => {
    const now = exposureFor(input({ gaps: [aGap("SECURITY", "critical")] }));
    const last = {
      id: "snap",
      recordedAt: "2026-09-29T10:00:00Z",
      modelVersion: now.modelVersion,
      ceilingsAtStakeCrore: 300,
      exposedHeads: 2,
      heads: now.heads.map((h) =>
        h.code === "H7"
          ? { code: h.code, status: "partially_mitigated" as const, position: { band: "lower" as const } }
          : { code: h.code, status: h.status, position: h.position && { band: h.position.band } },
      ),
    };
    const changes = exposureChanges(last, now)!;
    expect(changes.modelChanged).toBe(false);
    expect(changes.change.heads).toEqual([expect.objectContaining({ code: "H7", fromStatus: "partially_mitigated", toStatus: "mitigated", toBand: null })]);
    expect(changes.change.ceilingsAtStakeCrore).toEqual({ from: 300, to: 250 });
  });

  it("flags a snapshot recorded under another model version", () => {
    const now = exposureFor(input());
    const last = { id: "s", recordedAt: "x", modelVersion: "0.9.0", ceilingsAtStakeCrore: 0, exposedHeads: 0, heads: [] };
    expect(exposureChanges(last, now)!.modelChanged).toBe(true);
  });

  it("delta is empty between a result and itself", () => {
    const r = exposureFor(input({ gaps: [aGap("SECURITY", "critical")] }));
    expect(delta(r, r).heads).toEqual([]);
  });
});
