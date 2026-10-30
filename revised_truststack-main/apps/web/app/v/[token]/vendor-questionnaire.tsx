"use client";

import {
  allowedAnswers,
  EVIDENCE_CONTENT_TYPES,
  EVIDENCE_MAX_BYTES,
  INTAKE_LIMITS,
  SCORED_VENDOR_QUESTIONS,
  VENDOR_DECLARATION,
  VENDOR_LINK_LIMITS,
  VENDOR_QUESTION_SECTIONS,
  VENDOR_QUESTIONS,
  VENDOR_SECTION_LABEL,
  vendorSectionVoice,
  vendorVoice,
  type VendorQuestion,
} from "@truststack/core";
import { useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { SteppedTabs, type StepDef } from "@/components/ui/stepped-tabs";
import { apiFetch, type ApiResult } from "@/lib/client/api";
import { SECTION_TAB } from "@/lib/client/processors";

/**
 * The vendor's respondent answers the questionnaire (Slice 10, Stage 4b), in
 * three steps: a code emailed to the address the link was sent to (it proves
 * the address — a forwarded link is useless without the mailbox); the 4a
 * questionnaire, with their own documents; and a signed declaration. The same
 * controls hold as for staff — the database refuses an incomplete submission,
 * and a claim a document must back scores as the risky answer until one is
 * cited — and nothing counts until someone at the organisation accepts it.
 */

interface Header {
  organization: { name: string; legalName: string | null };
  vendor: { name: string; service: string | null };
  version: number;
  respondentName: string;
  /** Masked by the server. */
  respondentEmail: string;
  expiresAt: string;
}

interface LinkAnswer {
  code: string;
  answer: string | null;
  notApplicable: boolean;
  naReason: string | null;
  evidenceId: string | null;
  documentOnFile: boolean;
}

interface LinkDocument {
  id: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  uploadedAt: string;
  attached: boolean;
}

export type LinkView =
  | ({ status: "unconfirmed" } & Header)
  | ({ status: "open" } & Header & { answers: LinkAnswer[]; documents: LinkDocument[]; missing: string[] });

/** A document the organisation already holds stays cited until the respondent changes it. */
const ON_FILE = "on_file";

interface Draft {
  answer: string;
  notApplicable: boolean;
  naReason: string;
  /** "" none · a document uploaded here · ON_FILE. */
  evidenceId: string;
}

const EMPTY: Draft = { answer: "", notApplicable: false, naReason: "", evidenceId: "" };

const isAnswered = (d: Draft | undefined) => d !== undefined && (d.notApplicable || d.answer.trim() !== "");
const ANSWER_LABEL: Record<string, string> = { yes: "Yes", no: "No", partial: "Partly" };
const input = "rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";

function formatInstant(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso)) + " IST";
}

function outcomeOf<T>(r: ApiResult<T>): string | null {
  return r.success ? null : (r.error.details?.find((d) => d.field === "outcome")?.issue ?? null);
}

function draftsOf(answers: readonly LinkAnswer[]): Record<string, Draft> {
  return Object.fromEntries(
    answers.map((a) => [
      a.code,
      { answer: a.answer ?? "", notApplicable: a.notApplicable, naReason: a.naReason ?? "", evidenceId: a.evidenceId ?? (a.documentOnFile ? ON_FILE : "") },
    ]),
  );
}

export function VendorQuestionnaire({ token, initial }: { token: string; initial: LinkView }) {
  const base = `/api/v1/vendor-links/${token}`;
  const [view, setView] = useState<LinkView | null>(initial);
  const [gone, setGone] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(initial.status === "open" ? draftsOf(initial.answers) : {});
  const [codeSent, setCodeSent] = useState<{ email: string; emailed: boolean } | null>(null);
  const [code, setCode] = useState("");
  const [declaredName, setDeclaredName] = useState(initial.respondentName);
  const [declaredRole, setDeclaredRole] = useState("");
  const [accurate, setAccurate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** A refusal that ends the visit (the link is gone) or sends the respondent back to the code. */
  function handle<T>(r: ApiResult<T>): r is { success: true; data: T } {
    if (r.success) return true;
    const outcome = outcomeOf(r);
    if (outcome === "not_found" || outcome === "locked") setGone(r.error.message);
    else if (outcome === "unconfirmed") {
      setView((v) => (v ? { ...v, status: "unconfirmed" } as LinkView : v));
      setError(r.error.message);
    } else setError(r.error.message);
    return false;
  }

  function adopt(next: LinkView) {
    setView(next);
    if (next.status === "open") setDrafts(draftsOf(next.answers));
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  async function reload() {
    const r = await apiFetch<LinkView>(base);
    if (handle(r)) adopt(r.data);
  }

  if (gone) {
    return (
      <p data-testid="vendor-link-gone" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        {gone}
      </p>
    );
  }
  if (submitted) {
    return (
      <Notice tone="success" testId="vendor-link-submitted">
        <p className="font-semibold">Thank you — your answers were submitted on {formatInstant(submitted)}.</p>
        <p>
          {initial.organization.name} will review them. Nothing is final until it does; if it needs anything more it will contact you,
          and may send you a new link. This link no longer works.
        </p>
      </Notice>
    );
  }
  if (!view) return null;

  if (view.status === "unconfirmed") {
    return (
      <section data-testid="vendor-link-confirm" className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-sm">
        <p className="text-slate-800">
          {view.organization.name} asks you, {view.respondentName}, to answer its processor questionnaire about{" "}
          <strong>{view.vendor.name}</strong>
          {view.vendor.service ? ` (${view.vendor.service})` : ""}. The link works until {formatInstant(view.expiresAt)}.
        </p>
        <p className="text-slate-700">
          First, confirm it is you: we email a six-digit code to <strong>{codeSent?.email ?? view.respondentEmail}</strong>, the address
          this link was sent to.
        </p>
        {error && (
          <Notice tone="error" testId="vendor-link-error">
            {error}
          </Notice>
        )}
        {codeSent && (
          <Notice tone="success" testId="vendor-link-code-sent">
            {codeSent.emailed
              ? `We sent a code to ${codeSent.email}. Enter it within ${INTAKE_LIMITS.codeMinutes} minutes.`
              : "We could not send the email just now. Ask for a new code in a minute."}
          </Notice>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            data-testid="vendor-link-send-code"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const r = await apiFetch<{ email: string; emailed: boolean }>(`${base}/code`, { method: "POST" });
                if (handle(r)) setCodeSent(r.data);
              })
            }
            className={
              codeSent
                ? "rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                : "rounded-md bg-indigo-700 px-4 py-2 font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
            }
          >
            {codeSent ? "Send a new code" : "Email me a code"}
          </button>
          {codeSent && (
            <>
              <label className="flex flex-col text-xs text-slate-600">
                Code
                <input
                  data-testid="vendor-link-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className={`${input} mt-0.5 w-32 font-mono tracking-widest`}
                />
              </label>
              <button
                type="button"
                data-testid="vendor-link-confirm-code"
                disabled={busy || code.length !== 6}
                onClick={() =>
                  run(async () => {
                    const r = await apiFetch(`${base}/confirm`, { method: "POST", body: JSON.stringify({ code }) });
                    if (!handle(r)) return;
                    setCode("");
                    await reload();
                  })
                }
                className="rounded-md bg-indigo-700 px-3 py-1.5 font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
              >
                Confirm
              </button>
            </>
          )}
        </div>
      </section>
    );
  }

  const documents = view.documents.filter((d) => d.attached);
  const answered = SCORED_VENDOR_QUESTIONS.filter((q) => isAnswered(drafts[q.code])).length;
  /** A claim a document must back, with none cited — it scores as the risky answer (the row says so too). */
  const claimedOnly = VENDOR_QUESTIONS.filter((q) => {
    const d = drafts[q.code] ?? EMPTY;
    return q.document !== undefined && !d.notApplicable && (d.answer === "yes" || d.answer === "partial") && !d.evidenceId;
  }).map((q) => q.code);
  const orgName = view.organization.name;
  const set = (c: string, change: Partial<Draft>) => setDrafts((all) => ({ ...all, [c]: { ...(all[c] ?? EMPTY), ...change } }));

  /** Every question as the form holds it. A document on file is left as it is (no `evidenceId` key). */
  const body = () => ({
    answers: VENDOR_QUESTIONS.map((q) => {
      const d = drafts[q.code] ?? EMPTY;
      if (d.notApplicable) return { code: q.code, notApplicable: true, naReason: d.naReason.trim() || null };
      return d.evidenceId === ON_FILE
        ? { code: q.code, answer: d.answer.trim() || null }
        : { code: q.code, answer: d.answer.trim() || null, evidenceId: d.evidenceId || null };
    }),
  });

  async function save(): Promise<boolean> {
    const r = await apiFetch<LinkView>(base, { method: "PATCH", body: JSON.stringify(body()) });
    if (!handle(r)) return false;
    adopt(r.data);
    return true;
  }

  async function upload(file: File) {
    if (!(EVIDENCE_CONTENT_TYPES as readonly string[]).includes(file.type)) return setError("Upload a PDF, an image, a text or CSV file, or a Word or Excel document.");
    if (file.size > EVIDENCE_MAX_BYTES) return setError("A document may be at most 25 MB.");
    // Save first, so the answers on screen are not lost when the page re-reads them.
    if (!(await save())) return;
    const r = await apiFetch<{ document: { id: string }; upload: { url: string; contentType: string } }>(`${base}/documents`, {
      method: "POST",
      body: JSON.stringify({ fileName: file.name, contentType: file.type, byteSize: file.size }),
    });
    if (!handle(r)) return;
    const put = await fetch(r.data.upload.url, { method: "PUT", body: file, headers: { "Content-Type": r.data.upload.contentType } });
    if (!put.ok) return setError("The upload failed. Try again.");
    const attached = await apiFetch(`${base}/documents/${r.data.document.id}/attach`, { method: "POST" });
    if (!handle(attached)) return;
    await reload();
    setNotice(`${file.name} uploaded. Cite it on the answer it backs.`);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p>
          Answering as {view.respondentName} ({view.respondentEmail}) for {view.organization.name}. Save as you go; the link works until{" "}
          {formatInstant(view.expiresAt)}.
        </p>
        <p className="text-xs text-slate-600">
          Every scored question needs an answer, or &ldquo;not applicable&rdquo; with a reason, before you can submit. Where a question
          names a document (a certificate, a report, the signed contract), a &ldquo;yes&rdquo; counts as claimed, not evidenced, until
          you upload the document and cite it.
        </p>
        {view.missing.length > 0 && (
          <p data-testid="vendor-link-missing" className="text-xs text-slate-600">
            Still to answer ({view.missing.length}): {view.missing.join(", ")}.
          </p>
        )}
      </section>

      <section data-testid="vendor-link-documents" className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold">Your documents</h2>
        <p className="text-xs text-slate-600">
          Up to {VENDOR_LINK_LIMITS.documentsPerLink} documents, 25 MB each. {view.organization.name} reviews each one; only the documents
          you upload here are shown to you.
        </p>
        {documents.length > 0 && (
          <ul className="space-y-1 text-xs">
            {documents.map((d) => (
              <li key={d.id} data-testid={`vendor-link-document-${d.id}`} className="rounded-md border border-slate-200 p-2">
                {d.fileName} · uploaded {formatInstant(d.uploadedAt)}
              </li>
            ))}
          </ul>
        )}
        <input
          data-testid="vendor-link-upload"
          type="file"
          disabled={busy || view.documents.length >= VENDOR_LINK_LIMITS.documentsPerLink}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void run(() => upload(file));
          }}
          className="text-xs"
        />
      </section>

      {error && (
        <Notice tone="error" testId="vendor-link-error">
          {error}
        </Notice>
      )}
      {notice && (
        <Notice tone="success" testId="vendor-link-notice">
          {notice}
        </Notice>
      )}

      <SteppedTabs
        label="Questionnaire sections"
        testId="vendor-link-steps"
        busy={busy}
        // Next saves first, so a section's answers are never lost on the way.
        onNext={async () => {
          let ok = false;
          await run(async () => {
            ok = await save();
            if (ok) setNotice("Saved.");
          });
          return ok;
        }}
        steps={[
          ...VENDOR_QUESTION_SECTIONS.map((section): StepDef => {
            const scored = SCORED_VENDOR_QUESTIONS.filter((q) => q.section === section);
            const done = scored.filter((q) => isAnswered(drafts[q.code])).length;
            return {
              id: section,
              title: VENDOR_SECTION_LABEL[section].label,
              label: SECTION_TAB[section],
              badge: `${done}/${scored.length}`,
              done: done === scored.length,
              content: (
                <section data-testid={`section-${section}`} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <h2 className="text-sm font-semibold">{VENDOR_SECTION_LABEL[section].label}</h2>
                    <p className="text-xs text-slate-600">{vendorSectionVoice(section, orgName)}</p>
                  </div>
                  {VENDOR_QUESTIONS.filter((q) => q.section === section).map((q) => (
                    <QuestionRow key={q.code} question={q} organizationName={orgName} draft={drafts[q.code] ?? EMPTY} documents={documents} onChange={(change) => set(q.code, change)} />
                  ))}
                </section>
              ),
            };
          }),
          {
            id: "review",
            title: "Review and send",
            label: "Review and send",
            content: (
              <>
                <section data-testid="vendor-link-review" className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                  <h2 className="font-semibold">Before you send</h2>
                  <ul className="space-y-1 text-xs">
                    {VENDOR_QUESTION_SECTIONS.map((section) => {
                      const scored = SCORED_VENDOR_QUESTIONS.filter((q) => q.section === section);
                      const left = scored.filter((q) => !isAnswered(drafts[q.code])).map((q) => q.code);
                      return (
                        <li key={section} data-testid={`vendor-link-review-${section}`} className={left.length ? "text-slate-800" : "text-emerald-800"}>
                          {VENDOR_SECTION_LABEL[section].label} — {scored.length - left.length} of {scored.length} answered
                          {left.length > 0 && <span className="text-slate-600"> · still to answer: {left.join(", ")}</span>}
                        </li>
                      );
                    })}
                  </ul>
                  {claimedOnly.length > 0 && (
                    <Notice tone="warning" compact testId="vendor-link-review-claimed">
                      Claimed without a document cited: {claimedOnly.join(", ")}. Each counts as if the control were missing until you upload the
                      document and cite it on the question.
                    </Notice>
                  )}
                </section>
                <section data-testid="vendor-link-declaration" className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-sm">
                  <h2 className="font-semibold">Declaration</h2>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex flex-col text-xs text-slate-600">
                      Your name
                      <input
                        data-testid="vendor-link-declared-name"
                        value={declaredName}
                        maxLength={VENDOR_LINK_LIMITS.name}
                        onChange={(e) => setDeclaredName(e.target.value)}
                        className={`${input} mt-0.5`}
                      />
                    </label>
                    <label className="flex grow flex-col text-xs text-slate-600">
                      Your role at your company
                      <input
                        data-testid="vendor-link-declared-role"
                        value={declaredRole}
                        maxLength={VENDOR_LINK_LIMITS.name}
                        placeholder="e.g. Information Security Manager"
                        onChange={(e) => setDeclaredRole(e.target.value)}
                        className={`${input} mt-0.5`}
                      />
                    </label>
                  </div>
                  <label className="flex items-start gap-2 text-slate-800">
                    <input data-testid="vendor-link-accurate" type="checkbox" checked={accurate} onChange={(e) => setAccurate(e.target.checked)} className="mt-1" />
                    <span>{VENDOR_DECLARATION}</span>
                  </label>
                  <button
                    type="button"
                    data-testid="vendor-link-submit"
                    disabled={busy || !accurate || declaredName.trim() === "" || declaredRole.trim() === ""}
                    onClick={() =>
                      run(async () => {
                        if (!(await save())) return;
                        const r = await apiFetch<{ submittedAt: string }>(`${base}/submit`, {
                          method: "POST",
                          body: JSON.stringify({ declaredName: declaredName.trim(), declaredRole: declaredRole.trim(), accurate: true }),
                        });
                        if (handle(r)) setSubmitted(r.data.submittedAt);
                      })
                    }
                    className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
                  >
                    Sign and submit
                  </button>
                </section>
              </>
            ),
          },
        ]}
      />

      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white py-3">
        <p data-testid="vendor-link-progress" className="mr-auto text-xs text-slate-600" aria-live="polite">
          {answered} of {SCORED_VENDOR_QUESTIONS.length} questions answered
        </p>
        <button
          type="button"
          data-testid="vendor-link-save"
          disabled={busy}
          onClick={() =>
            run(async () => {
              if (await save()) setNotice("Saved.");
            })
          }
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function QuestionRow({
  question: q,
  organizationName,
  draft,
  documents,
  onChange,
}: {
  question: VendorQuestion;
  organizationName: string;
  draft: Draft;
  documents: readonly LinkDocument[];
  onChange: (change: Partial<Draft>) => void;
}) {
  const options = allowedAnswers(q);
  const label = (value: string) => q.options?.find((o) => o.value === value)?.label ?? ANSWER_LABEL[value] ?? value;
  const voice = vendorVoice(q, organizationName);
  const claims = q.document !== undefined && (draft.answer === "yes" || draft.answer === "partial") && !draft.notApplicable;

  return (
    <div data-testid={`q-${q.code}`} className="rounded-md border border-slate-100 p-3 text-sm">
      <p className="text-slate-900">
        <span className="mr-2 font-mono text-xs text-slate-500">{q.code}</span>
        {voice.text}
        {q.weight === 0 && <span className="ml-2 text-xs text-slate-500">(optional)</span>}
      </p>
      {voice.hint && <p className="mt-0.5 text-xs text-slate-500">{voice.hint}</p>}
      <div className="mt-2 space-y-2">
        {!draft.notApplicable &&
          (options === null ? (
            <input data-testid={`q-${q.code}-text`} value={draft.answer} maxLength={500} onChange={(e) => onChange({ answer: e.target.value })} className={`${input} w-full`} />
          ) : q.type === "select" ? (
            <select data-testid={`q-${q.code}-select`} value={draft.answer} onChange={(e) => onChange({ answer: e.target.value })} className={input}>
              <option value="">Choose…</option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {label(o)}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-3">
              {options.map((o) => (
                <label key={o} className="flex items-center gap-1 text-sm">
                  <input data-testid={`q-${q.code}-${o}`} type="radio" name={`q-${q.code}`} checked={draft.answer === o} onChange={() => onChange({ answer: o })} />
                  {label(o)}
                </label>
              ))}
            </div>
          ))}

        {q.document && !draft.notApplicable && (
          <label className="flex flex-col text-xs text-slate-600">
            {q.document} — cite a document you uploaded
            <select data-testid={`q-${q.code}-doc`} value={draft.evidenceId} onChange={(e) => onChange({ evidenceId: e.target.value })} className={`${input} mt-0.5`}>
              <option value="">No document cited</option>
              {draft.evidenceId === ON_FILE && <option value={ON_FILE}>A document the organisation already holds</option>}
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fileName}
                </option>
              ))}
            </select>
          </label>
        )}
        {claims && !draft.evidenceId && (
          <p data-testid={`q-${q.code}-claimed`} className="text-xs text-amber-800">
            Claimed, no evidence: until a document is cited this counts as if the control were missing.
          </p>
        )}

        {q.weight > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <label className="flex items-center gap-1">
              <input data-testid={`q-${q.code}-na`} type="checkbox" checked={draft.notApplicable} onChange={(e) => onChange({ notApplicable: e.target.checked })} />
              Not applicable
            </label>
            {draft.notApplicable && (
              <input
                data-testid={`q-${q.code}-reason`}
                value={draft.naReason}
                maxLength={500}
                placeholder="Why it does not apply"
                onChange={(e) => onChange({ naReason: e.target.value })}
                className={`${input} grow`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
