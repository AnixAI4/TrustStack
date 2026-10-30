/**
 * A thin progress bar (Slice 10.5 Batch B2, F2.1): "1 of 124 answered" drawn.
 * The numbers are the caller's — this only draws them.
 */
export function ProgressBar({
  value,
  max,
  label,
  testId,
  className = "",
}: {
  value: number;
  max: number;
  /** What is being counted, for a screen reader ("Questions answered"). */
  label: string;
  testId?: string;
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${max}`}
      data-testid={testId}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle ${className}`}
    >
      <div
        className={`h-full rounded-full ${max > 0 && value >= max ? "bg-success" : "bg-brand-blue"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
