import type { PermissionCode } from "@truststack/core";

/**
 * The app shell's menu (Slice 10.5 Stage B0, D-101): one list, grouped, read
 * by the sidebar and by the top bar's page title.
 *
 * Every entry keeps the permission gate and the `nav-*` test id the old flat
 * menu had (D-100: "every `<Can>` gate and every `nav-*` data-testid stays").
 * Hiding a link is presentation only — every route enforces on the server.
 */
export type NavIcon =
  | "overview"
  | "assessments"
  | "actions"
  | "exposure"
  | "reports"
  | "processing"
  | "breaches"
  | "rights"
  | "consent"
  | "processors"
  | "retention"
  | "ai"
  | "organisation"
  | "scope"
  | "users"
  | "questions";

export interface NavItem {
  href: string;
  /** Short label in the menu. */
  label: string;
  /** The page title in the top bar. */
  title: string;
  testId: string;
  /** Absent: every member sees it (as before). */
  permission?: PermissionCode;
  icon: NavIcon;
}

export interface NavGroup {
  /** Null for the ungrouped Overview. */
  label: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Overview", title: "Overview", testId: "nav-overview", icon: "overview" }],
  },
  {
    label: "Programme",
    items: [
      { href: "/dashboard/assessments", label: "Assessments", title: "Assessments", testId: "nav-assessments", permission: "assessment.read", icon: "assessments" },
      { href: "/dashboard/actions", label: "Actions", title: "Actions", testId: "nav-actions", permission: "gap.read", icon: "actions" },
      { href: "/dashboard/exposure", label: "Exposure", title: "Exposure", testId: "nav-exposure", permission: "score.read", icon: "exposure" },
      { href: "/dashboard/reports", label: "Reports", title: "Reports", testId: "nav-reports", permission: "report.read", icon: "reports" },
    ],
  },
  {
    label: "Registers",
    items: [
      { href: "/dashboard/ropa", label: "Processing register", title: "Processing register", testId: "nav-ropa", permission: "ropa.read", icon: "processing" },
      { href: "/dashboard/breaches", label: "Breach register", title: "Breach register", testId: "nav-breaches", permission: "breach.read", icon: "breaches" },
      { href: "/dashboard/rights", label: "Rights and grievances", title: "Rights and grievances", testId: "nav-rights", permission: "rights.read", icon: "rights" },
      { href: "/dashboard/consent", label: "Notice and consent", title: "Notice and consent", testId: "nav-consent", permission: "consent.read", icon: "consent" },
      { href: "/dashboard/processors", label: "Processors", title: "Processors", testId: "nav-processors", permission: "organization.read", icon: "processors" },
      { href: "/dashboard/retention", label: "Retention register", title: "Retention register", testId: "nav-retention", permission: "retention.read", icon: "retention" },
      { href: "/dashboard/ai-risk", label: "AI risk register", title: "AI risk register", testId: "nav-ai-risk", permission: "ropa.read", icon: "ai" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/dashboard/organization", label: "Organisation", title: "Organisation settings", testId: "nav-organization", icon: "organisation" },
      { href: "/dashboard/scope", label: "Scope", title: "Scope", testId: "nav-scope", icon: "scope" },
      { href: "/dashboard/users", label: "Users", title: "Users", testId: "nav-users", permission: "organization.users.read", icon: "users" },
      // The whole bank is Anix's view (D-068, D-071).
      { href: "/dashboard/questions", label: "Question bank", title: "Question bank", testId: "nav-questions", permission: "question.read_bank", icon: "questions" },
    ],
  },
];

export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** The menu entry a path belongs to: Overview only on `/dashboard` itself, otherwise the longest matching section. */
export function activeNavItem(pathname: string): NavItem | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/dashboard") return NAV_ITEMS[0] ?? null;
  let best: NavItem | null = null;
  for (const item of NAV_ITEMS) {
    if (item.href === "/dashboard") continue;
    if ((path === item.href || path.startsWith(`${item.href}/`)) && (!best || item.href.length > best.href.length)) best = item;
  }
  return best;
}

/** The group a path's entry sits in ("Registers"), or null. */
export function activeNavGroup(pathname: string): string | null {
  const item = activeNavItem(pathname);
  if (!item) return null;
  return NAV_GROUPS.find((g) => g.items.includes(item))?.label ?? null;
}

/** The top bar's title for a path. */
export function pageTitleFor(pathname: string): string {
  return activeNavItem(pathname)?.title ?? "DPDP Compass";
}

/** Up to two initials from a name (a bracketed role in it is ignored), else from the email's local part. */
export function initialsFor(name: string | null | undefined, email: string | null | undefined): string {
  const words = (name ?? "")
    .replace(/\([^)]*\)/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) return `${words[0]![0]}${words[words.length - 1]![0]}`.toUpperCase();
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  const local = (email ?? "").split("@")[0] ?? "";
  return local.slice(0, 2).toUpperCase() || "?";
}
