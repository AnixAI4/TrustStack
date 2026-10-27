'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

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
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-100 flex-shrink-0">
      {/* Left — breadcrumb placeholder */}
      <div />

      {/* Right — notifications + user */}
      <div className="flex items-center gap-3">
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors',
              dropdownOpen && 'bg-gray-50'
            )}
          >
            <div className="w-7 h-7 bg-[#003366] rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
            <span className="text-sm text-gray-700 hidden sm:block max-w-[150px] truncate">
              {userName || userEmail}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-20">
                <div className="px-3 py-2 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); router.push('/dashboard/settings') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-400" />
                  Settings
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); router.push('/dashboard/settings?tab=profile') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Profile
                </button>
                <div className="border-t border-gray-50 mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
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
