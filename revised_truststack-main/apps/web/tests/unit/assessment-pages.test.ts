/**
 * Slice 10.5 Batch B2 — assessment, evidence and gaps: guards on what the
 * pages may SAY and SHOW. The wording rules themselves (status labels, the
 * claim scale, the evidence sentences, the role filter) are tested in
 * packages/core `assessment-display.test.ts`.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const web = path.resolve(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(path.join(web, file), "utf8");

const browserFiles = ["app", "components", "lib/client"].flatMap((dir) =>
  readdirSync(path.join(web, dir), { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && /\.tsx?$/.test(d.name) && !d.parentPath.includes(`${path.sep}api`))
    .map((d) => path.relative(web, path.join(d.parentPath, d.name)).split(path.sep).join("/")),
);

const ANSWER_PANEL = "app/dashboard/assessments/[assessmentId]/answer-panel.tsx";
const DETAIL = "app/dashboard/assessments/[assessmentId]/assessment-detail.tsx";
const LIST = "app/dashboard/assessments/assessment-list.tsx";
const GAPS = "app/dashboard/assessments/[assessmentId]/gaps/gap-register.tsx";

describe("the evidence cap is read, never restated in the browser (F2.3, D-044)", () => {
  it("no page, component or client helper writes the E0→1 … E5→5 table out", () => {
    const table = /0\s*:\s*1\s*,\s*1\s*:\s*2\s*,\s*2\s*:\s*2\s*,\s*3\s*:\s*3/;
    expect(browserFiles.filter((f) => table.test(read(f)))).toEqual([]);
  });

  it("the answer panel says the cap through core's sentences, keeping the E-code in a tooltip", () => {
    const panel = read(ANSWER_PANEL);
    expect(panel).toContain("evidenceCapSentence(");
    expect(panel).toContain("evidenceFileSentence(");
    expect(panel).toMatch(/title=\{`Evidence \$\{evidenceCode\(/);
    expect(panel).not.toContain("capped by E");
  });
});

describe("the claimed level is the spec's answer scale, not the score bands (F2.2)", () => {
  it("the answer panel offers CLAIM_LEVELS and never borrows MATURITY_BANDS", () => {
    const panel = read(ANSWER_PANEL);
    expect(panel).toContain("CLAIM_LEVELS");
    expect(panel).not.toContain("MATURITY_BANDS");
  });
});

describe("no assessment surface shows a raw status code (F2.1, F2.6)", () => {
  it.each([DETAIL, LIST])("%s labels the status", (file) => {
    const source = read(file);
    expect(source).toContain("assessmentStatusLabel(");
    expect(source).not.toMatch(/>\s*\{\s*(a|assessment)\.status\s*\}\s*</);
  });

  it("the list shows a calendar date, never a locale timestamp", () => {
    expect(read(LIST)).not.toContain("toLocaleString");
  });
});

describe("growing lists are paged (F2.5, N2, N5 — D-107)", () => {
  it("the assessments list, the gap register and the register's gaps go through <DataTable>", () => {
    for (const file of [LIST, GAPS, "app/dashboard/ropa/gaps/ropa-gaps.tsx"]) expect(read(file), file).toContain("<DataTable");
  });

  it("every item's evidence or document list pages past ten", () => {
    for (const file of [
      ANSWER_PANEL,
      "app/dashboard/assessments/[assessmentId]/gaps/action-editor.tsx",
      "app/dashboard/register-documents.tsx",
      "app/dashboard/processors/[vendorId]/processor-detail.tsx",
      "app/dashboard/ropa/record-view.tsx",
    ]) {
      expect(read(file), file).toContain("<PagedList");
    }
    expect(read("components/data/paged-list.tsx")).toContain("SHORT_LIST_PAGE_SIZE = 10");
  });

  it("the assessment page shows one domain at a time, in the steps tabs", () => {
    const detail = read(DETAIL);
    expect(detail).toContain('variant="steps"');
    expect(detail).not.toContain("domains-expand-all");
  });
});

describe("the gap register's search never matches on a question code (D-040)", () => {
  it("its search text is built from the question, the domain, the fix and the owners", () => {
    const source = read(GAPS);
    const search = source.slice(source.indexOf("search={{"), source.indexOf("columns={["));
    expect(search).toContain("questionText");
    expect(search).not.toContain("questionCode");
  });
});

describe("questions for my role is a guide, not a lock (F2.4)", () => {
  it("the page filters with core's matcher and always offers All questions", () => {
    const detail = read(DETAIL);
    expect(detail).toContain("isQuestionForRole(");
    expect(detail).toContain('["all", `All questions');
  });
});
