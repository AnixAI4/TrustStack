/**
 * Slice 8 — the dashboard reads; it never recomputes.
 *
 * Every number on a dashboard is the engine's or the database's (D-011,
 * pitfall 1). The cheapest way to keep it so is to make it impossible to
 * import the arithmetic: these tests parse the dashboard's server reader, its
 * route and its two pages and fail if any of them names a scoring,
 * completeness, risk or gap-derivation function.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { AssessmentRow } from "@/lib/assessments/routes";
import { pickAssessments } from "@/lib/dashboard/read";

const web = path.resolve(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(path.join(web, file), "utf8");

const FILES = [
  "lib/dashboard/read.ts",
  "app/api/v1/organizations/[id]/dashboard/route.ts",
  "app/dashboard/executive-overview.tsx",
  "app/dashboard/actions/actions-dashboard.tsx",
];

/** The functions that PRODUCE a number. A dashboard may only report what they produced. */
const FORBIDDEN = [
  "scoreAssessment",
  "scoreDomain",
  "maturityBand",
  "questionSeverity",
  "questionPriority",
  "adjustedScore",
  "evidenceCap",
  "generateGaps",
  "opensGap",
  "dueDate",
  "ropaCompleteness",
  "ropaBand",
  "ropaRisk",
  "deriveRopaGaps",
  "liveScore",
  "snapshotToApi",
  "liveToApi",
];

/** Every name a file imports from `@truststack/core`. */
function coreImports(source: string): string[] {
  return [...source.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"@truststack\/core"/g)].flatMap((m) =>
    m[1]!
      .split(",")
      .map((s) => s.replace(/^\s*type\s+/, "").trim())
      .filter(Boolean),
  );
}

describe("no recomputation on any dashboard", () => {
  for (const file of FILES) {
    it(`${file} imports no scoring, completeness, risk or gap-derivation function`, () => {
      const source = read(file);
      const imported = coreImports(source);
      for (const name of FORBIDDEN) {
        expect(imported, `${file} imports ${name}`).not.toContain(name);
        expect(source, `${file} calls ${name}(`).not.toMatch(new RegExp(`\\b${name}\\(`));
      }
    });
  }

  it("the server reader reads through the SAME readers the score, gap and ROPA routes use", () => {
    const source = read("lib/dashboard/read.ts");
    expect(source).toContain('from "@/lib/assessments/score"');
    expect(source).toMatch(/readAssessmentScore\(/);
    expect(source).toMatch(/readGapRegister\(/);
    expect(source).toMatch(/readGaps\(/);
    expect(source).toMatch(/readRopaGapRegister\(/);
    expect(source).toMatch(/ropaRegisterCounts\(/);
    // No table is queried directly: a reader owns every read.
    expect(source).not.toMatch(/\.from\("/);
  });

  it("the score route and the dashboard share one score reader", () => {
    expect(read("lib/assessments/score.ts")).toMatch(/const payload = await readAssessmentScore\(/);
  });

  it("the register page and the dashboard share one count function, from core", () => {
    expect(read("lib/ropa/routes.ts")).toMatch(/counts: ropaRegisterCounts\(rows, today\)/);
    expect(read("lib/ropa/shape.ts")).toMatch(/countRopaRegister\(rows\.map\(ropaCountFacts\), today\)/);
  });

  it("the overview never calls itself compliant or certified (D-011)", () => {
    for (const file of FILES.slice(2)) {
      const visible = read(file).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      expect(visible.toLowerCase(), file).not.toContain("compliant");
      expect(visible.toLowerCase(), file).not.toMatch(/\bcertified\b/);
    }
  });
});

// ---------------------------------------------------------------------------

function row(over: Partial<AssessmentRow>): AssessmentRow {
  return {
    id: "a",
    organization_id: "o",
    name: "A",
    assessment_type: "baseline",
    status: "draft",
    industry_code: null,
    risk_tags: null,
    scope_derived_at: null,
    generated_at: null,
    created_by: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    ...over,
  };
}

describe("pickAssessments — a frozen number and a live one, never blended (D-068)", () => {
  it("nothing to show for an organisation with no assessment", () => {
    expect(pickAssessments([])).toEqual({ finalised: null, inProgress: null });
  });

  it("no finalised assessment: the newest with answers, else the newest", () => {
    const old = row({ id: "old", status: "in_progress", created_at: "2026-09-01T00:00:00Z" });
    const fresh = row({ id: "fresh", status: "draft", created_at: "2026-10-01T00:00:00Z" });
    expect(pickAssessments([fresh, old])).toEqual({ finalised: null, inProgress: old });
    expect(pickAssessments([fresh]).inProgress).toBe(fresh);
  });

  it("the newest finalised one is shown frozen; only an assessment started AFTER it is shown live", () => {
    const before = row({ id: "before", status: "in_progress", created_at: "2026-08-01T00:00:00Z" });
    const final1 = row({ id: "f1", status: "finalised", created_at: "2026-08-15T00:00:00Z" });
    const final2 = row({ id: "f2", status: "finalised", created_at: "2026-09-01T00:00:00Z" });
    const after = row({ id: "after", status: "in_progress", created_at: "2026-09-20T00:00:00Z" });
    expect(pickAssessments([before, final1, final2])).toEqual({ finalised: final2, inProgress: null });
    expect(pickAssessments([after, before, final2, final1])).toEqual({ finalised: final2, inProgress: after });
  });
});
