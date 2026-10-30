/**
 * Slice 10.5 Stage B0 — the app shell.
 *
 * The menu moved from a flat row of links into a grouped sidebar. These tests
 * pin what must not move with it: every `nav-*` test id and every permission
 * gate the old layout had (D-100), one page behind every link, and a title for
 * every page. They also cover the client-side paging every growing list uses.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pageNumbers, pageWindow, searchRows, showingLabel, sortRows } from "@/components/data/paging";
import { activeNavGroup, activeNavItem, initialsFor, NAV_GROUPS, NAV_ITEMS, pageTitleFor } from "@/lib/client/nav";

const web = path.resolve(import.meta.dirname, "../..");

/** The old flat menu's links, as they were in `app/dashboard/layout.tsx` before B0 (null: no gate). */
const BEFORE_B0: Record<string, string | null> = {
  "nav-organization": null,
  "nav-scope": null,
  "nav-assessments": "assessment.read",
  "nav-exposure": "score.read",
  "nav-reports": "report.read",
  "nav-actions": "gap.read",
  "nav-ropa": "ropa.read",
  "nav-breaches": "breach.read",
  "nav-rights": "rights.read",
  "nav-consent": "consent.read",
  "nav-processors": "organization.read",
  "nav-retention": "retention.read",
  "nav-ai-risk": "ropa.read",
  "nav-questions": "question.read_bank",
  "nav-users": "organization.users.read",
};

describe("the menu keeps every gate and test id", () => {
  it("every old link is still there, behind the same permission", () => {
    for (const [testId, permission] of Object.entries(BEFORE_B0)) {
      const item = NAV_ITEMS.find((i) => i.testId === testId);
      expect(item, testId).toBeDefined();
      expect(item!.permission ?? null, testId).toBe(permission);
    }
  });

  it("adds only the Overview link, which every member always had", () => {
    const added = NAV_ITEMS.filter((i) => !(i.testId in BEFORE_B0));
    expect(added.map((i) => [i.testId, i.href, i.permission ?? null])).toEqual([["nav-overview", "/dashboard", null]]);
  });

  it("groups them Overview · Programme · Registers · Settings", () => {
    expect(NAV_GROUPS.map((g) => g.label)).toEqual([null, "Programme", "Registers", "Settings"]);
  });

  it("test ids and links are unique, and every link has a page", () => {
    expect(new Set(NAV_ITEMS.map((i) => i.testId)).size).toBe(NAV_ITEMS.length);
    expect(new Set(NAV_ITEMS.map((i) => i.href)).size).toBe(NAV_ITEMS.length);
    for (const item of NAV_ITEMS) expect(existsSync(path.join(web, "app", item.href, "page.tsx")), item.href).toBe(true);
  });

  it("the sidebar renders a gated link only inside <Can>", () => {
    const sidebar = readFileSync(path.join(web, "components/shell/sidebar.tsx"), "utf8");
    expect(sidebar).toMatch(/item\.permission \? <Can permission=\{item\.permission\}>\{link\}<\/Can> : link/);
    expect(sidebar).toContain("data-testid={item.testId}");
  });

  it("the dashboard layout is the shell, inside the permissions and toast providers", () => {
    const layout = readFileSync(path.join(web, "app/dashboard/layout.tsx"), "utf8");
    expect(layout).toMatch(/<PermissionsProvider>\s*<ToastProvider>\s*<AppShell>\{children\}<\/AppShell>/);
  });

  it("the top bar shows the role from the permissions context and keeps Sign out", () => {
    const topbar = readFileSync(path.join(web, "components/shell/topbar.tsx"), "utf8");
    expect(topbar).toContain("permissions.value.roleName");
    expect(topbar).toContain('data-testid="topbar-role"');
    expect(topbar).toContain("action={signOut}");
    expect(topbar).toMatch(/"Sign out"/);
  });
});

describe("the shell's test ids are its own", () => {
  /** Every literal `data-testid="…"` in a tree of .tsx files. */
  function testIds(dir: string): string[] {
    return readdirSync(path.join(web, dir), { recursive: true, withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith(".tsx"))
      .flatMap((d) => [...readFileSync(path.join(d.parentPath, d.name), "utf8").matchAll(/data-testid="([^"]+)"/g)].map((m) => m[1]!));
  }

  it("no page reuses one (the shell is on every page, so a clash breaks strict lookups)", () => {
    const pages = new Set(testIds("app").filter((id) => id !== "organization-switcher" && id !== "switch-error"));
    for (const id of testIds("components/shell")) expect(pages.has(id), id).toBe(false);
  });
});

describe("the page title follows the path", () => {
  it.each([
    ["/dashboard", "Overview", null],
    ["/dashboard/", "Overview", null],
    ["/dashboard/breaches", "Breach register", "Registers"],
    ["/dashboard/breaches/new", "Breach register", "Registers"],
    ["/dashboard/breaches/0b000010-0000-4000-8000-000000000001", "Breach register", "Registers"],
    ["/dashboard/ropa/gaps", "Processing register", "Registers"],
    ["/dashboard/assessments/x/gaps", "Assessments", "Programme"],
    ["/dashboard/ai-risk/abc", "AI risk register", "Registers"],
    ["/dashboard/users", "Users", "Settings"],
    // Slice 10.5 B1 (F1.10): the page holds four settings, so its title says so.
    ["/dashboard/organization", "Organisation settings", "Settings"],
  ])("%s → %s", (pathname, title, group) => {
    expect(pageTitleFor(pathname)).toBe(title);
    expect(activeNavGroup(pathname)).toBe(group);
  });

  // Slice 10.5 B3 (F3.1): one name per register — the menu says what the top bar says.
  it("every register's menu label is its top bar title", () => {
    const registers = NAV_GROUPS.find((g) => g.label === "Registers")!.items;
    expect(registers.map((i) => i.label)).toEqual([
      "Processing register",
      "Breach register",
      "Rights and grievances",
      "Notice and consent",
      "Processors",
      "Retention register",
      "AI risk register",
    ]);
    for (const item of registers) expect(item.title, item.href).toBe(item.label);
  });

  it("a prefix is not a match: /dashboard/ropa-something is not the register", () => {
    expect(activeNavItem("/dashboard/ropa-something")?.href ?? null).toBe(null);
    expect(pageTitleFor("/dashboard/ropa-something")).toBe("DPDP Compass");
  });
});

describe("initials", () => {
  it.each([
    ["MU Legal Counsel", "a@b.c", "MC"],
    ["Asha", "a@b.c", "AS"],
    ["Registrar (DPDP Programme Owner)", "a@b.c", "RE"],
    ["Dean (Executive Sponsor)", null, "DE"],
    ["  Ravi   Kumar  ", null, "RK"],
    [null, "dpdp.owner@mu.example.com", "DP"],
    ["", "", "?"],
  ])("%s / %s → %s", (name, email, expected) => {
    expect(initialsFor(name, email)).toBe(expected);
  });
});

describe("client-side paging (DataTable)", () => {
  const rows = Array.from({ length: 140 }, (_, i) => ({ n: i + 1, name: `Row ${i + 1}` }));

  it("25 a page: page 1 shows 1–25 of 140, the last page 126–140", () => {
    expect(showingLabel(pageWindow(140, 1, 25))).toBe("Showing 1–25 of 140");
    const last = pageWindow(140, 6, 25);
    expect([last.start, last.end, last.pageCount]).toEqual([125, 140, 6]);
    expect(showingLabel(last)).toBe("Showing 126–140 of 140");
  });

  it("clamps a page out of range, and says so when there is nothing", () => {
    expect(pageWindow(140, 99, 25).page).toBe(6);
    expect(pageWindow(140, 0, 25).page).toBe(1);
    expect(pageWindow(0, 3, 25)).toMatchObject({ page: 1, pageCount: 1, start: 0, end: 0 });
    expect(showingLabel(pageWindow(0, 1, 25), "breaches")).toBe("No breaches");
  });

  it("offers the first, last and neighbouring pages, with gaps", () => {
    expect(pageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageNumbers(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
    expect(pageNumbers(1, 12)).toEqual([1, 2, "gap", 12]);
    expect(pageNumbers(3, 12)).toEqual([1, 2, 3, 4, "gap", 12]);
  });

  it("searches every word, case-insensitively, and keeps the order", () => {
    expect(searchRows(rows, "row 1", (r) => r.name).map((r) => r.n).slice(0, 3)).toEqual([1, 10, 11]);
    expect(searchRows(rows, "  ", (r) => r.name)).toHaveLength(140);
    expect(searchRows(rows, "ROW 14 0", (r) => r.name).map((r) => r.n)).toEqual([140]);
  });

  it("sorts numbers as numbers, keeps ties stable, and puts empty values last both ways", () => {
    const mixed = [
      { id: "a", v: 10 as number | null },
      { id: "b", v: null },
      { id: "c", v: 2 },
      { id: "d", v: 10 },
    ];
    expect(sortRows(mixed, (r) => r.v, "asc").map((r) => r.id)).toEqual(["c", "a", "d", "b"]);
    expect(sortRows(mixed, (r) => r.v, "desc").map((r) => r.id)).toEqual(["a", "d", "c", "b"]);
    const codes = [{ c: "ROPA-010" }, { c: "ROPA-002" }, { c: "ROPA-001" }];
    expect(sortRows(codes, (r) => r.c, "asc").map((r) => r.c)).toEqual(["ROPA-001", "ROPA-002", "ROPA-010"]);
  });
});
