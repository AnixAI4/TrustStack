'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { PlatformOrg } from '@/lib/platform/org'

const PlatformOrgContext = createContext<PlatformOrg | null>(null)

export function PlatformOrgProvider({
  org,
  children,
}: {
  org: PlatformOrg
  children: ReactNode
}) {
  return (
    <PlatformOrgContext.Provider value={org}>
      {children}
    </PlatformOrgContext.Provider>
  )
}

export function usePlatformOrg(): PlatformOrg {
  const org = useContext(PlatformOrgContext)
  if (!org) throw new Error('usePlatformOrg must be used within PlatformOrgProvider')
  return org
}
