import { MATURITY_LEVELS } from '@/lib/constants'

interface MaturityBadgeProps {
  level: 1 | 2 | 3 | 4 | 5
  size?: 'sm' | 'md' | 'lg'
}

export default function MaturityBadge({ level, size = 'md' }: MaturityBadgeProps) {
  const config = MATURITY_LEVELS[level]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
      Level {level}: {config.label}
    </span>
  )
}
