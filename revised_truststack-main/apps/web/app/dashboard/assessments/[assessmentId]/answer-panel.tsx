"use client";

import {
  CLAIM_LEVELS,
  claimLevelLabel,
  EVIDENCE_CAP,
  EVIDENCE_CONTENT_TYPES,
  EVIDENCE_LEVEL_MEANING,
  EVIDENCE_MAX_BYTES,
  evidenceCapSentence,
  evidenceCode,
  evidenceFileSentence,
  REVIEWED_STATUSES,
} from "@truststack/core";
import { useState, type FormEvent } from "react";
import { ExplainButton } from "@/components/ai/assistant-panel";
import { PagedList } from "@/components/data/paged-list";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import {
  REVIEW_STATUS_LABEL,
  type AssessmentQuestion,
  type AssessmentResponse,
  type EvidenceItem,
} from "@/lib/client/assessments";
import { Can } from "@/lib/client/permissions";
import { questionNextSteps } from "./ai-next-steps";

const LEVELS = [0, 1, 2, 3, 4, 5] as const;

interface Props {
  organizationId: string;
  assessmentId: string;
  question: AssessmentQuestion;
  response: AssessmentResponse | undefined;
  currentUserId: string | null;
  locked: boolean;
  onChanged: () => void;
}

/**
 * Answer one question, attach stored evidence, review it — with the cap
 * visible at every step. The adjusted score shown here always comes back from
 * the API, which read it from the database; the browser never computes it.
 */
export function AnswerPanel({ organizationId, assessmentId, question, response, currentUserId, locked, onChanged }: Props) {
  const code = question.questionCode;
  return (
    <div data-testid={`answer-${code}`} className="mt-2 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <ScoreLine response={response} code={code} />
      {locked ? (
        <p className="text-xs text-slate-600">This assessment is locked; answers and evidence can no longer change.</p>
      ) : (
        <Can permission="response.write">
          {/* Keyed on the saved answer: the form opens on it, even when the answers arrive after the page. */}
          <AnswerForm
            key={response ? `${response.id}:${response.answeredAt}` : "unanswered"}
            organizationId={organizationId}
            assessmentId={assessmentId}
            question={question}
            response={response}
            onSaved={onChanged}
          />
        </Can>
      )}
      {response && response.applicabilityDecision === "applicable" && (
        <EvidenceSection
          organizationId={organizationId}
          assessmentId={assessmentId}
          questionText={question.questionText}
          response={response}
          currentUserId={currentUserId}
          locked={locked}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}

function ScoreLine({ response, code }: { response: AssessmentResponse | undefined; code: string }) {
  if (!response) return <p className="text-xs text-slate-600">Not answered yet.</p>;
  if (response.applicabilityDecision === "not_applicable") {
    return (
      <p data-testid={`adjusted-${code}`} className="text-sm">
        <strong>Not Applicable</strong> — excluded from the score. Reason: {response.naReason}
      </p>
    );
  }
  const level = response.evidenceLevel;
  // The review of the file that set the level — the strongest reviewed one (F2.3).
  const setBy = level === null ? undefined : response.evidence.find((e) => e.reviewStatus !== "pending" && e.evidenceLevel === level);
  return (
    <div data-testid={`adjusted-${code}`} className="space-y-0.5 text-sm">
      <p>
        You claimed <strong data-testid={`claimed-${code}`}>{response.claimedMaturity}</strong>
        {response.claimedMaturity !== null && (
          <span className="text-slate-600"> ({CLAIM_LEVELS[response.claimedMaturity]?.name})</span>
        )}{" "}
        → it counts as <strong data-testid={`adjusted-value-${code}`}>{response.adjustedScore}</strong> of 5
      </p>
      {response.capApplied && (
        <p data-testid={`cap-note-${code}`} title={`Evidence ${evidenceCode(level)}`} className="text-xs text-amber-800">
          {evidenceCapSentence(level, setBy ? (REVIEW_STATUS_LABEL[setBy.reviewStatus] ?? setBy.reviewStatus) : null)}
        </p>
      )}
    </div>
  );
}

function AnswerForm({
  organizationId,
  assessmentId,
  question,
  response,
  onSaved,
}: {
  organizationId: string;
  assessmentId: string;
  question: AssessmentQuestion;
  response: AssessmentResponse | undefined;
  onSaved: () => void;
}) {
  const code = question.questionCode;
  const canBeNa = question.applicability !== "mandatory";
  const [choice, setChoice] = useState<string>(
    response?.applicabilityDecision === "not_applicable" ? "na" : String(response?.claimedMaturity ?? ""),
  );
  const [reason, setReason] = useState(response?.naReason ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (choice === "") return setError("Choose how far along this is (0–5), or Not Applicable.");
    if (choice === "na" && reason.trim() === "") return setError("A reason is required to mark a question Not Applicable.");
    setBusy(true);
    const body =
      choice === "na"
        ? { applicabilityDecision: "not_applicable", naReason: reason.trim() }
        : { applicabilityDecision: "applicable", claimedMaturity: Number(choice) };
    const r = await apiFetch<{ response: AssessmentResponse }>(
      `/api/v1/organizations/${organizationId}/assessments/${assessmentId}/responses/${encodeURIComponent(code)}`,
      { method: "PUT", body: JSON.stringify(body) },
    );
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    onSaved();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 text-sm">
      <label className="flex flex-col text-xs text-slate-600">
        How far along is this?
        <select
          data-testid={`claim-${code}`}
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="">Choose…</option>
          {CLAIM_LEVELS.map((l) => (
            <option key={l.level} value={l.level}>
              {claimLevelLabel(l.level)}
            </option>
          ))}
          {canBeNa && <option value="na">Not Applicable</option>}
        </select>
      </label>
      {choice !== "" && choice !== "na" && (
        <p data-testid={`level-meaning-${code}`} className="w-full text-xs text-slate-600">
          {CLAIM_LEVELS[Number(choice)]?.meaning} Evidence decides what it counts as.
        </p>
      )}
      {choice === "na" && (
        <label className="flex min-w-64 flex-1 flex-col text-xs text-slate-600">
          Reason (required)
          <input
            data-testid={`na-reason-${code}`}
            value={reason}
            required
            onChange={(e) => setReason(e.target.value)}
            className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          />
        </label>
      )}
      <button
        type="submit"
        data-testid={`save-answer-${code}`}
        disabled={busy}
        className="rounded-md bg-indigo-700 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        {busy ? "Saving…" : response ? "Update answer" : "Save answer"}
      </button>
      {error && (
        <Notice tone="error" compact testId={`answer-error-${code}`} className="w-full">
          {error}
        </Notice>
      )}
    </form>
  );
}

function EvidenceSection({
  organizationId,
  assessmentId,
  questionText,
  response,
  currentUserId,
  locked,
  onChanged,
}: {
  organizationId: string;
  assessmentId: string;
  questionText: string;
  response: AssessmentResponse;
  currentUserId: string | null;
  locked: boolean;
  onChanged: () => void;
}) {
  const code = response.questionCode;
  return (
    <div className="space-y-2 border-t border-slate-200 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">Evidence</p>
        <ExplainButton
          organizationId={organizationId}
          task="evidence_helper"
          body={{ assessmentId, questionCode: code }}
          subject={questionText}
          testId={`ai-explain-evidence-${code}`}
          nextSteps={questionNextSteps(assessmentId, code)}
        />
      </div>
      {response.evidence.length === 0 ? (
        <p className="text-xs text-slate-600">
          No evidence attached. Until reviewed evidence supports it, this answer counts at most 1 (evidence level 0 of 5).
        </p>
      ) : (
        <PagedList
          items={response.evidence}
          noun="files"
          testId={`evidence-list-${code}`}
          renderItem={(e) => (
            <EvidenceRow
              key={e.id}
              organizationId={organizationId}
              responseId={response.id}
              evidence={e}
              ownUpload={e.uploadedBy !== null && e.uploadedBy === currentUserId}
              locked={locked}
              onChanged={onChanged}
            />
          )}
        />
      )}
      {!locked && (
        <Can permission="evidence.write">
          <AttachForm organizationId={organizationId} responseId={response.id} code={code} onAttached={onChanged} />
        </Can>
      )}
    </div>
  );
}

function EvidenceRow({
  organizationId,
  responseId,
  evidence,
  ownUpload,
  locked,
  onChanged,
}: {
  organizationId: string;
  responseId: string;
  evidence: EvidenceItem;
  ownUpload: boolean;
  locked: boolean;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [detaching, setDetaching] = useState(false);

  async function download() {
    setError(null);
    const r = await apiFetch<{ url: string }>(`/api/v1/organizations/${organizationId}/evidence/${evidence.id}/download-url`);
    if (!r.success) return setError(r.error.message);
    window.open(r.data.url, "_blank", "noopener,noreferrer");
  }

  /**
   * Detaching from THIS answer only. The artefact stays in the evidence store
   * — nobody can delete one (D-042) — but this answer's score is re-derived
   * from whatever remains, so removing the artefact that held it up lowers it.
   */
  async function detach() {
    setError(null);
    setDetaching(true);
    const r = await apiFetch(
      `/api/v1/organizations/${organizationId}/evidence/${evidence.id}/links/${responseId}`,
      { method: "DELETE" },
    );
    setDetaching(false);
    if (!r.success) return setError(r.error.message);
    onChanged();
  }

  return (
    <li data-testid={`evidence-${evidence.id}`} className="rounded-md border border-slate-200 bg-white p-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono">{evidence.fileName}</span>
        <span
          data-testid={`evidence-status-${evidence.id}`}
          title={evidence.evidenceLevel !== null ? `Evidence ${evidenceCode(evidence.evidenceLevel)}` : undefined}
        >
          {evidenceFileSentence(
            REVIEW_STATUS_LABEL[evidence.reviewStatus] ?? evidence.reviewStatus,
            evidence.reviewStatus !== "pending",
            evidence.evidenceLevel,
          )}
        </span>
        <Can permission="evidence.read">
          <button type="button" onClick={download} className="text-indigo-700 hover:underline">
            Download
          </button>
        </Can>
        {!locked && (
          <Can permission="evidence.write">
            <button
              type="button"
              data-testid={`detach-evidence-${evidence.id}`}
              onClick={detach}
              disabled={detaching}
              className="text-slate-600 hover:underline disabled:opacity-50"
            >
              {detaching ? "Detaching…" : "Detach"}
            </button>
          </Can>
        )}
      </div>
      {!locked && (
        <Can permission="evidence.review">
          {ownUpload ? (
            <p className="mt-1 text-slate-600">You uploaded this file, so another reviewer must review it.</p>
          ) : (
            <ReviewForm organizationId={organizationId} evidence={evidence} onReviewed={onChanged} />
          )}
        </Can>
      )}
      {error && <Notice tone="error" compact className="mt-1">{error}</Notice>}
    </li>
  );
}

/** Exported for the gap register (Slice 6): evidence on an action is reviewed the same way. */
export function ReviewForm({
  organizationId,
  evidence,
  onReviewed,
}: {
  organizationId: string;
  evidence: EvidenceItem;
  onReviewed: () => void;
}) {
  const [status, setStatus] = useState<string>(evidence.reviewStatus === "pending" ? "" : evidence.reviewStatus);
  const [level, setLevel] = useState<string>(evidence.evidenceLevel === null ? "" : String(evidence.evidenceLevel));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (status === "" || level === "") return setError("Choose a review status and an evidence level.");
    setBusy(true);
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/evidence/${evidence.id}/review`, {
      method: "PATCH",
      body: JSON.stringify({ reviewStatus: status, evidenceLevel: Number(level) }),
    });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    onReviewed();
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-wrap items-end gap-2">
      <label className="flex flex-col text-slate-600">
        Review
        <select
          data-testid={`review-status-${evidence.id}`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            // Rejected evidence supports nothing: it is E0 (a database CHECK too).
            if (e.target.value === "rejected") setLevel("0");
          }}
          className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1"
        >
          <option value="">Choose…</option>
          {REVIEWED_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REVIEW_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-slate-600">
        Evidence level
        <select
          data-testid={`review-level-${evidence.id}`}
          value={level}
          disabled={status === "rejected"}
          onChange={(e) => setLevel(e.target.value)}
          className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1"
        >
          <option value="">Choose…</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l} of 5 — {EVIDENCE_LEVEL_MEANING[l]} (supports at most {EVIDENCE_CAP[l]})
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        data-testid={`save-review-${evidence.id}`}
        disabled={busy}
        className="rounded-md border border-indigo-700 px-3 py-1 font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save review"}
      </button>
      {error && (
        <Notice tone="error" compact className="w-full">
          {error}
        </Notice>
      )}
    </form>
  );
}

function AttachForm({
  organizationId,
  responseId,
  code,
  onAttached,
}: {
  organizationId: string;
  responseId: string;
  code: string;
  onAttached: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!file) return setError("Choose a file.");
    if (!(EVIDENCE_CONTENT_TYPES as readonly string[]).includes(file.type)) {
      return setError("Upload a PDF, image, text, CSV or Office document.");
    }
    if (file.size === 0 || file.size > EVIDENCE_MAX_BYTES) return setError("Files must be between 1 byte and 25 MB.");
    setBusy(true);
    try {
      // 1. Register the artefact and get a signed upload URL (audited).
      const issued = await apiFetch<{ evidence: { id: string }; upload: { url: string; contentType: string } }>(
        `/api/v1/organizations/${organizationId}/evidence/upload-url`,
        { method: "POST", body: JSON.stringify({ fileName: file.name, contentType: file.type, byteSize: file.size }) },
      );
      if (!issued.success) return setError(issued.error.message);
      // 2. Upload straight to private Storage — the file never passes through our server.
      const put = await fetch(issued.data.upload.url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": issued.data.upload.contentType },
      });
      if (!put.ok) return setError("The upload failed. Try again.");
      // 3. Link the now-stored artefact to this answer.
      const linked = await apiFetch(`/api/v1/organizations/${organizationId}/evidence/${issued.data.evidence.id}/link`, {
        method: "POST",
        body: JSON.stringify({ responseId }),
      });
      if (!linked.success) return setError(linked.error.message);
      setFile(null);
      onAttached();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 text-xs">
      <input
        type="file"
        data-testid={`evidence-file-${code}`}
        accept={EVIDENCE_CONTENT_TYPES.join(",")}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button
        type="submit"
        data-testid={`attach-${code}`}
        disabled={busy || !file}
        className="rounded-md border border-slate-300 bg-white px-3 py-1 hover:bg-slate-100 disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Attach evidence"}
      </button>
      {error && (
        <Notice tone="error" compact testId={`attach-error-${code}`} className="w-full">
          {error}
        </Notice>
      )}
    </form>
  );
}
