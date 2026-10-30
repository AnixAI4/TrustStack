import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";

export type NoticeTone = "info" | "success" | "warning" | "error";

const TONE: Record<NoticeTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: "border-info-border bg-info-light text-info-text before:bg-info", icon: "text-info", Icon: Info },
  success: { box: "border-success-border bg-success-light text-success-text before:bg-success", icon: "text-success", Icon: CheckCircle2 },
  warning: { box: "border-warning-border bg-warning-light text-warning-text before:bg-warning", icon: "text-warning", Icon: AlertTriangle },
  error: { box: "border-danger-border bg-danger-light text-danger-text before:bg-danger", icon: "text-danger", Icon: XCircle },
};

/**
 * A message that must stay on the page — a refusal, a legal note, a warning,
 * a saved confirmation (Slice 10.5 Stage B0). One look everywhere: an icon, a
 * coloured left edge, an optional bold title, then the text.
 *
 * The test id sits on the outer element and the icon carries no text, so an
 * existing message keeps the exact text its e2e asserts. Errors and warnings
 * are announced (`role="alert"`), the rest politely (`role="status"`).
 */
export function Notice({
  tone = "info",
  title,
  children,
  testId,
  className = "",
  compact = false,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  testId?: string;
  className?: string;
  /** Smaller padding and text, for a message under a form field or inside a card. */
  compact?: boolean;
}) {
  const t = TONE[tone];
  const role = tone === "error" || tone === "warning" ? "alert" : "status";
  return (
    <div
      data-testid={testId}
      role={role}
      className={`relative flex gap-2.5 overflow-hidden rounded-lg border before:absolute before:inset-y-0 before:left-0 before:w-1 ${
        compact ? "py-2 pl-3.5 pr-3 text-xs" : "py-3 pl-4 pr-4 text-sm"
      } ${t.box} ${className}`}
    >
      <t.Icon aria-hidden="true" className={`mt-0.5 shrink-0 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"} ${t.icon}`} />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
