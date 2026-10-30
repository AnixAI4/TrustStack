/**
 * Slice 9, Stage 2 — the exposure model lives in two places, and they must
 * never disagree (SLICE_09 pitfall 3, D-053's lesson).
 *
 * `exposureFor` (packages/core) is the live view; `app.exposure_evaluate`
 * (migration 20261009000000_exposure_snapshots) writes every STORED snapshot.
 * Both take the same `ExposureInput`. This suite generates hundreds of inputs
 * — weighted towards the 40% / 60% boundaries, floating-point noise, every
 * status path, every position factor and both parents' gaps — feeds each to
 * BOTH, and fails on any difference: status, position, band, rupee range,
 * fired factors, and every reason word for word.
 *
 * Slice 10 (1.1.0): the inputs also carry `now` and breach incidents —
 * weighted towards exactly 72 hours, the Board's extension, dismissed
 * incidents and both edges of the 24-month repetition window.
 * Slice 10 Stage 2 (1.2.0): and rights requests — weighted towards day 30,
 * day 31, day 90 and day 91 since receipt, in every status and kind.
 * Slice 10 Stage 3b (1.3.0): and consents on behalf of a child or a ward —
 * every action, verified, exempt or not, against every scope answer, so head 3
 * is made to apply by a consent alone.
 * Slice 10 Stage 4a (1.4.0): and vendors — every role and contract answer,
 * with an accepted assessment's review-by date the day before, on and after
 * `today`, or none.
 * Slice 10 Stage 5 (1.5.0): and retention schedules — no end, an end the day
 * before, on and after `today`, erased in this cycle, before it, or not; and
 * AI systems in use or retired, reviewed twelve months and a day ago, exactly
 * twelve months ago, recently, or never — head 4 applying or not.
 *
 * Slice 10.5 B4 (1.7.0): and register actions — on a breach, a request or a
 * retention schedule, every status, open or superseded — which no head reads:
 * the heads must match with them present, and the outstanding work counts them.
 *
 * The forecast is held the same way: `forecast` against
 * `app.exposure_forecast`, draw for draw, and the outstanding work against
 * `app.exposure_outstanding_work`.
 */
import {
  addDays,
  addMonths,
  BREACH_STATUSES,
  RIGHTS_KINDS,
  RIGHTS_STATUSES,
  CONSENT_ACTIONS,
  VERIFICATION_METHODS_FOR,
  DOMAIN_CODES,
  ROPA_GAP_CODES,
  RED_FLAGS,
  exposureFor,
  forecast,
  outstandingWork,
  type ExposureBreachInput,
  type ExposureRightsInput,
  type ExposureConsentInput,
  type ExposureVendorInput,
  type ExposureRetentionInput,
  type ExposureAiSystemInput,
  type ExposureGapInput,
  type ExposureInput,
  type ExposureRegisterActionInput,
  type GapSeverity,
  type TriState,
} from "@truststack/core";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connect, inTransaction } from "./db";

let client: pg.Client;
beforeAll(async () => {
  client = await connect();
});
afterAll(async () => {
  await client?.end();
});

/** A small seeded generator, so a failure is reproducible from its index. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  const next = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)]!;
  const chance = (p: number) => next() < p;
  return { next, pick, chance, int: (n: number) => Math.floor(next() * n) };
}

const TRI: TriState[] = ["yes", "no", "unknown"];
// Boundaries, noise and the ordinary: 0.6000000000000001 is what doubles produce for 3/5 × w / w.
const PERCENTS = [0, 0.1, 0.2, 0.39, 0.3999999999, 0.4, 0.4000000000000001, 0.45, 0.145, 0.5, 0.59, 0.5999999999999999, 0.6, 0.6000000000000001, 0.725, 0.8, 1];
const CONFIDENCES = [0, 20, 40, 59, 59.5, 59.99999999999999, 60, 60.00000000000001, 66.66666666666667, 80, 100];
const SEVERITIES: GapSeverity[] = ["critical", "high", "medium", "low"];
const USERS = ["7b0c7d38-0000-4000-8000-000000000001", "7b0c7d38-0000-4000-8000-000000000002"];

const HOUR = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();
/** Midnight in India on `day`, as an instant. */
const indiaMidnight = (day: string) => Date.parse(`${day}T00:00:00+05:30`);

function breaches(r: ReturnType<typeof rng>, today: string): { now: string; breaches: ExposureBreachInput[] } {
  // Noon in India on `today`, give or take a few hours — `now` and `today` agree, as the readers make them.
  const now = indiaMidnight(today) + (12 + r.int(11) - 5) * HOUR + r.int(60) * 60_000;
  const windowStart = indiaMidnight(addMonths(today, -24));
  const out: ExposureBreachInput[] = [];
  for (let i = r.pick([0, 0, 1, 1, 2, 3, 4]); i > 0; i -= 1) {
    const awareAt = r.pick([
      now - r.int(72) * HOUR, // inside the 72 hours
      now - 72 * HOUR, // due exactly now: still in time
      now - 72 * HOUR - 1, // one millisecond past
      now - (73 + r.int(500)) * HOUR, // well past
      windowStart, // the window's first instant (00:00 IST)
      windowStart - 1, // the instant before
      indiaMidnight(today) + 24 * HOUR - 1, // today, 23:59:59.999 IST
      now - r.int(900) * 24 * HOUR, // anywhere in 2½ years
    ]);
    const extended = r.chance(0.2);
    const due = extended ? awareAt + (72 + 1 + r.int(200)) * HOUR : awareAt + 72 * HOUR;
    const reported = r.chance(0.5);
    out.push({
      status: r.pick(BREACH_STATUSES),
      awareAt: iso(awareAt),
      boardReportDueAt: iso(due),
      boardReportAt: reported ? iso(awareAt + r.int(150) * HOUR) : null,
      principalsIntimatedAt: r.chance(0.5) ? iso(awareAt + r.int(100) * HOUR) : null,
    });
  }
  return { now: iso(now), breaches: out };
}

function rightsRequests(r: ReturnType<typeof rng>, today: string): ExposureRightsInput[] {
  return Array.from({ length: r.pick([0, 0, 1, 1, 2, 3, 5]) }, () => ({
    kind: r.pick(RIGHTS_KINDS),
    // Open most of the time: only an open request can count.
    status: r.chance(0.6) ? ("open" as const) : r.pick(RIGHTS_STATUSES),
    receivedOn: addDays(today, -r.pick([0, 1, 29, 30, 31, 32, 60, 89, 90, 91, 92, 200, r.int(400)])),
  }));
}

function consents(r: ReturnType<typeof rng>): ExposureConsentInput[] {
  return Array.from({ length: r.pick([0, 0, 0, 1, 1, 2, 3]) }, () => {
    const principalKind = r.pick(["child", "child", "guardian_ward", "self"] as const);
    const methods = VERIFICATION_METHODS_FOR[principalKind];
    return {
      principalKind,
      // Given most of the time: only a consent still given can count.
      action: r.chance(0.6) ? ("given" as const) : r.pick(CONSENT_ACTIONS),
      verificationMethod: methods.length > 0 && r.chance(0.4) ? r.pick(methods) : null,
    };
  });
}

function vendors(r: ReturnType<typeof rng>, today: string): ExposureVendorInput[] {
  return Array.from({ length: r.pick([0, 0, 1, 1, 2, 3, 4]) }, () => ({
    role: r.pick(["data_processor", "data_processor", "unknown", "independent"] as const),
    contractExists: r.chance(0.6) ? ("yes" as const) : r.pick(TRI),
    dpdpClauses: r.chance(0.6) ? ("yes" as const) : r.pick(TRI),
    // The review-by date: the day before today (out of date), today (still current), after, or none accepted.
    assessmentReviewBy: r.chance(0.4) ? null : addDays(today, r.pick([-400, -1, 0, 1, 200])),
  }));
}

function retentionSchedules(r: ReturnType<typeof rng>, today: string): ExposureRetentionInput[] {
  return Array.from({ length: r.pick([0, 0, 1, 1, 2, 3]) }, () => {
    if (r.chance(0.25)) {
      // No end recorded — erased at some point, or not.
      return { startsOn: null, endsOn: null, lastErasedOn: r.chance(0.3) ? addDays(today, -r.int(400)) : null };
    }
    const endsOn = addDays(today, r.pick([-400, -1, 0, 1, 200]));
    const startsOn = addMonths(endsOn, -r.pick([12, 24, 36]));
    // Erased inside this cycle, the day before it started, or never.
    const lastErasedOn = r.pick([null, null, startsOn, addDays(startsOn, -1), addDays(endsOn, r.pick([-5, 0, 5]))]);
    return { startsOn, endsOn, lastErasedOn: lastErasedOn !== null && lastErasedOn > today ? today : lastErasedOn };
  });
}

function aiSystems(r: ReturnType<typeof rng>, today: string): ExposureAiSystemInput[] {
  return Array.from({ length: r.pick([0, 0, 1, 1, 2]) }, () => ({
    status: r.chance(0.75) ? ("in_use" as const) : ("retired" as const),
    // Reviewed exactly twelve months ago (still current), a day earlier (due), recently, or never.
    lastReviewedOn: r.pick([null, addMonths(today, -12), addDays(addMonths(today, -12), -1), addDays(today, -r.int(300))]),
  }));
}

/**
 * 1.7.0: the actions on a breach, a request or a retention schedule. From their
 * OWN generator, so the draws of every earlier path (and its coverage) are unchanged.
 */
function registerActions(seed: number): ExposureRegisterActionInput[] {
  const r = rng(seed * 6007 + 29);
  return Array.from({ length: r.pick([0, 0, 1, 1, 2, 3, 5]) }, () => ({
    source: r.pick(["breach", "rights", "retention"] as const),
    severity: r.pick(SEVERITIES),
    state: r.chance(0.8) ? ("open" as const) : ("superseded" as const),
    id: `r-${r.int(1e9)}`,
    ownerUserId: r.chance(0.6) ? r.pick(USERS) : null,
    dueDate: r.chance(0.6) ? `2027-0${1 + r.int(5)}-1${r.int(9)}` : null,
    status: r.chance(0.3) ? ("closed" as const) : r.pick(["open", "in_progress", "blocked"] as const),
  }));
}

function generate(seed: number): ExposureInput {
  const r = rng(seed * 7919 + 17);
  const basis = r.pick(["finalised", "provisional", "none"] as const);
  const domains = DOMAIN_CODES.map((code) => {
    const state = r.pick(["scored", "scored", "scored", "scored", "scoped_out", "all_not_applicable"]);
    const questionCount = state === "scoped_out" ? 0 : 1 + r.int(8);
    const outstandingCount = state === "scored" && basis === "provisional" ? r.int(questionCount + 1) : 0;
    const answered = state === "scored" && (outstandingCount < questionCount || r.chance(0.2));
    return {
      code,
      state,
      weight: 4 + r.int(7),
      questionCount,
      outstandingCount: state === "scored" && !answered ? questionCount : outstandingCount,
      percent: answered ? r.pick(PERCENTS) : null,
      evidenceConfidence: answered ? (r.chance(0.05) ? null : r.pick(CONFIDENCES)) : null,
    };
  });
  // Shuffle sometimes: both copies must follow the INPUT's order.
  if (r.chance(0.3)) domains.sort(() => r.next() - 0.5);

  const action = (closedBias: number) => ({
    id: `a-${r.int(1e9)}`,
    ownerUserId: r.chance(0.6) ? r.pick(USERS) : null,
    dueDate: r.chance(0.6) ? `2027-0${1 + r.int(5)}-1${r.int(9)}` : null,
    status: r.chance(closedBias) ? ("closed" as const) : r.pick(["open", "in_progress", "blocked"] as const),
  });
  const gaps: ExposureGapInput[] = [];
  const nGaps = r.int(14);
  for (let i = 0; i < nGaps; i += 1) {
    const actions = Array.from({ length: r.pick([0, 1, 1, 1, 2, 3]) }, () => action(0.3));
    const common = { severity: r.pick(SEVERITIES), state: r.chance(0.85) ? ("open" as const) : ("superseded" as const), actions };
    if (basis !== "none" && r.chance(0.5)) gaps.push({ source: "assessment", domainCode: r.pick(DOMAIN_CODES), ...common });
    else gaps.push({ source: "ropa", gapCode: r.pick(ROPA_GAP_CODES), ...common });
  }

  const today = r.pick(["2026-10-06", "2027-01-01", "2027-05-13", "2027-06-01", "2028-02-29"]);
  const breach = breaches(r, today);
  const rights = rightsRequests(r, today);
  const consent = consents(r);
  return {
    today,
    now: breach.now,
    breaches: breach.breaches,
    rights,
    consents: consent,
    vendors: vendors(r, today),
    retention: retentionSchedules(r, today),
    aiSystems: aiSystems(r, today),
    basis,
    assessment:
      basis === "none"
        ? null
        : {
            domains,
            redFlags: RED_FLAGS.filter(() => r.chance(0.25)).map((f) => ({ code: f.code, domainCode: f.domainCode, label: f.label })),
          },
    gaps,
    registerActions: registerActions(seed),
    scope: {
      childrenData: r.pick(TRI),
      guardianData: r.pick(TRI),
      sensitiveDocuments: r.pick(TRI),
      largeScale: r.chance(0.4),
      locationUnknown: r.chance(0.4),
    },
    register: {
      childrenData: Array.from({ length: r.int(4) }, () => r.pick(TRI)),
      crossBorder: Array.from({ length: r.int(4) }, () => r.pick(TRI)),
    },
    sdf: { notifiedOn: r.chance(0.3) ? "2026-09-01" : null },
  };
}

/** The fields the SQL derives, from core's richer head. */
function coreHeads(input: ExposureInput) {
  const result = exposureFor(input);
  return {
    heads: result.heads.map((h) => ({
      code: h.code,
      serial: h.serial,
      title: h.title,
      ceilingCrore: h.ceilingCrore,
      applies: h.applies,
      status: h.status,
      statusLabel: h.statusLabel,
      atStake: h.atStake,
      position: h.position && {
        points: h.position.points,
        band: h.position.band,
        bandLabel: h.position.bandLabel,
        fromCrore: h.position.fromCrore,
        toCrore: h.position.toCrore,
        rangeLabel: h.position.rangeLabel,
        factors: h.position.factors.map((f) => ({ code: f.code, clause: f.clause, points: f.points, text: f.text })),
      },
      reasons: h.reasons.map((x) => ({ kind: x.kind, text: x.text })),
    })),
    ceilingsAtStakeCrore: result.headline.ceilingsAtStakeCrore,
    exposedHeads: result.headline.exposedHeads,
    applicableHeads: result.headline.applicableHeads,
    modelVersion: result.modelVersion,
  };
}

/** jsonb numerics come back as JS numbers once parsed; normalise key order by re-serialising through core's shape. */
function sqlHeads(value: unknown) {
  const v = value as ReturnType<typeof coreHeads>;
  return {
    heads: v.heads.map((h) => ({
      code: h.code,
      serial: h.serial,
      title: h.title,
      ceilingCrore: Number(h.ceilingCrore),
      applies: h.applies,
      status: h.status,
      statusLabel: h.statusLabel,
      atStake: h.atStake,
      position: h.position && {
        points: h.position.points,
        band: h.position.band,
        bandLabel: h.position.bandLabel,
        fromCrore: h.position.fromCrore,
        toCrore: h.position.toCrore,
        rangeLabel: h.position.rangeLabel,
        factors: h.position.factors.map((f) => ({ code: f.code, clause: f.clause, points: f.points, text: f.text })),
      },
      reasons: h.reasons.map((x) => ({ kind: x.kind, text: x.text })),
    })),
    ceilingsAtStakeCrore: Number(v.ceilingsAtStakeCrore),
    exposedHeads: Number(v.exposedHeads),
    applicableHeads: Number(v.applicableHeads),
    modelVersion: v.modelVersion,
  };
}

const CASES = 400;

describe("app.exposure_evaluate equals exposureFor on generated inputs", () => {
  it(`agrees on all ${CASES} inputs — every status, position and reason`, async () => {
    const inputs = Array.from({ length: CASES }, (_, i) => generate(i + 1));
    const { rows } = await inTransaction(client, (tx) =>
      tx.asAdmin<{ i: number; out: unknown }>(
        "SELECT (x.ord - 1)::integer AS i, app.exposure_evaluate(x.value) AS out FROM jsonb_array_elements($1::jsonb) WITH ORDINALITY AS x(value, ord) ORDER BY x.ord",
        [JSON.stringify(inputs)],
      ),
    );
    expect(rows).toHaveLength(CASES);
    for (const row of rows) {
      expect(sqlHeads(row.out), `input #${row.i + 1}`).toEqual(coreHeads(inputs[row.i]!));
    }
  });

  it("the generated inputs cover every status, every band, every factor and every 1.1.0 to 1.5.0 path", () => {
    const seen = new Set<string>();
    for (let i = 1; i <= CASES; i += 1) {
      for (const h of exposureFor(generate(i)).heads) {
        seen.add(`status:${h.status}`);
        if (h.position) {
          seen.add(`band:${h.position.band}`);
          for (const f of h.position.factors) seen.add(`factor:${f.code}`);
          const rep = h.position.factors.find((f) => f.code === "repetition");
          if (rep) seen.add(`repetition:${rep.points}`);
        }
        for (const r of h.reasons) {
          if (r.text.includes("report to the Board is past its due time")) seen.add("reason:board_overdue");
          if (r.text.includes("not recorded as intimated")) seen.add("reason:principals_pending");
          if (r.text.includes("for more than ninety days since")) seen.add("reason:rights_ceiling");
          if (r.text.includes("30-day response target")) seen.add("reason:rights_target");
          if (r.text.includes("no verification of the parent or lawful guardian")) seen.add("reason:child_consent");
          if (r.text.includes("past its end date with no erasure") || r.text.includes("past their end dates with no erasure")) seen.add("reason:retention_overdue");
          if (r.text.includes("no end date recorded")) seen.add("reason:retention_no_end");
          if (r.text.includes("no review recorded in the last twelve months")) seen.add("reason:ai_unreviewed");
        }
      }
    }
    for (const x of [
      "repetition:1",
      "repetition:2",
      "reason:board_overdue",
      "reason:principals_pending",
      "reason:rights_ceiling",
      "reason:rights_target",
      "reason:child_consent",
      "reason:retention_overdue",
      "reason:retention_no_end",
      "reason:ai_unreviewed",
    ]) {
      expect(seen, x).toContain(x);
    }
    for (const s of ["not_applicable", "not_yet_assessed", "exposed", "partially_mitigated", "mitigated"]) expect(seen, s).toContain(`status:${s}`);
    for (const b of ["lower", "middle", "upper"]) expect(seen, b).toContain(`band:${b}`);
    for (const f of ["children_data", "sensitive_documents", "large_scale", "location_unknown", "status_exposed", "remediation_planned", "evidence_confident", "repetition"]) {
      expect(seen, f).toContain(`factor:${f}`);
    }
  });
});

describe("app.exposure_outstanding_work equals outstandingWork", () => {
  it("on the same generated inputs", async () => {
    const inputs = Array.from({ length: 100 }, (_, i) => generate(i + 1000));
    const { rows } = await inTransaction(client, (tx) =>
      tx.asAdmin<{ i: number; critical_high: number; all_work: number }>(
        "SELECT (x.ord - 1)::integer AS i, w.critical_high, w.all_work FROM jsonb_array_elements($1::jsonb) WITH ORDINALITY AS x(value, ord), app.exposure_outstanding_work(x.value) w ORDER BY x.ord",
        [JSON.stringify(inputs)],
      ),
    );
    for (const row of rows) {
      expect({ criticalHigh: row.critical_high, all: row.all_work }, `input #${row.i}`).toEqual(outstandingWork(inputs[row.i]!.gaps, inputs[row.i]!.registerActions));
    }
    // 1.7.0: the inputs do exercise the register actions — counted, superseded and closed.
    const all = inputs.flatMap((i) => i.registerActions);
    expect(all.some((a) => a.state === "open" && a.status !== "closed")).toBe(true);
    expect(all.some((a) => a.state === "superseded")).toBe(true);
    expect(all.some((a) => a.status === "closed")).toBe(true);
    expect(inputs.filter((i) => outstandingWork(i.gaps, i.registerActions).all !== outstandingWork(i.gaps).all).length).toBeGreaterThan(10);
  });

  it("1.7.0: app.exposure_input reads every breach, rights and retention action with the Actions page's severity and state", async () => {
    const MU = "0b000000-0000-4000-8000-000000000001";
    const { rows } = await inTransaction(client, (tx) =>
      tx.asAdmin<{ input: ExposureInput; actions: number }>(
        `SELECT (app.exposure_input($1, (now() AT TIME ZONE 'Asia/Kolkata')::date)) -> 'input' AS input,
                (SELECT count(*)::integer FROM public.gap_actions a WHERE a.organization_id = $1
                   AND (a.breach_incident_id IS NOT NULL OR a.rights_request_id IS NOT NULL OR a.retention_schedule_id IS NOT NULL)) AS actions`,
        [MU],
      ),
    );
    const { input, actions } = rows[0]!;
    // Every action on the three registers, none on a gap row.
    expect(input.registerActions).toHaveLength(actions);
    // MU's seed: the breach's high action, the grievance's (high) and the overdue schedule's (high).
    const seeded = new Map(input.registerActions.map((a) => [a.id, `${a.source}:${a.severity}:${a.state}`]));
    expect(seeded.get("0b000010-0000-4000-8000-0000000000a1")).toBe("breach:high:open");
    expect(seeded.get("0b000012-0000-4000-8000-0000000000a1")).toBe("rights:high:open");
    expect(seeded.get("0b000016-0000-4000-8000-000000000031")).toBe("retention:high:open");
    // And the model's heads ignore them: evaluated with and without, SQL gives the same heads.
    const { rows: heads } = await inTransaction(client, (tx) =>
      tx.asAdmin<{ same: boolean }>(
        "SELECT app.exposure_evaluate($1::jsonb) = app.exposure_evaluate(($1::jsonb) - 'registerActions') AS same",
        [JSON.stringify(input)],
      ),
    );
    expect(heads[0]!.same).toBe(true);
  });
});

describe("app.exposure_forecast equals forecast, draw for draw", () => {
  function forecastCase(seed: number) {
    const r = rng(seed * 104729 + 3);
    const today = r.pick(["2026-10-06", "2027-02-28", "2027-05-13", "2027-05-20"]);
    const base = Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)));
    const closedOn = Array.from({ length: r.int(40) }, () => new Date(base - (r.int(70) - 3) * 86_400_000).toISOString().slice(0, 10));
    const all = r.pick([0, 1, 5, 17, 60, 300, 2000]);
    const criticalHigh = Math.min(all, r.pick([0, 1, 3, 10, 50, 1500]));
    return { closedOn, work: { criticalHigh, all }, today, deadline: "2027-05-13" };
  }

  it("on 120 generated histories — including thin, empty and future-dated ones", async () => {
    const cases = Array.from({ length: 120 }, (_, i) => forecastCase(i + 1));
    const { rows } = await inTransaction(client, (tx) =>
      tx.asAdmin<{ i: number; out: unknown }>(
        `SELECT (x.ord - 1)::integer AS i,
                app.exposure_forecast(
                  ARRAY(SELECT jsonb_array_elements_text(x.value -> 'closedOn')::date),
                  (x.value #>> '{work,criticalHigh}')::integer, (x.value #>> '{work,all}')::integer,
                  (x.value ->> 'today')::date, (x.value ->> 'deadline')::date) AS out
         FROM jsonb_array_elements($1::jsonb) WITH ORDINALITY AS x(value, ord) ORDER BY x.ord`,
        [JSON.stringify(cases)],
      ),
    );
    let simulated = 0;
    for (const row of rows) {
      const expected = forecast(cases[row.i]!);
      if (expected.all.p50Weeks !== null && expected.all.outstanding > 0) simulated += 1;
      expect(JSON.parse(JSON.stringify(row.out)), `case #${row.i + 1}`).toEqual(JSON.parse(JSON.stringify(expected)));
    }
    expect(simulated).toBeGreaterThan(20);
  });
});
