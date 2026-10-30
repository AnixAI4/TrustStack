"use client";

import { EVIDENCE_CONTENT_TYPES, EVIDENCE_MAX_BYTES } from "@truststack/core";
import { useState, type FormEvent } from "react";
import { PagedList } from "@/components/data/paged-list";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { REVIEW_STATUS_LABEL, type EvidenceItem } from "@/lib/client/assessments";

/**
 * Documents on a register row (Slice 10, Stages 5–6): an erasure certificate on
 * a retention schedule, a review or an impact assessment on an AI system, the
 * Board's intimations on a breach, the response sent on a request. The
 * file is uploaded by a signed URL, then linked to the row (`linkBody`); the
 * artefact itself is never deleted — detaching only removes the link (D-042).
 */
export function RegisterDocuments({
  organizationId,
  documents,
  link,
  detachUrl,
  canWrite,
  canDetach = canWrite,
  hint,
  testIdPrefix,
  onChanged,
}: {
  organizationId: string;
  documents: readonly EvidenceItem[];
  /** The link body, e.g. `{ retentionScheduleId }`. */
  link: Record<string, string>;
  /** `…/evidence` — the evidence id is appended. */
  detachUrl: string;
  canWrite: boolean;
  /** Whether a document may be detached now — a closed breach or an answered request keeps its documents. Defaults to `canWrite`. */
  canDetach?: boolean;
  hint: string;
  testIdPrefix: string;
  onChanged: () => void | Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function attach(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!file) return setError("Choose a file.");
    if (!(EVIDENCE_CONTENT_TYPES as readonly string[]).includes(file.type)) return setError("Upload a PDF, image, text, CSV or Office document.");
    if (file.size === 0 || file.size > EVIDENCE_MAX_BYTES) return setError("Files must be between 1 byte and 25 MB.");
    setBusy(true);
    try {
      const issued = await apiFetch<{ evidence: { id: string }; upload: { url: string; contentType: string } }>(
        `/api/v1/organizations/${organizationId}/evidence/upload-url`,
        { method: "POST", body: JSON.stringify({ fileName: file.name, contentType: file.type, byteSize: file.size }) },
      );
      if (!issued.success) return setError(issued.error.message);
      const put = await fetch(issued.data.upload.url, { method: "PUT", body: file, headers: { "Content-Type": issued.data.upload.contentType } });
      if (!put.ok) return setError("The upload failed. Try again.");
      const linked = await apiFetch(`/api/v1/organizations/${organizationId}/evidence/${issued.data.evidence.id}/link`, {
        method: "POST",
        body: JSON.stringify(link),
      });
      if (!linked.success) return setError(linked.error.message);
      setFile(null);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function detach(evidenceId: string) {
    setError(null);
    const r = await apiFetch(`${detachUrl}/${evidenceId}`, { method: "DELETE" });
    if (!r.success) return setError(r.error.message);
    await onChanged();
  }

  async function download(evidenceId: string) {
    const r = await apiFetch<{ url: string }>(`/api/v1/organizations/${organizationId}/evidence/${evidenceId}/download-url`);
    if (!r.success) return setError(r.error.message);
    window.open(r.data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <section data-testid={`${testIdPrefix}-documents`} className="space-y-2 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">Documents</h3>
      {documents.length === 0 ? (
        <p className="text-xs text-slate-600">{hint}</p>
      ) : (
        <PagedList
          items={documents}
          testId={`${testIdPrefix}-document-list`}
          renderItem={(d) => (
            <li key={d.id} data-testid={`${testIdPrefix}-document-${d.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-2 text-xs">
              <span>
                <strong className="text-slate-800">{d.fileName}</strong> · {REVIEW_STATUS_LABEL[d.reviewStatus] ?? d.reviewStatus}
              </span>
              <span className="flex gap-3">
                <button type="button" onClick={() => void download(d.id)} className="text-indigo-700 hover:underline">
                  Download
                </button>
                {canDetach && (
                  <button type="button" data-testid={`${testIdPrefix}-detach-${d.id}`} onClick={() => void detach(d.id)} className="text-slate-600 hover:underline">
                    Detach
                  </button>
                )}
              </span>
            </li>
          )}
        />
      )}
      {canWrite && (
        <form onSubmit={attach} className="flex flex-wrap items-center gap-2">
          <input data-testid={`${testIdPrefix}-file`} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
          <button type="submit" data-testid={`${testIdPrefix}-attach`} disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">
            {busy ? "Uploading…" : "Attach"}
          </button>
        </form>
      )}
      {error && (
        <Notice tone="error" compact>
          {error}
        </Notice>
      )}
    </section>
  );
}
