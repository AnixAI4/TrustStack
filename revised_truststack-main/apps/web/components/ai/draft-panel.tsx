"use client";

import {
  AI_INTIMATION_SECTIONS,
  AI_ROPA_FIELD_LABEL,
  AI_ROPA_TEXT_FIELDS,
  AI_ROPA_TRI_FIELDS,
  AI_TASK_SPECS,
  BOARD_COMPLAINT_TEXT,
  CONSENT_LANGUAGE_LABEL,
  countNoun,
  intimationPlainText,
  NOTICE_LIMITS,
  noticeDataItems,
  ROPA_LAWFUL_BASES,
  WITHDRAW_TEXT,
  type AiTask,
  type ConsentLanguage,
  type NoticePurpose,
} from "@truststack/core";
import { Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { Tabs } from "@/components/ui/tabs";
import { useAiStatus, type AiRegisterDraft, type AiStoredDraft } from "@/lib/client/ai";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";
import { Feedback } from "./assistant-panel";

/**
 * The TrustStack Assistant's DRAFTING mode (SLICE_11 §2.3, §7b.7; Stage 2a, D-129):
 * a processing record from a description, the Board intimation under Rule 7(2),
 * a response to a rights request. The person edits every field, then accepts or
 * discards the draft. Accepting keeps their text on the draft and hands it back to
 * the page, which PRE-FILLS the register's own form — nothing is saved to a
 * register until the person clicks that form's own Save.
 *
 * Shown only to a person holding `ai.use`, the register's read AND write
 * permissions (§4.7, D-129.3), while `GET …/ai` says the assistant can answer
 * here. The backend enforces all of it again; this only hides.
 *
 * Stage 2b (D-133): a privacy notice from the processing register and its Hindi or
 * Marathi translation (accepting pre-fills the notice editor — the person saves and
 * publishes there), and a report's narrative (accepting lets a person print a NEW
 * version: the stored figures with the narrative in front — never automatic).
 */

/** A notice's purpose as the panel edits it: the data items one per line (as the notice editor). */
interface PurposeDraft {
  key: string;
  title: string;
  uses: string;
  dataItems: string;
}
const toPurposeDraft = (p: Partial<NoticePurpose>): PurposeDraft => ({
  key: p.key ?? "",
  title: p.title ?? "",
  uses: p.uses ?? "",
  dataItems: (p.dataItems ?? []).join("\n"),
});
const fromPurposeDraft = (p: PurposeDraft): NoticePurpose => ({
  key: p.key.trim(),
  title: p.title.trim(),
  uses: p.uses.trim(),
  dataItems: p.dataItems
    .split("\n")
    .map((d) => d.trim())
    .filter((d) => d !== ""),
});
const isNoticeTask = (task: AiTask) => task === "notice_draft" || task === "notice_translation_draft";

/** What the person accepted, in words, for the toast. */
const ACCEPTED_TOAST: Partial<Record<AiTask, string>> = {
  ropa_draft: "Draft accepted — check the form, then save the record",
  breach_intimation_draft: "Draft accepted — it is below, to copy for counsel",
  rights_response_draft: "Draft accepted — choose the outcome, then save the response",
  notice_draft: "Draft accepted — check the notice, then save and publish it",
  notice_translation_draft: "Translation accepted — check it, then save and publish it",
  report_narrative_draft: "Narrative accepted — print the narrated version when you are ready",
};

const TRI_LABEL = { yes: "Yes", no: "No", unknown: "Not sure" } as const;

interface DraftButtonProps {
  organizationId: string;
  task: AiTask;
  /** The task's body without `ask`: `{ breachId }`, `{ requestId }` — or none for a record drafted from a description. */
  body?: Record<string, string>;
  /** What is being drafted, in the panel's header. */
  subject: string;
  /** The button's words, where the task's own label is not specific enough ("Translate into Hindi"). */
  label?: string;
  /** Called with the accepted draft (the person's own text in `acceptedOutput`). */
  onAccepted: (draft: AiStoredDraft) => void;
  testId: string;
  className?: string;
  /** "xs" in a table row, beside the row's other small buttons. */
  size?: "sm" | "xs";
}

export function DraftButton({ organizationId, task, body, subject, label, onAccepted, testId, className = "", size = "sm" }: DraftButtonProps) {
  const permissions = usePermissions();
  const status = useAiStatus(organizationId);
  const [open, setOpen] = useState(false);
  const spec = AI_TASK_SPECS[task];
  const held =
    permissions.kind === "ready" &&
    ["ai.use", spec.readPermission, spec.writePermission].every((p) => p !== null && (permissions.value.permissions as string[]).includes(p));
  if (!held || !status?.available) return null;
  return (
    <>
      <button
        type="button"
        data-testid={testId}
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-surface font-medium text-indigo-700 hover:bg-indigo-50 ${size === "xs" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"} ${className}`}
      >
        <Sparkles aria-hidden="true" className={size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label ?? spec.label}
      </button>
      {open && (
        <DraftPanel
          organizationId={organizationId}
          task={task}
          body={body ?? null}
          subject={subject}
          onClose={() => setOpen(false)}
          onAccepted={(d) => {
            setOpen(false);
            onAccepted(d);
          }}
        />
      )}
    </>
  );
}

type Phase =
  | { kind: "describe" }
  | { kind: "asking" }
  | { kind: "draft"; draft: AiRegisterDraft }
  | { kind: "error"; tone: "warning" | "error"; title: string; message: string };

const SLOW_AFTER_MS = 10_000;

function DraftPanel({
  organizationId,
  task,
  body,
  subject,
  onClose,
  onAccepted,
}: {
  organizationId: string;
  task: AiTask;
  body: Record<string, string> | null;
  subject: string;
  onClose: () => void;
  onAccepted: (draft: AiStoredDraft) => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const fromDescription = body === null;
  const [phase, setPhase] = useState<Phase>(fromDescription ? { kind: "describe" } : { kind: "asking" });
  const [description, setDescription] = useState("");
  const [slow, setSlow] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [purposes, setPurposes] = useState<PurposeDraft[]>([]);
  const [busy, setBusy] = useState<"accept" | "discard" | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const run = useCallback(
    async (payload: Record<string, string>) => {
      setPhase({ kind: "asking" });
      setSlow(false);
      const r = await apiFetch<{ draft: AiRegisterDraft }>(`/api/v1/organizations/${organizationId}/ai/${task}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (r.success) {
        const d = r.data.draft.answer.draft;
        if (isNoticeTask(task)) {
          setFields({ language: String(d.language ?? "en"), title: String(d.title ?? ""), summary: String(d.summary ?? "") });
          setPurposes(((d.purposes as Partial<NoticePurpose>[] | undefined) ?? []).map(toPurposeDraft));
        } else if (task === "report_narrative_draft") {
          setFields({
            headline: String(d.headline ?? ""),
            paragraphs: ((d.paragraphs as string[] | undefined) ?? []).join("\n\n"),
            bullets: ((d.bullets as string[] | undefined) ?? []).join("\n"),
          });
        } else {
          setFields(Object.fromEntries(Object.entries(d).map(([k, v]) => [k, typeof v === "string" ? v : ""])));
        }
        return setPhase({ kind: "draft", draft: r.data.draft });
      }
      const code = r.error.code;
      setPhase({
        kind: "error",
        tone: code === "AI_ANSWER_REJECTED" || code === "RATE_LIMITED" || code === "AI_DISABLED" || code === "CONFLICT" ? "warning" : "error",
        title:
          code === "AI_DISABLED"
            ? "The assistant is off here"
            : code === "AI_ANSWER_REJECTED"
              ? "That draft was not kept"
              : code === "RATE_LIMITED"
                ? "Please wait a little"
                : code === "CONFLICT"
                  ? "There is nothing to draft here"
                  : "The assistant could not draft this",
        message: r.error.message,
      });
    },
    [organizationId, task],
  );

  // A breach or a request: draft at once, one click from the page. A record: ask for the description first.
  useEffect(() => {
    if (!fromDescription && body) void run(body);
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

  function describe(event: FormEvent) {
    event.preventDefault();
    if (description.trim().length < 20) return;
    void run({ description: description.trim() });
  }

  async function decide(kind: "accept" | "discard") {
    if (phase.kind !== "draft") return;
    setBusy(kind);
    setDecisionError(null);
    const lines = (text: string, separator: RegExp) =>
      text
        .split(separator)
        .map((x) => x.trim())
        .filter((x) => x !== "");
    const output =
      task === "ropa_draft"
        ? { ...fields, lawfulBasis: fields.lawfulBasis ? fields.lawfulBasis : null }
        : isNoticeTask(task)
          ? { language: fields.language, title: fields.title, summary: fields.summary, purposes: purposes.map(fromPurposeDraft) }
          : task === "report_narrative_draft"
            ? { headline: fields.headline, paragraphs: lines(fields.paragraphs ?? "", /\n\s*\n/), bullets: lines(fields.bullets ?? "", /\n/) }
            : Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v]));
    const r = await apiFetch<{ draft: AiStoredDraft }>(`/api/v1/organizations/${organizationId}/ai/drafts/${phase.draft.id}/${kind}`, {
      method: "POST",
      ...(kind === "accept" ? { body: JSON.stringify({ output }) } : {}),
    });
    setBusy(null);
    if (!r.success) return setDecisionError(r.error.details?.[0] ? `${r.error.message} (${r.error.details[0].field})` : r.error.message);
    if (kind === "discard") {
      toast.success("Draft discarded");
      return onClose();
    }
    toast.success(ACCEPTED_TOAST[task] ?? "Draft accepted");
    onAccepted(r.data.draft);
  }

  const set = (key: string) => (value: string) => setFields((f) => ({ ...f, [key]: value }));

  return createPortal(
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-[45] bg-brand-navy-dark/30" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="ai-draft-panel"
        className="fixed inset-y-0 right-0 z-[46] flex w-full max-w-xl flex-col border-l border-line bg-surface shadow-card-hover"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p id={titleId} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-indigo-700" />
              TrustStack Assistant · {AI_TASK_SPECS[task].label}
            </p>
            <p data-testid="ai-draft-subject" className="mt-0.5 line-clamp-2 text-xs text-ink-soft">
              {subject}
            </p>
          </div>
          <button ref={closeRef} type="button" data-testid="ai-draft-close" onClick={onClose} aria-label="Close the assistant" className="rounded-md p-1 text-ink-soft hover:bg-surface-muted">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
          {phase.kind === "describe" && (
            <form onSubmit={describe} data-testid="ai-draft-describe" className="space-y-2">
              <label htmlFor={`${titleId}-describe`} className="block font-medium text-ink">
                Describe the activity in your own words
              </label>
              <p className="text-xs text-ink-soft">
                What happens, whose personal data, what it is used for, where it comes from. The assistant drafts the record; you check every
                field and save it yourself.
              </p>
              <textarea
                id={`${titleId}-describe`}
                data-testid="ai-draft-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="For example: through the admissions portal we collect applicants' names, contact details and marks to decide admission."
                className="block w-full rounded-md border border-line-strong px-2 py-1.5 text-sm"
              />
              <p className="text-xs text-ink-muted">Do not type anyone&apos;s name, email or phone number here.</p>
              <button
                type="submit"
                data-testid="ai-draft-describe-send"
                disabled={description.trim().length < 20}
                className="rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-navy-dark disabled:opacity-50"
              >
                Draft the record
              </button>
            </form>
          )}

          {phase.kind === "asking" && (
            <div data-testid="ai-draft-asking" role="status" className="space-y-2">
              <p className="text-ink">Reading the Act, the Rules and your organisation&apos;s own records…</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-300" />
              </div>
              <p className="text-xs text-ink-soft">
                {slow ? "Still working. A careful draft takes 20 to 40 seconds; it is checked in full before you see it." : "The draft is checked against the law before it is shown."}
              </p>
            </div>
          )}

          {phase.kind === "error" && (
            <Notice tone={phase.tone} title={phase.title} testId="ai-draft-error">
              {phase.message}
            </Notice>
          )}

          {phase.kind === "draft" && (
            <div data-testid="ai-draft" className="space-y-4">
              <p data-testid="ai-draft-headline" className="text-base font-semibold leading-snug text-ink">
                {phase.draft.answer.answer}
              </p>
              {phase.draft.answer.counselNote && (
                <Notice tone="info" compact testId="ai-draft-counsel">
                  {phase.draft.answer.legalReviewRequired ? "A legal draft. " : "Counsel to confirm: the law here depends on facts or is not settled. "}
                  {phase.draft.answer.counselNote}
                </Notice>
              )}
              <p className="text-xs text-ink-soft">Edit anything below. Nothing is saved to the register until you save it there yourself.</p>

              <div data-testid="ai-draft-fields" className="space-y-3">
                {task === "ropa_draft" && <RopaFields fields={fields} set={set} />}
                {task === "breach_intimation_draft" && <IntimationFields fields={fields} set={set} />}
                {task === "rights_response_draft" && <ResponseFields fields={fields} set={set} />}
                {isNoticeTask(task) && <NoticeFields fields={fields} set={set} purposes={purposes} setPurposes={setPurposes} translation={task === "notice_translation_draft"} />}
                {task === "report_narrative_draft" && <NarrativeFields fields={fields} set={set} />}
              </div>

              <details data-testid="ai-draft-law" className="rounded-lg border border-line px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium text-ink">The law behind this ({countNoun(phase.draft.answer.law.length, "provision", "provisions")})</summary>
                <ul className="mt-2 space-y-2">
                  {phase.draft.answer.law.map((l, i) => (
                    <li key={`${l.citation}-${i}`} className="text-sm">
                      <span className="font-semibold text-ink">{l.citation}</span>{" "}
                      <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[11px] ${l.source === "statute" ? "bg-info-light text-info-text" : "bg-warning-light text-warning-text"}`}>
                        {l.source === "statute" ? "The law" : "TrustStack default, not the law"}
                      </span>
                      <p className="mt-0.5 text-ink-soft">{l.point}</p>
                    </li>
                  ))}
                </ul>
              </details>

              {phase.draft.answer.missingInformation.length > 0 && (
                <div data-testid="ai-draft-missing">
                  <p className="text-xs font-semibold text-ink-soft">What the assistant did not know — you add it</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {phase.draft.answer.missingInformation.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-1 border-t border-line pt-3 text-xs text-ink-soft">
                <p data-testid="ai-draft-review-note" className="font-medium text-ink">
                  {phase.draft.answer.reviewNote}
                </p>
                <p data-testid="ai-draft-caveat">{phase.draft.answer.caveat}</p>
              </div>

              {decisionError && (
                <Notice tone="error" compact testId="ai-draft-decision-error">
                  {decisionError}
                </Notice>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="ai-draft-accept"
                  disabled={busy !== null}
                  onClick={() => void decide("accept")}
                  className="rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-navy-dark disabled:opacity-50"
                >
                  {busy === "accept"
                    ? "Accepting…"
                    : task === "ropa_draft" || task === "notice_draft"
                      ? "Use this draft"
                      : task === "notice_translation_draft"
                        ? "Use this translation"
                        : task === "report_narrative_draft"
                          ? "Accept this narrative"
                          : "Accept this draft"}
                </button>
                <button
                  type="button"
                  data-testid="ai-draft-discard"
                  disabled={busy !== null}
                  onClick={() => void decide("discard")}
                  className="rounded-md border border-line-strong px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-muted disabled:opacity-50"
                >
                  {busy === "discard" ? "Discarding…" : "Discard"}
                </button>
              </div>

              <Feedback organizationId={organizationId} draftId={phase.draft.id} />
            </div>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}

const fieldClass = "mt-0.5 block w-full rounded-md border border-line-strong px-2 py-1 text-sm text-ink";

function Field({ label, hint, value, onChange, rows = 2, testId }: { label: string; hint?: string; value: string; onChange: (v: string) => void; rows?: number; testId: string }) {
  return (
    <label className="block text-xs font-medium text-ink-soft">
      {label}
      {hint && <span className="block font-normal text-ink-muted">{hint}</span>}
      {rows === 1 ? (
        <input data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
      ) : (
        <textarea data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={fieldClass} />
      )}
    </label>
  );
}

function RopaFields({ fields, set }: { fields: Record<string, string>; set: (k: string) => (v: string) => void }) {
  return (
    <>
      {AI_ROPA_TEXT_FIELDS.map((f) => (
        <Field key={f} label={AI_ROPA_FIELD_LABEL[f]} value={fields[f] ?? ""} onChange={set(f)} rows={f === "name" ? 1 : 2} testId={`ai-draft-field-${f}`} />
      ))}
      <label className="block text-xs font-medium text-ink-soft">
        {AI_ROPA_FIELD_LABEL.lawfulBasis}
        <span className="block font-normal text-ink-muted">A suggestion for counsel to confirm — never a legal opinion.</span>
        <select data-testid="ai-draft-field-lawfulBasis" value={fields.lawfulBasis ?? ""} onChange={(e) => set("lawfulBasis")(e.target.value)} className={fieldClass}>
          <option value="">Not sure — leave for counsel</option>
          {ROPA_LAWFUL_BASES.map((b) => (
            <option key={b.code} value={b.code}>
              {b.section} — {b.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {AI_ROPA_TRI_FIELDS.map((f) => (
          <label key={f} className="block text-xs font-medium text-ink-soft">
            {AI_ROPA_FIELD_LABEL[f]}
            <select data-testid={`ai-draft-field-${f}`} value={fields[f] ?? "unknown"} onChange={(e) => set(f)(e.target.value)} className={fieldClass}>
              {(Object.keys(TRI_LABEL) as (keyof typeof TRI_LABEL)[]).map((t) => (
                <option key={t} value={t}>
                  {TRI_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </>
  );
}

function IntimationFields({ fields, set }: { fields: Record<string, string>; set: (k: string) => (v: string) => void }) {
  // Eleven sections: the Rule's two parts as two tabs (D-101). Both stay mounted, so edits survive a switch.
  return (
    <Tabs
      label="The parts of Rule 7(2)"
      testId="ai-draft-intimation-tabs"
      variant="steps"
      tabs={[
        {
          id: "intimation-a",
          label: "(a) Without delay",
          content: (
            <div className="space-y-3">
              <p className="text-xs text-ink-soft">The description of the breach — told to the Board without delay.</p>
              {AI_INTIMATION_SECTIONS.filter((s) => s.rule === "Rule 7(2)(a)").map((s) => (
                <Field key={s.key} label={s.label} value={fields[s.key] ?? ""} onChange={set(s.key)} testId={`ai-draft-field-${s.key}`} />
              ))}
            </div>
          ),
        },
        {
          id: "intimation-b",
          label: "(b) Within 72 hours",
          content: (
            <div className="space-y-3">
              <p className="text-xs text-ink-soft">
                Within seventy-two hours of becoming aware, or such longer period as the Board may allow on a written request.
              </p>
              {AI_INTIMATION_SECTIONS.filter((s) => s.rule !== "Rule 7(2)(a)").map((s) => (
                <Field
                  key={s.key}
                  label={`${s.rule.replace("Rule 7(2)(b)", "")} ${s.label}`}
                  hint={
                    s.key === "personFindings"
                      ? "Left for you to complete: TrustStack never asks the assistant about a person, so no one is named in a draft."
                      : s.key === "principalsReport"
                        ? "Written by TrustStack from this breach's own record of telling the people affected (Rule 7(1)) — not by the assistant."
                        : undefined
                  }
                  value={fields[s.key] ?? ""}
                  onChange={set(s.key)}
                  rows={3}
                  testId={`ai-draft-field-${s.key}`}
                />
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}

function ResponseFields({ fields, set }: { fields: Record<string, string>; set: (k: string) => (v: string) => void }) {
  return (
    <>
      <Field
        label="The letter"
        hint="Fill in [Name], [reference], [date] and every [placeholder] before you send it. The decision on the request is yours."
        value={fields.letter ?? ""}
        onChange={set("letter")}
        rows={14}
        testId="ai-draft-field-letter"
      />
      <Field
        label="Summary for the register"
        hint="Pre-fills “What was done” when you record the response. You choose the outcome there."
        value={fields.summary ?? ""}
        onChange={set("summary")}
        rows={3}
        testId="ai-draft-field-summary"
      />
    </>
  );
}

function NoticeFields({
  fields,
  set,
  purposes,
  setPurposes,
  translation,
}: {
  fields: Record<string, string>;
  set: (k: string) => (v: string) => void;
  purposes: PurposeDraft[];
  setPurposes: (p: PurposeDraft[]) => void;
  translation: boolean;
}) {
  const edit = (i: number, field: keyof PurposeDraft, value: string) => setPurposes(purposes.map((p, j) => (j === i ? { ...p, [field]: value } : p)));
  const language = (fields.language ?? "en") as ConsentLanguage;
  return (
    <>
      <p className="text-xs text-ink-soft">
        {translation
          ? `A ${CONSENT_LANGUAGE_LABEL[language] ?? language} translation. Each purpose keeps its key — consents are recorded under it — so only the words change.`
          : "Drafted from the processing records that rely on consent, or whose basis is not yet decided (s.5(1)). A legitimate use under s.7 needs no consent notice, so it is left out."}
      </p>
      <Field label="Title" value={fields.title ?? ""} onChange={set("title")} rows={1} testId="ai-draft-field-title" />
      <Field label="Introduction" value={fields.summary ?? ""} onChange={set("summary")} rows={3} testId="ai-draft-field-summary" />
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-ink-soft">Purposes (Rule 3(b)) — {countNoun(purposes.length, "purpose", "purposes")}</legend>
        {purposes.map((p, i) => (
          <div key={i} data-testid={`ai-draft-purpose-${i}`} className="space-y-2 rounded-lg border border-line p-3">
            <label className="block text-xs font-medium text-ink-soft">
              Key
              <span className="block font-normal text-ink-muted">
                {translation ? "Kept from the notice — not translated." : "What the widget and the consent records name it by, e.g. alumni_updates."}
              </span>
              <input
                data-testid={`ai-draft-purpose-key-${i}`}
                value={p.key}
                readOnly={translation}
                onChange={(e) => edit(i, "key", e.target.value)}
                className={`${fieldClass} font-mono ${translation ? "bg-surface-muted" : ""}`}
              />
            </label>
            <Field label="Purpose" value={p.title} onChange={(v) => edit(i, "title", v)} rows={1} testId={`ai-draft-purpose-title-${i}`} />
            <Field label="What it provides or enables" value={p.uses} onChange={(v) => edit(i, "uses", v)} testId={`ai-draft-purpose-uses-${i}`} />
            <Field
              label="The personal data it needs — one item per line"
              value={p.dataItems}
              onChange={(v) => edit(i, "dataItems", v)}
              rows={3}
              testId={`ai-draft-purpose-data-${i}`}
            />
            {!translation && purposes.length > 1 && (
              <button type="button" className="text-xs text-danger-text hover:underline" onClick={() => setPurposes(purposes.filter((_, j) => j !== i))}>
                Remove this purpose
              </button>
            )}
          </div>
        ))}
        {!translation && purposes.length < NOTICE_LIMITS.purposes && (
          <button
            type="button"
            data-testid="ai-draft-add-purpose"
            onClick={() => setPurposes([...purposes, { key: "", title: "", uses: "", dataItems: "" }])}
            className="rounded-md border border-line-strong px-2 py-1 text-xs hover:bg-surface-muted"
          >
            Add a purpose
          </button>
        )}
        <p className="text-xs text-ink-muted">
          The itemised personal data, across every purpose: {noticeDataItems(purposes.map(fromPurposeDraft)).join(", ") || "none yet"}.
        </p>
      </fieldset>
      <div data-testid="ai-draft-fixed-texts" className="space-y-1 rounded-md bg-surface-muted p-2 text-xs text-ink-soft">
        <p className="font-medium text-ink">Always printed by TrustStack on the notice — not drafted</p>
        <p>“{WITHDRAW_TEXT}”</p>
        <p>“{BOARD_COMPLAINT_TEXT}”</p>
        <p>The links to your public request and grievance forms, and your published contact.</p>
      </div>
    </>
  );
}

function NarrativeFields({ fields, set }: { fields: Record<string, string>; set: (k: string) => (v: string) => void }) {
  return (
    <>
      <p className="text-xs text-ink-soft">
        Drafted from this version&apos;s stored figures. Every number must be one the report itself prints — a narrative with any other number
        is not accepted. Refer to a legal deadline by its citation.
      </p>
      <Field label="Headline" value={fields.headline ?? ""} onChange={set("headline")} rows={1} testId="ai-draft-field-headline" />
      <Field
        label="Paragraphs"
        hint="A blank line between paragraphs; at most four."
        value={fields.paragraphs ?? ""}
        onChange={set("paragraphs")}
        rows={8}
        testId="ai-draft-field-paragraphs"
      />
      <Field label="Points to act on" hint="One per line; at most eight." value={fields.bullets ?? ""} onChange={set("bullets")} rows={4} testId="ai-draft-field-bullets" />
    </>
  );
}

/**
 * The accepted text on the register's page (D-129.1, D-129.2): the latest accepted
 * Rule 7(2) intimation on the breach's step, or the latest accepted letter on the
 * request's Response step — to Copy or Download. It records nothing: the breach's
 * own step records that the report was made, and the copy actually sent is
 * attached under Documents.
 */
export function AcceptedDraft({
  organizationId,
  task,
  targetId,
  heading,
  reloadKey,
  testId,
}: {
  organizationId: string;
  task: "breach_intimation_draft" | "rights_response_draft";
  targetId: string;
  /** The incident or request code, printed at the top of a download. */
  heading: string;
  /** Bumped by the page after an accept, to read it again. */
  reloadKey: number;
  testId: string;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<AiStoredDraft | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiFetch<{ drafts: AiStoredDraft[] }>(`/api/v1/organizations/${organizationId}/ai/drafts?targetId=${targetId}&task=${task}&status=accepted`).then((r) => {
      if (!cancelled) setDraft(r.success ? (r.data.drafts[0] ?? null) : null);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, targetId, task, reloadKey]);

  if (!draft?.acceptedOutput) return null;
  const output = Object.fromEntries(Object.entries(draft.acceptedOutput).map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  const text = task === "breach_intimation_draft" ? intimationPlainText(output, heading) : `${output.letter ?? ""}\n`;
  const accepted = `Accepted${draft.decidedByName ? ` by ${draft.decidedByName}` : ""}${draft.decidedAt ? ` on ${formatDecided(draft.decidedAt)}` : ""}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy — select the text and copy it instead.");
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${heading}-${task === "breach_intimation_draft" ? "board-intimation" : "response-letter"}-draft.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div data-testid={testId} className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
        <Sparkles aria-hidden="true" className="h-4 w-4 text-indigo-700" />
        {task === "breach_intimation_draft" ? "Draft intimation to the Board" : "Draft response letter"} — {accepted}
      </p>
      <p className="text-xs text-ink-soft">
        {task === "breach_intimation_draft"
          ? "A draft for counsel to check before it is sent. Recording that the report was made is the step above. Attach the copy you actually sent under Documents."
          : "A draft for counsel to check before it is sent. Fill in every [placeholder]. Attach the copy you actually sent under Documents."}
      </p>
      <details>
        <summary className="cursor-pointer text-xs font-medium text-indigo-700">Show the text</summary>
        <pre data-testid={`${testId}-text`} className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-surface p-2 font-sans text-xs text-ink">
          {text}
        </pre>
      </details>
      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid={`${testId}-copy`} onClick={() => void copy()} className="rounded-md border border-line-strong bg-surface px-2 py-1 text-xs hover:bg-surface-muted">
          Copy
        </button>
        <button type="button" data-testid={`${testId}-download`} onClick={download} className="rounded-md border border-line-strong bg-surface px-2 py-1 text-xs hover:bg-surface-muted">
          Download (.txt)
        </button>
      </div>
    </div>
  );
}

function formatDecided(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso)) + " IST";
}
