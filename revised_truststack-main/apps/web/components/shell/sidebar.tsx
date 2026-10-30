"use client";

import {
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Compass,
  Database,
  FileCheck2,
  FileText,
  Gauge,
  Hourglass,
  LayoutDashboard,
  Library,
  ListChecks,
  MessageSquareText,
  Shield,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Can } from "@/lib/client/permissions";
import { activeNavItem, NAV_GROUPS, type NavIcon, type NavItem } from "@/lib/client/nav";

const ICONS: Record<NavIcon, LucideIcon> = {
  overview: LayoutDashboard,
  assessments: ClipboardCheck,
  actions: ListChecks,
  exposure: Gauge,
  reports: BarChart3,
  processing: Database,
  breaches: AlertTriangle,
  rights: MessageSquareText,
  consent: FileCheck2,
  processors: Truck,
  retention: Hourglass,
  ai: Bot,
  organisation: Building2,
  scope: Compass,
  users: Users,
  questions: Library,
};

/**
 * The fixed navy menu (Slice 10.5 Stage B0): grouped Programme / Registers /
 * Settings, icons, the active page highlighted, collapsible to icons on a
 * laptop and a drawer on a phone. Each link keeps its `nav-*` test id and its
 * `<Can>` gate (presentation only — the API enforces).
 */
export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const active = activeNavItem(pathname);
  // The drawer always shows labels; only the laptop rail collapses.
  const narrow = collapsed && !mobileOpen;

  return (
    <>
      {mobileOpen && (
        <div aria-hidden="true" onClick={onCloseMobile} className="fixed inset-0 z-30 bg-brand-navy-dark/50 lg:hidden" />
      )}
      <aside
        data-testid="app-sidebar"
        aria-label="Main menu"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-navy text-white shadow-nav transition-transform duration-200 lg:static lg:translate-x-0 lg:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full max-lg:invisible"
        } ${collapsed ? "lg:w-16" : "lg:w-60"}`}
      >
        <div className={`flex h-14 shrink-0 items-center gap-2.5 border-b border-white/10 ${narrow ? "justify-center px-0" : "px-4"}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
            <Shield aria-hidden="true" className="h-4 w-4" />
          </span>
          {!narrow && (
            <div className="min-w-0 flex-1 leading-tight">
              <p data-testid="app-brand" className="font-display text-sm font-semibold">
                TrustStack<span className="align-super text-[9px]">™</span>
              </p>
              <p className="truncate text-xs text-white/60">DPDP Compass</p>
            </div>
          )}
          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 hover:bg-white/10 lg:hidden"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav aria-label="Sections" className="ts-scroll-dark flex-1 overflow-y-auto py-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label ?? `group-${gi}`} className={gi > 0 ? "mt-4" : undefined}>
              {group.label &&
                (narrow ? (
                  <div aria-hidden="true" className="mx-4 mb-2 border-t border-white/10" />
                ) : (
                  <p className="mb-1 px-5 text-[11px] font-semibold uppercase tracking-wider text-white/45">{group.label}</p>
                ))}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} active={active?.href === item.href} narrow={narrow} onNavigate={onCloseMobile} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="hidden shrink-0 border-t border-white/10 p-2 lg:block">
          <button
            type="button"
            data-testid="sidebar-collapse"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand the menu" : "Collapse the menu"}
            aria-expanded={!collapsed}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            {collapsed ? <ChevronRight aria-hidden="true" className="h-4 w-4" /> : <ChevronLeft aria-hidden="true" className="h-4 w-4" />}
            {!collapsed && "Collapse menu"}
          </button>
        </div>
      </aside>
    </>
  );
}

function NavLink({ item, active, narrow, onNavigate }: { item: NavItem; active: boolean; narrow: boolean; onNavigate: () => void }) {
  const Icon = ICONS[item.icon] ?? FileText;
  const link = (
    <li>
      <Link
        href={item.href}
        data-testid={item.testId}
        aria-current={active ? "page" : undefined}
        aria-label={narrow ? item.label : undefined}
        title={narrow ? item.label : undefined}
        onClick={onNavigate}
        className={`mx-2 flex items-center gap-3 rounded-lg py-2 text-sm transition-colors ${narrow ? "justify-center px-0" : "px-3"} ${
          active ? "bg-white/15 font-medium text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        {!narrow && <span className="truncate">{item.label}</span>}
      </Link>
    </li>
  );
  return item.permission ? <Can permission={item.permission}>{link}</Can> : link;
}
