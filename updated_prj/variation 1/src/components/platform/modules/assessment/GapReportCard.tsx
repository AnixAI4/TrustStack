import type { AssessmentGap } from '@/types/dpdp'

interface GapReportCardProps {
  gap: AssessmentGap
}

const PRIORITY_CONFIG = {
  p0: { label: 'Critical', code: 'P0', bar: 'bg-red', badge: 'text-red' },
  p1: { label: 'High', code: 'P1', bar: 'bg-amber', badge: 'text-amber' },
  p2: { label: 'Medium', code: 'P2', bar: 'bg-blue', badge: 'text-blue' },
  p3: { label: 'Low', code: 'P3', bar: 'bg-green', badge: 'text-green' },
}

export default function GapReportCard({ gap }: GapReportCardProps) {
  const pConfig = PRIORITY_CONFIG[gap.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.p3

  return (
    <article className="platform-panel relative overflow-hidden rounded-xl border border-line bg-bg-2 p-5 shadow-card sm:p-6">
      <span className={`absolute inset-y-0 left-0 w-1 ${pConfig.bar}`} />
      <div className="flex items-start justify-between gap-4 pl-1">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`font-mono text-label font-bold uppercase tracking-[var(--tracking-label)] ${pConfig.badge}`}
            >
              {pConfig.code} · {pConfig.label}
            </span>
            {gap.dpdp_section && (
              <span className="flex-shrink-0 rounded-md border border-line bg-surface-2/45 px-2 py-0.5 text-[11px] text-text-muted">
                DPDP {gap.dpdp_section}
              </span>
            )}
            <span className="text-[11px] text-text-faint">Control {gap.question_id}</span>
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug text-text">{gap.gap_description}</h3>
        </div>

        {gap.resolved && (
          <div className="flex-shrink-0">
            <span className="rounded-pill bg-green/10 px-2 py-0.5 text-[11px] font-medium text-green">
              ✓ Resolved
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-line pt-4 pl-1">
        <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Recommended action</p>
        <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{gap.recommended_action}</p>
      </div>

      {gap.module_to_fix && (
        <div className="mt-4 flex items-center gap-1.5 pl-1">
          <svg className="w-3.5 h-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs text-brand font-medium">Resolve in → {gap.module_to_fix}</span>
        </div>
      )}
    </article>
  )
}
