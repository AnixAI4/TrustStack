'use client'

interface AssessmentProgressProps {
  currentSectionIndex: number
  answeredInSection: number
  totalInSection: number
  totalSections: number
  sectionLabel: string
}

export default function AssessmentProgress({
  currentSectionIndex,
  answeredInSection,
  totalInSection,
  totalSections,
  sectionLabel,
}: AssessmentProgressProps) {
  const overallProgress = (currentSectionIndex / totalSections) * 100
  const sectionProgress = totalInSection > 0 ? (answeredInSection / totalInSection) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-accent">
          Section {currentSectionIndex + 1} of {totalSections}
        </span>
        <span className="text-text-faint">
          {answeredInSection} of {totalInSection} answered
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-text flex-1 truncate">{sectionLabel}</span>
      </div>

      {/* Overall progress bar */}
      <div className="relative h-2 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-accent/15 rounded-full transition-all duration-300"
          style={{ width: `${overallProgress}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-accent rounded-full transition-all duration-300"
          style={{ width: `${overallProgress + (sectionProgress / totalSections)}%` }}
        />
      </div>

      {/* Section dots - one per effective section */}
      <div className="flex items-center gap-1 mt-1">
        {Array.from({ length: totalSections }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-200 flex-1 ${
              i < currentSectionIndex
                ? 'bg-accent'
                : i === currentSectionIndex
                ? 'bg-[#2F5FE0]'
                : 'bg-surface-2'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
