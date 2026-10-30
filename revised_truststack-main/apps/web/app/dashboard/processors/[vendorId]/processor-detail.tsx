"use client";

import { EVIDENCE_CONTENT_TYPES, EVIDENCE_MAX_BYTES, TRI_STATES, VENDOR_REVIEW_NOTE, type TriState } from "@truststack/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PagedList } from "@/components/data/paged-list";
import { Notice } from "@/components/feedback/notice";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/feedback/toast";
import { apiFetch } from "@/lib/client/api";
import { REVIEW_STATUS_LABEL } from "@/lib/client/assessments";
import { formatInstant } from "@/lib/client/consent";
import { Can, usePermissions } from "@/lib/client/permissions";
import { ASSESSMENT_STATUS_STYLE, RISK_TIER_STYLE, ROLE_LABEL, TRI_LABEL, type Processor } from "@/lib/client/processors";
import { formatDay } from "@/lib/client/rights";

/**
 * One vendor in the processor register (Slice 10, Stage 4a): its contract —
 * whether one exists with DPDP clauses, when it was signed and is due for
 * review — the documents attached to it (the contract itself, certificates,
 * reports), and every version of its assessment. The contract facts are the
 * vendor register's (scope.write); documents and assessments need
 * vendor.assess. Nothing here decides anything — the database does.
 */
export function ProcessorDetail({ vendorId }: { vendorId: string }) {
  const permissions = usePermissions();
  const router = useRouter();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [processor, setProcessor] = useState<Processor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!organizationId) return Promise.resolve();
    return apiFetch<{ processor: Processor }>(`/api/v1/organizations/${organizationId}/processors/${vendorId}`).then((r) => {
      if (r.success) {
        setProcessor(r.data.processor);
        setError(null);
      } else setError(r.error.message);
    });
  }, [organizationId, vendorId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function start() {
    if (!organizationId) return;
    setBusy(true);
    setError(null);
    const r = await apiFetch<{ assessment: { id: string } }>(`/api/v1/organizations/${organizationId}/processors/${vendorId}/assessments`, { method: "POST" });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    router.push(`/dashboard/processors/${vendorId}/assessments/${r.data.assessment.id}`);
  }

  if (permissions.kind === "loading" || (!processor && !error)) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!processor) {
    return (
      <Notice tone="error" testId="processor-error">
        {error}
      </Notice>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/processors" className="text-xs text-indigo-800 hover:underline">
          ← Processors
        </Link>
        <h2 data-testid="processor-name" className="mt-1 text-lg font-semibold">
          {processor.name}
        </h2>
        <p className="text-sm text-slate-600">
          {ROLE_LABEL[processor.vendorRole]}
          {processor.service ? ` · ${processor.service}` : ""}
        </p>
        {!processor.isProcessor && (
          <p className="mt-2 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
            The vendor register records this vendor as an independent fiduciary, not a processor: section 8(2) does not ask for
            a processor contract, and the model does not count it.
          </p>
        )}
      </div>

      {error && (
        <Notice tone="error" testId="processor-action-error">
          {error}
        </Notice>
      )}

      <Tabs
        label="Processor"
        tabs={[
          {
            id: "contract",
            label: "Contract",
            attention: processor.isProcessor && processor.contractGap,
            badge: processor.isProcessor && processor.contractGap ? "Gap" : undefined,
            content: <ContractSection organizationId={organizationId!} processor={processor} onSaved={load} />,
          },
          {
            id: "assessments",
            label: "Assessments",
            badge: processor.versions.length,
            content: (
              <section data-testid="processor-assessments" className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Assessments</h3>
                  {!processor.open && (
                    <Can permission="vendor.assess">
                      <button
                        type="button"
                        data-testid="processor-start-assessment"
                        disabled={busy}
                        onClick={start}
                        className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
                      >
                        {processor.current ? "Start a new version" : "Start an assessment"}
                      </button>
                    </Can>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Staff enter the vendor&apos;s answers and say where they came from. Only an assessment ACCEPTED by someone who did
                  not enter it counts; once accepted it never changes — a correction is a new version, which starts from it.{" "}
                  {VENDOR_REVIEW_NOTE}
                </p>
                {processor.versions.length === 0 ? (
                  <p data-testid="processor-no-assessment" className="text-sm text-slate-700">
                    This vendor has not been assessed.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {processor.versions.map((a) => (
                      <li key={a.id} data-testid={`assessment-v${a.version}`} className="rounded-md border border-slate-200 p-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/dashboard/processors/${processor.id}/assessments/${a.id}`} className="text-sm font-medium text-indigo-800 hover:underline">
                            Version {a.version}
                          </Link>
                          <span className={`rounded-full px-2 py-0.5 font-medium ${ASSESSMENT_STATUS_STYLE[a.status]}`}>{a.statusLabel}</span>
                          {a.outOfDate && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">Assessment out of date</span>}
                          {a.withVendor && <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-800">With the vendor</span>}
                          {a.riskScore !== null && a.riskTier && (
                            <span className={RISK_TIER_STYLE[a.riskTier]}>
                              Risk {a.riskScore} ({a.riskTierLabel})
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-slate-600">
                          {a.sourceLabel}
                          {a.createdByName ? ` · started by ${a.createdByName}` : ""}
                          {a.declaration ? ` · declared by ${a.declaration.name}, ${a.declaration.role}` : ""}
                          {a.sourceNote ? ` · source: ${a.sourceNote}` : ""}
                          {a.reviewedByName && a.status === "accepted" ? ` · accepted by ${a.reviewedByName}${a.reviewedAt ? ` on ${formatInstant(a.reviewedAt)}` : ""}` : ""}
                          {a.reviewBy ? ` · review by ${formatDay(a.reviewBy)}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ),
          },
          {
            id: "documents",
            label: "Documents",
            badge: processor.documents.length,
            content: <DocumentsSection organizationId={organizationId!} processor={processor} onChanged={load} />,
          },
        ]}
      />
    </div>
  );
}

function ContractSection({ organizationId, processor, onSaved }: { organizationId: string; processor: Processor; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const permissions = usePermissions();
  const canEdit = permissions.kind === "ready" && permissions.value.permissions.includes("scope.write");
  const [contractExists, setContractExists] = useState<TriState>(processor.contractExists);
  const [dpdpClauses, setDpdpClauses] = useState<TriState>(processor.dpdpClauses);
  const [signedOn, setSignedOn] = useState(processor.contractSignedOn ?? "");
  const [reviewBy, setReviewBy] = useState(processor.contractReviewBy ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/vendors/${processor.id}`, {
      method: "PATCH",
      body: JSON.stringify({ contractExists, dpdpClauses, contractSignedOn: signedOn || null, contractReviewBy: reviewBy || null }),
    });
    if (!r.success) return setMessage({ ok: false, text: r.error.message });
    setMessage({ ok: true, text: "Saved." });
    toast.success("Contract details saved.");
    await onSaved();
  }

  const select = "mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 disabled:bg-slate-50";
  return (
    <section data-testid="processor-contract" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">Contract</h3>
      {processor.isProcessor && processor.contractGap && (
        <Notice tone="error" compact testId="processor-contract-gap">
          No contract with DPDP clauses is recorded. A processor is engaged only under a valid contract (section 8(2)), which
          provides for reasonable security safeguards (Rule 6(1)(f)). Until both are recorded as &ldquo;Yes&rdquo;, heads 1 and 7
          of the exposure view cannot be Mitigated.
        </Notice>
      )}
      {processor.contractReviewPassed && (
        <Notice tone="warning" compact testId="processor-contract-review-passed">
          The contract&apos;s review date ({formatDay(processor.contractReviewBy!)}) has passed.
        </Notice>
      )}
      <form onSubmit={save} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-slate-600">
          A contract exists
          <select data-testid="processor-contract-exists" disabled={!canEdit} value={contractExists} onChange={(e) => setContractExists(e.target.value as TriState)} className={select}>
            {TRI_STATES.map((t) => (
              <option key={t} value={t}>
                {TRI_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs text-slate-600">
          It has DPDP clauses
          <select data-testid="processor-dpdp-clauses" disabled={!canEdit} value={dpdpClauses} onChange={(e) => setDpdpClauses(e.target.value as TriState)} className={select}>
            {TRI_STATES.map((t) => (
              <option key={t} value={t}>
                {TRI_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs text-slate-600">
          Signed on
          <input data-testid="processor-signed-on" type="date" disabled={!canEdit} value={signedOn} onChange={(e) => setSignedOn(e.target.value)} className={select} />
        </label>
        <label className="flex flex-col text-xs text-slate-600">
          Review by
          <input data-testid="processor-contract-review-by" type="date" disabled={!canEdit} value={reviewBy} onChange={(e) => setReviewBy(e.target.value)} className={select} />
        </label>
        {canEdit && (
          <button type="submit" data-testid="processor-contract-save" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50">
            Save contract
          </button>
        )}
      </form>
      {message && (
        <Notice tone={message.ok ? "success" : "error"} compact testId="processor-contract-message">
          {message.text}
        </Notice>
      )}
      <p className="text-xs text-slate-500">Attach the signed contract itself under Documents — it is stored as evidence, never as a link.</p>
    </section>
  );
}

function DocumentsSection({ organizationId, processor, onChanged }: { organizationId: string; processor: Processor; onChanged: () => Promise<void> }) {
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
      // Linked to the VENDOR: an answer in its assessment can then cite it.
      const linked = await apiFetch(`/api/v1/organizations/${organizationId}/evidence/${issued.data.evidence.id}/link`, {
        method: "POST",
        body: JSON.stringify({ vendorId: processor.id }),
      });
      if (!linked.success) return setError(linked.error.message);
      setFile(null);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function download(evidenceId: string) {
    const r = await apiFetch<{ url: string }>(`/api/v1/organizations/${organizationId}/evidence/${evidenceId}/download-url`);
    if (!r.success) return setError(r.error.message);
    window.open(r.data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <section data-testid="processor-documents" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">Documents</h3>
      <p className="text-xs text-slate-600">
        The signed contract, certificates (ISO/IEC 27001, SOC 2), a penetration-test summary, the sub-processor list. An answer
        that claims one of these scores as the risky answer until the document is cited on it.
      </p>
      {processor.documents.length === 0 ? (
        <p data-testid="processor-no-documents" className="text-xs text-slate-600">
          Nothing attached yet.
        </p>
      ) : (
        <PagedList
          items={processor.documents}
          className="space-y-1"
          testId="processor-document-list"
          renderItem={(d) => (
            <li key={d.id} data-testid={`processor-document-${d.id}`} className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-2 text-xs">
              <button type="button" onClick={() => download(d.id)} className="font-medium text-indigo-800 hover:underline">
                {d.fileName}
              </button>
              <span className="text-slate-500">
                uploaded {formatInstant(d.uploadedAt)}
                {d.fromVendor ? " by the vendor's respondent" : ""}
              </span>
              <span className={d.counts ? "text-slate-600" : "font-medium text-red-800"}>
                {d.counts
                  ? (REVIEW_STATUS_LABEL[d.reviewStatus] ?? d.reviewStatus)
                  : `${REVIEW_STATUS_LABEL[d.reviewStatus] ?? d.reviewStatus} — does not back an answer`}
              </span>
            </li>
          )}
        />
      )}
      <Can permission="vendor.assess">
        <form onSubmit={attach} className="flex flex-wrap items-center gap-2">
          <input data-testid="processor-document-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
          <button
            type="submit"
            data-testid="processor-document-attach"
            disabled={busy}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Attach document"}
          </button>
        </form>
      </Can>
      {error && (
        <Notice tone="error" compact testId="processor-document-error">
          {error}
        </Notice>
      )}
    </section>
  );
}
