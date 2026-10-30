"use client";

import { ChevronDown, LogOut, Menu, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OrganizationSwitcher, type OrgOption } from "@/app/dashboard/organization-switcher";
import { signOut } from "@/app/login/actions";
import { apiFetch } from "@/lib/client/api";
import { activeNavGroup, initialsFor, pageTitleFor } from "@/lib/client/nav";
import { usePermissions } from "@/lib/client/permissions";

interface Me {
  user: { id: string; email: string; fullName: string | null } | null;
}

/**
 * The fixed top bar (Slice 10.5 Stage B0): the page title on the left; on the
 * right the organisation switcher and who is signed in — initials, name, a
 * role badge and the organisation — with a menu (profile, Sign out). Every
 * page therefore shows who is signed in, as which role, in which organisation.
 *
 * The role is the permissions context's `roleName` for the ACTIVE
 * organisation; the name and organisation come from the existing `/auth/me`
 * reads. No new API.
 */
export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const permissions = usePermissions();
  const [me, setMe] = useState<Me["user"]>(null);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<Me>("/api/v1/auth/me").then((r) => {
      if (r.success) setMe(r.data.user);
    });
    apiFetch<{ organizations: OrgOption[] }>("/api/v1/auth/me/organizations").then((r) => {
      if (r.success) setOrgs(r.data.organizations);
    });
  }, []);

  // Close the menu on a click outside it or on Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const roleName = permissions.kind === "ready" ? permissions.value.roleName : null;
  const activeOrg = orgs.find((o) => o.isActive) ?? (permissions.kind === "ready" ? orgs.find((o) => o.id === permissions.value.organizationId) : undefined);
  const name = me?.fullName?.trim() || me?.email || "";
  const group = activeNavGroup(pathname);

  return (
    <header data-testid="app-topbar" className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 shadow-nav sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        data-testid="menu-open"
        aria-label="Open the menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-surface-subtle lg:hidden"
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        {group && <p className="hidden text-[11px] font-semibold uppercase tracking-wider text-ink-muted sm:block">{group}</p>}
        <h1 data-testid="page-title" className="truncate font-display text-base font-semibold text-ink sm:text-lg sm:leading-tight">
          {pageTitleFor(pathname)}
        </h1>
      </div>

      <div className="hidden md:block">
        <OrganizationSwitcher orgs={orgs} />
      </div>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          data-testid="user-menu"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1 text-left hover:bg-surface-subtle sm:px-2 ${open ? "bg-surface-subtle" : ""}`}
        >
          {/* A phone gives the page title the room (Slice 10.5 B1, F1.7): the role is in the account menu. */}
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white"
          >
            {me ? initialsFor(me.fullName, me.email) : ""}
          </span>
          <span className="hidden min-w-0 leading-tight sm:block">
            <span className="flex items-center gap-1.5">
              <span data-testid="topbar-user-name" className="max-w-[16rem] truncate text-sm font-medium text-ink">
                {name}
              </span>
              {roleName && (
                <span data-testid="topbar-role" className="whitespace-nowrap rounded-full bg-brand-blue-pale px-2 py-0.5 text-[11px] font-semibold text-brand-navy ring-1 ring-brand-blue/20">
                  {roleName}
                </span>
              )}
            </span>
            <span data-testid="topbar-organization" className="block max-w-[16rem] truncate text-xs text-ink-soft">
              {activeOrg?.name ?? ""}
            </span>
          </span>
          <span className="sr-only">
            Signed in as {name}
            {roleName ? `, ${roleName}` : ""}
            {activeOrg ? `, ${activeOrg.name}` : ""}. Open the account menu.
          </span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-muted" />
        </button>

        {open && (
          <div
            role="menu"
            data-testid="user-menu-panel"
            className="absolute right-0 z-40 mt-1 w-72 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-card-hover"
          >
            <div className="border-b border-line-light px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink">{name}</p>
              {me?.email && me.email !== name && <p className="truncate text-xs text-ink-soft">{me.email}</p>}
              {roleName && (
                <p className="mt-2 text-xs text-ink-soft">
                  Signed in as <span className="font-semibold text-brand-navy">{roleName}</span>
                  {activeOrg ? <> in {activeOrg.name}</> : null}
                </p>
              )}
            </div>
            {/* On a phone the switcher lives here, not in the bar. */}
            {orgs.length > 1 && (
              <div className="border-b border-line-light px-4 py-3 md:hidden">
                <p className="mb-1 text-xs text-ink-soft">Organisation</p>
                <MobileSwitcher orgs={orgs} />
              </div>
            )}
            <Link
              href="/dashboard/organization"
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-surface-muted"
            >
              <Settings aria-hidden="true" className="h-4 w-4 text-ink-muted" />
              Organisation settings
            </Link>
            <form
              action={signOut}
              onSubmit={() => setSigningOut(true)}
              className="mt-1 border-t border-line-light pt-1"
            >
              <button
                type="submit"
                role="menuitem"
                disabled={signingOut}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger-text hover:bg-danger-light disabled:opacity-60"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

/** The phone's copy of the switcher, inside the account menu (the bar has no room). */
function MobileSwitcher({ orgs }: { orgs: OrgOption[] }) {
  const [pending, setPending] = useState(false);
  const active = orgs.find((o) => o.isActive)?.id ?? orgs[0]?.id;
  return (
    <select
      aria-label="Organisation"
      value={active}
      disabled={pending}
      onChange={async (e) => {
        setPending(true);
        const r = await apiFetch("/api/v1/auth/switch-organization", {
          method: "POST",
          body: JSON.stringify({ organizationId: e.target.value }),
        });
        if (r.success) window.location.reload();
        else setPending(false);
      }}
      className="w-full rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm"
    >
      {orgs.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name} · {o.roleName}
        </option>
      ))}
    </select>
  );
}
