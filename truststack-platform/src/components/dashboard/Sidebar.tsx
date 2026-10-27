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
import { cn } from '@/lib/utils'
import { SIDEBAR_MODULES } from '@/lib/constants'

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
        'relative flex flex-col h-full bg-[#003366] text-white transition-all duration-200',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 py-4 border-b border-white/10', collapsed && 'justify-center px-0')}>
        <div className="w-7 h-7 bg-white/10 rounded-md flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-none">TrustStack™</p>
            <p className="text-white/50 text-xs mt-0.5 truncate">{orgName}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {SIDEBAR_MODULES.map(mod => {
          const Icon = ICON_MAP[mod.icon]
          const isActive = pathname.startsWith(mod.href)
          const isAvailable = mod.available

          return (
            <div key={mod.key}>
              {isAvailable ? (
                <Link
                  href={mod.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center px-0 mx-1'
                  )}
                  title={collapsed ? mod.label : undefined}
                >
                  {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                  {!collapsed && <span className="truncate">{mod.label}</span>}
                </Link>
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm cursor-not-allowed',
                    'text-white/30',
                    collapsed && 'justify-center px-0 mx-1'
                  )}
                  title={collapsed ? `${mod.label} (Coming Soon)` : undefined}
                >
                  {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                  {!collapsed && (
                    <span className="flex items-center justify-between w-full min-w-0">
                      <span className="truncate">{mod.label}</span>
                      <span className="text-[10px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                        Soon
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 bg-[#1A5276] border border-[#003366] rounded-full flex items-center justify-center text-white hover:bg-[#003366] transition-colors z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
