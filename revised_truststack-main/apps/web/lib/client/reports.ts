/** Browser-side shapes for the report store (Slice 9, Stage 3) — as `lib/reports/store.ts` returns them. */

export interface ReportItem {
  id: string;
  kind: string;
  kindLabel: string;
  format: string;
  version: number;
  status: "running" | "ready" | "failed";
  statusLabel: string;
  stalled: boolean;
  fileName: string;
  byteSize: number | null;
  asOf: string;
  requestedAt: string;
  generatedAt: string | null;
  generatedBy: string | null;
  generatedByName: string | null;
  subjectUserId: string | null;
  subjectName: string | null;
  error: string | null;
  /** Slice 11 Stage 2b (D-133.1): a finished version that kept its figures — a narrative may be drafted on it. */
  narratable: boolean;
  /** A narrated version: the version whose figures it prints. */
  narratedFromId: string | null;
  /** An accepted narrative about this version, not yet printed (the list only). */
  pendingNarrativeDraftId?: string | null;
}

export interface GeneratedReport {
  report: ReportItem;
  /** The Evidence Index generated with an evidence pack. */
  companion: ReportItem | null;
  generation: { totalMs: number; renderMs: number; bytes: number };
}

/** Who can be given an Owner Action Pack — the organisation's active members. */
export interface ReportMember {
  userId: string;
  fullName: string | null;
  roleName: string;
  status: string;
}

/** "21 KB", "1.4 MB" — a file size for a person. */
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** An ISO timestamp as India's date and time, short. */
export function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
