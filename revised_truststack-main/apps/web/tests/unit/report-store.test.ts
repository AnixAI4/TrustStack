/**
 * Slice 9, Stage 3 — the report store's guards, without a database.
 *
 *  - The migration's report kinds (`app.report_kinds`), its kind/format
 *    CHECK and its file-name rule are core's, row for row (the mirror rule of
 *    D-053, applied to the report kinds). The kinds and the CHECK are read
 *    from the NEWEST migration that defines them (Slice 10 Stage 6 widened
 *    both); the file-name rule and the owner rule from the store's own.
 *  - The app never writes a `reports` row or a stored file except through the
 *    three functions and the generator's one upload.
 *  - A report computes nothing (D-069): the report code reads through the
 *    exposure, snapshot and dashboard readers and imports no scoring, model,
 *    forecast or leverage function; the page imports none either.
 *  - Downloads are 60-second signed URLs, audited every time.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { REPORT_KIND_DEFINITIONS, reportFileName } from "@truststack/core";
import { describe, expect, it } from "vitest";

const web = path.resolve(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(path.join(web, file), "utf8");
const migrations = path.resolve(web, "../../packages/db/prisma/migrations");
const migration = readFileSync(path.join(migrations, "20261010000000_reports/migration.sql"), "utf8");
/** The newest definition of the kinds and the kind/format CHECK. */
const kindsMigration = readFileSync(path.join(migrations, "20261018000000_slice10_reports/migration.sql"), "utf8");

/** Every name a file imports from `@truststack/core`. */
function coreImports(source: string): string[] {
  return [...source.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"@truststack\/core"/g)].flatMap((m) =>
    m[1]!
      .split(",")
      .map((s) => s.replace(/^\s*type\s+/, "").trim())
      .filter(Boolean),
  );
}

describe("the report kinds in SQL are core's", () => {
  it("app.report_kinds() lists every kind with its format, snapshot rule, owner rule and file stem", () => {
    const body = kindsMigration.slice(kindsMigration.indexOf("FUNCTION app.report_kinds()"), kindsMigration.indexOf("reports_kind_format_check"));
    const rows = [...body.matchAll(/\('(\w+)',\s*'(\w+)',\s*(true|false),\s*(true|false),\s*'(\w+)'\)/g)].map((m) => ({
      kind: m[1],
      format: m[2],
      recordsExposure: m[3] === "true",
      perOwner: m[4] === "true",
      fileSlug: m[5],
    }));
    expect(rows).toEqual(
      REPORT_KIND_DEFINITIONS.map((k) => ({ kind: k.kind, format: k.format, recordsExposure: k.recordsExposure, perOwner: k.perOwner, fileSlug: k.fileSlug })),
    );
  });

  it("the kind/format CHECK admits exactly core's pairs", () => {
    const from = kindsMigration.indexOf("ADD CONSTRAINT reports_kind_format_check");
    const check = kindsMigration.slice(from, kindsMigration.indexOf(";", from));
    const pairs = [...check.matchAll(/\('(\w+)',\s*'(\w+)'\)/g)].map((m) => `${m[1]}/${m[2]}`);
    expect(pairs.sort()).toEqual(REPORT_KIND_DEFINITIONS.map((k) => `${k.kind}/${k.format}`).sort());
  });

  it("the file name is built the same way in both", () => {
    expect(migration).toContain(
      "'TrustStack_' || k.file_slug || '_v' || p_version || '_' || to_char(p_as_of, 'YYYY-MM-DD') || '.' || k.format",
    );
    expect(reportFileName("programme_status", 12, "2027-01-31")).toBe("TrustStack_Programme_Status_Report_v12_2027-01-31.pdf");
  });

  it("an owner's pack is the only kind that names a person, in SQL as in core", () => {
    expect(migration).toContain("CHECK ((kind = 'owner_action_pack') = (subject_user_id IS NOT NULL))");
  });
});

const REPORT_FILES = [
  "lib/reports/store.ts",
  "lib/reports/generate.ts",
  "lib/reports/routes.ts",
  "lib/reports/pdf.ts",
  "lib/reports/xlsx.ts",
  "lib/reports/inputs.ts",
  "lib/reports/stakeholders.ts",
  "lib/evidence/index-reader.ts",
];

describe("only the three functions write a report", () => {
  const files = REPORT_FILES;

  it("no report code inserts, updates, upserts or deletes a table row", () => {
    for (const file of files) expect(read(file), file).not.toMatch(/\.(insert|update|upsert|delete)\(/);
  });

  it("the generator begins, completes or fails through the RPCs, and uploads once without overwrite", () => {
    const generate = read("lib/reports/generate.ts");
    expect(generate).toContain('rpc("begin_report"');
    expect(generate).toContain('rpc("complete_report"');
    expect(generate).toContain('rpc("fail_report"');
    expect([...generate.matchAll(/\.upload\(/g)]).toHaveLength(1);
    expect(generate).toContain("upsert: false");
    // The size is the database's (read from the stored object), never sent.
    expect(generate).not.toMatch(/p_byte_size|byteSize:\s*bytes/);
  });
});

describe("a report computes nothing (D-069)", () => {
  const FORBIDDEN = [
    "scoreAssessment",
    "scoreDomain",
    "maturityBand",
    "questionSeverity",
    "adjustedScore",
    "generateGaps",
    "ropaCompleteness",
    "ropaRisk",
    "exposureFor",
    "exposureForecast",
    "forecast",
    "leverage",
    "whatIf",
    "slippage",
    "exposureChanges",
    "summariseActions",
    "countRopaRegister",
    // Slice 10, Stage 6: the registers' headlines come from their own readers.
    "countBreaches",
    "countRights",
    "countRetention",
    "countConsents",
    "countAiSystems",
    "evidenceCoverage",
  ];

  for (const file of [...REPORT_FILES, "app/dashboard/reports/reports-centre.tsx"]) {
    it(`${file} imports no scoring, model, forecast or counting function`, () => {
      const imported = coreImports(read(file));
      for (const name of FORBIDDEN) expect(imported, `${file} imports ${name}`).not.toContain(name);
    });
  }

  it("the generator prints the STORED snapshot and reads the live view and the overview through their own readers", () => {
    const generate = read("lib/reports/generate.ts");
    expect(generate).toMatch(/readSnapshot\(/);
    expect(generate).toMatch(/readLiveExposure\(/);
    expect(generate).toMatch(/readDashboard\(/);
    // The only table it reads directly is the organisation's name.
    expect([...generate.matchAll(/\.from\("([a-z_]+)"\)/g)].map((m) => m[1])).toEqual(["organizations"]);
  });

  it("the Stage 4 reports read the gap registers through the overview's own reader, and the evidence through its reader", () => {
    const inputs = read("lib/reports/inputs.ts");
    expect(inputs).toMatch(/readRemediation\(/);
    expect(inputs).toMatch(/readEvidenceIndex\(/);
    expect(read("lib/dashboard/read.ts")).toMatch(/readRemediation\(supabase, organizationId, members, assessments, records/);
    // The ROPA workbook and the CSV export share ONE column list (SLICE_09 §5).
    expect(read("lib/reports/generate.ts")).toMatch(/ropaExportHeaders\(\)/);
    expect(read("lib/ropa/routes.ts")).toMatch(/ropaExportHeaders\(\)\.map\(csvCell\)/);
  });

  it("an XLSX holds values only: the renderer never writes a formula or a link object", () => {
    const xlsx = read("lib/reports/xlsx.ts");
    expect(xlsx).not.toMatch(/formula\s*:|hyperlink\s*:|sharedFormula/);
    expect(xlsx).toContain("defuseFormula");
  });

  it("the exposure route and the dashboard route answer from the same readers the reports use", () => {
    expect(read("lib/exposure/read.ts")).toMatch(/return ok\(await readLiveExposure\(/);
    expect(read("lib/dashboard/read.ts")).toMatch(/ok\(await readDashboard\(ctx\), ctx\.request\)/);
  });
});

describe("downloads", () => {
  it("are signed for 60 seconds with the caller's JWT and audited every time", () => {
    expect(read("lib/reports/store.ts")).toContain("REPORT_DOWNLOAD_URL_SECONDS = 60");
    const routes = read("lib/reports/routes.ts");
    expect(routes).toContain("createSignedUrl(row.storage_path, REPORT_DOWNLOAD_URL_SECONDS");
    expect(routes).toContain('eventType: "report.download_url.issued"');
    expect(read("lib/reports/routes.ts")).not.toContain("createSupabaseAdmin");
  });
});
