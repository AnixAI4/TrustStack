/**
 * Slice 10.5 Batch B3 — the registers: guards on what the pages may SAY and
 * SHOW. The wording rules themselves (periods in years, the exemption's short
 * name, the request's status, the questionnaire's progress, people types, the
 * record's tabs, the import template, the s.7(a) ground) are tested in
 * packages/core `register-display.test.ts`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const web = path.resolve(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(path.join(web, file), "utf8");

const RECORD = "app/dashboard/ropa/record-view.tsx";
const REGISTER = "app/dashboard/ropa/ropa-register.tsx";
const CONSENT = "app/dashboard/consent/consent-home.tsx";
const NOTICE = "app/dashboard/consent/notices/notice-editor.tsx";
const QUESTIONNAIRE = "app/dashboard/processors/[vendorId]/assessments/[assessmentId]/questionnaire.tsx";

describe("a processing record in tabs, saved once (F3.2)", () => {
  const record = read(RECORD);

  it("one Save for every tab: a single submit, outside the tabs, tied to the form by id", () => {
    expect(record.match(/data-testid="ropa-save"/g)).toHaveLength(1);
    expect(record).toMatch(/type="submit"\s+form=\{formId\}\s+data-testid="ropa-save"/);
    expect(record).toContain("<form id={formId} onSubmit={save}");
  });

  it("the tabs come from core's grouping, and their points from the record's own areas (D-061)", () => {
    expect(record).toContain("ROPA_RECORD_TABS");
    expect(record).toContain("ropaTabPoints(record.areas,");
  });

  it("every one of the thirteen areas is still on the form, once", () => {
    for (const code of ["identity", "department_owner", "data_principals", "data_categories", "purpose_basis", "collection_source", "systems", "vendors", "notice_consent", "retention", "security", "risk_review", "evidence"]) {
      expect(record.match(new RegExp(`<AreaSection code="${code}"`, "g")), code).toHaveLength(1);
    }
  });

  it("the lawful ground reads in words, the section in brackets (F3.5)", () => {
    expect(record).toContain("{b.label} ({b.section})");
  });
});

describe("one primary action on the register (F3.3)", () => {
  it("Import, Export, Ask and Gaps sit under More, keeping their test ids", () => {
    const register = read(REGISTER);
    const more = register.slice(register.indexOf("<MoreMenu"), register.indexOf("</MoreMenu>"));
    for (const id of ["ropa-import-link", "ropa-export", "ropa-lookup-link", "ropa-gaps-link"]) expect(more, id).toContain(`data-testid="${id}"`);
    expect(more).not.toContain('data-testid="ropa-new"');
  });
});

describe("consent says purposes by title, in tabs (F3.6) — and checks a notice only once it is touched (F3.7)", () => {
  it("no stale model version in the copy", () => {
    expect(read(CONSENT)).not.toMatch(/exposure model \d/);
  });

  it("staff views map purpose keys to titles", () => {
    const consent = read(CONSENT);
    expect(consent).not.toMatch(/purposes\.join\(", "\)/);
    expect(consent).toContain('id: "notice"');
    expect(consent).toContain('id: "widget"');
    expect(consent).toContain('id: "records"');
  });

  it("a blank notice shows no problems until a field is left or Save is pressed", () => {
    expect(read(NOTICE)).toMatch(/problems\.length > 0 && \(touched \|\| notice !== null\)/);
  });
});

describe("the other registers in words (F3.8–F3.11)", () => {
  it("processors: no 'Never assessed', no dotted counts, claims named by question", () => {
    expect(read("app/dashboard/processors/processor-register.tsx")).not.toContain("Never assessed");
    const q = read(QUESTIONNAIRE);
    expect(q).not.toContain("Answered · not applicable · of");
    expect(q).toContain("questionnaireProgress(");
    expect(q).toContain("claimNames(assessment.unevidenced)");
  });

  it("retention periods go through the years helper", () => {
    for (const f of ["app/dashboard/retention/retention-register.tsx", "app/dashboard/retention/[scheduleId]/schedule-detail.tsx"]) {
      const source = read(f);
      expect(source, f).toContain("formatRetentionPeriod(");
      expect(source, f).not.toMatch(/periodMonths\}\s*months/);
    }
  });

  it("the AI record names the exemption, the code in brackets", () => {
    expect(read("app/dashboard/ai-risk/[aiSystemId]/ai-detail.tsx")).toContain("childExemptionShort(a.childExemption)");
  });

  it("a request's status is the same phrase in the list and the record", () => {
    expect(read("app/dashboard/rights/rights-register.tsx")).toContain("rightsStatusText(r.statusLabel, r.response?.outcomeLabel)");
    expect(read("app/dashboard/rights/[requestId]/rights-detail.tsx")).toContain("rightsStatusText(r.statusLabel, r.response?.outcomeLabel)");
  });
});

describe("import and look-up (F3.12)", () => {
  it("the import offers core's template; the look-up folds people types and says what it is for", () => {
    expect(read("app/dashboard/ropa/import/ropa-import.tsx")).toContain("ropaImportTemplateCsv()");
    const lookup = read("app/dashboard/ropa/lookup/ropa-lookup.tsx");
    expect(lookup).toContain("foldPeopleTypes(options.principals)");
    expect(lookup).toContain('data-testid="ropa-lookup-purpose"');
  });
});
