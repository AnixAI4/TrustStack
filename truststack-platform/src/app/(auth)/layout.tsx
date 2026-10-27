import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'TrustStack™',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F8FC] flex flex-col">
      <header className="h-14 flex items-center px-6 border-b border-gray-100 bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#003366] rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">TS</span>
          </div>
          <span className="text-[#003366] font-semibold text-sm">TrustStack™</span>
          <span className="text-gray-400 text-xs">by Anix AI</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      <footer className="h-10 flex items-center justify-center text-xs text-gray-400">
        © {new Date().getFullYear()} Anix AI LLP · DPDP-compliant by design
      </footer>
    </div>
  )
}
