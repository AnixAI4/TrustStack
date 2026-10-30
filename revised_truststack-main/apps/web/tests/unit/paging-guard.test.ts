/**
 * Slice 10.5 — the paging guard (D-107).
 *
 * Every list of records a page renders row by row (`.map(… => <li>)` or
 * `<tr>`) outside `<DataTable>` is counted per file and must be accounted
 * for below, with the reason it may stay unpaged — a fixed set (sixteen
 * domains, seven sections), a short list by rule (ten documents a link), a
 * top-N summary that links to its paged register — or the batch that owes
 * its paging ("owed: N6, B3").
 *
 * A new list that can grow therefore cannot ship unpaged: the count rises
 * and this fails until the list goes through `<DataTable>` or is allowlisted
 * with a reason. A list moved to `<DataTable>` lowers the count, and this
 * fails until the entry is lowered too — so the "owed" lines stay a true
 * to-do list. Cards built with `<div>`s are not counted: review them by eye.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const web = path.resolve(import.meta.dirname, "../..");

/** Rows mapped from a list: `.map((x) => (<li` / `<tr`, or a block body that returns one. */
const ROW_MAP = /\.map\(\s*\(?[^)=]*\)?\s*=>\s*(?:\{[^{}]*?return\s*\(?\s*|\(?\s*)<(li|tr)\b/g;

const ALLOWED: Record<string, { rows: number; why: string }> = {
  "components/data/data-table.tsx": { rows: 1, why: "the paged table itself" },
  "components/ai/assistant-panel.tsx": {
    rows: 3,
    why: "one answer's own lists, bounded by its schema: at most eight provisions, eight suggested evidence items, eight unknowns (Slice 11 Stage 1b)",
  },
  "components/ai/draft-panel.tsx": {
    rows: 2,
    why: "one draft's own lists, bounded by its schema: at most eight provisions and eight unknowns (Slice 11 Stage 2a)",
  },
  "app/dashboard/actions/actions-dashboard.tsx": { rows: 1, why: "one owner's actions in the By owner tab; every action is also in the paged All actions tab" },
  "app/dashboard/assessments/[assessmentId]/assessment-detail.tsx": {
    rows: 2,
    why: "sixteen domain cards (fixed); ONE domain's questions at a time, at most twelve (N2, B2 — the domain pills page them)",
  },
  "app/dashboard/assessments/[assessmentId]/gaps/roadmap.tsx": { rows: 1, why: "a 30/60/90 bucket's actions; every action is also in the paged All actions table" },
  "app/dashboard/assessments/[assessmentId]/score-panel.tsx": { rows: 2, why: "red flags (a fixed rule set) and the sixteen domain rows (fixed)" },
  "app/dashboard/consent/consent-home.tsx": { rows: 1, why: "one notice per language — at most 22" },
  "app/dashboard/consent/notices/notice-editor.tsx": { rows: 2, why: "a notice's own purposes, and its validation problems" },
  "app/dashboard/executive-overview.tsx": { rows: 4, why: "overview summaries (red flags, clocks, attention, overdue), each linking to its paged register" },
  "app/dashboard/exposure/exposure-command-centre.tsx": { rows: 9, why: "the model's fixed lists (heads, factors, notes) and the top-leverage few, in four tabs (N3, B4)" },
  "app/dashboard/next-steps.tsx": { rows: 1, why: "a person's own five most urgent actions; all of them are in the paged My actions tab" },
  "app/dashboard/processors/[vendorId]/assessments/[assessmentId]/questionnaire.tsx": {
    rows: 3,
    why: "the reviewer's flags (a fixed rule set), the seven-section review, the vendor's earlier versions (one a review cycle)",
  },
  "app/dashboard/processors/[vendorId]/processor-detail.tsx": { rows: 1, why: "assessment versions (one a review cycle); its documents page past ten (<PagedList>, F2.5)" },
  "app/dashboard/questions/question-bank-browser.tsx": { rows: 2, why: "sixteen domains and the twenty packs (reference data, fixed)" },
  "app/dashboard/reports/reports-centre.tsx": { rows: 1, why: "\"Which report do I need?\" — one line per report kind (fixed, seven PDFs or three files, F4.8); the stored reports are paged" },
  "app/dashboard/retention/[scheduleId]/schedule-detail.tsx": { rows: 1, why: "one schedule's erasures — one a retention cycle" },
  "app/dashboard/ropa/import/ropa-import.tsx": { rows: 1, why: "a sheet's columns (few, one per field it reads); its rows and problems are paged (N6, B3)" },
  "app/dashboard/ropa/record-view.tsx": { rows: 2, why: "the risk model's factors (fixed) and a record's own open gaps (a few, linking to the paged register); its evidence pages past ten (<PagedList>, F2.5)" },
  "app/dashboard/scope/scope-wizard.tsx": { rows: 5, why: "the wizard's steps, tags and packs (fixed); the systems and vendors an admin types — page them if one passes 25" },
  "app/dashboard/users/users-panel.tsx": { rows: 2, why: "pending invitations — they expire in days; the role guide (the nine organisation roles, fixed)" },
  "app/p/[slug]/notice/page.tsx": { rows: 2, why: "the published notice's own purposes and data items" },
  "app/v/[token]/vendor-questionnaire.tsx": { rows: 2, why: "the vendor's documents (ten a link at most) and the seven-section review" },
};

function tsxFiles(dir: string): string[] {
  return readdirSync(path.join(web, dir), { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".tsx"))
    .map((d) => path.relative(web, path.join(d.parentPath, d.name)).split(path.sep).join("/"));
}

const found: Record<string, number> = {};
for (const file of [...tsxFiles("app"), ...tsxFiles("components")]) {
  const n = [...readFileSync(path.join(web, file), "utf8").matchAll(ROW_MAP)].length;
  if (n > 0) found[file] = n;
}

describe("every list a page renders row by row is paged or accounted for (D-107)", () => {
  it("no file renders more unpaged lists than it is allowed — page the new one with <DataTable>, or allowlist it with its reason", () => {
    const over = Object.entries(found)
      .filter(([file, n]) => n > (ALLOWED[file]?.rows ?? 0))
      .map(([file, n]) => `${file}: ${n} lists rendered row by row, ${ALLOWED[file]?.rows ?? 0} allowed`);
    expect(over).toEqual([]);
  });

  it("no allowance is larger than it needs to be — lower it when a list moves to <DataTable>", () => {
    const stale = Object.entries(ALLOWED)
      .filter(([file, a]) => (found[file] ?? 0) < a.rows)
      .map(([file, a]) => `${file}: allowed ${a.rows}, found ${found[file] ?? 0}`);
    expect(stale).toEqual([]);
  });

  it("every allowance says why", () => {
    for (const [file, a] of Object.entries(ALLOWED)) expect(a.why.length, file).toBeGreaterThan(10);
  });
});
