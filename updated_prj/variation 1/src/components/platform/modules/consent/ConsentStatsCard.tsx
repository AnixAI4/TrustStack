'use client'

import { ConsentStats } from '@/types/dpdp'
import { Users, CheckCircle2, RefreshCcw, Radio } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  stats: ConsentStats
}

export function ConsentStatsCard({ stats }: Props) {
  const items = [
    {
      label: 'Records this month',
      value: stats.total_this_month,
      suffix: '',
      Icon: Users,
      tone: 'accent' as const,
    },
    {
      label: 'Optional consent rate',
      value: stats.consent_rate,
      suffix: '%',
      Icon: CheckCircle2,
      tone: 'green' as const,
    },
    {
      label: 'Withdrawals',
      value: stats.withdrawals_this_month,
      suffix: '',
      Icon: RefreshCcw,
      tone: 'amber' as const,
    },
    {
      label: 'Active channels',
      value: Object.values(stats.by_channel).filter(count => count > 0).length,
      suffix: '',
      Icon: Radio,
      tone: 'blue' as const,
    },
  ]

  const toneClass = {
    accent: { bg: 'bg-accent/10', icon: 'text-accent' },
    green: { bg: 'bg-green/10', icon: 'text-green' },
    amber: { bg: 'bg-amber/10', icon: 'text-amber' },
    blue: { bg: 'bg-blue/10', icon: 'text-blue' },
  }

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card lg:grid-cols-4">
      {items.map(({ label, value, suffix, Icon, tone }, index) => {
        const c = toneClass[tone]
        const divider = [
          'border-b border-line lg:border-b-0',
          'border-b border-l border-line lg:border-b-0',
          'lg:border-l lg:border-line',
          'border-l border-line',
        ][index]
        return (
          <div key={label} className={cn('min-h-24 p-4 sm:px-5', divider)}>
            <span className={cn('grid h-8 w-8 place-items-center rounded-lg', c.bg, c.icon)}>
              <Icon size={16} />
            </span>
            <p className="mt-3 font-display text-2xl font-semibold leading-none text-text">
              {value.toLocaleString('en-IN')}
              {suffix}
            </p>
            <p className="mt-1 text-xs font-medium text-text-muted">{label}</p>
          </div>
        )
      })}
    </div>
  )
}
