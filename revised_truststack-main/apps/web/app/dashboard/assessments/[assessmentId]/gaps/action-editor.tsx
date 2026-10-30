"use client";

import {
  EVIDENCE_CONTENT_TYPES,
  EVIDENCE_MAX_BYTES,
  GAP_ACTION_STATUS_LABEL,
  GAP_ACTION_TRANSITIONS,
  isOverdue,
  type GapActionStatus,
} from "@truststack/core";
import { useState, type FormEvent } from "react";
import { PagedList } from "@/components/data/paged-list";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { REVIEW_STATUS_LABEL, type EvidenceItem } from "@/lib/client/assessments";
import { CLOSURE_BASIS_LABEL, formatDueDate, type Gap, type GapAction, type GapMember } from "@/lib/client/gaps";
import { Can, usePermissions } from "@/lib/client/permissions";
import { ReviewForm } from "../answer-panel";

interface Props {
  organizationId: string;
  /** An assessment gap's action is addressed under its assessment… */
  assessmentId?: string;
  gap: Pick<Gap, "id">;
  /** …a ROPA gap's under the register (Slice 7). One action table, one editor (D-060). */
  actionUrl?: string;
  action: GapAction;
  members: GapMember[];
  currentUserId: string | null;
  today: string;
  onChanged: () => void | Promise<void>;
}

/**
 * One remediation action: who owns it, when it is due, where it stands, and
 * the evidence that it was done.
 *
 * The status menu offers only the moves the workflow allows, and the server
 * decides whether an action may close — it needs reviewed evidence attached
 * here, or approval by a reviewer who is not the owner (D-056). The browser
 * explains that rule; it never enforces it.
 */
export function ActionEditor({ organizationId, assessmentId, gap, actionUrl, action, members, currentUserId, today, onChanged }: Props) {
  const permissions = usePermissions();
  const canWrite = permissions.kind === "ready" && permissions.value.permissions.includes("gap.write");
  const closed = action.status === "closed";
  const overdue = isOverdue(action.status, action.dueDate, today);
  const url = actionUrl ?? `/api/v1/organizations/${organizationId}/assessments/${assessmentId}/gaps/${gap.id}/actions/${action.id}`;

  return (
    <div data-testid={`action-${action.id}`} className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{action.title}</p>
        <span
          data-testid={`action-status-${action.id}`}
          className={
            closed
              ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900"
              : "rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-800 ring-1 ring-slate-300"
          }
        >
          {GAP_ACTION_STATUS_LABEL[action.status]}
        </span>
      </div>

      <p className="flex flex-wrap gap-x-4 text-xs text-slate-600">
        <span data-testid={`action-owner-${action.id}`}>
          Owner: <strong className="text-slate-800">{action.ownerName ?? "Unassigned"}</strong>
          {action.ownerRole && ` · suggested: ${action.ownerRole}`}
        </span>
        <span data-testid={`action-due-${action.id}`} className={overdue ? "font-semibold text-red-800" : undefined}>
          Due: {formatDueDate(action.dueDate)}
          {overdue && " — overdue"}
        </span>
      </p>

      {closed && (
        <p data-testid={`action-closure-${action.id}`} className="text-xs text-emerald-900">
          Closed
          {action.closedAt && ` on ${new Date(action.closedAt).toLocaleDateString("en-IN")}`}
          {action.closedByName && ` by ${action.closedByName}`}
          {action.closureBasis && `, on ${CLOSURE_BASIS_LABEL[action.closureBasis]}`}.
        </p>
      )}
      {action.notes && !canWrite && <p className="whitespace-pre-wrap text-xs text-slate-700">{action.notes}</p>}

      {canWrite &&
        (closed ? (
          <ReopenButton url={url} actionId={action.id} onChanged={onChanged} />
        ) : (
          <EditForm key={action.updatedAt} url={url} action={action} members={members} onChanged={onChanged} />
        ))}

      <EvidenceList
        organizationId={organizationId}
        url={url}
        action={action}
        currentUserId={currentUserId}
        canWrite={canWrite}
        onChanged={onChanged}
      />
    </div>
  );
}

function EditForm({
  url,
  action,
  members,
  onChanged,
}: {
  url: string;
  action: GapAction;
  members: GapMember[];
  onChanged: () => void | Promise<void>;
}) {
  const [owner, setOwner] = useState(action.ownerUserId ?? "");
  const [due, setDue] = useState(action.dueDate ?? "");
  const [status, setStatus] = useState<GapActionStatus>(action.status);
  const [notes, setNotes] = useState(action.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only the moves the workflow allows — the database enforces the same graph.
  const moves = GAP_ACTION_TRANSITIONS[action.status];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    // Send only what changed: an untouched field is not an edit.
    const body: Record<string, unknown> = {};
    if (owner !== (action.ownerUserId ?? "")) body.ownerUserId = owner === "" ? null : owner;
    if (due !== (action.dueDate ?? "")) body.dueDate = due === "" ? null : due;
    if (status !== action.status) body.status = status;
    if (notes.trim() !== (action.notes ?? "")) body.notes = notes.trim() === "" ? null : notes.trim();
    if (Object.keys(body).length === 0) return setError("Nothing has changed.");

    setBusy(true);
    const r = await apiFetch(url, { method: "PATCH", body: JSON.stringify(body) });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    await onChanged();
  }

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-slate-200 pt-2 text-xs text-slate-600">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col">
          Owner
          <select
            data-testid={`action-owner-select-${action.id}`}
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.fullName ?? "Unnamed member"} — {m.roleName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          Due date
          <input
            type="date"
            data-testid={`action-due-input-${action.id}`}
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
          />
        </label>
        <label className="flex flex-col">
          Status
          <select
            data-testid={`action-status-select-${action.id}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as GapActionStatus)}
            className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
          >
            <option value={action.status}>{GAP_ACTION_STATUS_LABEL[action.status]}</option>
            {moves.map((s) => (
              <option key={s} value={s}>
                {GAP_ACTION_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col">
        Notes
        <textarea
          data-testid={`action-notes-${action.id}`}
          value={notes}
          rows={2}
          maxLength={4000}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
        />
      </label>
      {status === "closed" && (
        <p className="text-slate-600">
          {action.retentionScheduleId
            ? "Closing needs an owner, and either reviewed evidence attached to this action, the erasure recorded on its schedule by someone other than the owner, or approval by a reviewer who is not the owner."
            : "Closing needs an owner, and either reviewed evidence attached to this action or approval by a reviewer who is not the owner."}
        </p>
      )}
      <button
        type="submit"
        data-testid={`save-action-${action.id}`}
        disabled={busy}
        className="rounded-md bg-indigo-700 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
      {error && (
        <Notice tone="error" compact testId={`action-error-${action.id}`}>
          {error}
        </Notice>
      )}
    </form>
  );
}

function ReopenButton({ url, actionId, onChanged }: { url: string; actionId: string; onChanged: () => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reopen() {
    setError(null);
    setBusy(true);
    const r = await apiFetch(url, { method: "PATCH", body: JSON.stringify({ status: "in_progress" }) });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    await onChanged();
  }

  return (
    <div className="border-t border-slate-200 pt-2 text-xs">
      <button
        type="button"
        data-testid={`reopen-action-${actionId}`}
        onClick={reopen}
        disabled={busy}
        className="rounded-md border border-slate-300 bg-white px-3 py-1 hover:bg-slate-100 disabled:opacity-50"
      >
        {busy ? "Reopening…" : "Reopen"}
      </button>
      <span className="ml-2 text-slate-600">A closed action cannot be edited. Reopening moves it back to In Progress.</span>
      {error && (
        <Notice tone="error" compact className="mt-1">
          {error}
        </Notice>
      )}
    </div>
  );
}

function EvidenceList({
  organizationId,
  url,
  action,
  currentUserId,
  canWrite,
  onChanged,
}: {
  organizationId: string;
  url: string;
  action: GapAction;
  currentUserId: string | null;
  canWrite: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const closed = action.status === "closed";
  return (
    <div className="space-y-2 border-t border-slate-200 pt-2">
      <p className="text-xs font-semibold text-slate-700">Evidence that the action was done</p>
      {action.evidence.length === 0 ? (
        <p className="text-xs text-slate-600">
          Nothing attached. Evidence here supports closing the action; it does not change the score of the answer.
        </p>
      ) : (
        <PagedList
          items={action.evidence}
          noun="files"
          testId={`action-evidence-list-${action.id}`}
          renderItem={(e) => (
            <EvidenceRow
              key={e.id}
              organizationId={organizationId}
              url={url}
              evidence={e}
              ownUpload={e.uploadedBy !== null && e.uploadedBy === currentUserId}
              canDetach={canWrite && !closed}
              onChanged={onChanged}
            />
          )}
        />
      )}
      {canWrite && (
        <Can permission="evidence.write">
          <AttachForm organizationId={organizationId} actionId={action.id} onAttached={onChanged} />
        </Can>
      )}
    </div>
  );
}

function EvidenceRow({
  organizationId,
  url,
  evidence,
  ownUpload,
  canDetach,
  onChanged,
}: {
  organizationId: string;
  url: string;
  evidence: EvidenceItem;
  ownUpload: boolean;
  canDetach: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    setError(null);
    const r = await apiFetch<{ url: string }>(`/api/v1/organizations/${organizationId}/evidence/${evidence.id}/download-url`);
    if (!r.success) return setError(r.error.message);
    window.open(r.data.url, "_blank", "noopener,noreferrer");
  }

  /** Detaching from THIS action only. The artefact stays in the evidence store (D-042). */
  async function detach() {
    setError(null);
    setBusy(true);
    const r = await apiFetch(`${url}/evidence/${evidence.id}`, { method: "DELETE" });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    await onChanged();
  }

  return (
    <li data-testid={`action-evidence-${evidence.id}`} className="rounded-md border border-slate-200 bg-white p-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono">{evidence.fileName}</span>
        <span data-testid={`action-evidence-status-${evidence.id}`}>
          {REVIEW_STATUS_LABEL[evidence.reviewStatus] ?? evidence.reviewStatus}
        </span>
        <Can permission="evidence.read">
          <button type="button" onClick={download} className="text-indigo-700 hover:underline">
            Download
          </button>
        </Can>
        {canDetach && (
          <Can permission="evidence.write">
            <button
              type="button"
              data-testid={`detach-action-evidence-${evidence.id}`}
              onClick={detach}
              disabled={busy}
              className="text-slate-600 hover:underline disabled:opacity-50"
            >
              {busy ? "Detaching…" : "Detach"}
            </button>
          </Can>
        )}
      </div>
      <Can permission="evidence.review">
        {ownUpload ? (
          <p className="mt-1 text-slate-600">You uploaded this file, so another reviewer must review it.</p>
        ) : (
          <ReviewForm organizationId={organizationId} evidence={evidence} onReviewed={onChanged} />
        )}
      </Can>
      {error && (
        <Notice tone="error" compact className="mt-1">
          {error}
        </Notice>
      )}
    </li>
  );
}

function AttachForm({
  organizationId,
  actionId,
  onAttached,
}: {
  organizationId: string;
  actionId: string;
  onAttached: () => void | Promise<void>;
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
      // 3. Link the now-stored artefact to this ACTION — not to the answer.
      const linked = await apiFetch(`/api/v1/organizations/${organizationId}/evidence/${issued.data.evidence.id}/link`, {
        method: "POST",
        body: JSON.stringify({ gapActionId: actionId }),
      });
      if (!linked.success) return setError(linked.error.message);
      setFile(null);
      await onAttached();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 text-xs">
      <input
        type="file"
        data-testid={`action-evidence-file-${actionId}`}
        accept={EVIDENCE_CONTENT_TYPES.join(",")}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button
        type="submit"
        data-testid={`attach-action-evidence-${actionId}`}
        disabled={busy || !file}
        className="rounded-md border border-slate-300 bg-white px-3 py-1 hover:bg-slate-100 disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Attach evidence"}
      </button>
      {error && (
        <Notice tone="error" compact testId={`action-attach-error-${actionId}`} className="w-full">
          {error}
        </Notice>
      )}
    </form>
  );
}
