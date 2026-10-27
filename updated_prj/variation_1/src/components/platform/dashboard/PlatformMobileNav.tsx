'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Building2,
  CheckSquare,
  ChevronRight,
  Compass,
  Database,
  FileBarChart,
  FileText,
  LayoutDashboard,
  Menu,
  MessageCircle,
  ScanLine,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { SIDEBAR_MODULE_GROUPS, SIDEBAR_MODULES } from '@/lib/platform/constants'
import { cn } from '@/lib/cn'
import { EASE } from '@/lib/motion'
import { SettingsPanel } from '@/components/site/SettingsPanel'

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
  ScanLine,
}

export function PlatformMobileNav({ orgName }: { orgName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const availableModules = SIDEBAR_MODULES.filter((mod) => mod.available)
  const activeModule = availableModules.find(
    (mod) => pathname === mod.href || pathname.startsWith(`${mod.href}/`)
  ) ?? availableModules[0]
  const ActiveIcon = ICON_MAP[activeModule.icon]

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <>
      <div className="sticky top-[var(--shell-header-height)] z-30 border-b border-line bg-bg/90 px-3 py-2 backdrop-blur-xl md:hidden">
        <div className="flex min-h-11 items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-bg-2 text-text shadow-sm transition-colors duration-200 ease-[var(--ease)] active:border-accent/40 active:text-accent"
            aria-label="Open TrustDeck navigation"
            aria-controls="platform-mobile-drawer"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/12 text-accent">
            {ActiveIcon && <ActiveIcon className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text">{activeModule.label}</p>
            <p className="truncate font-mono text-label uppercase tracking-[var(--tracking-label)] text-text-faint">
              {orgName}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] md:hidden" aria-hidden={false}>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
              aria-label="Close TrustDeck navigation"
            />

            <motion.aside
              id="platform-mobile-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: EASE }}
              className="absolute inset-y-0 left-0 flex w-[min(86vw,21rem)] flex-col border-r border-white/[0.08] bg-[#161a17] text-white shadow-2xl"
              aria-label="TrustDeck navigation"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex h-[var(--shell-header-height)] shrink-0 items-center gap-3 border-b border-white/[0.08] px-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-[color:var(--on-accent)]">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold leading-none text-white">TrustDeck</p>
                  <p className="mt-1 truncate font-mono text-label uppercase tracking-[var(--tracking-label)] text-white/40">
                    DPDP ops
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white"
                  aria-label="Close TrustDeck navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mx-3 mt-3 rounded-lg border border-white/[0.08] bg-white/[0.045] px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-white">{orgName}</p>
                <p className="mt-0.5 font-mono text-label uppercase tracking-[var(--tracking-label)] text-white/38">
                  Compliance workspace
                </p>
              </div>

              <nav className="trustdeck-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2" aria-label="TrustDeck modules">
                {SIDEBAR_MODULE_GROUPS.map((group) => (
                  <div key={group.label} className="pt-3">
                    <p className="px-3 pb-1.5 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-white/30">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {availableModules.filter((mod) => group.keys.some((key) => key === mod.key)).map((mod) => {
                        const Icon = ICON_MAP[mod.icon]
                        const active = pathname === mod.href || pathname.startsWith(`${mod.href}/`)
                        return (
                          <Link
                            key={mod.key}
                            href={mod.href}
                            prefetch={false}
                            onPointerEnter={() => router.prefetch(mod.href)}
                            onFocus={() => router.prefetch(mod.href)}
                            onClick={() => setOpen(false)}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 ease-[var(--ease)]',
                              active
                                ? 'bg-white/[0.12] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                                : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
                            )}
                          >
                            <span
                              className={cn(
                                'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                                active ? 'bg-accent text-[color:var(--on-accent)]' : 'text-white/50'
                              )}
                            >
                              {Icon && <Icon className="h-4 w-4" />}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{mod.label}</span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="shrink-0 border-t border-white/[0.08] bg-black/20 p-3">
                <div className="rounded-xl border border-line bg-bg-2 p-3 text-text shadow-card">
                  <p className="mb-2 px-1 font-mono text-label uppercase tracking-[0.18em] text-text-faint">
                    Settings
                  </p>
                  <SettingsPanel up />
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
