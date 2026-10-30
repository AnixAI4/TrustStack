"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { NoticeTone } from "./notice";

/** How long a success or info toast stays; warnings and errors stay until closed. */
export const TOAST_AUTO_DISMISS_MS = 4000;

interface ToastItem {
  id: number;
  tone: NoticeTone;
  title: string;
  body?: string;
}

interface ToastApi {
  show: (tone: NoticeTone, title: string, body?: string) => void;
  success: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
  warning: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
}

const NOOP: ToastApi = { show: () => {}, success: () => {}, info: () => {}, warning: () => {}, error: () => {} };
const ToastContext = createContext<ToastApi>(NOOP);

/**
 * Transient outcomes — "Saved", "Published", "Invitation sent" — shown top
 * right, under the top bar (Slice 10.5 Stage B0). Built in-house: a context and
 * a list, no dependency.
 *
 * A toast never replaces the message on the page: the inline `<Notice>` (and
 * its test id) stays, the toast only makes the outcome hard to miss.
 * Outside a provider (a public page) `useToast()` is a silent no-op.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const show = useCallback((tone: NoticeTone, title: string, body?: string) => {
    const id = next.current++;
    // Newest on top; never more than four at once.
    setToasts((all) => [{ id, tone, title, body }, ...all].slice(0, 4));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, body) => show("success", title, body),
      info: (title, body) => show("info", title, body),
      warning: (title, body) => show("warning", title, body),
      error: (title, body) => show("error", title, body),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        data-testid="toasts"
        className="pointer-events-none fixed right-4 top-16 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

const STYLE: Record<NoticeTone, { edge: string; icon: string; Icon: typeof Info }> = {
  info: { edge: "before:bg-info", icon: "text-info", Icon: Info },
  success: { edge: "before:bg-success", icon: "text-success", Icon: CheckCircle2 },
  warning: { edge: "before:bg-warning", icon: "text-warning", Icon: AlertTriangle },
  error: { edge: "before:bg-danger", icon: "text-danger", Icon: XCircle },
};

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const s = STYLE[toast.tone];
  const sticky = toast.tone === "error" || toast.tone === "warning";

  useEffect(() => {
    if (sticky) return;
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [sticky, onDismiss, toast.id]);

  return (
    <div
      role={sticky ? "alert" : "status"}
      data-testid={`toast-${toast.tone}`}
      className={`pointer-events-auto relative flex animate-toast-in gap-3 overflow-hidden rounded-lg border border-line bg-surface py-3 pl-4 pr-3 shadow-toast before:absolute before:inset-y-0 before:left-0 before:w-1 ${s.edge}`}
    >
      <s.Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${s.icon}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.body && <p className="mt-0.5 text-sm text-ink-soft">{toast.body}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Close"
        className="-mr-1 -mt-1 h-7 w-7 shrink-0 rounded-md text-ink-muted hover:bg-surface-subtle hover:text-ink"
      >
        <X aria-hidden="true" className="mx-auto h-4 w-4" />
      </button>
    </div>
  );
}
