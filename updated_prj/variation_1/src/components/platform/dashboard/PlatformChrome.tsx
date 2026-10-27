'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Compass,
  CheckSquare,
  FileText,
  FileBarChart,
  MessageCircle,
  Users,
  Database,
  Building2,
  AlertTriangle,
  Settings,
  ShieldCheck,
  CircleHelp,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { SIDEBAR_MODULE_GROUPS, SIDEBAR_MODULES } from '@/lib/platform/constants'
import { PlatformMobileNav } from '@/components/platform/dashboard/PlatformMobileNav'
import { Logo } from '@/components/site/Logo'
import { ThemeToggle } from '@/components/site/ThemeToggle'
import { AccountMenu } from '@/components/site/Header'
import { PlatformBackButton } from '@/components/platform/dashboard/PlatformBackButton'
import { TrustDeckRouteTransition } from '@/components/platform/ui/ModulePage'
import { RailSettings } from '@/components/platform/dashboard/RailSettings'
import {
  TRUSTDECK_TOUR_STORAGE_KEY,
  TrustDeckTutorialModal,
  TrustDeckTutorialStrip,
} from '@/components/platform/dashboard/TrustDeckTutorial'
import { LexBotLauncher } from '@/components/site/LexBotLauncher'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Compass,
  CheckSquare,
  FileText,
  FileBarChart,
  MessageCircle,
  Users,
  Database,
  Building2,
  AlertTriangle,
  Settings,
}

const PRIMARY_MODULES = SIDEBAR_MODULES.filter((m) => m.key !== 'settings')
const RAIL_COLLAPSED = '4.5rem'
const RAIL_EXPANDED = '18rem'

function NavItem({
  mod,
  pathname,
  expanded,
  onNavigate,
  onIntent,
}: {
  mod: (typeof SIDEBAR_MODULES)[number]
  pathname: string
  expanded: boolean
  onNavigate?: () => void
  onIntent?: () => void
}) {
  const Icon = ICON_MAP[mod.icon]
  const isActive = pathname === mod.href || pathname.startsWith(`${mod.href}/`)

  if (!mod.available) {
    return (
      <div
        className={cn(
          'mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm text-white/30',
          expanded ? 'w-[16.5rem]' : 'w-11 justify-center px-0'
        )}
        title={mod.label}
      >
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
            <Icon className="h-[1.05rem] w-[1.05rem]" />
          </span>
        )}
        {expanded && (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate">{mod.label}</span>
            <span className="shrink-0 rounded-pill border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-label uppercase tracking-[var(--tracking-label)] text-white/40">
              Soon
            </span>
          </span>
        )}
      </div>
    )
  }

  return (
    <Link
      href={mod.href}
      prefetch={false}
      title={mod.label}
      aria-current={isActive ? 'page' : undefined}
      onClick={onNavigate}
      onMouseEnter={onIntent}
      onFocus={onIntent}
      className={cn(
        'group relative mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease)]',
        expanded ? 'w-[16.5rem]' : 'w-11 justify-center px-0',
        isActive
          ? 'bg-white/[0.12] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] before:absolute before:bottom-2.5 before:left-0 before:top-2.5 before:w-0.5 before:rounded-pill before:bg-accent'
          : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
      )}
    >
      {Icon && (
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-[background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease)]',
            isActive
              ? 'border-accent/60 bg-accent text-[color:var(--on-accent)] shadow-[0_8px_20px_-10px_rgba(226,98,10,0.85)]'
              : 'border-white/[0.06] bg-white/[0.03] text-white/55 group-hover:border-white/12 group-hover:bg-white/[0.07] group-hover:text-white'
          )}
        >
          <Icon className="h-[1.05rem] w-[1.05rem]" />
        </span>
      )}
      {expanded && <span className="min-w-0 flex-1 truncate">{mod.label}</span>}
    </Link>
  )
}

export function PlatformChrome({
  orgName,
  children,
}: {
  orgName: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [railOpen, setRailOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [showTutorialStrip, setShowTutorialStrip] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  function openRail() {
    clearCloseTimer()
    setRailOpen(true)
  }

  function scheduleCloseRail() {
    clearCloseTimer()
    // Small delay so moving between icon → label doesn't flicker shut.
    closeTimer.current = setTimeout(() => setRailOpen(false), 120)
  }

  function closeRailNow() {
    clearCloseTimer()
    setRailOpen(false)
  }

  useEffect(() => {
    closeRailNow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => () => clearCloseTimer(), [])

  useEffect(() => {
    try {
      setShowTutorialStrip(localStorage.getItem(TRUSTDECK_TOUR_STORAGE_KEY) !== 'dismissed')
    } catch {
      setShowTutorialStrip(true)
    }
  }, [])

  function dismissTutorialStrip() {
    setShowTutorialStrip(false)
    try {
      localStorage.setItem(TRUSTDECK_TOUR_STORAGE_KEY, 'dismissed')
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
  }

  return (
    <div className="platform-shell relative min-h-screen bg-bg pt-[var(--shell-header-height)]">
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 h-[var(--shell-header-height)] overflow-visible border-b border-line bg-bg/85 backdrop-blur-xl md:left-[4.5rem]'
        )}
      >
        <div className="relative flex h-full min-w-0 items-center justify-between gap-4 overflow-visible px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <PlatformBackButton />
            <div className="min-w-0 md:hidden">
              <Link href="/trustdeck/overview" prefetch={false} aria-label="TrustDeck home" className="shrink-0">
                <Logo />
              </Link>
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-semibold text-text">{orgName}</p>
              <p className="mt-0.5 font-mono text-label uppercase tracking-[var(--tracking-label)] text-text-faint">
                TrustDeck
              </p>
            </div>
          </div>

          <div className="relative z-50 flex shrink-0 items-center gap-1.5 overflow-visible sm:gap-2">
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              title="Open TrustDeck guide"
              aria-label="Open TrustDeck guide"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line/70 bg-glass/60 px-2.5 text-xs font-semibold text-text-muted transition-colors hover:border-accent/35 hover:text-text sm:px-3"
            >
              <CircleHelp className="h-4 w-4 text-accent" />
              <span className="hidden sm:inline">Guide</span>
            </button>
            <ThemeToggle className="relative z-10 h-9 w-9 shrink-0 border-line/70 bg-glass/60" />
            <AccountMenu />
          </div>
        </div>
      </header>

      <PlatformMobileNav orgName={orgName} />

      {/* Click-away / dim when rail is open so it never feels stuck */}
      {railOpen && (
        <button
          type="button"
          aria-label="Collapse TrustDeck navigation"
          className="fixed inset-0 z-[45] hidden bg-black/20 backdrop-blur-[1px] md:block"
          onClick={closeRailNow}
        />
      )}

      <aside
        onMouseEnter={openRail}
        onMouseLeave={scheduleCloseRail}
        onFocusCapture={openRail}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleCloseRail()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            closeRailNow()
            ;(event.currentTarget.querySelector(':focus') as HTMLElement | null)?.blur()
          }
        }}
        style={{ width: railOpen ? RAIL_EXPANDED : RAIL_COLLAPSED }}
        className={cn(
          'fixed bottom-0 left-0 top-0 z-50 hidden flex-col overflow-hidden border-r border-white/[0.08] bg-[#141816] text-white transition-[width,box-shadow] duration-300 ease-[var(--ease)] md:flex',
          railOpen
            ? 'shadow-[22px_0_56px_-28px_rgba(0,0,0,0.7)]'
            : 'shadow-[12px_0_40px_-28px_rgba(0,0,0,0.55)]'
        )}
        aria-label="TrustDeck navigation"
      >
        <Link
          href="/trustdeck/overview"
          prefetch={false}
          aria-label="TrustDeck home"
          onClick={closeRailNow}
          className={cn(
            'flex h-[var(--shell-header-height)] shrink-0 items-center gap-3 border-b border-white/[0.08] px-3.5',
            railOpen && 'px-4'
          )}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/35 bg-accent text-[color:var(--on-accent)] shadow-[0_10px_24px_-12px_rgba(226,98,10,0.9)]">
            <ShieldCheck className="h-[1.1rem] w-[1.1rem]" />
          </span>
          {railOpen && (
            <div className="min-w-0">
              <p className="font-display text-[1.05rem] font-semibold leading-none text-white">TrustDeck</p>
              <p className="mt-1.5 max-w-48 truncate font-mono text-label uppercase tracking-[var(--tracking-label)] text-white/40">
                {orgName}
              </p>
            </div>
          )}
        </Link>

        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-3 pt-2" aria-label="TrustDeck modules">
          {SIDEBAR_MODULE_GROUPS.map((group) => (
            <div key={group.label} className="pb-1 pt-1">
              {railOpen && (
                <p className="flex h-6 items-end whitespace-nowrap px-5 pb-1 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-white/30">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {PRIMARY_MODULES.filter((mod) => group.keys.some((key) => key === mod.key)).map((mod) => (
                  <NavItem
                    key={mod.key}
                    mod={mod}
                    pathname={pathname}
                    expanded={railOpen}
                    onNavigate={closeRailNow}
                    onIntent={() => router.prefetch(mod.href)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto shrink-0 border-t border-white/[0.08] bg-black/10">
          <RailSettings expanded={railOpen} />
        </div>
      </aside>

      <div className="platform-canvas relative min-w-0 px-3 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-10 md:ml-[4.5rem] lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(55% 40% at 8% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 65%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
            style={{
              backgroundImage:
                'linear-gradient(color-mix(in srgb, var(--line) 55%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--line) 55%, transparent) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent 88%)',
            }}
          />
        </div>
        <div className="relative mx-auto w-full max-w-7xl">
          {pathname === '/trustdeck/overview' && showTutorialStrip && (
            <TrustDeckTutorialStrip
              onStart={() => setTutorialOpen(true)}
              onDismiss={dismissTutorialStrip}
            />
          )}
          <TrustDeckRouteTransition>{children}</TrustDeckRouteTransition>
        </div>
      </div>

      <TrustDeckTutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      <LexBotLauncher platform />
    </div>
  )
}
