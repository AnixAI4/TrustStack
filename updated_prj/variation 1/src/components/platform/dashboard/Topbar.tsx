'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { createClient } from '@/lib/platform/supabase/client'
import { cn } from '@/lib/cn'

interface TopbarProps {
  userEmail: string
  userName: string
}

export default function Topbar({ userEmail, userName }: TopbarProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase()

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-bg-2 border-b border-line flex-shrink-0">
      {/* Left - breadcrumb placeholder */}
      <div />

      {/* Right - notifications + user */}
      <div className="flex items-center gap-3">
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-faint hover:bg-glass hover:text-text-muted transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-glass transition-colors',
              dropdownOpen && 'bg-glass'
            )}
          >
            <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
            <span className="text-sm text-text hidden sm:block max-w-[150px] truncate">
              {userName || userEmail}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-faint" />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 mt-1 w-52 bg-bg-2 rounded-xl border border-line shadow-lg py-1 z-20">
                <div className="px-3 py-2 border-b border-line-soft">
                  <p className="text-xs font-semibold text-text truncate">{userName}</p>
                  <p className="text-xs text-text-faint truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); router.push('/trustdeck/overview') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text hover:bg-glass transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-text-faint" />
                  Settings
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); router.push('/account') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text hover:bg-glass transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-text-faint" />
                  Profile
                </button>
                <div className="border-t border-line-soft mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red transition-colors hover:bg-red/[0.07] disabled:opacity-60"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
