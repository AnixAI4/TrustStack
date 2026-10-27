import { MATURITY_LEVELS } from '@/lib/platform/constants'

interface MaturityBadgeProps {
  level: 1 | 2 | 3 | 4 | 5
  size?: 'sm' | 'md' | 'lg'
}

export default function MaturityBadge({ level, size = 'md' }: MaturityBadgeProps) {
  const config = MATURITY_LEVELS[level]
  const color = {
    1: 'var(--red)',
    2: 'var(--amber)',
    3: 'var(--blue)',
    4: 'var(--accent)',
    5: 'var(--green)',
  }[level]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border border-line bg-bg-2 font-semibold text-text shadow-sm ${sizeClasses[size]}`}
    >
      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
      Level {level}: {config.label}
    </span>
  )
}
