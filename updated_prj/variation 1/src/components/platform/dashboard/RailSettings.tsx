'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/cn'
import { A11yToolbar } from '@/components/site/A11yToolbar'
import { ReadingModeToggle } from '@/components/site/ReadingModeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

/** TrustDeck left-rail settings (language, easy read, a11y). Theme stays in the top bar. */
export function RailSettings({ expanded }: { expanded: boolean }) {
  const [open, setOpen] = useState(false)
  const [canPortal, setCanPortal] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCanPortal(true)
  }, [])

  useEffect(() => {
    if (!open || !btnRef.current) return
    const update = () => {
      if (!btnRef.current) return
      const r = btnRef.current.getBoundingClientRect()
      const width = Math.min(272, window.innerWidth - 24)
      let left = r.right + 12
      if (left + width > window.innerWidth - 12) {
        left = Math.max(12, r.left - width - 12)
      }
      const maxH = Math.min(380, window.innerHeight - 24)
      let top = r.bottom - maxH
      if (top < 12) top = 12
      if (top + maxH > window.innerHeight - 12) top = window.innerHeight - maxH - 12
      setPos({ top, left })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (t instanceof Element && t.closest('[data-anchored-menu]')) return
      if (btnRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const panel =
    open &&
    pos &&
    canPortal &&
    createPortal(
      <div
        ref={panelRef}
        role="dialog"
        aria-label="TrustDeck settings"
        data-anchored-menu
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          width: Math.min(272, typeof window !== 'undefined' ? window.innerWidth - 24 : 272),
          zIndex: 220,
        }}
        className="svc-fade-in origin-bottom-left overflow-hidden rounded-2xl border border-line/80 bg-bg-2/95 p-1 text-text shadow-[0_24px_64px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <div className="px-3.5 pb-2 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-faint">
            Settings
          </p>
        </div>

        <div className="space-y-0.5 px-1.5 pb-1.5">
          <div className="rounded-xl px-2.5 py-2.5 transition-colors hover:bg-glass/50">
            <p className="mb-2 text-[11px] font-medium text-text-muted">Easy read</p>
            <ReadingModeToggle full />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-glass/50">
            <span className="text-sm text-text">Language</span>
            <LanguageSwitcher up={false} />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-glass/50">
            <div className="min-w-0">
              <p className="truncate text-sm text-text">Accessibility</p>
              <p className="truncate text-[11px] text-text-faint">Size, contrast</p>
            </div>
            <A11yToolbar up={false} className="shrink-0" />
          </div>
        </div>
      </div>,
      document.body
    )

  return (
    <div className="py-1.5">
      <button
        ref={btnRef}
        type="button"
        title="Settings"
        aria-label="Open TrustDeck settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group relative mx-2 flex min-h-10 items-center gap-3 rounded-xl px-2.5 py-1.5 text-sm transition-all duration-200 ease-[var(--ease)]',
          expanded ? 'w-[16.5rem]' : 'w-11 justify-center px-0',
          open
            ? 'bg-white/[0.1] font-medium text-white'
            : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
        )}
      >
        <span
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-200 ease-[var(--ease)]',
            open
              ? 'bg-accent text-[color:var(--on-accent)] shadow-[0_6px_16px_-8px_rgba(226,98,10,0.9)]'
              : 'bg-white/[0.04] text-white/50 group-hover:bg-white/[0.08] group-hover:text-white/90'
          )}
        >
          <Settings className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {expanded && <span className="min-w-0 flex-1 truncate text-left tracking-tight">Settings</span>}
      </button>
      {panel}
    </div>
  )
}
