'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { SIDEBAR_MODULES } from '@/lib/platform/constants'

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

interface SidebarProps {
  orgName: string
}

export default function Sidebar({ orgName }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col self-stretch border-r border-line bg-bg-2 transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2.5 border-b border-line px-4 py-4',
          collapsed && 'justify-center px-0'
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-glass">
          <Shield className="h-4 w-4 text-accent" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold leading-none text-text">
              TrustDeck
            </p>
            <p className="mt-1 truncate font-mono text-[0.65rem] uppercase tracking-[0.12em] text-text-faint">
              {orgName}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3" aria-label="TrustDeck modules">
        {SIDEBAR_MODULES.map((mod) => {
          const Icon = ICON_MAP[mod.icon]
          const isActive =
            pathname === mod.href || pathname.startsWith(`${mod.href}/`)
          const isAvailable = mod.available

          if (!isAvailable) {
            return (
              <div
                key={mod.key}
                className={cn(
                  'mx-2 flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-faint/50',
                  collapsed && 'mx-1 justify-center px-0'
                )}
                title={collapsed ? `${mod.label} (Coming Soon)` : undefined}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {!collapsed && (
                  <span className="flex min-w-0 w-full items-center justify-between">
                    <span className="truncate">{mod.label}</span>
                    <span className="ml-2 shrink-0 rounded-pill border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-faint">
                      Soon
                    </span>
                  </span>
                )}
              </div>
            )
          }

          return (
            <Link
              key={mod.key}
              href={mod.href}
              prefetch={false}
              className={cn(
                'mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-accent/12 font-medium text-accent'
                  : 'text-text-muted hover:bg-glass hover:text-text',
                collapsed && 'mx-1 justify-center px-0'
              )}
              title={collapsed ? mod.label : undefined}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {!collapsed && <span className="truncate">{mod.label}</span>}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 grid h-6 w-6 place-items-center rounded-full border border-line bg-bg-2 text-text-muted shadow-sm transition-colors hover:border-accent/40 hover:text-accent"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  )
}
