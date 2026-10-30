/**
 * Slice 10.5 Batch B4 — reports, exposure and emails: guards on what the pages
 * may SAY and SHOW. The wording rules themselves (the plural helper, the
 * ceilings heading, the folded reasons, the "no change" sentence, "Not
 * started" in a scorecard, the Evidence Index's cells) are tested in
 * packages/core (`words.test.ts`, `reports.test.ts`, `workbooks.test.ts`).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const web = path.resolve(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(path.join(web, file), "utf8");

const CENTRE = "app/dashboard/exposure/exposure-command-centre.tsx";
const HISTORY = "app/dashboard/exposure/exposure-history.tsx";
const STRIP = "app/dashboard/exposure-strip.tsx";
const REPORTS = "app/dashboard/reports/reports-centre.tsx";

describe("one name for the headline figure (Q2)", () => {
  it("the overview's strip and the Exposure page read core's constant — never \"where you are exposed\"", () => {
    for (const file of [CENTRE, STRIP]) {
      const source = read(file);
      expect(source, file).toContain("CEILINGS_AT_STAKE_HEADING");
      expect(source.toLowerCase(), file).not.toContain("where you are exposed");
    }
  });
});

describe("the Exposure page in four tabs (N3, F4.1, F4.2)", () => {
  const centre = read(CENTRE);

  it("Where you stand · Penalty heads · What-if · History, in that order", () => {
    const labels = [...centre.matchAll(/label: "([^"]+)",\n\s+(?:badge|content)/g)].map((m) => m[1]);
    expect(labels).toEqual(["Where you stand", "Penalty heads", "What-if", "History"]);
  });

  it("no second page heading — the shell names the page (D-110.10)", () => {
    expect(centre).not.toContain("DPDP Exposure Command Centre</h2>");
  });

  it("the s.37 note is an information note, not an error, and keeps its test id", () => {
    expect(centre).toContain('<Notice tone="info" testId="exposure-s37">');
    expect(centre).not.toMatch(/tone="error" testId="exposure-s37"/);
  });

  it("an open-action count goes through the plural helper", () => {
    expect(centre).toContain("actionsOpenLabel(projection.outstanding)");
    expect(centre).not.toMatch(/\{projection\.outstanding\} actions open/);
  });

  it("both caveats stay outside the tabs, on the page whatever the tab", () => {
    const tabsEnd = centre.indexOf("      />\n\n      {/* Both caveats");
    expect(tabsEnd).toBeGreaterThan(-1);
    expect(centre.indexOf('data-testid="exposure-caveat"')).toBeGreaterThan(tabsEnd);
    expect(centre.indexOf('data-testid="readiness-caveat"')).toBeGreaterThan(tabsEnd);
  });

  it("every test id the page had is still there", () => {
    for (const id of [
      "exposure-command-centre",
      "exposure-basis",
      "exposure-headline",
      "exposure-ceilings",
      "exposure-heads-at-stake",
      "exposure-days",
      "exposure-forecast-tile",
      "exposure-s37",
      "exposure-slippage",
      "exposure-leverage",
      "exposure-leverage-empty",
      "whatif-run",
      "whatif-result",
      "whatif-ceilings-after",
      "exposure-changes",
      "exposure-record-snapshot",
      "exposure-caveats",
      "exposure-caveat",
      "readiness-caveat",
    ]) {
      expect(centre, id).toContain(`"${id}"`);
    }
  });
});

describe("the exposure history through <DataTable> (N4)", () => {
  const history = read(HISTORY);
  it("pages its table, names each snapshot's model, and keeps its test ids", () => {
    expect(history).toContain("<DataTable");
    expect(history).toContain('testId="exposure-history-table"');
    expect(history).toContain("r.modelVersion");
    for (const id of ["exposure-history", "exposure-history-empty", "exposure-history-tooltip"]) expect(history, id).toContain(`"${id}"`);
    expect(history).not.toContain("#4338ca");
  });
});

describe("the reports centre in three tabs (F4.8)", () => {
  const reports = read(REPORTS);

  it("PDF reports · Working files · Stored, each generating tab led by \"Which report do I need?\"", () => {
    const labels = [...reports.matchAll(/id: "([^"]+)",\n\s+label: "([^"]+)"/g)].map((m) => `${m[1]}:${m[2]}`);
    expect(labels).toEqual(["pdf:PDF reports", "working-files:Working files", "stored:Stored"]);
    expect(reports.match(/<ReportGuide /g)).toHaveLength(2);
    expect(reports).toContain("Which report do I need?");
  });

  it("every permission gate and test id is kept", () => {
    expect(reports).toContain('<Can permission="gap.read">');
    expect(reports).toContain("hidden: !canGenerate,");
    for (const id of ["reports-notice", "reports-error", "owner-select", "generate-own-pack", "reports-empty", "reports-table"]) {
      expect(reports, id).toContain(`"${id}"`);
    }
    for (const id of ["generate-${k.kind}", "download-${r.id}", "regenerate-${r.id}", "report-row-${r.id}"]) expect(reports, id).toContain(id);
  });
});
