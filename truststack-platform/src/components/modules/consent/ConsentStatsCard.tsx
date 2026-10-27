'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, CheckCircle, XCircle, Smartphone } from 'lucide-react'
import { ConsentStats } from '@/types/dpdp'

export default function ConsentStatsCard() {
  const [stats, setStats] = useState<ConsentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/consent/stats')
      .then(r => r.json())
      .then(data => {
        if (!data.error) setStats(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    {
      label: 'Total Consents This Month',
      value: loading ? '—' : String(stats?.total_this_month ?? 0),
      icon: TrendingUp,
      color: 'text-[#003366]',
      bg: 'bg-blue-50',
    },
    {
      label: 'Consent Rate',
      value: loading ? '—' : `${stats?.consent_rate ?? 0}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Withdrawals This Month',
      value: loading ? '—' : String(stats?.withdrawals_this_month ?? 0),
      icon: XCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Web Consents',
      value: loading ? '—' : String(stats?.by_channel?.web ?? 0),
      icon: Smartphone,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-500 mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  )
}
