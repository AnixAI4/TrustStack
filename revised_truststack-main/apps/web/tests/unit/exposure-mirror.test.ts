/**
 * Slice 9, Stage 2 — the exposure model's DATA lives in two places: core
 * (`exposure.ts`, `forecast.ts`) for the live view, and the Stage 2
 * migration for every stored snapshot. This parses the migration and fails
 * if the two differ on the heads, the mapping, the thresholds, the factor
 * points, the forecast constants or the model version (SLICE_09 §4.1, §11) —
 * as `scoring-engine.test.ts` does for the readiness engine.
 *
 * The LOGIC is held together by `tests/rls/exposure-mirror.test.ts`, which
 * runs both copies on the same generated inputs.
 *
 * Slice 10: each stage bumps the model in its OWN migration (D-079.6), so a
 * function is read from the LATEST migration that defines it — exactly the
 * definition the database runs.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  COMMENCEMENT,
  DEFAULT_RISK_TRIGGER_CONFIG,
  DOMAIN_CODES,
  EXPOSURE_HEADS,
  EXPOSURE_MAPPING,
  EXPOSURE_MODEL_VERSION,
  EXPOSURE_THRESHOLDS,
  FORECAST_CONFIG,
  FORECAST_METHOD,
  FORECAST_PRNG,
  MODULE_INPUTS,
  POSITION_FACTORS,
  REPETITION_WINDOW_MONTHS,
  ROPA_GAP_CODES,
} from "@truststack/core";
import { describe, expect, it } from "vitest";

const MIGRATIONS = path.resolve(import.meta.dirname, "../../../../packages/db/prisma/migrations");
/** Every migration, oldest first — a later one replaces an earlier definition. */
const migrations = readdirSync(MIGRATIONS)
  .filter((d) => /^\d{14}_/.test(d))
  .sort()
  .map((d) => ({ name: d, sql: readFileSync(path.join(MIGRATIONS, d, "migration.sql"), "utf8") }));
/** The snapshot table and its RPC were created here, and are not replaced since. */
const sql = migrations.find((m) => m.name === "20261009000000_exposure_snapshots")!.sql;

/** The body of the LATEST definition of `name`, across every migration. */
function fn(name: string): string {
  for (const m of [...migrations].reverse()) {
    const start = m.sql.lastIndexOf(`CREATE OR REPLACE FUNCTION ${name}(`);
    if (start > -1) return m.sql.slice(start, m.sql.indexOf("$$;", start));
  }
  expect.fail(`${name} not found in any migration`);
}

/** The VALUES rows of a table function, each split into SQL literals. Quote-aware: a string may hold "(Rule 7(2)(b))". */
function rows(name: string): string[][] {
  const body = fn(name);
  const values = body.slice(body.indexOf("VALUES") + "VALUES".length);
  const out: string[][] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < values.length; i += 1) {
    const c = values[i];
    if (c === "'") {
      i += 1;
      while (i < values.length && !(values[i] === "'" && values[i + 1] !== "'")) i += values[i] === "'" ? 2 : 1;
    } else if (c === "(") {
      if (depth === 0) start = i + 1;
      depth += 1;
    } else if (c === ")") {
      depth -= 1;
      if (depth === 0) out.push(splitLiterals(values.slice(start, i)));
    }
  }
  return out;
}

function splitLiterals(row: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < row.length) {
    while (row[i] === " " || row[i] === "," || row[i] === "\n") i += 1;
    if (i >= row.length) break;
    if (row[i] === "'") {
      let j = i + 1;
      let text = "";
      for (;;) {
        if (row[j] === "'" && row[j + 1] === "'") {
          text += "'";
          j += 2;
        } else if (row[j] === "'") {
          break;
        } else {
          text += row[j];
          j += 1;
        }
      }
      out.push(text);
      i = j + 1;
      while (i < row.length && row[i] !== ",") i += 1; // a trailing ::type
    } else {
      let j = i;
      while (j < row.length && row[j] !== ",") j += 1;
      out.push(row.slice(i, j).trim().replace(/::[a-z]+$/, ""));
      i = j;
    }
  }
  return out;
}

const num = (s: string) => (s === "NULL" ? null : Number(s));
const str = (s: string) => (s === "NULL" ? null : s);

describe("the model version and the deadline", () => {
  it("app.exposure_model_version() is EXPOSURE_MODEL_VERSION", () => {
    expect(fn("app.exposure_model_version")).toContain(`SELECT '${EXPOSURE_MODEL_VERSION}'::text;`);
  });
  it("app.exposure_deadline() is COMMENCEMENT.substantive", () => {
    expect(fn("app.exposure_deadline")).toContain(`SELECT DATE '${COMMENCEMENT.substantive}';`);
  });
});

describe("app.exposure_heads() equals EXPOSURE_HEADS", () => {
  it("row for row: code, serial, title, provision, ceiling, modelled", () => {
    const parsed = rows("app.exposure_heads").map(([code, serial, title, provision, ceiling, modelled]) => ({
      code,
      serial: num(serial!),
      title,
      provision,
      ceilingRupees: num(ceiling!),
      modelled: modelled === "true",
    }));
    expect(parsed).toEqual(
      EXPOSURE_HEADS.map((h) => ({
        code: h.code,
        serial: h.serial,
        title: h.title,
        provision: h.provision,
        ceilingRupees: h.ceilingRupees,
        modelled: h.modelled,
      })),
    );
  });
});

describe("the mapping equals EXPOSURE_MAPPING (§6.2)", () => {
  const expected = (
    codes: readonly string[],
    classes: Readonly<Record<string, (typeof EXPOSURE_MAPPING.domains)[keyof typeof EXPOSURE_MAPPING.domains]>>,
  ) =>
    codes.flatMap((code, i): { ord: number; code: string; kind: string; head: string; provision: string | null }[] => {
      const c = classes[code]!;
      return c.kind === "direct"
        ? c.links.map((l) => ({ ord: i + 1, code, kind: "direct", head: l.head, provision: l.provision }))
        : c.supports.map((head) => ({ ord: i + 1, code, kind: "enabling", head, provision: null }));
    });

  it("app.exposure_domain_links(): every domain, in DOMAIN_CODES order, direct with its provisions or enabling with its heads", () => {
    const parsed = rows("app.exposure_domain_links").map(([ord, code, kind, head, provision]) => ({
      ord: num(ord!),
      code,
      kind,
      head,
      provision: str(provision!),
    }));
    expect(parsed).toEqual(expected(DOMAIN_CODES, EXPOSURE_MAPPING.domains));
  });

  it("app.exposure_rule_links(): every register gap rule, in ROPA_GAP_CODES order", () => {
    const parsed = rows("app.exposure_rule_links").map(([ord, code, kind, head, provision]) => ({
      ord: num(ord!),
      code,
      kind,
      head,
      provision: str(provision!),
    }));
    expect(parsed).toEqual(expected(ROPA_GAP_CODES, EXPOSURE_MAPPING.registerRules));
  });
});

describe("thresholds, points and the scope trigger", () => {
  it("app.exposure_thresholds() equals EXPOSURE_THRESHOLDS (40 / 60 / 60)", () => {
    const [[exposed, mitigated, confidence]] = rows("app.exposure_thresholds") as [string[]];
    expect({ exposed: num(exposed!), mitigated: num(mitigated!), confidence: num(confidence!) }).toEqual({
      exposed: EXPOSURE_THRESHOLDS.exposedBelowPercent,
      mitigated: EXPOSURE_THRESHOLDS.mitigatedMinPercent,
      confidence: EXPOSURE_THRESHOLDS.mitigatedMinConfidence,
    });
  });

  it("app.exposure_position_factors() equals POSITION_FACTORS, point for point", () => {
    const parsed = rows("app.exposure_position_factors").map(([code, clause, points, unknown, h3, h3Unknown, repeated, onlyHead]) => ({
      code,
      clause,
      points: num(points!),
      unknownPoints: num(unknown!),
      h3Points: num(h3!),
      h3UnknownPoints: num(h3Unknown!),
      repeatedPoints: num(repeated!),
      onlyHead: str(onlyHead!),
    }));
    expect(parsed).toEqual(
      POSITION_FACTORS.map((f) => ({
        code: f.code,
        clause: f.clause,
        points: f.points,
        unknownPoints: f.unknownPoints ?? null,
        h3Points: f.h3Points ?? null,
        h3UnknownPoints: f.h3UnknownPoints ?? null,
        repeatedPoints: f.repeatedPoints ?? null,
        onlyHead: f.onlyHeads?.join(",") ?? null,
      })),
    );
  });

  it("app.exposure_module_inputs() equals MODULE_INPUTS, row for row (1.1.0)", () => {
    const parsed = rows("app.exposure_module_inputs").map(([ord, code, head, provision, effect, register, label, one, many]) => ({
      ord: num(ord!),
      code,
      head,
      provision,
      effect,
      register,
      label,
      reasonOne: one,
      reasonMany: many,
    }));
    expect(parsed).toEqual(
      MODULE_INPUTS.map((m, i) => ({
        ord: i + 1,
        code: m.code,
        head: m.head,
        provision: m.provision,
        effect: m.effect,
        register: m.register,
        label: m.label,
        reasonOne: m.reasonOne,
        reasonMany: m.reasonMany,
      })),
    );
  });

  it("the repetition window is core's (s.33(2)(c))", () => {
    expect(fn("app.exposure_repetition_window_months")).toContain(`SELECT ${REPETITION_WINDOW_MONTHS};`);
  });

  it("the large-scale trigger is the scope's own (D-028)", () => {
    expect(fn("app.exposure_large_scale_threshold")).toContain(`SELECT ${DEFAULT_RISK_TRIGGER_CONFIG.largeScaleProcessingThreshold};`);
  });

  it("the evaluator writes the band edges core uses: ≤ 1 lower, ≤ 3 middle", () => {
    expect(fn("app.exposure_evaluate_head")).toContain("CASE WHEN v_points <= 1 THEN 0 WHEN v_points <= 3 THEN 1 ELSE 2 END");
  });
});

describe("the forecast's constants equal FORECAST_CONFIG and FORECAST_PRNG", () => {
  it("app.exposure_forecast_config()", () => {
    const [[weeks, minActive, sims, seed, horizon, p50, p85, mult, mod]] = rows("app.exposure_forecast_config") as [string[]];
    expect({
      trailingWeeks: num(weeks!),
      minActiveWeeks: num(minActive!),
      simulations: num(sims!),
      seed: num(seed!),
      horizonWeeks: num(horizon!),
      p50: num(p50!),
      p85: num(p85!),
    }).toEqual(FORECAST_CONFIG);
    expect({ multiplier: num(mult!), modulus: num(mod!) }).toEqual(FORECAST_PRNG);
  });

  it("states the same method", () => {
    expect(fn("app.exposure_forecast")).toContain(`'method', '${FORECAST_METHOD.replace(/'/g, "''")}'`);
  });
});

describe("the snapshot table is written by one function only", () => {
  it("no user write grant; SELECT gated by score.read; recording needs score.calculate", () => {
    expect(sql).toContain("REVOKE ALL ON public.exposure_snapshots FROM anon, authenticated;");
    expect(sql).toContain("GRANT SELECT ON public.exposure_snapshots TO authenticated;");
    expect(sql).not.toMatch(/GRANT (INSERT|UPDATE|DELETE)[^;]*exposure_snapshots/);
    expect(sql).toContain("app.has_permission(organization_id, 'score.read')");
    expect(fn("public.record_exposure_snapshot")).toContain("app.has_permission(p_organization_id, 'score.calculate')");
  });

  it("the RPC takes an organisation id and nothing else", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.record_exposure_snapshot(p_organization_id uuid)");
  });

  it("a model change is a NEW migration: the 1.0.0 one still says 1.0.0 (an applied migration is frozen)", () => {
    expect(sql).toContain("SELECT '1.0.0'::text;");
    const versions = migrations.filter((m) => m.sql.includes("CREATE OR REPLACE FUNCTION app.exposure_model_version()"));
    expect(versions.map((m) => m.name)).toEqual([
      "20261009000000_exposure_snapshots",
      "20261011000000_breach_register",
      "20261012000000_rights_register",
      "20261014000000_notice_consent",
      "20261015000000_processor_register",
      "20261017000000_retention_ai_risk",
      "20261018000000_slice10_reports",
      "20261019000000_exposure_model_1_7_0",
    ]);
    // Each later stage's migration says its own version, and core says the latest.
    expect(migrations.find((m) => m.name === "20261011000000_breach_register")!.sql).toContain("SELECT '1.1.0'::text;");
    expect(migrations.find((m) => m.name === "20261012000000_rights_register")!.sql).toContain("SELECT '1.2.0'::text;");
    expect(migrations.find((m) => m.name === "20261014000000_notice_consent")!.sql).toContain("SELECT '1.3.0'::text;");
    expect(migrations.find((m) => m.name === "20261015000000_processor_register")!.sql).toContain("SELECT '1.4.0'::text;");
    expect(migrations.find((m) => m.name === "20261017000000_retention_ai_risk")!.sql).toContain("SELECT '1.5.0'::text;");
    expect(migrations.find((m) => m.name === "20261018000000_slice10_reports")!.sql).toContain("SELECT '1.6.0'::text;");
    expect(migrations.find((m) => m.name === "20261019000000_exposure_model_1_7_0")!.sql).toContain("SELECT '1.7.0'::text;");
    expect(fn("app.exposure_model_version")).toContain(`SELECT '${EXPOSURE_MODEL_VERSION}'::text;`);
  });

  it("red flags carry their code, domain and label — never the question codes behind them (D-071)", () => {
    const input = fn("app.exposure_input");
    expect(input).not.toContain("questionCodes");
    expect(input.match(/'label', f\.value ->> 'label'/g)).toHaveLength(2);
  });
});
