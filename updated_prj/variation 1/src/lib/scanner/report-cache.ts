const PREFIX = "truststack:scan-report:";

/** Stash a fresh report payload so the dedicated report page can render immediately. */
export function cacheScanReport(reportId: string, report: unknown): void {
  try {
    sessionStorage.setItem(
      PREFIX + reportId,
      JSON.stringify({ savedAt: Date.now(), report })
    );
  } catch {
    /* quota / private mode */
  }
}

export function readCachedScanReport(reportId: string): unknown | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + reportId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; report?: unknown };
    if (!parsed?.report) return null;
    if (parsed.savedAt && Date.now() - parsed.savedAt > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(PREFIX + reportId);
      return null;
    }
    return parsed.report;
  } catch {
    return null;
  }
}
