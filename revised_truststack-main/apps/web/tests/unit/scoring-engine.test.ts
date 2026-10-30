/**
 * The scoring engine lives in two places — `app.*` in the Slice 5 migration
 * (which computes every FINALISED snapshot) and `packages/core/src/engine.ts`
 * (which the API and the UI use for a live score). This parses the SQL and
 * fails if the two ever differ.
 *
 * It is the same mirror rule `evidence-cap.test.ts` applies to the cap, on the
 * layer above it: bands, severities, the red-flag table, the thresholds and
 * the engine version. A rule that lived in only one of them would produce a
 * live score and a finalised score that disagree.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ENGINE_VERSION,
  GAP_SEVERITIES,
  MATURITY_BANDS,
  NO_SCORE_CAP,
  ON_TRACK_MIN_PERCENT,
  RED_FLAG_MAX_ADJUSTED,
  RED_FLAGS,
  DOMAIN_CODES,
  DOMAIN_SCORE_STATES,
  DOMAIN_STATUSES,
} from "@truststack/core";
import { describe, expect, it } from "vitest";

const MIGRATION = path.resolve(
  import.meta.dirname,
  "../../../../packages/db/prisma/migrations/20260920000000_scoring_engine/migration.sql",
);
const sql = readFileSync(MIGRATION, "utf8");

function block(startMarker: string, endMarker: string): string {
  const start = sql.indexOf(startMarker);
  expect(start, `${startMarker} not found in the migration`).toBeGreaterThan(-1);
  const end = sql.indexOf(endMarker, start);
  return sql.slice(start, end);
}

/** The single quoted literal a trivial SQL function returns. */
function returnedNumber(fn: string): number {
  const body = block(`CREATE OR REPLACE FUNCTION ${fn}`, "$$;");
  const match = body.match(/SELECT\s+([\d.]+)/);
  expect(match, `${fn} does not return a plain number`).not.toBeNull();
  return Number(match![1]);
}

describe("app.maturity_band() equals MATURITY_BANDS", () => {
  const fn = block("CREATE OR REPLACE FUNCTION app.maturity_band", "$$;");
  const pairs = [...fn.matchAll(/WHEN p_percent <= ([\d.]+)\s+THEN '([^']+)'/g)].map((m) => ({
    maxPercent: Number(m[1]),
    label: m[2]!,
  }));

  it("has the five bounded bands plus the ELSE", () => {
    expect(pairs).toHaveLength(5);
    expect(fn).toContain("ELSE 'Level 5 - Continuous Assurance'");
  });

  it("is the same table, boundaries and labels", () => {
    expect(pairs).toEqual(MATURITY_BANDS.slice(0, 5).map((b) => ({ maxPercent: b.maxPercent, label: b.label })));
    expect(MATURITY_BANDS.at(-1)!.label).toBe("Level 5 - Continuous Assurance");
  });

  it("uses <=, so a boundary belongs to the LOWER band in SQL too", () => {
    expect(fn).not.toMatch(/WHEN p_percent < [\d.]/);
  });

  it("bands a null percent as null, never as Level 0", () => {
    expect(fn).toContain("WHEN p_percent IS NULL THEN NULL");
  });
});

describe("app.question_severity() equals questionSeverity()", () => {
  const fn = block("CREATE OR REPLACE FUNCTION app.question_severity", "$$;");
  const pairs = [...fn.matchAll(/WHEN p_adjusted >= (\d)\s+THEN '([a-z_]+)'/g)].map((m) => ({
    atLeast: Number(m[1]),
    severity: m[2]!,
  }));

  it("covers the whole vocabulary", () => {
    const severities = [...pairs.map((p) => p.severity), "critical"];
    expect(new Set(severities)).toEqual(new Set(GAP_SEVERITIES));
  });

  it("is the same ladder: 5 no_gap · 4 improvement · 3 low · 2 medium · 1 high · else critical", () => {
    expect(pairs).toEqual([
      { atLeast: 5, severity: "no_gap" },
      { atLeast: 4, severity: "improvement" },
      { atLeast: 3, severity: "low" },
      { atLeast: 2, severity: "medium" },
      { atLeast: 1, severity: "high" },
    ]);
    expect(fn).toContain("ELSE 'critical'");
  });

  it("gives a Not Applicable answer no severity at all", () => {
    expect(fn).toContain("WHEN p_adjusted IS NULL THEN NULL");
  });
});

describe("app.red_flags() equals RED_FLAGS", () => {
  const fn = block("CREATE OR REPLACE FUNCTION app.red_flags", "$$;");
  const rows = [...fn.matchAll(/\((\d), '([a-z_]+)',\s*(?:'([^']+)'|NULL),\s*'([A-Z_]+)',\s*(\d+)::numeric, '((?:[^']|'')+)'\)/g)].map(
    (m) => ({
      ord: Number(m[1]),
      code: m[2]!,
      questionCode: m[3],
      domainCode: m[4]!,
      cap: Number(m[5]),
      label: m[6]!.replace(/''/g, "'"),
    }),
  );

  it("parses all seven", () => {
    expect(rows).toHaveLength(RED_FLAGS.length);
    expect(rows.map((r) => r.ord)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("is the same table — codes, domains, caps and labels", () => {
    expect(rows.map(({ ord, ...rest }) => ({ ...rest, questionCode: rest.questionCode ?? undefined }))).toEqual(
      RED_FLAGS.map((f) => ({
        code: f.code,
        questionCode: f.questionCode,
        domainCode: f.domainCode,
        cap: f.cap,
        label: f.label,
      })),
    );
  });

  it("names every domain the model knows", () => {
    for (const row of rows) expect(DOMAIN_CODES).toContain(row.domainCode);
  });
});

describe("the thresholds are the same numbers", () => {
  it("red flags fire at adjusted <= 2 (D-046)", () => {
    expect(returnedNumber("app.red_flag_max_adjusted")).toBe(RED_FLAG_MAX_ADJUSTED);
    expect(block("CREATE OR REPLACE FUNCTION app.assessment_red_flags", "$$;")).toContain(
      "r.adjusted_score <= app.red_flag_max_adjusted()",
    );
  });

  it("no flag means no cap at all — 100", () => {
    expect(returnedNumber("app.no_score_cap")).toBe(NO_SCORE_CAP);
  });

  it("On Track starts at 61%", () => {
    expect(returnedNumber("app.on_track_min_percent")).toBe(ON_TRACK_MIN_PERCENT);
  });

  it("the engine version is stamped from one place, and matches core", () => {
    expect(block("CREATE OR REPLACE FUNCTION app.engine_version", "$$;")).toContain(`'${ENGINE_VERSION}'`);
  });
});

describe("the snapshot vocabularies match packages/core", () => {
  it("the three domain states (D-038)", () => {
    const check = block("assessment_domain_scores_state_check", "),");
    expect([...check.matchAll(/'([a-z_]+)'/g)].map((m) => m[1])).toEqual([...DOMAIN_SCORE_STATES]);
  });

  it("the four domain statuses", () => {
    const check = block("assessment_domain_scores_status_check", "),");
    expect([...check.matchAll(/'([a-z_]+)'/g)].map((m) => m[1])).toEqual([...DOMAIN_STATUSES]);
  });

  it("the six maturity bands, on the snapshot too", () => {
    const check = block("assessment_score_snapshots_band_check", "));");
    expect([...check.matchAll(/'(Level \d[^']+)'/g)].map((m) => m[1])).toEqual(MATURITY_BANDS.map((b) => b.label));
  });

  it("all sixteen domain codes", () => {
    const check = block("assessment_domain_scores_code_check", "));");
    expect([...check.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1])).toEqual([...DOMAIN_CODES]);
  });
});

describe("the invariants that make a finalised score evidence", () => {
  it("the final score IS min(raw, cap) — a row invariant, not a convention", () => {
    // `least(a, b)` has a comma of its own, so the block runs to the NEXT
    // constraint rather than to the next comma.
    expect(block("assessment_score_snapshots_final_is_capped", "ADD CONSTRAINT assessment_score_snapshots_counts"))
      .toContain("final_score = least(raw_score, score_cap)");
  });

  it("an empty domain carries a NULL score, never zero (D-038)", () => {
    expect(block("assessment_domain_scores_empty_is_null", "),"))
      .toContain("(state = 'scored') = (score IS NOT NULL)");
  });

  it("neither snapshot table can be updated or deleted, by anyone", () => {
    const trigger = block("CREATE TRIGGER assessment_score_snapshots_immutable", ";");
    expect(trigger).toContain("BEFORE UPDATE OR DELETE");
    expect(trigger).toContain("app.snapshot_is_immutable()");
    expect(block("CREATE TRIGGER assessment_domain_scores_immutable", ";")).toContain("BEFORE UPDATE OR DELETE");
  });

  it("neither snapshot table has a user INSERT, UPDATE or DELETE grant", () => {
    const grants = [...sql.matchAll(/GRANT (\w+)[^;]*ON public\.(assessment_score_snapshots|assessment_domain_scores)/g)];
    expect(grants.map((m) => m[1])).toEqual(["SELECT", "SELECT"]);
  });

  it("finalise refuses an outstanding question, and says how many", () => {
    const fn = block("CREATE OR REPLACE FUNCTION public.finalise_assessment", "$$;");
    expect(fn).toContain("IF v_outstanding > 0 THEN");
    expect(fn).toContain("DETAIL = v_outstanding::text");
  });

  it("finalise checks assessment.finalise, not merely membership", () => {
    expect(block("CREATE OR REPLACE FUNCTION public.finalise_assessment", "$$;")).toContain(
      "app.has_permission(p_organization_id, 'assessment.finalise')",
    );
  });

  /**
   * The whole reason the snapshot is computed in SQL: an RPC that stored
   * numbers the caller passed in would store numbers the caller can forge.
   */
  it("finalise takes two ids and NO numbers", () => {
    const signature = block("CREATE OR REPLACE FUNCTION public.finalise_assessment", "RETURNS uuid");
    expect(signature).toContain("p_organization_id uuid");
    expect(signature).toContain("p_assessment_id uuid");
    expect(signature.match(/p_\w+ /g)).toHaveLength(2);
  });

  it("the overall confidence is a mean of DOMAIN confidences, not of questions", () => {
    expect(block("CREATE OR REPLACE FUNCTION public.finalise_assessment", "$$;")).toContain(
      "avg(d.evidence_confidence) FILTER (WHERE d.evidence_confidence IS NOT NULL)",
    );
  });

  it("the denominator is the SCORED domains' weight, not a flat 100 (D-038)", () => {
    expect(block("CREATE OR REPLACE FUNCTION public.finalise_assessment", "$$;")).toContain(
      "sum(d.weight) FILTER (WHERE d.state = 'scored')",
    );
  });
});

describe("unlinking evidence (D-051)", () => {
  it("grants DELETE on links — and on nothing else", () => {
    expect(sql).toContain("GRANT DELETE ON public.evidence_links TO authenticated;");
    const deletes = [...sql.matchAll(/GRANT DELETE ON public\.(\w+)/g)].map((m) => m[1]);
    expect(deletes).toEqual(["evidence_links"]);
  });

  it("still no DELETE on the artefact itself (D-042)", () => {
    expect(sql).not.toMatch(/GRANT[^;]*DELETE[^;]*ON public\.evidence\b/);
  });

  it("re-derives the answer's level on delete, so the score cannot outlive its evidence", () => {
    expect(block("CREATE OR REPLACE FUNCTION app.evidence_link_after_delete", "$$;")).toContain(
      "app.linked_evidence_level(r.organization_id, r.id)",
    );
  });

  it("refuses to unlink once the assessment is locked", () => {
    const fn = block("CREATE OR REPLACE FUNCTION app.evidence_link_before_delete", "$$;");
    expect(fn).toContain("IN ('submitted', 'finalised')");
    expect(fn).toContain("TS409");
  });

  it("needs evidence.write, the same permission as linking", () => {
    expect(block("CREATE POLICY evidence_links_delete_writer", ";")).toContain(
      "app.has_permission(organization_id, 'evidence.write')",
    );
  });
});

describe("the migration asserts its own engine at apply time", () => {
  const assertions = block("DO $$", "END;");

  it("pins every band boundary", () => {
    for (const boundary of ["0.2", "0.4", "0.6", "0.75", "0.9"]) {
      expect(assertions).toContain(`app.maturity_band(${boundary})`);
    }
  });

  it("pins the severity ladder and the red-flag threshold", () => {
    expect(assertions).toContain("app.question_severity(0) = 'critical'");
    expect(assertions).toContain("app.red_flag_max_adjusted() = 2");
    expect(assertions).toContain("(SELECT count(*) FROM app.red_flags()) = 7");
  });

  it("pins the cap's consequence: an unevidenced claim of 5 is High, not Critical", () => {
    expect(assertions).toContain("app.question_severity(app.adjusted_score(5, NULL)) = 'high'");
  });
});
