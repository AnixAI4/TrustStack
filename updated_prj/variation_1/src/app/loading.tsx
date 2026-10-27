/**
 * Next.js App Router route-level loading UI.
 * Shown automatically while a server page segment is being streamed.
 * Minimal: a single small spinner, centered - no skeleton, no labels.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
