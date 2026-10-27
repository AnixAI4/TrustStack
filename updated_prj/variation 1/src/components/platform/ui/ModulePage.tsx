'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { EASE } from '@/lib/motion'

/** Soft fade-up for a module page body after data loads. */
export function ModulePage({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : { y: 8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.38, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Cross-fade TrustDeck routes so nav doesn’t hard-cut. */
export function TrustDeckRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()

  if (reduce) return <>{children}</>

  return (
    <motion.div
      key={pathname}
      initial={{ y: 6 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.24, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
