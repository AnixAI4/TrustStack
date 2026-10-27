"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  LogOut,
  Loader2,
  Menu,
  X,
  ArrowUpRight,
  Settings,
  UserRound,
} from "lucide-react";
import { Logo } from "./Logo";
import { SiteSettingsMenu } from "./SiteSettingsMenu";
import { SettingsPanel } from "./SettingsPanel";
import { ThemeToggle } from "./ThemeToggle";
import { PRIMARY_NAV, MOBILE_NAV } from "@/content/site";
import { cn } from "@/lib/cn";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { DPDP_SCANNER_URL } from "@/content/home";
import { PilotLockLink } from "@/components/gates/PilotLockLink";
import { featureForHref } from "@/lib/paid-routes";

function accountLabel(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const metaName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    "";
  if (metaName.trim()) return metaName.trim();
  // Prefer local-part so a long college email doesn't blow out the navbar.
  if (user.email) return user.email.split("@")[0] || user.email;
  return "Account";
}

export function AccountMenu({
  className,
  variant = "desktop",
  onAfterSignOut,
  up = false,
}: {
  className?: string;
  variant?: "desktop" | "drawer";
  onAfterSignOut?: () => void;
  up?: boolean;
}) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { tier, loading: subLoading } = useSubscription();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      // Language / a11y menus portal to document.body - don't treat them as outside.
      if (target instanceof Element && target.closest("[data-anchored-menu]")) {
        return;
      }
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (authLoading || !user) return null;

  const isPilot = tier === "pilot";
  const label = accountLabel(user);
  const fullTitle = `${user.email ?? label} · ${isPilot ? "Pilot active" : "Free plan"}`;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      setOpen(false);
      onAfterSignOut?.();
      window.location.assign("/welcome");
    } finally {
      setSigningOut(false);
    }
  }

  if (variant === "drawer") {
    return (
      <div className={cn("flex w-full flex-col gap-3", className)}>
        <div className="rounded-xl border border-line bg-glass/40 p-3">
          <div className="flex min-w-0 items-center gap-1.5" title={fullTitle}>
            <Settings className="h-4 w-4 shrink-0 text-text-faint" />
            <span className="min-w-0 truncate text-sm font-semibold text-text">
              {subLoading ? "…" : label}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-pill px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.08em]",
                isPilot ? "bg-accent/15 text-accent" : "bg-surface-2 text-text-faint"
              )}
            >
              {subLoading ? "…" : isPilot ? "Pilot" : "Free"}
            </span>
          </div>
          {user.email && (
            <p className="mt-1 truncate text-xs text-text-faint">{user.email}</p>
          )}
          <div className="mt-3 flex flex-col gap-1.5">
            <Link
              href="/account"
              prefetch={false}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              onClick={() => onAfterSignOut?.()}
            >
              <UserRound className="h-4 w-4" />
              Account
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Log out
            </button>
          </div>
        </div>
        <div>
          <p className="mb-2 px-1 font-mono text-label uppercase tracking-[0.18em] text-text-faint">
            Settings
          </p>
          <SettingsPanel up />
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "flex min-w-0 max-w-[16.5rem] items-center gap-2.5 rounded-pill border border-line bg-glass px-3.5 py-2 leading-none transition-colors hover:bg-surface-2",
          open && "border-accent/40 bg-surface-2"
        )}
        title={fullTitle}
        aria-label="Account and settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Settings className="h-4 w-4 shrink-0 text-text-faint" />
        <span className="min-w-0 truncate text-sm font-semibold text-text">
          {subLoading ? "…" : label}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-pill px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em]",
            isPilot ? "bg-accent/15 text-accent" : "bg-surface-2 text-text-faint"
          )}
        >
          {subLoading ? "…" : isPilot ? "Pilot" : "Free"}
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-text-faint transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Account and settings"
          className={cn(
            "absolute right-0 z-[65] w-[min(20rem,calc(100vw-1.25rem))] rounded-xl border border-line bg-bg-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.45)]",
            up ? "bottom-full mb-2" : "top-[calc(100%+0.35rem)]"
          )}
        >
          <div className="border-b border-line px-3 py-3">
            <p className="font-mono text-label uppercase tracking-[0.18em] text-text-faint">
              Account
            </p>
            {user.email && (
              <p className="mt-1 truncate text-sm font-medium text-text">{user.email}</p>
            )}
            <p className="mt-0.5 text-xs text-text-faint">
              {subLoading ? "…" : isPilot ? "Pilot plan" : "Free plan"}
            </p>
            <div className="mt-3 flex flex-col gap-0.5">
              <Link
                href="/account"
                prefetch={false}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                onClick={() => setOpen(false)}
              >
                <UserRound className="h-4 w-4" />
                Manage account
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Log out
              </button>
            </div>
          </div>

          <div className="p-3">
            <p className="mb-2 px-1 font-mono text-label uppercase tracking-[0.18em] text-text-faint">
              Settings
            </p>
            <SettingsPanel up={up} />
          </div>
        </div>
      )}
    </div>
  );
}

const MEGA_MENU = [
  {
    groupKey: "the_law",
    items: [
      { key: "act", href: "/act" },
      { key: "rules", href: "/rules" },
      { key: "cases", href: "/cases" },
    ],
  },
  {
    groupKey: "resources",
    items: [
      { key: "rights", href: "/rights" },
      { key: "templates", href: "/templates" },
      { key: "blog", href: "/blog" },
    ],
  },
  {
    groupKey: "learn",
    items: [
      { key: "courses", href: "/courses" },
      { key: "learn", href: "/learn" },
      { key: "certification", href: "/certification" },
    ],
  },
];

export function Header() {
  const t = useTranslations("header");
  const tNav = useTranslations("nav");
  const tDesc = useTranslations("desc");
  const tMega = useTranslations("mega");
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [resOpen, setResOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const canPortal = typeof document !== "undefined";
  const showAccount = !authLoading && Boolean(user);
  const showGuestAuth = !authLoading && !user;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDrawer(false);
    setResOpen(false);
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(false);
    };
    if (drawer) {
      document.body.style.overflow = "hidden";
      root.style.overflow = "hidden";
      document.addEventListener("keydown", onKeyDown);
    } else {
      document.body.style.overflow = "";
      root.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      root.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawer]);

  return (
    <header
      className={cn(
        // Avoid overflow-x-clip: it also clips overflow-y, which cuts off account/settings menus.
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-line bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent"
      )}
    >
      <div className="site-header-row container-x flex min-w-0 items-center justify-between gap-2 sm:gap-4">
        <Link
          href="/"
          prefetch={false}
          aria-label={t("home_aria")}
          className="shrink-0"
        >
          <Logo />
        </Link>

        <nav
          className="hidden items-center gap-1 xl:flex"
          aria-label="Primary"
        >
          {PRIMARY_NAV.map((item) => {
            const paid = Boolean(featureForHref(item.href));
            const NavLink = paid ? PilotLockLink : Link;
            return (
              <NavLink
                key={item.label}
                href={item.href}
                prefetch={false}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-1.5 text-[0.8125rem] font-medium text-text-muted transition-colors hover:text-text"
              >
                {tNav(item.key!)}
              </NavLink>
            );
          })}

          <div
            className="relative"
            onMouseEnter={() => setResOpen(true)}
            onMouseLeave={() => setResOpen(false)}
          >
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={resOpen}
              onClick={() => setResOpen((v) => !v)}
              className="flex items-center gap-1 rounded-pill px-2.5 py-1.5 text-[0.8125rem] font-medium text-text-muted transition-colors hover:text-text"
            >
              {tNav("resources")}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  resOpen && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {resOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full z-[60] w-[min(560px,calc(100vw-2rem))] pt-3 max-xl:fixed max-xl:left-4 max-xl:right-4 max-xl:top-[calc(var(--shell-header-height)+0.25rem)] max-xl:pt-0"
                >
                  <div className="rounded-xl border border-line bg-bg-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
                    <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                      {MEGA_MENU.map((col) => (
                        <div key={col.groupKey} className="p-4">
                          <p className="mb-3 font-mono text-label uppercase tracking-[0.22em] text-accent">
                            {tMega(col.groupKey)}
                          </p>
                          <ul className="flex flex-col gap-0.5">
                            {col.items.map((item) => {
                              const paid = Boolean(featureForHref(item.href));
                              const ItemLink = paid ? PilotLockLink : Link;
                              return (
                              <li key={item.key}>
                                <ItemLink
                                  href={item.href}
                                  prefetch={false}
                                  onClick={() => setResOpen(false)}
                                  className="group flex flex-col rounded-md px-2.5 py-2 transition-colors hover:bg-surface-2"
                                >
                                  <span className="flex items-center gap-1 text-sm font-medium text-text transition-colors group-hover:text-accent">
                                    {tNav(item.key)}
                                    <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                                  </span>
                                  <span className="text-label leading-snug text-text-faint">
                                    {tDesc(item.key)}
                                  </span>
                                </ItemLink>
                              </li>
                            );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="relative z-10 h-9 w-9 shrink-0" />
          {showAccount ? (
            <AccountMenu className="hidden sm:block" />
          ) : (
            <>
              {showGuestAuth && (
                <div className="hidden items-center gap-1.5 sm:flex">
                  <Link
                    href="/auth/sign-in"
                    prefetch={false}
                    className="rounded-pill px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
                  >
                    {t("sign_in")}
                  </Link>
                  <Link
                    href="/auth/sign-up?plan=free"
                    prefetch={false}
                    className="rounded-pill border border-line bg-glass px-2.5 py-1.5 text-xs font-medium text-text transition-colors hover:border-accent/40 hover:text-accent"
                  >
                    {t("create_account")}
                  </Link>
                </div>
              )}
              <SiteSettingsMenu className="hidden sm:block" />
              <PilotLockLink
                href={DPDP_SCANNER_URL}
                prefetch={false}
                className="btn btn-accent hidden h-8 shrink-0 px-3 py-0 text-xs shadow-none sm:inline-flex"
              >
                {t("get_assessment")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </PilotLockLink>
            </>
          )}
          <button
            type="button"
            aria-label={t("open_menu")}
            onClick={() => setDrawer(true)}
            className="grid h-9 w-9 place-items-center rounded-pill border border-line bg-glass text-text xl:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {canPortal &&
        createPortal(
          <AnimatePresence>
            {drawer && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[70] overflow-hidden bg-black/60 backdrop-blur-sm xl:hidden"
                  onClick={() => setDrawer(false)}
                />
                <div className="fixed inset-0 z-[80] xl:hidden">
                  <motion.aside
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("open_menu")}
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "tween", duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                    className="absolute inset-y-0 right-0 flex h-full min-h-0 w-[min(100vw,22rem)] max-w-full flex-col border-l border-line bg-bg-2 shadow-2xl"
                  >
                  <div className="flex shrink-0 items-center justify-between border-b border-line p-5">
                    <Link href="/" prefetch={false} onClick={() => setDrawer(false)} aria-label={t("home_aria")}>
                      <Logo />
                    </Link>
                    <button
                      type="button"
                      aria-label={t("close_menu")}
                      onClick={() => setDrawer(false)}
                      className="grid h-11 w-11 place-items-center rounded-pill border border-line bg-glass text-text"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
                    <nav
                      className="flex flex-col gap-1 p-5"
                      aria-label="Mobile"
                    >
                      {MOBILE_NAV.map((item) => {
                        const paid = Boolean(featureForHref(item.href));
                        const NavLink = paid ? PilotLockLink : Link;
                        return (
                        <NavLink
                          key={item.label}
                          href={item.href}
                          prefetch={false}
                          onClick={() => setDrawer(false)}
                          className="inline-flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium text-text-muted transition-colors hover:bg-glass hover:text-text"
                        >
                          {tNav(item.key!)}
                        </NavLink>
                      );
                      })}
                    </nav>
                    <div className="mt-auto flex flex-col gap-3 border-t border-line p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-glass/40 px-3 py-2">
                        <span className="text-sm font-medium text-text">Theme</span>
                        <ThemeToggle className="h-9 w-9" />
                      </div>
                      {showAccount ? (
                        <AccountMenu
                          variant="drawer"
                          onAfterSignOut={() => setDrawer(false)}
                        />
                      ) : (
                        <>
                          <PilotLockLink
                            href={DPDP_SCANNER_URL}
                            prefetch={false}
                            onClick={() => setDrawer(false)}
                            className="btn btn-accent w-full text-sm"
                          >
                            {t("get_assessment")}
                          </PilotLockLink>
                          {showGuestAuth && (
                            <div className="rounded-lg border border-line bg-glass/40 px-3 py-3">
                              <p className="text-xs leading-relaxed text-text-muted">
                                {t("guest_hint")}
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                <Link
                                  href="/auth/sign-in"
                                  prefetch={false}
                                  onClick={() => setDrawer(false)}
                                  className="btn btn-ghost flex-1 justify-center text-sm"
                                >
                                  {t("sign_in")}
                                </Link>
                                <Link
                                  href="/auth/sign-up?plan=free"
                                  prefetch={false}
                                  onClick={() => setDrawer(false)}
                                  className="btn btn-ghost flex-1 justify-center text-sm"
                                >
                                  {t("create_account")}
                                </Link>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="mb-2 px-1 font-mono text-label uppercase tracking-[0.18em] text-text-faint">
                              Settings
                            </p>
                            <SettingsPanel up />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.aside>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </header>
  );
}
