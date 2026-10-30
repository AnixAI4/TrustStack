/**
 * Slice 9, Stage 1 — the live exposure reader.
 *
 * The model is `exposureFor` in packages/core and is tested there. What is
 * tested here is the thin layer that feeds it: that it reads, never
 * recomputes (the D-069 rule the dashboard follows), and that the scope facts
 * it hands the model treat silence as risk (D-026).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { EMPTY_SCOPE, type RiskInput } from "@truststack/core";
import { describe, expect, it } from "vitest";
import { scopeFacts } from "@/lib/exposure/read";
import type { ScopeState } from "@/lib/scope/risk";

const web = path.resolve(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(path.join(web, file), "utf8");

const FILES = [
  "lib/exposure/read.ts",
  "lib/exposure/snapshots.ts",
  "lib/exposure/closures.ts",
  "app/api/v1/organizations/[id]/exposure/route.ts",
  "app/api/v1/organizations/[id]/exposure/what-if/route.ts",
  "app/api/v1/organizations/[id]/exposure/snapshots/route.ts",
  "app/dashboard/exposure/exposure-command-centre.tsx",
  "app/dashboard/exposure/exposure-history.tsx",
  "app/dashboard/exposure-strip.tsx",
];

/** The functions that PRODUCE a score, a severity or a gap. Exposure reads what they produced. */
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

function coreImports(source: string): string[] {
  return [...source.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"@truststack\/core"/g)].flatMap((m) =>
    m[1]!
      .split(",")
      .map((s) => s.replace(/^\s*type\s+/, "").trim())
      .filter(Boolean),
  );
}

describe("the exposure reader reads; it never recomputes", () => {
  for (const file of FILES) {
    it(`${file} imports no scoring, severity or gap-derivation function`, () => {
      const imported = coreImports(read(file));
      expect(imported.filter((name) => FORBIDDEN.includes(name))).toEqual([]);
    });
  }

  it("reads through the score, gap and ROPA readers, and asks the database nothing directly but the SDF date", () => {
    const source = read("lib/exposure/read.ts");
    for (const reader of ["readAssessmentScore", "readGapRegister", "readRopaGapRegister", "readAllRecords", "loadScopeState", "listAssessments"]) {
      expect(source, reader).toContain(reader);
    }
    const tables = [...source.matchAll(/\.from\("([a-z_]+)"\)/g)].map((m) => m[1]);
    expect(tables).toEqual(["organizations"]);
    expect(source).toContain('.select("sdf_notified_on")');
  });

  it("Stage 2: history is written only by the RPC, and the pace is read from stored closures", () => {
    const snapshots = read("lib/exposure/snapshots.ts");
    expect([...snapshots.matchAll(/\.from\("([a-z_]+)"\)/g)].map((m) => m[1])).toEqual(["exposure_snapshots", "exposure_snapshots", "exposure_snapshots"]);
    expect(snapshots).toContain('rpc("record_exposure_snapshot", { p_organization_id: organizationId })');
    expect(snapshots).not.toMatch(/\.(insert|update|upsert|delete)\(/);
    const closures = read("lib/exposure/closures.ts");
    expect([...closures.matchAll(/\.from\("([a-z_]+)"\)/g)].map((m) => m[1])).toEqual(["gap_actions"]);
    expect(closures).toContain('.select("id, closed_at")');
  });

  it("the pages compute nothing: no model, forecast or leverage function is imported by a page", () => {
    for (const file of FILES.filter((f) => f.startsWith("app/dashboard"))) {
      const imported = coreImports(read(file));
      for (const name of ["exposureFor", "forecast", "exposureForecast", "leverage", "whatIf", "slippage", "exposureChanges"]) {
        expect(imported, `${file} imports ${name}`).not.toContain(name);
      }
    }
  });

  it("uses the overview's rule for which assessment feeds it (D-069.1)", () => {
    expect(read("lib/exposure/read.ts")).toContain("pickAssessments(assessments)");
  });
});

describe("scope facts — silence is not mitigation (D-026)", () => {
  const riskInput = (over: Partial<RiskInput> = {}): RiskInput => ({
    scope: { ...EMPTY_SCOPE, guardianData: "no", usesDataProcessors: "no" },
    systems: [],
    vendors: [],
    dataPrincipalTypes: [],
    dataPrincipalCountEstimate: null,
    ...over,
  });
  const state = (input: RiskInput, saved = true): ScopeState => ({
    industryCode: "general",
    dataPrincipalCountEstimate: input.dataPrincipalCountEstimate,
    answers: input.scope,
    stored: saved ? { riskTags: [], derivedAt: "2026-10-05T00:00:00Z" } : null,
    input,
  });

  it("an organisation that never saved its scope is unknown on every fact", () => {
    expect(scopeFacts(state(riskInput(), false))).toEqual({
      childrenData: "unknown",
      guardianData: "unknown",
      sensitiveDocuments: "unknown",
      largeScale: false,
      locationUnknown: true,
    });
  });

  it("a saved 'no' everywhere is no", () => {
    expect(scopeFacts(state(riskInput()))).toEqual({
      childrenData: "no",
      guardianData: "no",
      sensitiveDocuments: "no",
      largeScale: false,
      locationUnknown: false,
    });
  });

  it("children's data is the strongest of the answer, the Data Principal types and the systems", () => {
    const viaType = riskInput({
      dataPrincipalTypes: [{ code: "patient", label: "Patients", includesChildren: "unknown", estimatedCount: 10 } as never],
    });
    expect(scopeFacts(state(viaType)).childrenData).toBe("unknown");
    const viaSystem = riskInput({
      systems: [{ name: "EMR", systemType: "other", hostingModel: "cloud", dataLocation: "india", processesChildrenData: "yes" } as never],
    });
    expect(scopeFacts(state(viaSystem)).childrenData).toBe("yes");
  });

  it("large-scale is the scope's own internal trigger (D-028), and location unknown its cross-border tag", () => {
    expect(scopeFacts(state(riskInput({ dataPrincipalCountEstimate: 100_000 }))).largeScale).toBe(true);
    expect(scopeFacts(state(riskInput({ dataPrincipalCountEstimate: 99_999 }))).largeScale).toBe(false);
    const vendor = riskInput({ vendors: [{ name: "Cloud", vendorRole: "data_processor", crossBorder: "unknown" }] });
    expect(scopeFacts(state(vendor)).locationUnknown).toBe(true);
  });
});
