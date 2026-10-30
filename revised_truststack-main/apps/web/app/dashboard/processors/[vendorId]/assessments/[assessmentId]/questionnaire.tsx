"use client";

import {
  allowedAnswers,
  defaultReviewBy,
  questionnaireProgress,
  VENDOR_QUESTION_SECTIONS,
  VENDOR_QUESTIONS,
  VENDOR_DECLARATION,
  VENDOR_LINK_LIMITS,
  VENDOR_RESPONDENT,
  VENDOR_REVIEW_NOTE,
  VENDOR_RISK_NOTE,
  VENDOR_SECTION_LABEL,
  type VendorQuestion,
} from "@truststack/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { SteppedTabs, type StepDef } from "@/components/ui/stepped-tabs";
import { apiFetch } from "@/lib/client/api";
import { formatInstant } from "@/lib/client/consent";
import { todayInIndia } from "@/lib/client/gaps";
import { usePermissions } from "@/lib/client/permissions";
import { ASSESSMENT_STATUS_STYLE, RISK_TIER_STYLE, SECTION_TAB, type AssessmentDetail } from "@/lib/client/processors";
import { formatDay } from "@/lib/client/rights";

/**
 * One processor assessment (Slice 10, Stage 4a): the questionnaire, entered by
 * staff, and its review. The accuracy controls (D-089) are the database's —
 * the page explains them:
 *   * complete — submitting is refused until every scored question is answered
 *     or marked not applicable with a reason;
 *   * evidence-backed — a claim a document must back scores as the risky
 *     answer until one of the vendor's documents is cited on it;
 *   * consistency — contradictions with the vendor register are flagged here
 *     for the reviewer, never resolved;
 *   * a second person — only someone who did not enter or answer it may accept
 *     or return it; only an accepted assessment counts;
 *   * attributed, frozen once accepted, current until its review-by date.
 *
 * Stage 4b: staff may send the vendor a link to answer it themselves. While
 * the link is open only the vendor changes the answers; the vendor's answers
 * and documents are marked as theirs; their submission carries a signed
 * declaration; and whoever sent the link may not review it (D-092).
 */

interface Draft {
  answer: string;
  notApplicable: boolean;
  naReason: string;
  evidenceId: string;
}

const EMPTY: Draft = { answer: "", notApplicable: false, naReason: "", evidenceId: "" };
const isAnswered = (d: Draft | undefined) => d !== undefined && (d.notApplicable || d.answer.trim() !== "");
const ANSWER_LABEL: Record<string, string> = { yes: "Yes", no: "No", partial: "Partly" };

export function Questionnaire({ vendorId, assessmentId }: { vendorId: string; assessmentId: string }) {
  const permissions = usePermissions();
  const router = useRouter();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const can = (p: string) => permissions.kind === "ready" && (permissions.value.permissions as string[]).includes(p);
  const [detail, setDetail] = useState<AssessmentDetail | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [sourceNote, setSourceNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reviewBy, setReviewBy] = useState(defaultReviewBy(todayInIndia()));
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");

  const url = organizationId ? `/api/v1/organizations/${organizationId}/processors/${vendorId}/assessments/${assessmentId}` : null;

  const adopt = useCallback((d: AssessmentDetail) => {
    setDetail(d);
    setSourceNote(d.assessment.sourceNote ?? "");
    setDrafts(
      Object.fromEntries(
        d.assessment.answers.map((a) => [
          a.code,
          { answer: a.answer ?? "", notApplicable: a.notApplicable, naReason: a.naReason ?? "", evidenceId: a.evidenceId ?? "" },
        ]),
      ),
    );
  }, []);

  const load = useCallback(() => {
    if (!url) return Promise.resolve();
    return apiFetch<AssessmentDetail>(url).then((r) => {
      if (r.success) {
        adopt(r.data);
        setError(null);
      } else setError(r.error.message);
    });
  }, [url, adopt]);

  useEffect(() => {
    void load();
    apiFetch<{ user: { id: string } }>("/api/v1/auth/me").then((r) => {
      if (r.success) setCurrentUserId(r.data.user.id);
    });
  }, [load]);

  if (permissions.kind === "loading" || (!detail && !error)) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!detail) {
    return (
      <Notice tone="error" testId="assessment-error">
        {error}
      </Notice>
    );
  }

  const { processor, assessment } = detail;
  const open = assessment.status === "draft" || assessment.status === "returned";
  // While a link is open the vendor is answering: one writer at a time (the database holds it too).
  const editable = open && can("vendor.assess") && assessment.openLink === null;
  const documents = processor.documents.filter((d) => d.counts);
  const set = (code: string, change: Partial<Draft>) => setDrafts((all) => ({ ...all, [code]: { ...(all[code] ?? EMPTY), ...change } }));

  /** Every question, as the form holds it: blank and not "not applicable" clears it. */
  const body = () => ({
    sourceNote: sourceNote.trim() === "" ? null : sourceNote.trim(),
    answers: VENDOR_QUESTIONS.map((q) => {
      const d = drafts[q.code] ?? EMPTY;
      return d.notApplicable
        ? { code: q.code, notApplicable: true, naReason: d.naReason.trim() || null }
        : { code: q.code, answer: d.answer.trim() || null, evidenceId: d.evidenceId || null };
    }),
  });

  async function save(): Promise<boolean> {
    if (!url) return false;
    setError(null);
    setNotice(null);
    const r = await apiFetch<AssessmentDetail>(url, { method: "PATCH", body: JSON.stringify(body()) });
    if (!r.success) {
      setError(r.error.message);
      return false;
    }
    adopt(r.data);
    return true;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  const post = async (tail: string, payload?: object) => {
    const r = await apiFetch<AssessmentDetail>(`${url}${tail}`, { method: "POST", ...(payload ? { body: JSON.stringify(payload) } : {}) });
    if (!r.success) return setError(r.error.message);
    adopt(r.data);
  };

  const involved = currentUserId !== null && assessment.involved.includes(currentUserId);
  // Whoever asked the vendor is told so first, whatever else they did (D-092).
  const sentLink = currentUserId !== null && assessment.links.some((l) => l.sentBy === currentUserId);

  async function sendLink() {
    if (!url) return;
    setError(null);
    setNotice(null);
    const r = await apiFetch<AssessmentDetail & { emailed: boolean }>(`${url}/link`, {
      method: "POST",
      body: JSON.stringify({ respondentName: respondentName.trim(), respondentEmail: respondentEmail.trim() }),
    });
    if (!r.success) return setError(r.error.message);
    adopt(r.data);
    setRespondentName("");
    setRespondentEmail("");
    if (r.data.emailed) setNotice(`Link emailed to ${r.data.assessment.openLink?.respondentEmail ?? "the vendor"}. It works for ${VENDOR_LINK_LIMITS.linkDays} days.`);
    else setError("The link was created, but the email could not be sent. Send it again.");
  }

  async function revokeLink() {
    if (!url || !window.confirm("Revoke the vendor's link? Their saved answers stay; the link stops working.")) return;
    setError(null);
    setNotice(null);
    const r = await apiFetch<AssessmentDetail>(`${url}/link`, { method: "DELETE" });
    if (!r.success) return setError(r.error.message);
    adopt(r.data);
    setNotice("Link revoked. You can change the answers again.");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/processors/${processor.id}`} className="text-xs text-indigo-800 hover:underline">
          ← {processor.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Processor assessment · version {assessment.version}</h2>
          <span data-testid="assessment-status" className={`rounded-full px-2 py-0.5 text-xs font-medium ${ASSESSMENT_STATUS_STYLE[assessment.status]}`}>
            {assessment.statusLabel}
          </span>
          {assessment.outOfDate && (
            <span data-testid="assessment-out-of-date" className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
              Assessment out of date
            </span>
          )}
        </div>
      </div>

      <section data-testid="assessment-summary" className="space-y-2 rounded-xl border border-slate-200 p-4 text-sm">
        <dl className="grid gap-2 text-xs text-slate-700 sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Risk {assessment.riskIsPreview ? "(preview — derived again by the database on submission)" : ""}</dt>
            <dd data-testid="assessment-risk" className={`text-lg font-semibold ${assessment.riskTier ? RISK_TIER_STYLE[assessment.riskTier] : ""}`}>
              {assessment.riskScore === null ? "—" : `${assessment.riskScore} (${assessment.riskTierLabel})`}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Progress</dt>
            <dd data-testid="assessment-progress">{questionnaireProgress(assessment.answered, assessment.notApplicable, assessment.scorable)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Source</dt>
            <dd data-testid="assessment-source">
              {assessment.sourceLabel}
              {assessment.sourceNote ? ` — ${assessment.sourceNote}` : " — not yet stated"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Started by</dt>
            <dd>{assessment.createdByName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Submitted</dt>
            <dd data-testid="assessment-submitted">
              {assessment.submittedAt
                ? `${assessment.declaration ? VENDOR_RESPONDENT : (assessment.submittedByName ?? "—")}, ${formatInstant(assessment.submittedAt)}`
                : "Not yet"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{assessment.status === "returned" ? "Returned" : "Reviewed"}</dt>
            <dd data-testid="assessment-reviewed">
              {assessment.reviewedAt ? `${assessment.reviewedByName ?? "—"}, ${formatInstant(assessment.reviewedAt)}` : "Not yet"}
              {assessment.reviewBy ? ` · review by ${formatDay(assessment.reviewBy)}` : ""}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500">{VENDOR_RISK_NOTE}</p>
        {assessment.declaration && (
          <p data-testid="assessment-declaration" className="rounded-md bg-slate-50 p-2 text-xs text-slate-800">
            Declared by the vendor&apos;s respondent — &ldquo;{VENDOR_DECLARATION}&rdquo; — signed {assessment.declaration.name},{" "}
            {assessment.declaration.role}, {formatInstant(assessment.declaration.at)}. A declaration is the vendor&apos;s word, not
            evidence: the documents and the review are the check.
          </p>
        )}
        {assessment.status === "returned" && assessment.returnReason && (
          <p data-testid="assessment-return-reason" className="rounded-md bg-orange-50 p-2 text-xs text-orange-900">
            Returned for changes: {assessment.returnReason}
          </p>
        )}
        {assessment.unevidenced.length > 0 && (
          <Notice tone="warning" compact testId="assessment-unevidenced">
            Claimed, no evidence: {claimNames(assessment.unevidenced)}. Each claims a control a document must back, and none of
            the vendor&apos;s documents is cited on it — so it scores as the risky answer until one is.
          </Notice>
        )}
        {assessment.flags.length > 0 && (
          <div data-testid="assessment-flags" className="rounded-md bg-sky-50 p-2 text-xs text-sky-900">
            <p className="font-medium">For the reviewer — answers that disagree with the vendor register (or with each other):</p>
            <ul className="mt-1 list-disc pl-5">
              {assessment.flags.map((f) => (
                <li key={f.code} data-testid={`assessment-flag-${f.code}`}>
                  {f.message}
                </li>
              ))}
            </ul>
            <p className="mt-1">Nothing is changed automatically: correct the register, or return the assessment.</p>
          </div>
        )}
        {editable && assessment.missing.length > 0 && (
          <p data-testid="assessment-missing" className="text-xs text-slate-600">
            Still to answer or mark not applicable before it can be submitted ({assessment.missing.length}): {assessment.missing.join(", ")}.
          </p>
        )}
      </section>

      {error && (
        <Notice tone="error" testId="assessment-action-error">
          {error}
        </Notice>
      )}
      {notice && (
        <Notice tone="success" testId="assessment-notice">
          {notice}
        </Notice>
      )}

      {open && (can("vendor.assess") || assessment.links.length > 0) && (
        <VendorLinkPanel
          assessment={assessment}
          canSend={can("vendor.assess")}
          busy={busy}
          respondentName={respondentName}
          respondentEmail={respondentEmail}
          onName={setRespondentName}
          onEmail={setRespondentEmail}
          onSend={() => run(sendLink)}
          onRevoke={() => run(revokeLink)}
        />
      )}

      {assessment.status === "submitted" && can("vendor.review") && (
        <section data-testid="assessment-review" className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
          <h3 className="text-sm font-semibold">Review</h3>
          {involved ? (
            <p data-testid="assessment-review-self" className="text-sm text-slate-700">
              {sentLink
                ? "You sent this assessment to the vendor — someone else must review their answers."
                : "You entered or answered this assessment — someone else must review it."}
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-600">
                Accepting makes it count: its score becomes the vendor&apos;s, it is frozen, and it stays current until the
                review-by date. {VENDOR_REVIEW_NOTE}
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col text-xs text-slate-600">
                  Review by
                  <input
                    data-testid="review-by"
                    type="date"
                    value={reviewBy}
                    onChange={(e) => setReviewBy(e.target.value)}
                    className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  />
                </label>
                <button
                  type="button"
                  data-testid="review-accept"
                  disabled={busy}
                  onClick={() => run(() => post("/review", { decision: "accept", reviewBy }))}
                  className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  Accept
                </button>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex grow flex-col text-xs text-slate-600">
                  Or return it — say what to change
                  <input
                    data-testid="review-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  />
                </label>
                <button
                  type="button"
                  data-testid="review-return"
                  disabled={busy}
                  onClick={() => run(() => post("/review", { decision: "return", reason: reason.trim() || null }))}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                >
                  Return for changes
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {editable && (
        <section className="space-y-2 rounded-xl border border-slate-200 p-4">
          <label className="flex flex-col text-xs text-slate-600">
            Where did these answers come from? (required before submitting)
            <input
              data-testid="assessment-source-note"
              value={sourceNote}
              maxLength={300}
              placeholder="e.g. the vendor's email of 3 Oct 2026"
              onChange={(e) => setSourceNote(e.target.value)}
              className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
            />
          </label>
        </section>
      )}

      <SteppedTabs
        label="Questionnaire sections"
        testId="assessment-steps"
        busy={busy}
        // While it can be edited, Next saves first, so a section's answers are never lost on the way.
        onNext={async () => {
          if (!editable) return true;
          let ok = false;
          await run(async () => {
            ok = await save();
            if (ok) setNotice("Saved.");
          });
          return ok;
        }}
        steps={[
          ...VENDOR_QUESTION_SECTIONS.map((section): StepDef => {
            const scored = VENDOR_QUESTIONS.filter((q) => q.section === section && q.weight > 0);
            const done = scored.filter((q) => isAnswered(drafts[q.code])).length;
            return {
              id: section,
              title: VENDOR_SECTION_LABEL[section].label,
              label: SECTION_TAB[section],
              badge: `${done}/${scored.length}`,
              done: done === scored.length,
              content: (
                <section data-testid={`section-${section}`} className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <div>
                    <h3 className="text-sm font-semibold">{VENDOR_SECTION_LABEL[section].label}</h3>
                    <p className="text-xs text-slate-600">{VENDOR_SECTION_LABEL[section].description}</p>
                  </div>
                  {VENDOR_QUESTIONS.filter((q) => q.section === section).map((q) => (
                    <QuestionRow
                      key={q.code}
                      question={q}
                      draft={drafts[q.code] ?? EMPTY}
                      editable={editable}
                      documents={documents}
                      saved={assessment.answers.find((a) => a.code === q.code) ?? null}
                      unevidenced={assessment.unevidenced.includes(q.code)}
                      onChange={(change) => set(q.code, change)}
                    />
                  ))}
                </section>
              ),
            };
          }),
          {
            id: "review",
            title: "Review",
            label: "Review",
            content: (
              <section data-testid="assessment-review-summary" className="space-y-2 rounded-xl border border-slate-200 p-4 text-sm">
                <h3 className="font-semibold">Where each section stands</h3>
                <ul className="space-y-1 text-xs">
                  {VENDOR_QUESTION_SECTIONS.map((section) => {
                    const scored = VENDOR_QUESTIONS.filter((q) => q.section === section && q.weight > 0);
                    const left = scored.filter((q) => !isAnswered(drafts[q.code])).map((q) => q.code);
                    const claimed = assessment.unevidenced.filter((c) => scored.some((q) => q.code === c));
                    return (
                      <li key={section} data-testid={`assessment-review-${section}`} className={left.length ? "text-slate-800" : "text-emerald-800"}>
                        {VENDOR_SECTION_LABEL[section].label} — {scored.length - left.length} of {scored.length} answered
                        {left.length > 0 && <span className="text-slate-600"> · still to answer: {left.join(", ")}</span>}
                        {claimed.length > 0 && <span className="text-amber-800"> · claimed, no evidence: {claimNames(claimed)}</span>}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-slate-600">
                  {editable
                    ? "Submit from the bar below once every question is answered or marked not applicable; someone else then reviews it."
                    : "Read-only here: the answers can change only while the assessment is a draft or returned, and no vendor link is open."}
                </p>
              </section>
            ),
          },
        ]}
      />

      {editable && (
        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-slate-200 bg-white py-3">
          <button
            type="button"
            data-testid="assessment-save"
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
          <button
            type="button"
            data-testid="assessment-submit"
            disabled={busy}
            onClick={() =>
              run(async () => {
                if (!(await save())) return;
                await post("/submit");
              })
            }
            className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            Submit for review
          </button>
          <button
            type="button"
            data-testid="assessment-discard"
            disabled={busy}
            onClick={() =>
              run(async () => {
                if (!url || !window.confirm("Discard this assessment? Its answers are deleted.")) return;
                const r = await apiFetch(url, { method: "DELETE" });
                if (!r.success) return setError(r.error.message);
                router.push(`/dashboard/processors/${processor.id}`);
              })
            }
            className="ml-auto rounded-md px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionRow({
  question: q,
  draft,
  editable,
  documents,
  saved,
  unevidenced,
  onChange,
}: {
  question: VendorQuestion;
  draft: Draft;
  editable: boolean;
  documents: AssessmentDetail["processor"]["documents"];
  saved: AssessmentDetail["assessment"]["answers"][number] | null;
  unevidenced: boolean;
  onChange: (change: Partial<Draft>) => void;
}) {
  const options = allowedAnswers(q);
  const claims = q.document !== undefined && (draft.answer === "yes" || draft.answer === "partial") && !draft.notApplicable;
  const label = (value: string) => q.options?.find((o) => o.value === value)?.label ?? ANSWER_LABEL[value] ?? value;
  const cited = documents.find((d) => d.id === draft.evidenceId) ?? null;

  return (
    <div data-testid={`q-${q.code}`} className="rounded-md border border-slate-100 p-3 text-sm">
      <p className="text-slate-900">
        <span className="mr-2 font-mono text-xs text-slate-500">{q.code}</span>
        {q.text}
        {q.weight === 0 && <span className="ml-2 text-xs text-slate-500">(not scored)</span>}
      </p>
      {q.hint && <p className="mt-0.5 text-xs text-slate-500">{q.hint}</p>}

      {editable ? (
        <div className="mt-2 space-y-2">
          {!draft.notApplicable &&
            (options === null ? (
              <input
                data-testid={`q-${q.code}-text`}
                value={draft.answer}
                maxLength={500}
                onChange={(e) => onChange({ answer: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            ) : q.type === "select" ? (
              <select
                data-testid={`q-${q.code}-select`}
                value={draft.answer}
                onChange={(e) => onChange({ answer: e.target.value })}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
              >
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
                {draft.answer !== "" && (
                  <button type="button" onClick={() => onChange({ answer: "", evidenceId: "" })} className="text-xs text-slate-500 hover:underline">
                    Clear
                  </button>
                )}
              </div>
            ))}

          {q.document && !draft.notApplicable && (
            <label className="flex flex-col text-xs text-slate-600">
              {q.document} — cite one of the vendor&apos;s documents
              <select
                data-testid={`q-${q.code}-doc`}
                value={draft.evidenceId}
                onChange={(e) => onChange({ evidenceId: e.target.value })}
                className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
              >
                <option value="">No document cited</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fileName}
                    {d.fromVendor ? " (from the vendor)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          {claims && !draft.evidenceId && (
            <p data-testid={`q-${q.code}-claimed`} className="text-xs text-amber-800">
              Claimed, no evidence: this scores as the risky answer until a document is cited.
            </p>
          )}

          {q.weight > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <label className="flex items-center gap-1">
                <input
                  data-testid={`q-${q.code}-na`}
                  type="checkbox"
                  checked={draft.notApplicable}
                  onChange={(e) => onChange({ notApplicable: e.target.checked })}
                />
                Not applicable
              </label>
              {draft.notApplicable && (
                <input
                  data-testid={`q-${q.code}-reason`}
                  value={draft.naReason}
                  maxLength={500}
                  placeholder="Why it does not apply"
                  onChange={(e) => onChange({ naReason: e.target.value })}
                  className="grow rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div data-testid={`q-${q.code}-answer`} className="mt-1 text-sm text-slate-800">
          {saved === null ? (
            <span className="text-slate-500">Not answered</span>
          ) : saved.notApplicable ? (
            <span>Not applicable — {saved.naReason}</span>
          ) : (
            <span>{label(saved.answer ?? "")}</span>
          )}
          {cited && (
            <span className="ml-2 text-xs text-slate-600">
              · backed by {cited.fileName}
              {cited.fromVendor ? " (from the vendor)" : ""}
            </span>
          )}
          {unevidenced && <span className="ml-2 text-xs font-medium text-amber-800">· claimed, no evidence</span>}
          {saved?.answeredByVendor ? (
            <span data-testid={`q-${q.code}-by-vendor`} className="ml-2 text-xs text-slate-500">
              · answered by {VENDOR_RESPONDENT}
            </span>
          ) : (
            saved?.answeredByName && <span className="ml-2 text-xs text-slate-500">· answered by {saved.answeredByName}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Stage 4b — send the vendor a link to answer it themselves: emailed, open for
 * fourteen days, confirmed by a code to the respondent's address, submitted
 * with a signed declaration. Whoever sends it may not review the answers.
 */
function VendorLinkPanel({
  assessment,
  canSend,
  busy,
  respondentName,
  respondentEmail,
  onName,
  onEmail,
  onSend,
  onRevoke,
}: {
  assessment: AssessmentDetail["assessment"];
  canSend: boolean;
  busy: boolean;
  respondentName: string;
  respondentEmail: string;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onSend: () => void;
  onRevoke: () => void;
}) {
  const link = assessment.openLink;
  const earlier = assessment.links.filter((l) => l.id !== link?.id);
  return (
    <section data-testid="vendor-link" className="space-y-3 rounded-xl border border-slate-200 p-4 text-sm">
      <div>
        <h3 className="text-sm font-semibold">Ask the vendor to answer</h3>
        <p className="text-xs text-slate-600">
          Email someone at the vendor a link to this questionnaire. It works for {VENDOR_LINK_LIMITS.linkDays} days; they confirm
          their address with a code, may attach documents, and sign &ldquo;{VENDOR_DECLARATION}&rdquo; when they submit. Nothing
          they submit counts until someone here accepts it — and whoever sends the link may not be that person.
        </p>
      </div>
      {link ? (
        <div data-testid="vendor-link-open" className="space-y-2 rounded-md bg-sky-50 p-3 text-xs text-sky-900">
          <p>
            <span className="font-medium">With the vendor:</span> sent to {link.respondentName} ({link.respondentEmail}) by{" "}
            {link.sentByName ?? "—"} on {formatInstant(link.sentAt)} · open until {formatInstant(link.expiresAt)} ·{" "}
            {link.confirmedAt ? "they have confirmed their email address" : "not yet opened"}.
          </p>
          <p>While the link is open only the vendor can change the answers. Revoke it to change them yourself.</p>
          {canSend && (
            <button
              type="button"
              data-testid="vendor-link-revoke"
              disabled={busy}
              onClick={onRevoke}
              className="rounded-md border border-sky-300 bg-white px-3 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100 disabled:opacity-50"
            >
              Revoke the link
            </button>
          )}
        </div>
      ) : (
        canSend && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs text-slate-600">
              Respondent&apos;s name
              <input
                data-testid="vendor-link-name"
                value={respondentName}
                maxLength={VENDOR_LINK_LIMITS.name}
                onChange={(e) => onName(e.target.value)}
                className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
              />
            </label>
            <label className="flex grow flex-col text-xs text-slate-600">
              Their work email address
              <input
                data-testid="vendor-link-email"
                type="email"
                value={respondentEmail}
                maxLength={320}
                onChange={(e) => onEmail(e.target.value)}
                className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
              />
            </label>
            <button
              type="button"
              data-testid="vendor-link-send"
              disabled={busy || respondentName.trim() === "" || respondentEmail.trim() === ""}
              onClick={onSend}
              className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {earlier.length > 0 ? "Send a new link" : "Send the link"}
            </button>
          </div>
        )
      )}
      {earlier.length > 0 && (
        <ul data-testid="vendor-link-history" className="space-y-0.5 text-xs text-slate-600">
          {earlier.map((l) => (
            <li key={l.id}>
              {formatInstant(l.sentAt)} — to {l.respondentName} by {l.sentByName ?? "—"}: {l.stateLabel}
              {l.revokedAt ? ` (${l.revokedByName ?? "—"}, ${formatInstant(l.revokedAt)})` : ""}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Slice 10.5 B3 (F3.8): claims named by their question, the code in brackets — "Is the vendor ISO/IEC 27001 certified? (A3)". */
function claimNames(codes: readonly string[]): string {
  return codes.map((c) => `${VENDOR_QUESTIONS.find((q) => q.code === c)?.text ?? c} (${c})`).join("; ");
}
