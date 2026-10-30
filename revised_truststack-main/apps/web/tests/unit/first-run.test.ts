/**
 * Slice 10.5 Batch B1 — first-run and the overview: the browser-side wording
 * and one black-box guard. The rules themselves (Not started, next steps,
 * assignable roles) are tested in packages/core `first-run.test.ts`.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { daysToDeadlineText, finishDateText } from "@/lib/client/exposure";

const web = path.resolve(import.meta.dirname, "../..");

describe("the exposure tile's deadline line (F1.3)", () => {
  it("reads as a sentence: 208 days to 13 May 2027", () => {
    expect(daysToDeadlineText(208, "2027-05-13")).toBe("208 days to 13 May 2027");
    expect(daysToDeadlineText(1, "2027-05-13")).toBe("1 day to 13 May 2027");
    expect(daysToDeadlineText(1500, "2027-05-13")).toBe("1,500 days to 13 May 2027");
  });

  it("says when the day has come or passed, never a negative count", () => {
    expect(daysToDeadlineText(0, "2027-05-13")).toBe("13 May 2027 is today");
    expect(daysToDeadlineText(-3, "2027-05-13")).toBe("3 days past 13 May 2027");
  });

  it("puts the forecast's own state into words", () => {
    expect(finishDateText({ outstanding: 4, p50Date: null }, true)).toBe("finish date: not enough history yet");
    expect(finishDateText({ outstanding: 4, p50Date: "2027-02-01" }, false)).toBe("finish date: 1 Feb 2027");
    expect(finishDateText({ outstanding: 4, p50Date: null }, false)).toBe("finish date: beyond five years");
    expect(finishDateText({ outstanding: 0, p50Date: null }, true)).toBe("finish date: nothing open");
  });
});

describe("industry labels never bring the bank into the browser (F1.2, D-071)", () => {
  // Core's INDUSTRIES carries each industry's overlay pack code. Labels come from GET /api/v1/industries.
  const files = ["app", "components", "lib/client"].flatMap((dir) =>
    readdirSync(path.join(web, dir), { recursive: true, withFileTypes: true })
      .filter((d) => d.isFile() && /\.tsx?$/.test(d.name) && !d.parentPath.includes(`${path.sep}api`))
      .map((d) => path.join(d.parentPath, d.name)),
  );

  it("no page, component or client helper imports INDUSTRIES or an overlay pack code", () => {
    const imports = /import\s*\{[^}]*\bINDUSTRIES\b[^}]*\}\s*from\s*"@truststack\/core"|\.overlayPackCode\b/;
    const offenders = files.filter((f) => imports.test(readFileSync(f, "utf8")));
    expect(offenders.map((f) => path.relative(web, f))).toEqual([]);
  });
});
