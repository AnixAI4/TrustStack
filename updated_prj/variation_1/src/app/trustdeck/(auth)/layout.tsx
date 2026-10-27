import type { Metadata } from 'next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { PlatformBackButton } from '@/components/platform/dashboard/PlatformBackButton'

export const metadata: Metadata = {
  title: 'TrustDeck · TrustStack',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 sm:py-12">
      <div className="absolute start-4 top-4 z-10 sm:start-6 sm:top-6">
        <PlatformBackButton />
      </div>
      <div className="absolute end-4 top-4 z-10 sm:end-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <div className="mb-6 text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-accent">
          TrustDeck
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-text">
          Compliance workspace
        </h1>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
