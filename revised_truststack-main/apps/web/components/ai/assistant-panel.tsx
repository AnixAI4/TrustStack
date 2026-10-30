"use client";

import { AI_TASK_SPECS, countNoun, type AiTask } from "@truststack/core";
import { ChevronRight, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { useAiStatus, type AiDraft, type AiNextStepPage } from "@/lib/client/ai";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";

/** Where the answer's one next step leads on this page: a link, or something to do here. */
export type NextSteps = Partial<Record<Exclude<AiNextStepPage, "none">, { href: string } | { onSelect: () => void }>>;

interface ExplainProps {
  organizationId: string;
  task: AiTask;
  /** The task's body, without `ask` — the gateway validates it (Zod). */
  body: Record<string, string>;
  /** What is being explained, in the panel's header: a question's text, a gap, a domain. */
  subject: string;
  /** The button's words; the task's own label by default ("Explain this question"). */
  label?: string;
  nextSteps?: NextSteps;
  testId: string;
  className?: string;
}

/**
 * "Explain" — the TrustStack Assistant in the side panel (SLICE_11 §2.2, §4.13;
 * Stage 1b). Shown only to a person who holds `ai.use` AND the task's own read
 * permission (§4.7), and only while `GET …/ai` says the assistant can answer
 * here (off, held or switched off by the platform: no button at all). The
 * backend enforces all of it again; this only hides.
 */
export function ExplainButton({ organizationId, task, body, subject, label, nextSteps, testId, className = "" }: ExplainProps) {
  const permissions = usePermissions();
  const status = useAiStatus(organizationId);
  const [open, setOpen] = useState(false);
  const held =
    permissions.kind === "ready" &&
    permissions.value.permissions.includes("ai.use") &&
    permissions.value.permissions.includes(AI_TASK_SPECS[task].readPermission);
  if (!held || !status?.available) return null;
  return (
    <>
      <button
        type="button"
        data-testid={testId}
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-surface px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 ${className}`}
      >
        <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
        {label ?? AI_TASK_SPECS[task].label}
      </button>
      {open && (
        <AssistantPanel
          organizationId={organizationId}
          task={task}
          title={label && label !== "Explain" ? label : AI_TASK_SPECS[task].label}
          body={body}
          subject={subject}
          nextSteps={nextSteps ?? {}}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

type Phase =
  | { kind: "asking"; since: number }
  | { kind: "answer"; draft: AiDraft }
  | { kind: "error"; tone: "warning" | "error"; title: string; message: string };

/** A calm wait (§4.12, D-127): the answer is checked whole before it is shown, so it arrives at once. */
const SLOW_AFTER_MS = 10_000;

function AssistantPanel({
  organizationId,
  task,
  title,
  body,
  subject,
  nextSteps,
  onClose,
}: {
  organizationId: string;
  task: AiTask;
  /** The panel's heading: what the person asked for ("Explain this action"). */
  title: string;
  body: Record<string, string>;
  subject: string;
  nextSteps: NextSteps;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "asking", since: Date.now() });
  const [slow, setSlow] = useState(false);
  const [question, setQuestion] = useState("");

  const run = useCallback(
    async (ask?: string) => {
      setPhase({ kind: "asking", since: Date.now() });
      setSlow(false);
      const r = await apiFetch<{ draft: AiDraft }>(`/api/v1/organizations/${organizationId}/ai/${task}`, {
        method: "POST",
        body: JSON.stringify(ask ? { ...body, ask } : body),
      });
      if (r.success) return setPhase({ kind: "answer", draft: r.data.draft });
      const code = r.error.code;
      setPhase({
        kind: "error",
        tone: code === "AI_ANSWER_REJECTED" || code === "RATE_LIMITED" || code === "AI_DISABLED" ? "warning" : "error",
        title:
          code === "AI_DISABLED"
            ? "The assistant is off here"
            : code === "AI_ANSWER_REJECTED"
              ? "That answer was not kept"
              : code === "RATE_LIMITED"
                ? "Please wait a little"
                : "The assistant could not answer",
        message: r.error.message,
      });
    },
    [organizationId, task, body],
  );

  // Ask once on open: one click from the page to an answer.
  useEffect(() => {
    void run();
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    if (phase.kind !== "asking") return;
    const t = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function followUp(event: FormEvent) {
    event.preventDefault();
    const ask = question.trim();
    if (ask === "") return;
    void run(ask);
  }

  return createPortal(
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-[45] bg-brand-navy-dark/30" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="ai-panel"
        className="fixed inset-y-0 right-0 z-[46] flex w-full max-w-md flex-col border-l border-line bg-surface shadow-card-hover"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p id={titleId} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-indigo-700" />
              TrustStack Assistant · {title}
            </p>
            <p data-testid="ai-panel-subject" className="mt-0.5 line-clamp-2 text-xs text-ink-soft">
              {subject}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            data-testid="ai-panel-close"
            onClick={onClose}
            aria-label="Close the assistant"
            className="rounded-md p-1 text-ink-soft hover:bg-surface-muted"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
          {phase.kind === "asking" && (
            <div data-testid="ai-panel-asking" role="status" className="space-y-2">
              <p className="text-ink">Reading the Act, the Rules and your organisation&apos;s own records…</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-300" />
              </div>
              <p className="text-xs text-ink-soft">
                {slow
                  ? "Still working. A careful answer takes 15 to 25 seconds; it is checked in full before you see it."
                  : "The answer is checked against the law before it is shown."}
              </p>
            </div>
          )}

          {phase.kind === "error" && (
            <Notice tone={phase.tone} title={phase.title} testId="ai-panel-error">
              {phase.message}
            </Notice>
          )}

          {phase.kind === "answer" && <Answer draft={phase.draft} organizationId={organizationId} nextSteps={nextSteps} onClose={onClose} />}
        </div>

        <form onSubmit={followUp} className="space-y-2 border-t border-line px-4 py-3">
          <label htmlFor={`${titleId}-ask`} className="block text-xs font-medium text-ink-soft">
            Ask something more specific (optional)
          </label>
          <div className="flex gap-2">
            <input
              id={`${titleId}-ask`}
              data-testid="ai-panel-ask"
              value={question}
              maxLength={500}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="For example: what would a reviewer accept here?"
              className="min-w-0 flex-1 rounded-md border border-line-strong px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              data-testid="ai-panel-ask-send"
              disabled={phase.kind === "asking" || question.trim() === ""}
              className="rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-navy-dark disabled:opacity-50"
            >
              Ask
            </button>
          </div>
          <p className="text-xs text-ink-muted">Do not type anyone&apos;s name, email or phone number here.</p>
        </form>
      </aside>
    </>,
    document.body,
  );
}

/** §4.13's one shape: the answer · why it matters · one next step · the law (folded) · tell me more. */
function Answer({ draft, organizationId, nextSteps, onClose }: { draft: AiDraft; organizationId: string; nextSteps: NextSteps; onClose: () => void }) {
  const a = draft.answer;
  const step = a.nextStep.page === "none" ? undefined : nextSteps[a.nextStep.page];
  const stepClass =
    "inline-flex items-center gap-1 rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-navy-dark";
  return (
    <div data-testid="ai-answer" className="space-y-4">
      <p data-testid="ai-answer-headline" className="text-base font-semibold leading-snug text-ink">
        {a.answer}
      </p>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Why it matters here</h3>
        <p data-testid="ai-answer-why" className="mt-1 text-ink">
          {a.whyItMatters}
        </p>
      </section>

      {a.nextStep.page !== "none" && (
        <div data-testid="ai-answer-next">
          {step && "href" in step ? (
            <Link href={step.href} className={stepClass} data-testid="ai-answer-next-step">
              {a.nextStep.label}
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          ) : step ? (
            <button
              type="button"
              data-testid="ai-answer-next-step"
              className={stepClass}
              onClick={() => {
                onClose();
                step.onSelect();
              }}
            >
              {a.nextStep.label}
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : (
            <p className="text-sm font-medium text-ink">Next step: {a.nextStep.label}</p>
          )}
        </div>
      )}

      {a.counselNote && (
        <Notice tone="info" compact testId="ai-answer-counsel">
          {a.counselToConfirm ? "Counsel to confirm: the law here depends on facts or is not settled. " : ""}
          {a.counselNote}
        </Notice>
      )}

      <details data-testid="ai-answer-law" className="rounded-lg border border-line px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-ink">The law behind this ({countNoun(a.law.length, "provision", "provisions")})</summary>
        <ul className="mt-2 space-y-2">
          {a.law.map((l, i) => (
            <li key={`${l.citation}-${i}`} className="text-sm">
              <span className="font-semibold text-ink">{l.citation}</span>{" "}
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[11px] ${
                  l.source === "statute" ? "bg-info-light text-info-text" : "bg-warning-light text-warning-text"
                }`}
              >
                {l.source === "statute" ? "The law" : "TrustStack default, not the law"}
              </span>
              <p className="mt-0.5 text-ink-soft">{l.point}</p>
            </li>
          ))}
        </ul>
        {draft.citationFlags.length > 0 && (
          <p data-testid="ai-answer-citation-flags" className="mt-2 text-xs text-ink-soft">
            {countNoun(draft.citationFlags.length, "reference", "references")} the assistant gave could not be found in the Act or the Rules,
            so {draft.citationFlags.length === 1 ? "it was" : "they were"} removed.
          </p>
        )}
      </details>

      {(a.moreDetail || a.suggestedEvidence.length > 0 || a.missingInformation.length > 0) && (
        <details data-testid="ai-answer-more" className="rounded-lg border border-line px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-ink">Tell me more</summary>
          <div className="mt-2 space-y-3">
            {a.moreDetail && <p className="whitespace-pre-line text-ink">{a.moreDetail}</p>}
            {a.suggestedEvidence.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-soft">Evidence that would help</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {a.suggestedEvidence.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {a.missingInformation.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-soft">What the assistant did not know</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {a.missingInformation.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      <div className="space-y-1 border-t border-line pt-3 text-xs text-ink-soft">
        <p data-testid="ai-answer-review-note" className="font-medium text-ink">
          {a.reviewNote}
        </p>
        <p data-testid="ai-answer-caveat">{a.caveat}</p>
      </div>

      <Feedback organizationId={organizationId} draftId={draft.id} />
    </div>
  );
}

/** Thumbs up or down, with an optional comment — once (§4.13). The comment is scrubbed by the server (A3). Shared with the drafting panel. */
export function Feedback({ organizationId, draftId }: { organizationId: string; draftId: string }) {
  const toast = useToast();
  const [choice, setChoice] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState<"up" | "down" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!choice) return;
    setBusy(true);
    setError(null);
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/ai/drafts/${draftId}/feedback`, {
      method: "POST",
      body: JSON.stringify(comment.trim() ? { feedback: choice, comment: comment.trim() } : { feedback: choice }),
    });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    setSent(choice);
    toast.success("Thanks for the feedback");
  }

  if (sent) {
    return (
      <p data-testid="ai-feedback-sent" className="text-xs text-ink-soft">
        You rated this answer {sent === "up" ? "helpful" : "not helpful"}. Thank you.
      </p>
    );
  }
  const thumb = (value: "up" | "down") =>
    `inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
      choice === value ? "border-brand-navy bg-brand-navy text-white" : "border-line-strong bg-surface text-ink-soft hover:bg-surface-muted"
    }`;
  return (
    <form onSubmit={send} data-testid="ai-feedback" className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-soft">Was this helpful?</span>
        <button type="button" data-testid="ai-feedback-up" aria-pressed={choice === "up"} onClick={() => setChoice("up")} className={thumb("up")}>
          <ThumbsUp aria-hidden="true" className="h-3.5 w-3.5" /> Yes
        </button>
        <button type="button" data-testid="ai-feedback-down" aria-pressed={choice === "down"} onClick={() => setChoice("down")} className={thumb("down")}>
          <ThumbsDown aria-hidden="true" className="h-3.5 w-3.5" /> No
        </button>
      </div>
      {choice && (
        <>
          <label className="block text-xs text-ink-soft">
            Anything to add? (optional)
            <textarea
              data-testid="ai-feedback-comment"
              value={comment}
              maxLength={500}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-md border border-line-strong px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            data-testid="ai-feedback-send"
            disabled={busy}
            className="rounded-md border border-brand-navy px-3 py-1 text-xs font-medium text-brand-navy hover:bg-indigo-50 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send feedback"}
          </button>
        </>
      )}
      {error && (
        <Notice tone="error" compact testId="ai-feedback-error">
          {error}
        </Notice>
      )}
    </form>
  );
}
