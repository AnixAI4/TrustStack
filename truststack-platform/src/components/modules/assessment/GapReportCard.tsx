import type { AssessmentGap } from '@/types/dpdp'

interface GapReportCardProps {
  gap: AssessmentGap
}

const PRIORITY_CONFIG = {
  p0: { label: 'P0 — Critical',  color: '#DC2626', bgColor: '#FEF2F2', borderColor: '#FECACA' },
  p1: { label: 'P1 — High',      color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FDE68A' },
  p2: { label: 'P2 — Medium',    color: '#2563EB', bgColor: '#EFF6FF', borderColor: '#BFDBFE' },
  p3: { label: 'P3 — Low',       color: '#059669', bgColor: '#ECFDF5', borderColor: '#A7F3D0' },
}

export default function GapReportCard({ gap }: GapReportCardProps) {
  const pConfig = PRIORITY_CONFIG[gap.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.p3

  return (
    <div
      className="bg-white rounded-xl border shadow-sm p-5 space-y-3"
      style={{ borderColor: pConfig.borderColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ color: pConfig.color, backgroundColor: pConfig.bgColor }}
            >
              {pConfig.label}
            </span>
            {gap.dpdp_section && (
              <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full flex-shrink-0">
                DPDP {gap.dpdp_section}
              </span>
            )}
            <span className="text-[11px] text-gray-400">{gap.question_id}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{gap.gap_description}</p>
        </div>

        {gap.resolved && (
          <div className="flex-shrink-0">
            <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
              ✓ Resolved
            </span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg px-3.5 py-2.5">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Recommended action</p>
        <p className="text-sm text-gray-700">{gap.recommended_action}</p>
      </div>

      {gap.module_to_fix && (
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#2874A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs text-[#2874A6] font-medium">Resolve in → {gap.module_to_fix}</span>
        </div>
      )}
    </div>
  )
}
