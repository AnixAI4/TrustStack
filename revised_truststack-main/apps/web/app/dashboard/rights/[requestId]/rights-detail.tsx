"use client";

import {
  formatInIndia,
  needsIdentity,
  RIGHTS_CAPACITIES,
  RIGHTS_CAPACITY_LABEL,
  RIGHTS_CHANNEL_LABEL,
  RIGHTS_CHANNELS,
  RIGHTS_KIND_LABEL,
  RIGHTS_KINDS,
  RIGHTS_OUTCOME_LABEL,
  RIGHTS_OUTCOMES,
  rightsFamily,
  rightsStatusText,
  SHARING_RECIPIENT_KIND_LABEL,
  type RightsOutcome,
  type SharingRecipientKind,
} from "@truststack/core";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AcceptedDraft, DraftButton } from "@/components/ai/draft-panel";
import { Notice } from "@/components/feedback/notice";
import { DataTable } from "@/components/data/data-table";
import { Tabs } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/client/api";
import type { RecordedBy } from "@/lib/client/breaches";
import { todayInIndia } from "@/lib/client/gaps";
import { Can, usePermissions } from "@/lib/client/permissions";
import {
  formatDay,
  RIGHTS_CLOCK_STYLE,
  RIGHTS_STATUS_STYLE,
  type RightsDetailPayload,
  type RightsRequest,
} from "@/lib/client/rights";
import { AddAction } from "../../add-action";
import { RegisterDocuments } from "../../register-documents";
import { ActionEditor } from "../../assessments/[assessmentId]/gaps/action-editor";

/**
 * One request or grievance (Slice 10, Stage 2): where its response stands
 * against the ninety days, how the person was identified, the response, its
 * lifecycle and its remedial actions.
 *
 * The respond-by date is the database's (receipt + 90 days). The identity
 * check and the response are facts recorded once, with their day; the server
 * stamps who recorded them and when. The browser explains the rules; the
 * database enforces them.
 */
export function RightsDetail({ requestId }: { requestId: string }) {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canWrite = permissions.kind === "ready" && permissions.value.permissions.includes("rights.write");
  const [payload, setPayload] = useState<RightsDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const url = organizationId ? `/api/v1/organizations/${organizationId}/rights-requests/${requestId}` : null;
  const load = useCallback(() => {
    if (!url) return Promise.resolve();
    return apiFetch<RightsDetailPayload>(url).then((r) => {
      if (r.success) {
        setPayload(r.data);
        setError(null);
      } else setError(r.error.message);
    });
  }, [url]);

  useEffect(() => {
    void load();
    apiFetch<{ user: { id: string } }>("/api/v1/auth/me").then((r) => {
      if (r.success) setCurrentUserId(r.data.user.id);
    });
  }, [load]);

  /** One PATCH; the fresh request comes back in the response. */
  const patch = useCallback(
    async (body: Record<string, unknown>): Promise<string | null> => {
      if (!url) return "Not ready.";
      const r = await apiFetch<RightsDetailPayload>(url, { method: "PATCH", body: JSON.stringify(body) });
      if (!r.success) return r.error.message;
      setPayload(r.data);
      return null;
    },
    [url],
  );

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="rights-error">
        {error}
      </Notice>
    );
  }
  if (!payload || !organizationId) return <p className="text-sm text-slate-500">Loading the request…</p>;
  const r = payload.request;
  const editable = canWrite && r.status === "open";

  return (
    <div className="space-y-6" data-testid="rights-detail" data-status={r.status}>
      <div>
        <Link href="/dashboard/rights" className="text-xs text-indigo-700 hover:underline">
          ← Back to the register
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span data-testid="rights-code" className="font-mono font-semibold text-slate-800">
            {r.requestCode}
          </span>
          <span data-testid="rights-status" className={`rounded-full px-2 py-0.5 font-medium ${RIGHTS_STATUS_STYLE[r.status]}`}>
            {rightsStatusText(r.statusLabel, r.response?.outcomeLabel)}
          </span>
          <span className="text-slate-600">
            {r.kindLabel} · {r.provision}
          </span>
        </div>
        <h2 className="mt-1 whitespace-pre-wrap text-lg font-semibold">{r.summary}</h2>
        {(r.status === "withdrawn" || r.status === "void") && (
          <p data-testid="rights-closure" className="mt-2 rounded-md bg-slate-100 p-2 text-sm text-slate-700">
            {r.statusLabel}: {r.closureReason}
          </p>
        )}
      </div>

      <Tabs
        label="Request"
        tabs={[
          {
            id: "response",
            label: "Response",
            content: (
              <>
                <Clock r={r} clockNote={payload.clockNote} />
                <Identity r={r} editable={editable} patch={patch} />
                {r.kind === "access" && organizationId && <SharedWith organizationId={organizationId} requestId={r.id} />}
                <Response r={r} editable={editable} patch={patch} organizationId={organizationId} />
                <Lifecycle r={r} canWrite={canWrite} patch={patch} />
              </>
            ),
          },
          {
            id: "documents",
            label: "Documents",
            badge: r.documents.length,
            content: (
              <RegisterDocuments
                organizationId={organizationId}
                documents={r.documents}
                link={{ rightsRequestId: r.id }}
                detachUrl={`${url}/evidence`}
                canWrite={canWrite && r.status !== "void"}
                canDetach={canWrite && r.status === "open"}
                hint="Nothing attached yet. The response sent to the person — and, for a grievance, what was done — belongs here. Never attach the person's identity documents."
                testIdPrefix="rights"
                onChanged={load}
              />
            ),
          },
          {
            id: "actions",
            label: "Actions",
            badge: r.actions.length,
            content: (
              <section data-testid="rights-actions" className="space-y-2 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold">Remedial actions</h3>
                <p className="text-xs text-slate-600">
                  What must change so this does not happen again — an erasure that has to reach every system and processor, a
                  correction that never reached another register. These are on the same action list as every other gap: the same
                  owners, due dates and closing rule — reviewed evidence, or a reviewer who is not the owner.
                </p>
                {r.actions.length === 0 && <p className="text-sm text-slate-600">No action yet.</p>}
                {r.actions.map((action) => (
                  <ActionEditor
                    key={action.id}
                    organizationId={organizationId}
                    gap={{ id: r.id }}
                    actionUrl={`/api/v1/organizations/${organizationId}/rights-requests/${r.id}/actions/${action.id}`}
                    action={action}
                    members={payload.members}
                    currentUserId={currentUserId}
                    today={todayInIndia()}
                    onChanged={load}
                  />
                ))}
                {r.status !== "void" && (
                  <Can permission="rights.write">
                    <Can permission="gap.write">
                      <AddAction<RightsDetailPayload>
                        url={`/api/v1/organizations/${organizationId}/rights-requests/${r.id}/actions`}
                        members={payload.members}
                        onAdded={setPayload}
                        testIdPrefix="rights"
                      />
                    </Can>
                  </Can>
                )}
              </section>
            ),
          },
          {
            id: "details",
            label: "Details",
            content: <Details r={r} editable={editable} members={payload.members} patch={patch} />,
          },
        ]}
      />
    </div>
  );
}

type Patch = (body: Record<string, unknown>) => Promise<string | null>;

// ---------------------------------------------------------------------------
// s.11(1)(b) — who the data was shared with (D-139)
// ---------------------------------------------------------------------------

interface SharingRecordView {
  recordCode: string;
  name: string;
  dataCategories: string | null;
  basisUndecided: boolean;
  approved: boolean;
}
interface SharingPayload {
  recipients: { name: string; kind: SharingRecipientKind; service: string | null; records: SharingRecordView[] }[];
  namedInRecords: { text: string; record: SharingRecordView }[];
  counts: { recordsRead: number; recordsInScope: number; recordsUndecided: number; recordsOutOfScope: number; recordsSharingNothing: number };
  text: string;
  lawNote: string;
}

interface SharingRow {
  key: string;
  name: string;
  who: string;
  records: string;
}

function recordText(record: SharingRecordView): string {
  return `${record.recordCode} ${record.name} — ${record.dataCategories ?? "kinds of data not yet recorded"}${record.basisUndecided ? " (lawful basis not yet decided)" : ""}`;
}

/** One row per recipient in the processor register, then one per record that names recipients only in its text. */
function sharingRows(data: SharingPayload): SharingRow[] {
  return [
    ...data.recipients.map((x) => ({
      key: `v-${x.name}`,
      name: x.name,
      who: `${SHARING_RECIPIENT_KIND_LABEL[x.kind]}${x.service ? ` · ${x.service}` : ""}`,
      records: x.records.map(recordText).join("; "),
    })),
    ...data.namedInRecords.map((n) => ({
      key: `t-${n.record.recordCode}`,
      name: n.text,
      who: "Named in the record's text — check who this is",
      records: recordText(n.record),
    })),
  ];
}

function SharedWith({ organizationId, requestId }: { organizationId: string; requestId: string }) {
  const [data, setData] = useState<SharingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch<SharingPayload>(`/api/v1/organizations/${organizationId}/rights-requests/${requestId}/sharing`).then((r) => {
      if (r.success) setData(r.data);
      else setError(r.error.message);
    });
  }, [organizationId, requestId]);

  const empty = data !== null && data.recipients.length === 0 && data.namedInRecords.length === 0;
  return (
    <Step title="Who the person's data was shared with" testId="rights-sharing">
      <p className="text-xs text-slate-600">
        The reply must name every other organisation the person&apos;s data was shared with — whether it acts for you (a Data
        Processor) or decides for itself (another Data Fiduciary) — and say what kinds of data went to each (s.11(1)(b)). This
        list comes from your processing register. Keep only what concerns this person, then put it in the reply.
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      {data === null && !error && <p className="text-sm text-slate-600">Reading the processing register…</p>}
      {empty && (
        <p data-testid="rights-sharing-empty" className="text-sm text-slate-700">
          Your processing register records no sharing for consent-based processing. If data was shared, record it in the register
          first — on each record, link the processor or fill in &quot;Who it is shared with&quot;.
        </p>
      )}
      {data && !empty && (
        <DataTable<SharingRow>
          testId="rights-sharing-table"
          rows={sharingRows(data)}
          rowKey={(row) => row.key}
          rowTestId={(row) => `rights-sharing-row-${row.key}`}
          noun="recipients"
          caption="Who the person's data was shared with"
          search={{ text: (row) => `${row.name} ${row.who} ${row.records}`, placeholder: "Search recipients", label: "Search recipients" }}
          columns={[
            { key: "name", header: "Recipient", cell: (row) => <span className="font-medium">{row.name}</span>, sortValue: (row) => row.name },
            { key: "who", header: "Who they are", cell: (row) => <span className="text-xs text-slate-600">{row.who}</span>, sortValue: (row) => row.who },
            { key: "records", header: "Processing records and kinds of data", cell: (row) => <span className="text-xs text-slate-600">{row.records}</span> },
          ]}
        />
      )}
      {data && (data.counts.recordsUndecided > 0 || data.counts.recordsOutOfScope > 0) && (
        <p data-testid="rights-sharing-counts" className="text-xs text-slate-600">
          {data.counts.recordsUndecided > 0 &&
            `${data.counts.recordsUndecided} record${data.counts.recordsUndecided === 1 ? " has" : "s have"} no lawful basis decided yet, so ${data.counts.recordsUndecided === 1 ? "it is" : "they are"} listed until the basis is decided. `}
          {data.counts.recordsOutOfScope > 0 &&
            `${data.counts.recordsOutOfScope} record${data.counts.recordsOutOfScope === 1 ? " rests" : "s rest"} on another legitimate use (s.7) or an exemption; this right does not reach ${data.counts.recordsOutOfScope === 1 ? "it" : "them"}, so ${data.counts.recordsOutOfScope === 1 ? "it is" : "they are"} left out.`}
        </p>
      )}
      {data && !empty && (
        <button
          type="button"
          data-testid="rights-sharing-copy"
          className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          onClick={() => {
            void navigator.clipboard?.writeText(data.text).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy the list for the reply"}
        </button>
      )}
      {data && <p className="text-xs text-slate-500">{data.lawNote}</p>}
    </Step>
  );
}

// ---------------------------------------------------------------------------
// The clock — the Rules' ninety days, and TrustStack's target
// ---------------------------------------------------------------------------

function Clock({ r, clockNote }: { r: RightsRequest; clockNote: string }) {
  return (
    <section data-testid="rights-timeline" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">Response clock — Rule 14(3)</h3>
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-500">Received</dt>
          <dd data-testid="rights-received">{formatDay(r.receivedOn)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Respond by — the Rules&apos; ninety days</dt>
          <dd data-testid="rights-respond-by" className="font-medium">
            {formatDay(r.respondBy)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">TrustStack&apos;s target — thirty days</dt>
          <dd data-testid="rights-target-by">{formatDay(r.clock.targetBy)}</dd>
        </div>
      </dl>
      <p data-testid="rights-clock" className={`text-sm ${RIGHTS_CLOCK_STYLE[r.clock.state]}`}>
        {r.clock.label}
      </p>
      <p className="text-xs text-slate-500">{clockNote}</p>
    </section>
  );
}

function Step({ title, testId, children }: { title: string; testId: string; children: ReactNode }) {
  return (
    <section data-testid={testId} className="space-y-2 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function RecordedLine({ recorded }: { recorded: RecordedBy | null }) {
  if (!recorded) return null;
  return (
    <p className="text-xs text-slate-500">
      Recorded{recorded.byName ? ` by ${recorded.byName}` : ""} on {formatInIndia(recorded.at)}
    </p>
  );
}

const input = "mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";

// ---------------------------------------------------------------------------
// The identity check — Rule 14(1)(b), (2), (5)
// ---------------------------------------------------------------------------

function Identity({ r, editable, patch }: { r: RightsRequest; editable: boolean; patch: Patch }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const failed = await patch({ identity: { verifiedOn: String(form.get("verifiedOn")), method: String(form.get("method") ?? "").trim() } });
    setBusy(false);
    if (failed) return setError(failed);
    setOpen(false);
  }

  const grievance = r.family === "grievance";
  return (
    <Step title={`Identity verified — Rule 14(1)(b)${grievance ? " (optional for a grievance)" : ""}`} testId="rights-identity">
      {r.identity ? (
        <div>
          <p className="text-sm">
            Verified {formatDay(r.identity.verifiedOn)}
            {r.identity.method ? ` — ${r.identity.method}` : ""}
          </p>
          <RecordedLine recorded={r.identity.recorded} />
        </div>
      ) : (
        <p className={`text-sm ${grievance ? "text-slate-600" : "text-amber-800"}`}>
          {grievance
            ? "Not recorded."
            : "Not yet recorded. The request cannot be fulfilled until the person is identified — fulfilling it for someone else would itself disclose their data."}
        </p>
      )}
      {editable && !open && (
        <button type="button" data-testid="rights-identity-open" onClick={() => setOpen(true)} className="text-xs font-medium text-indigo-700 hover:underline">
          {r.identity ? "Correct" : "Record how they were identified"}
        </button>
      )}
      {editable && open && (
        <form data-testid="rights-identity-form" onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-2">
          <label className="flex flex-col text-xs text-slate-600">
            Verified on
            <input name="verifiedOn" type="date" required min={r.receivedOn} max={todayInIndia()} defaultValue={r.identity?.verifiedOn ?? todayInIndia()} className={input} />
          </label>
          <label className="flex flex-col text-xs text-slate-600">
            How — required
            <input
              name="method"
              required
              maxLength={500}
              defaultValue={r.identity?.method ?? ""}
              placeholder="e.g. matched the registered email and enrolment number"
              className={`${input} w-80`}
            />
          </label>
          <button type="submit" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-600 hover:underline">
            Cancel
          </button>
          {error && (
            <Notice tone="error" compact className="w-full">
              {error}
            </Notice>
          )}
        </form>
      )}
    </Step>
  );
}

// ---------------------------------------------------------------------------
// The response
// ---------------------------------------------------------------------------

function Response({ r, editable, patch, organizationId }: { r: RightsRequest; editable: boolean; patch: Patch; organizationId: string }) {
  const [open, setOpen] = useState(false);
  // "" = not yet chosen. A response pre-filled from an AI draft starts here: a person decides the outcome (D-129.2).
  const [outcome, setOutcome] = useState<RightsOutcome | "">("fulfilled");
  const [summaryText, setSummaryText] = useState("");
  const [fromDraft, setFromDraft] = useState(false);
  const [accepted, setAccepted] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labels = RIGHTS_OUTCOME_LABEL[r.family];

  // A refusal for a missing identity check must not outlive the check: once
  // it is recorded, the old red message would read as a second refusal.
  const identityOn = r.identity?.verifiedOn ?? null;
  useEffect(() => setError(null), [identityOn]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const summary = summaryText.trim();
    if (outcome === "") return setError("Choose the outcome — that decision is yours, not the assistant's.");
    setBusy(true);
    setError(null);
    const failed = await patch({
      status: "responded",
      response: { outcome, respondedOn: String(form.get("respondedOn")), summary: summary || null },
    });
    setBusy(false);
    if (failed) return setError(failed);
    setOpen(false);
  }

  const blocked = outcome !== "" && needsIdentity(r.kind, outcome) && r.identity === null;
  return (
    <Step title="Response" testId="rights-response">
      {r.response ? (
        <div>
          <p className="text-sm">
            <strong>{r.response.outcomeLabel}</strong> on {formatDay(r.response.respondedOn)}
            {r.clock.daysOpen !== null ? ` (day ${r.clock.daysOpen})` : ""}
          </p>
          {r.response.summary && <p className="whitespace-pre-wrap text-sm text-slate-700">{r.response.summary}</p>}
          <RecordedLine recorded={r.response.recorded} />
        </div>
      ) : (
        <p className="text-sm text-slate-600">Not yet responded.</p>
      )}
      {/* Slice 11 Stage 2a (D-129.2): the accepted letter to copy; its summary pre-fills the form below. */}
      <AcceptedDraft organizationId={organizationId} task="rights_response_draft" targetId={r.id} heading={r.requestCode} reloadKey={accepted} testId="rights-ai-letter" />
      {editable && (
        <div className="flex flex-wrap gap-2">
          {!open && (
            <button type="button" data-testid="rights-respond-open" onClick={() => setOpen(true)} className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800">
              Record the response
            </button>
          )}
          <DraftButton
            organizationId={organizationId}
            task="rights_response_draft"
            body={{ requestId: r.id }}
            subject={`${r.requestCode} — ${r.kindLabel}`}
            onAccepted={(d) => {
              setAccepted((n) => n + 1);
              setSummaryText(typeof d.acceptedOutput?.summary === "string" ? d.acceptedOutput.summary : "");
              setOutcome("");
              setFromDraft(true);
              setOpen(true);
            }}
            testId="rights-ai-draft"
          />
        </div>
      )}
      {editable && open && (
        <form data-testid="rights-respond-form" onSubmit={submit} className="space-y-2 rounded-md bg-slate-50 p-2">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col text-xs text-slate-600">
              Outcome
              <select data-testid="rights-outcome" value={outcome} required onChange={(e) => setOutcome(e.target.value as RightsOutcome | "")} className={input}>
                {outcome === "" && (
                  <option value="" disabled>
                    — Choose the outcome —
                  </option>
                )}
                {RIGHTS_OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {labels[o]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs text-slate-600">
              Responded on
              <input name="respondedOn" type="date" required min={r.receivedOn} max={todayInIndia()} defaultValue={todayInIndia()} className={input} />
            </label>
          </div>
          <label className="block text-xs text-slate-600">
            What was done{outcome === "fulfilled" ? " (optional)" : " — and why not in full (required)"}
            <textarea
              name="summary"
              data-testid="rights-response-summary"
              rows={fromDraft ? 4 : 2}
              maxLength={4000}
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              required={outcome !== "fulfilled"}
              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
            />
          </label>
          {fromDraft && (
            <p data-testid="rights-respond-from-draft" className="text-xs text-indigo-800">
              “What was done” is pre-filled from the accepted draft — complete its [placeholders]. Choose the outcome yourself.
            </p>
          )}
          {blocked && (
            <p className="text-xs text-amber-800">Record how the person was identified first — or record the request as {labels.declined.toLowerCase()}.</p>
          )}
          <div className="flex gap-2">
            <button type="submit" data-testid="rights-respond-save" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">
              {busy ? "Saving…" : "Save the response"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-600 hover:underline">
              Cancel
            </button>
          </div>
          {error && (
            <Notice tone="error" compact testId="rights-respond-error">
              {error}
            </Notice>
          )}
        </form>
      )}
    </Step>
  );
}

// ---------------------------------------------------------------------------
// The lifecycle
// ---------------------------------------------------------------------------

function Lifecycle({ r, canWrite, patch }: { r: RightsRequest; canWrite: boolean; patch: Patch }) {
  const [closing, setClosing] = useState<"withdrawn" | "void" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!canWrite) return null;

  async function move(status: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    const failed = await patch({ status, ...extra });
    setBusy(false);
    if (failed) setError(failed);
    else {
      setClosing(null);
      setReason("");
    }
  }

  return (
    <section data-testid="rights-lifecycle" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">Status: {r.statusLabel}</h3>
      {r.status !== "open" && r.closedAt && (
        <p className="text-xs text-slate-600">
          Since {formatInIndia(r.closedAt)}
          {r.closedByName ? `, recorded by ${r.closedByName}` : ""}. Reopen it to change anything.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {r.status === "open" ? (
          <>
            <button type="button" data-testid="rights-move-withdrawn" onClick={() => setClosing("withdrawn")} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100">
              Withdrawn by the person
            </button>
            <button type="button" data-testid="rights-move-void" onClick={() => setClosing("void")} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100">
              Void — entered in error
            </button>
          </>
        ) : (
          <button type="button" data-testid="rights-move-open" disabled={busy} onClick={() => move("open")} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50">
            Reopen
          </button>
        )}
      </div>
      {r.status === "responded" && (
        <p className="text-xs text-slate-500">Reopening withdraws the recorded response; the audit log keeps it. A complaint about the response is a new grievance.</p>
      )}
      {closing && (
        <div className="space-y-2 rounded-md bg-slate-50 p-2">
          <label className="block text-xs text-slate-600">
            {closing === "withdrawn" ? "How and when did the person withdraw it? (required)" : "What was entered in error? (required)"}
            <textarea
              data-testid="rights-closure-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={2000}
              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
            />
          </label>
          <button
            type="button"
            data-testid="rights-closure-confirm"
            disabled={busy || reason.trim() === ""}
            onClick={() => move(closing, { closureReason: reason.trim() })}
            className="rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            {closing === "withdrawn" ? "Mark withdrawn" : "Mark void"}
          </button>
        </div>
      )}
      {error && (
        <Notice tone="error" compact testId="rights-lifecycle-error">
          {error}
        </Notice>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// The request, the person and the owner
// ---------------------------------------------------------------------------

function Details({
  r,
  editable,
  members,
  patch,
}: {
  r: RightsRequest;
  editable: boolean;
  members: RightsDetailPayload["members"];
  patch: Patch;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const v = (k: string) => {
      const s = String(form.get(k) ?? "").trim();
      return s === "" ? null : s;
    };
    const kind = v("kind");
    setBusy(true);
    setError(null);
    const failed = await patch({
      kind,
      channel: v("channel"),
      requesterName: v("requesterName"),
      requesterEmail: v("requesterEmail"),
      requesterPhone: v("requesterPhone"),
      requesterCapacity: v("requesterCapacity"),
      principalIdentifier: v("principalIdentifier"),
      summary: v("summary"),
      ownerUserId: v("ownerUserId"),
      ...(kind === "nomination"
        ? { nomineeName: v("nomineeName"), nomineeContact: v("nomineeContact"), nomineeRelationship: v("nomineeRelationship") }
        : {}),
    });
    setBusy(false);
    if (failed) return setError(failed);
    setEditing(false);
  }

  const rows: [string, ReactNode][] = [
    ["From", `${r.requester.name} — ${r.requester.capacityLabel.toLowerCase()}`],
    ["Identifier given", r.requester.identifier],
    ["Email", r.requester.email],
    ["Phone", r.requester.phone],
    ["Arrived by", r.channelLabel],
    [
      "About an earlier request",
      r.related ? (
        <Link href={`/dashboard/rights/${r.related.id}`} className="text-indigo-700 hover:underline">
          {r.related.requestCode ?? "An earlier request"}
        </Link>
      ) : null,
    ],
    ...(r.nominee
      ? ([
          ["Nominee", r.nominee.name],
          ["Nominee's contact", r.nominee.contact],
          ["Relationship", r.nominee.relationship],
        ] as [string, ReactNode][])
      : []),
    ["Owner", r.ownerName ?? "Unassigned"],
    [
      "Recorded by",
      r.createdByName
        ? `${r.createdByName}, ${formatInIndia(r.createdAt)}`
        : r.channel === "web_form"
          ? // Slice 10 Stage 3a: no user — the person's own submission, their email address confirmed by a code.
            `The public form, email address confirmed — ${formatInIndia(r.createdAt)}`
          : formatInIndia(r.createdAt),
    ],
  ];
  const wide = "mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
  const sameFamily = RIGHTS_KINDS.filter((k) => rightsFamily(k) === r.family);

  return (
    <section data-testid="rights-details" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">The request</h3>
        {editable && !editing && (
          <button type="button" data-testid="rights-edit" onClick={() => setEditing(true)} className="text-xs font-medium text-indigo-700 hover:underline">
            Edit
          </button>
        )}
      </div>
      {!editing ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd data-testid={label === "Owner" ? "rights-owner" : undefined} className="whitespace-pre-wrap">
                {value ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <form onSubmit={submit} data-testid="rights-edit-form" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Kind {r.family === "grievance" ? "" : "(a request stays a request — a grievance is recorded anew)"}
              <select name="kind" defaultValue={r.kind} className={wide}>
                {sameFamily.map((k) => (
                  <option key={k} value={k}>
                    {RIGHTS_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Owner
              <select name="ownerUserId" defaultValue={r.ownerUserId ?? ""} data-testid="rights-owner-select" className={wide}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName ?? m.userId} — {m.roleName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Arrived by
              <select name="channel" defaultValue={r.channel} className={wide}>
                {RIGHTS_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {RIGHTS_CHANNEL_LABEL[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Made by
              <select name="requesterCapacity" defaultValue={r.requester.capacity} className={wide}>
                {RIGHTS_CAPACITIES.map((c) => (
                  <option key={c} value={c}>
                    {RIGHTS_CAPACITY_LABEL[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Name
              <input name="requesterName" required maxLength={200} defaultValue={r.requester.name} className={wide} />
            </label>
            <label className="block text-sm">
              Identifier given
              <input name="principalIdentifier" maxLength={200} defaultValue={r.requester.identifier ?? ""} className={wide} />
            </label>
            <label className="block text-sm">
              Email
              <input name="requesterEmail" type="email" maxLength={320} defaultValue={r.requester.email ?? ""} className={wide} />
            </label>
            <label className="block text-sm">
              Phone
              <input name="requesterPhone" maxLength={40} defaultValue={r.requester.phone ?? ""} className={wide} />
            </label>
          </div>
          <label className="block text-sm">
            What they asked for, or complained of
            <textarea name="summary" required rows={3} maxLength={4000} defaultValue={r.summary} className={wide} />
          </label>
          {r.kind === "nomination" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                Nominee
                <input name="nomineeName" required maxLength={200} defaultValue={r.nominee?.name ?? ""} className={wide} />
              </label>
              <label className="block text-sm">
                Nominee&apos;s contact
                <input name="nomineeContact" maxLength={500} defaultValue={r.nominee?.contact ?? ""} className={wide} />
              </label>
              <label className="block text-sm">
                Relationship
                <input name="nomineeRelationship" maxLength={200} defaultValue={r.nominee?.relationship ?? ""} className={wide} />
              </label>
            </div>
          )}
          {error && (
            <Notice tone="error" compact>
              {error}
            </Notice>
          )}
          <div className="flex gap-2">
            <button type="submit" data-testid="rights-edit-save" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-slate-600 hover:underline">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
