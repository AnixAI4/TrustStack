"use client";

import {
  AI_ROPA_TEXT_FIELDS,
  EVIDENCE_CONTENT_TYPES,
  EVIDENCE_MAX_BYTES,
  GAP_SEVERITY_LABEL,
  ROPA_APPROVAL_MIN_SCORE,
  consentRequired,
  noticeRequired,
  ROPA_BANDS,
  ROPA_CHILD_EXEMPTIONS,
  ROPA_COMPLETENESS_AREAS,
  ROPA_LAWFUL_BASES,
  ROPA_RETENTION_TRIGGERS,
  ROPA_SAFEGUARDS,
  ROPA_RISK_FACTORS,
  ROPA_RISK_LABEL,
  ROPA_RISK_RATINGS,
  ROPA_STATUS_LABEL,
  ropaCompleteness,
  ROPA_RECORD_TABS,
  ropaRisk,
  ropaTabPoints,
  ropaTabWeight,
  type RopaAreaCode,
  type RopaChildExemption,
  type RopaLawfulBasis,
  type RopaRetentionTrigger,
  type RopaSafeguard,
  type RopaTemplate,
  type RopaRiskRating,
  type RopaStatus,
  type TriState,
} from "@truststack/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { PagedList } from "@/components/data/paged-list";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { Tabs, type TabDef } from "@/components/ui/tabs";
import type { AiStoredDraft } from "@/lib/client/ai";
import { apiFetch } from "@/lib/client/api";
import { REVIEW_STATUS_LABEL } from "@/lib/client/assessments";
import { formatDueDate, SEVERITY_STYLE } from "@/lib/client/gaps";
import { Can, usePermissions } from "@/lib/client/permissions";
import {
  BAND_STYLE,
  RISK_STYLE,
  ROPA_POSITIONING,
  TRI_LABEL,
  type RopaDetailPayload,
  type RopaOptions,
  type RopaRecord,
} from "@/lib/client/ropa";
import { ReviewForm } from "../assessments/[assessmentId]/answer-panel";

/** The form's state: every content field as the input holds it. */
interface FormState {
  recordCode: string;
  name: string;
  description: string;
  departmentId: string;
  departmentText: string;
  ownerUserId: string;
  dataPrincipalTypes: string;
  dataCategories: string;
  estimatedDataPrincipals: string;
  purpose: string;
  legalBasisNote: string;
  collectionSource: string;
  systemsText: string;
  vendorsText: string;
  sharing: string;
  retentionRule: string;
  securitySafeguards: string;
  noticeLinked: string;
  consentLinked: string;
  rightsWorkflow: string;
  grievanceLinked: string;
  childrenData: TriState;
  crossBorder: TriState;
  aiProcessing: TriState;
  highRiskDocuments: TriState;
  evidenceNote: string;
  riskRatingAssessor: string;
  riskRatingAssessorReason: string;
  lawfulBasis: string;
  childParentalConsent: TriState;
  childExemption: string;
  childTracking: TriState;
  retentionTrigger: string;
  retentionLaw: string;
  safeguards: RopaSafeguard[];
  lastReviewedAt: string;
  nextReviewAt: string;
  systemIds: string[];
  vendorIds: string[];
}

const EMPTY_FORM: FormState = {
  recordCode: "",
  name: "",
  description: "",
  departmentId: "",
  departmentText: "",
  ownerUserId: "",
  dataPrincipalTypes: "",
  dataCategories: "",
  estimatedDataPrincipals: "",
  purpose: "",
  legalBasisNote: "",
  collectionSource: "",
  systemsText: "",
  vendorsText: "",
  sharing: "",
  retentionRule: "",
  securitySafeguards: "",
  noticeLinked: "",
  consentLinked: "",
  rightsWorkflow: "",
  grievanceLinked: "",
  childrenData: "unknown",
  crossBorder: "unknown",
  aiProcessing: "unknown",
  highRiskDocuments: "unknown",
  evidenceNote: "",
  riskRatingAssessor: "",
  riskRatingAssessorReason: "",
  lawfulBasis: "",
  childParentalConsent: "unknown",
  childExemption: "",
  childTracking: "unknown",
  retentionTrigger: "",
  retentionLaw: "",
  safeguards: [],
  lastReviewedAt: "",
  nextReviewAt: "",
  systemIds: [],
  vendorIds: [],
};

function fromRecord(r: RopaRecord): FormState {
  const s = (v: string | null) => v ?? "";
  return {
    recordCode: r.recordCode,
    name: r.name,
    description: s(r.description),
    departmentId: s(r.departmentId),
    departmentText: s(r.departmentText),
    ownerUserId: s(r.ownerUserId),
    dataPrincipalTypes: s(r.dataPrincipalTypes),
    dataCategories: s(r.dataCategories),
    estimatedDataPrincipals: r.estimatedDataPrincipals === null ? "" : String(r.estimatedDataPrincipals),
    purpose: s(r.purpose),
    legalBasisNote: s(r.legalBasisNote),
    collectionSource: s(r.collectionSource),
    systemsText: s(r.systemsText),
    vendorsText: s(r.vendorsText),
    sharing: s(r.sharing),
    retentionRule: s(r.retentionRule),
    securitySafeguards: s(r.securitySafeguards),
    noticeLinked: s(r.noticeLinked),
    consentLinked: s(r.consentLinked),
    rightsWorkflow: s(r.rightsWorkflow),
    grievanceLinked: s(r.grievanceLinked),
    childrenData: r.childrenData,
    crossBorder: r.crossBorder,
    aiProcessing: r.aiProcessing,
    highRiskDocuments: r.highRiskDocuments,
    evidenceNote: s(r.evidenceNote),
    lawfulBasis: s(r.lawfulBasis),
    childParentalConsent: r.childParentalConsent,
    childExemption: s(r.childExemption),
    childTracking: r.childTracking,
    retentionTrigger: s(r.retentionTrigger),
    retentionLaw: s(r.retentionLaw),
    safeguards: [...r.safeguards],
    riskRatingAssessor: s(r.risk.assessor),
    riskRatingAssessorReason: s(r.risk.assessorReason),
    lastReviewedAt: s(r.lastReviewedAt),
    nextReviewAt: s(r.nextReviewAt),
    systemIds: r.systems.map((x) => x.id),
    vendorIds: r.vendors.map((x) => x.id),
  };
}

/** The request body: blanks become null, the number a number. */
function toBody(f: FormState, creating: boolean) {
  const t = (v: string) => (v.trim() === "" ? null : v.trim());
  return {
    ...(creating && f.recordCode.trim() !== "" ? { recordCode: f.recordCode.trim() } : {}),
    name: f.name.trim(),
    description: t(f.description),
    departmentId: t(f.departmentId),
    departmentText: t(f.departmentText),
    ownerUserId: t(f.ownerUserId),
    dataPrincipalTypes: t(f.dataPrincipalTypes),
    dataCategories: t(f.dataCategories),
    estimatedDataPrincipals: f.estimatedDataPrincipals.trim() === "" ? null : Number(f.estimatedDataPrincipals.replace(/[,\s]/g, "")),
    purpose: t(f.purpose),
    legalBasisNote: t(f.legalBasisNote),
    collectionSource: t(f.collectionSource),
    systemsText: t(f.systemsText),
    vendorsText: t(f.vendorsText),
    sharing: t(f.sharing),
    retentionRule: t(f.retentionRule),
    securitySafeguards: t(f.securitySafeguards),
    noticeLinked: t(f.noticeLinked),
    consentLinked: t(f.consentLinked),
    rightsWorkflow: t(f.rightsWorkflow),
    grievanceLinked: t(f.grievanceLinked),
    childrenData: f.childrenData,
    crossBorder: f.crossBorder,
    aiProcessing: f.aiProcessing,
    highRiskDocuments: f.highRiskDocuments,
    evidenceNote: t(f.evidenceNote),
    lawfulBasis: t(f.lawfulBasis),
    childParentalConsent: f.childParentalConsent,
    childExemption: t(f.childExemption),
    childTracking: f.childTracking,
    retentionTrigger: t(f.retentionTrigger),
    retentionLaw: t(f.retentionLaw),
    safeguards: f.safeguards,
    riskRatingAssessor: t(f.riskRatingAssessor),
    riskRatingAssessorReason: f.riskRatingAssessor.trim() === "" ? null : t(f.riskRatingAssessorReason),
    lastReviewedAt: t(f.lastReviewedAt),
    nextReviewAt: t(f.nextReviewAt),
    systemIds: f.systemIds,
    vendorIds: f.vendorIds,
  };
}

/**
 * One processing record: the form, grouped the way the completeness areas
 * are, each saying whether it is complete and what it is worth; the risk and
 * the factors behind it; the lifecycle; links to the system and vendor
 * registers; and stored evidence.
 *
 * The preview beside the form is packages/core's own rule run in the browser;
 * the SAVED numbers are the database's, and only those are stored.
 */
export function RecordView({ recordId, draftId = null }: { recordId: string | null; draftId?: string | null }) {
  const toast = useToast();
  const router = useRouter();
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const can = (p: string) => permissions.kind === "ready" && (permissions.value.permissions as string[]).includes(p);
  const creating = recordId === null;

  const [payload, setPayload] = useState<RopaDetailPayload | null>(null);
  const [options, setOptions] = useState<RopaOptions | null>(null);
  const [templates, setTemplates] = useState<RopaTemplate[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>(ROPA_RECORD_TABS[0]!.id);
  /** Slice 11 Stage 2a: who accepted the AI draft this new record was pre-filled from (D-129). */
  const [fromDraft, setFromDraft] = useState<{ by: string | null } | "unavailable" | null>(null);
  const formId = useId();

  const load = useCallback(async () => {
    if (!organizationId) return;
    if (creating) {
      const r = await apiFetch<{ options: RopaOptions | null; templates: RopaTemplate[] }>(`/api/v1/organizations/${organizationId}/ropa`);
      if (r.success) {
        setOptions(r.data.options);
        setTemplates(r.data.templates);
      } else setError(r.error.message);
      // An accepted AI draft pre-fills the form — only the create form's own text fields, never a
      // rating or a status (D-061). Nothing is saved until the person saves.
      if (draftId) {
        const d = await apiFetch<{ draft: AiStoredDraft }>(`/api/v1/organizations/${organizationId}/ai/drafts/${draftId}`);
        const out = d.success && d.data.draft.task === "ropa_draft" && d.data.draft.status === "accepted" ? d.data.draft.acceptedOutput : null;
        if (!out) return setFromDraft("unavailable");
        const text = (k: string) => (typeof out[k] === "string" ? (out[k] as string) : "");
        const tri = (k: string): TriState => (out[k] === "yes" || out[k] === "no" ? out[k] : "unknown");
        setForm((f) => ({
          ...f,
          ...Object.fromEntries(AI_ROPA_TEXT_FIELDS.map((k) => [k, text(k)])),
          lawfulBasis: text("lawfulBasis"),
          childrenData: tri("childrenData"),
          crossBorder: tri("crossBorder"),
          aiProcessing: tri("aiProcessing"),
        }));
        setFromDraft({ by: d.success ? d.data.draft.decidedByName : null });
      }
      return;
    }
    const r = await apiFetch<RopaDetailPayload>(`/api/v1/organizations/${organizationId}/ropa/${recordId}`);
    if (!r.success) return setError(r.error.message);
    setPayload(r.data);
    setOptions(r.data.options ?? null);
    setForm(fromRecord(r.data.record));
  }, [organizationId, recordId, creating, draftId]);

  useEffect(() => {
    void load();
    apiFetch<{ user: { id: string } }>("/api/v1/auth/me").then((r) => {
      if (r.success) setCurrentUserId(r.data.user.id);
    });
  }, [load]);

  const record = payload?.record ?? null;
  const status: RopaStatus = record?.status ?? "draft";
  const editable = can("ropa.write") && (status === "draft" || status === "in_review");

  /** packages/core's rule, run on what the form holds now. */
  const preview = useMemo(() => {
    const facts = {
      name: form.name || null,
      departmentId: form.departmentId || null,
      departmentText: form.departmentText || null,
      ownerUserId: form.ownerUserId || null,
      dataPrincipalTypes: form.dataPrincipalTypes || null,
      dataCategories: form.dataCategories || null,
      estimatedDataPrincipals: form.estimatedDataPrincipals ? Number(form.estimatedDataPrincipals.replace(/[,\s]/g, "")) || null : null,
      purpose: form.purpose || null,
      legalBasisNote: form.legalBasisNote || null,
      collectionSource: form.collectionSource || null,
      systemsText: form.systemsText || null,
      systemLinkCount: form.systemIds.length,
      vendorsText: form.vendorsText || null,
      vendorLinkCount: form.vendorIds.length,
      noticeLinked: form.noticeLinked || null,
      consentLinked: form.consentLinked || null,
      retentionRule: form.retentionRule || null,
      securitySafeguards: form.securitySafeguards || null,
      childrenData: form.childrenData,
      crossBorder: form.crossBorder,
      aiProcessing: form.aiProcessing,
      highRiskDocuments: form.highRiskDocuments,
      evidenceCount: record?.evidence.length ?? 0,
      nextReviewAt: form.nextReviewAt || null,
      lawfulBasis: (form.lawfulBasis || null) as RopaLawfulBasis | null,
      childParentalConsent: form.childParentalConsent,
      childExemption: (form.childExemption || null) as RopaChildExemption | null,
      childTracking: form.childTracking,
      retentionTrigger: (form.retentionTrigger || null) as RopaRetentionTrigger | null,
      retentionLaw: form.retentionLaw || null,
      safeguards: form.safeguards,
      vendorContractGaps: record?.vendorContractGaps ?? 0,
    };
    return {
      completeness: ropaCompleteness(facts),
      risk: ropaRisk(facts, (form.riskRatingAssessor || null) as RopaRiskRating | null),
    };
  }, [form, record]);

  const set = <K extends keyof FormState>(key: K) => (value: FormState[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!organizationId) return;
    setSaveError(null);
    setBusy(true);
    const r = await apiFetch<RopaDetailPayload>(
      creating ? `/api/v1/organizations/${organizationId}/ropa` : `/api/v1/organizations/${organizationId}/ropa/${recordId}`,
      { method: creating ? "POST" : "PATCH", body: JSON.stringify(toBody(form, creating)) },
    );
    setBusy(false);
    if (!r.success) {
      const detail = r.error.details?.map((d) => (d.field ? `${d.field}: ${d.issue}` : d.issue)).join("; ");
      return setSaveError(detail ? `${r.error.message} (${detail})` : r.error.message);
    }
    if (creating) {
      toast.success("Processing activity created.", "Completeness and risk were calculated by the register.");
      return router.push(`/dashboard/ropa/${r.data.record.id}`);
    }
    setPayload((p) => ({ ...r.data, options: p?.options }));
    setForm(fromRecord(r.data.record));
    setSaved(true);
    toast.success("Saved.", "Completeness and risk were recalculated by the register.");
  }

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <div className="space-y-3">
        <Notice tone="error" testId="ropa-record-error">
          {error}
        </Notice>
        <Link href="/dashboard/ropa" className="text-sm text-indigo-700 hover:underline">
          Back to the register
        </Link>
      </div>
    );
  }
  if (!creating && !record) return <p className="text-sm text-slate-500">Loading the record…</p>;
  if (creating && !can("ropa.write")) {
    return <p className="text-sm text-slate-700">You do not have permission to add processing records.</p>;
  }

  const missingNow = new Set(preview.completeness.missing);
  const savedMissing = new Set(record?.areas.filter((a) => !a.complete).map((a) => a.code) ?? []);
  const dirty = record !== null && JSON.stringify(toBody(form, false)) !== JSON.stringify(toBody(fromRecord(record), false));

  /** One tab of the form (F3.2): its badge is the SAVED points the register returned (D-061); a new record has none, so it says what the tab is worth. */
  const recordTab = (id: string, content: ReactNode): TabDef => {
    const t = ROPA_RECORD_TABS.find((x) => x.id === id)!;
    const points = record ? ropaTabPoints(record.areas, t.areas) : null;
    return {
      id,
      label: t.label,
      badge: <span data-testid={`ropa-tab-points-${id}`}>{points ? `${points.got}/${points.of}` : `${ropaTabWeight(t.areas)} pts`}</span>,
      done: points !== null && points.got === points.of,
      attention: points !== null && points.got < points.of,
      content: (
        <fieldset disabled={!editable && !creating} className="space-y-4">
          {content}
        </fieldset>
      ),
    };
  };
  // F3.4: a new record is rated on its unknowns until they are answered — say so beside the rating.
  const unknownsRaise = creating && preview.risk.factors.some((f) => f.endsWith("_unknown"));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/ropa" className="text-xs text-indigo-700 hover:underline">
          ← Back to the register
        </Link>
        <h2 className="mt-1 text-lg font-semibold">
          {creating ? "New processing activity" : record!.name}
          {record && <span className="ml-2 text-sm font-normal text-slate-500">{record.recordCode}</span>}
        </h2>
        <p className="text-xs text-slate-600">{ROPA_POSITIONING}</p>
      </div>

      <section data-testid="ropa-record-summary" className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-600">Completeness{record && dirty ? " (if saved)" : ""}</p>
          <p className="text-2xl font-semibold">
            <span data-testid="ropa-record-score">{record && !dirty ? record.completenessScore : preview.completeness.score}</span>
            <span className="text-sm text-slate-500">/100</span>
          </p>
          <span
            data-testid="ropa-record-band"
            className={`rounded-full px-2 py-0.5 text-xs ${BAND_STYLE[record && !dirty ? record.completenessBand : preview.completeness.band]}`}
          >
            {ROPA_BANDS.find((b) => b.band === (record && !dirty ? record.completenessBand : preview.completeness.band))?.label}
          </span>
        </div>
        <div>
          <p className="text-xs text-slate-600">Risk{record && dirty ? " (if saved)" : ""}</p>
          <p className="mt-1">
            <span data-testid="ropa-record-risk" className={`rounded-full px-2 py-0.5 text-sm ${RISK_STYLE[record && !dirty ? record.risk.rating : preview.risk.rating]}`}>
              {ROPA_RISK_LABEL[record && !dirty ? record.risk.rating : preview.risk.rating]}
            </span>
          </p>
          {unknownsRaise && (
            <p data-testid="ropa-record-risk-unknowns" className="mt-1 text-xs text-amber-800">
              Risk: {ROPA_RISK_LABEL[preview.risk.rating]} until the unknowns are answered.
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Derived from the record ({(record && !dirty ? record.risk.points : preview.risk.points)} points)
            {(record && !dirty ? record.risk.assessor : preview.risk.assessor) ? "; raised by an assessor" : ""}.
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600">Status</p>
          <p data-testid="ropa-record-status" className="mt-1 text-sm font-medium">
            {ROPA_STATUS_LABEL[status]}
            {record && record.version > 1 ? ` · version ${record.version}` : ""}
          </p>
          {record?.approvedAt && (
            <p className="text-xs text-slate-500">
              Approved by {record.approvedByName ?? "a reviewer"} on {formatDueDate(record.approvedAt.slice(0, 10))}
            </p>
          )}
        </div>
      </section>

      {record && organizationId && (
        <Lifecycle
          organizationId={organizationId}
          record={record}
          currentUserId={currentUserId}
          canWrite={can("ropa.write")}
          canReview={can("evidence.review")}
          dirty={dirty}
          onChanged={load}
        />
      )}

      <form id={formId} onSubmit={save} className="space-y-4" data-testid="ropa-form">
        {!editable && !creating && (
          <p data-testid="ropa-readonly" className="rounded-md bg-slate-100 p-2 text-xs text-slate-700">
            {status === "approved"
              ? "This record is approved, so it is read-only. Reopen it to make changes — the next approval is a new version."
              : status === "archived"
                ? "This record is archived. Restore it to make changes."
                : "You can read this record but not change it."}
          </p>
        )}

        {creating && fromDraft === "unavailable" && (
          <Notice tone="warning" compact testId="ropa-from-draft-unavailable">
            That AI draft could not be used — it was not accepted, or it is not a processing record. Start from the form instead.
          </Notice>
        )}
        {creating && fromDraft && fromDraft !== "unavailable" && (
          <Notice tone="info" title="Pre-filled from an AI draft" testId="ropa-from-draft">
            Accepted{fromDraft.by ? ` by ${fromDraft.by}` : ""}. Check every field before you save — nothing is in the register until you do. The
            lawful basis is a note for counsel, not a legal opinion.
          </Notice>
        )}

        {creating && !fromDraft && templates.length > 0 && (
          <label className="block rounded-lg bg-indigo-50 p-3 text-xs text-indigo-900">
            Start from a common activity (a starting point — edit it to match what you actually do)
            <select
              data-testid="ropa-template"
              defaultValue=""
              onChange={(e) => {
                const t = templates[Number(e.target.value)];
                if (t) setForm((f) => ({ ...f, name: t.name, dataPrincipalTypes: t.dataPrincipalTypes, purpose: t.purpose }));
              }}
              className="mt-1 block w-full rounded-md border border-indigo-200 bg-white px-2 py-1 text-sm text-slate-900"
            >
              <option value="">— Choose a template —</option>
              {templates.map((t, i) => (
                <option key={t.name} value={i}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Slice 10.5 B3 (F3.2): the thirteen areas in five tabs. Every panel stays mounted (a half-filled tab
            survives a switch); one Save, below and sticky, saves every tab. */}
        <Tabs
          label="Parts of the record"
          testId="ropa-record-tabs"
          value={tab}
          onValueChange={setTab}
          tabs={[
            recordTab("who", <>
              <AreaSection code="identity" complete={!missingNow.has("identity")}>
                <Text label="Processing activity" testId="ropa-field-name" value={form.name} onChange={set("name")} required />
                <Text label="Description" testId="ropa-field-description" value={form.description} onChange={set("description")} multiline />
                {creating && (
                  <Text
                    label="Record ID (optional — ROPA-001 and so on is assigned if left blank)"
                    testId="ropa-field-recordCode"
                    value={form.recordCode}
                    onChange={set("recordCode")}
                  />
                )}
              </AreaSection>

              <AreaSection code="department_owner" complete={!missingNow.has("department_owner")}>
                <label className="block text-xs text-slate-700">
                  Department
                  <select
                    data-testid="ropa-field-departmentId"
                    value={form.departmentId}
                    onChange={(e) => set("departmentId")(e.target.value)}
                    className="mt-0.5 block w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  >
                    <option value="">— Not linked to a department —</option>
                    {options?.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Text label="Department, as your register names it" testId="ropa-field-departmentText" value={form.departmentText} onChange={set("departmentText")} />
                <label className="block text-xs text-slate-700">
                  Owner — the person accountable for this activity
                  <select
                    data-testid="ropa-field-ownerUserId"
                    value={form.ownerUserId}
                    onChange={(e) => set("ownerUserId")(e.target.value)}
                    className="mt-0.5 block w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  >
                    <option value="">— No owner —</option>
                    {(options?.members ?? []).map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName ?? "Unnamed member"} — {m.roleName}
                      </option>
                    ))}
                  </select>
                </label>
              </AreaSection>

              <AreaSection code="data_principals" complete={!missingNow.has("data_principals")}>
                <Text label="Whose personal data (e.g. applicants, parents)" testId="ropa-field-dataPrincipalTypes" value={form.dataPrincipalTypes} onChange={set("dataPrincipalTypes")} />
                <Text
                  label="About how many people (optional)"
                  testId="ropa-field-estimatedDataPrincipals"
                  value={form.estimatedDataPrincipals}
                  onChange={set("estimatedDataPrincipals")}
                />
                <Tri label="Children's data involved? (under 18)" testId="ropa-field-childrenData" value={form.childrenData} onChange={set("childrenData")} />
                {form.childrenData !== "no" && (
                  <div data-testid="ropa-children" className="space-y-2 rounded-md bg-amber-50 p-2">
                    <p className="text-xs text-amber-900">
                      A child's data needs verifiable consent of a parent first (s.9(1), Rule 10), and children may not be
                      tracked, behaviourally monitored or targeted with adverts (s.9(3)) — unless a Fourth Schedule
                      exemption applies, and then only within its conditions.
                    </p>
                    <label className="block text-xs text-slate-700">
                      Fourth Schedule exemption claimed
                      <select
                        data-testid="ropa-field-childExemption"
                        value={form.childExemption}
                        onChange={(e) => set("childExemption")(e.target.value)}
                        className="mt-0.5 block w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                      >
                        <option value="">— None —</option>
                        {ROPA_CHILD_EXEMPTIONS.map((x) => (
                          <option key={x.code} value={x.code}>
                            {x.label} ({x.part})
                          </option>
                        ))}
                      </select>
                    </label>
                    <Tri label="Verifiable parental consent obtained?" testId="ropa-field-childParentalConsent" value={form.childParentalConsent} onChange={set("childParentalConsent")} />
                    <Tri label="Any tracking, behavioural monitoring or targeted advertising of children?" testId="ropa-field-childTracking" value={form.childTracking} onChange={set("childTracking")} />
                  </div>
                )}
              </AreaSection>

              <AreaSection code="data_categories" complete={!missingNow.has("data_categories")}>
                <Text label="Personal data categories" testId="ropa-field-dataCategories" value={form.dataCategories} onChange={set("dataCategories")} multiline />
                <Tri label="Identity, financial or other high-risk documents?" testId="ropa-field-highRiskDocuments" value={form.highRiskDocuments} onChange={set("highRiskDocuments")} />
              </AreaSection>
            </>),
            recordTab("purpose", <>
              <AreaSection code="purpose_basis" complete={!missingNow.has("purpose_basis")}>
                <Text label="Purpose" testId="ropa-field-purpose" value={form.purpose} onChange={set("purpose")} multiline />
                <label className="block text-xs text-slate-700">
                  Lawful ground — consent, or a legitimate use (s.4, s.7)
                  <select
                    data-testid="ropa-field-lawfulBasis"
                    value={form.lawfulBasis}
                    onChange={(e) => set("lawfulBasis")(e.target.value)}
                    className="mt-0.5 block w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  >
                    <option value="">— Not decided yet —</option>
                    {ROPA_LAWFUL_BASES.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.label} ({b.section})
                      </option>
                    ))}
                  </select>
                </label>
                <Text
                  label="Note for counsel (the ground is the organisation's position, not a legal opinion)"
                  testId="ropa-field-legalBasisNote"
                  value={form.legalBasisNote}
                  onChange={set("legalBasisNote")}
                />
              </AreaSection>

              <AreaSection code="collection_source" complete={!missingNow.has("collection_source")}>
                <Text label="Where the data comes from" testId="ropa-field-collectionSource" value={form.collectionSource} onChange={set("collectionSource")} />
              </AreaSection>

              <AreaSection code="notice_consent" complete={!missingNow.has("notice_consent")}>
                <p data-testid="ropa-notice-consent-hint" className="text-xs text-slate-600">
                  {form.lawfulBasis === ""
                    ? "Until the lawful ground is decided, both are treated as needed."
                    : `For this ground: a notice is ${noticeRequired(form.lawfulBasis as RopaLawfulBasis) ? "needed" : "not required (good practice)"}; consent is ${consentRequired(form.lawfulBasis as RopaLawfulBasis) ? "needed" : "not the basis"}.`}
                </p>
                <Text label="Notice that covers it (itemising the data and the purpose)" testId="ropa-field-noticeLinked" value={form.noticeLinked} onChange={set("noticeLinked")} />
                <Text label="How consent is captured — and withdrawn as easily" testId="ropa-field-consentLinked" value={form.consentLinked} onChange={set("consentLinked")} />
              </AreaSection>

              <fieldset className="rounded-lg border border-slate-200 p-3">
                <legend className="px-1 text-sm font-semibold">Other details (not scored)</legend>
                <div className="space-y-2">
                  <Text label="Rights workflow" testId="ropa-field-rightsWorkflow" value={form.rightsWorkflow} onChange={set("rightsWorkflow")} />
                  <Text label="Grievance channel" testId="ropa-field-grievanceLinked" value={form.grievanceLinked} onChange={set("grievanceLinked")} />
                </div>
              </fieldset>
            </>),
            recordTab("systems", <>
              <AreaSection code="systems" complete={!missingNow.has("systems")}>
                <Text label="Systems, as your register names them" testId="ropa-field-systemsText" value={form.systemsText} onChange={set("systemsText")} />
                <Picker label="Linked to the system register" testId="ropa-field-systemIds" items={options?.systems ?? record?.systems ?? []} chosen={form.systemIds} onChange={set("systemIds")} />
              </AreaSection>

              <AreaSection code="vendors" complete={!missingNow.has("vendors")}>
                <Text label='Data Processors involved — or "None"' testId="ropa-field-vendorsText" value={form.vendorsText} onChange={set("vendorsText")} />
                <Picker label="Linked to the vendor register" testId="ropa-field-vendorIds" items={options?.vendors ?? record?.vendors ?? []} chosen={form.vendorIds} onChange={set("vendorIds")} />
                <Tri label="Is the data stored or sent outside India?" testId="ropa-field-crossBorder" value={form.crossBorder} onChange={set("crossBorder")} />
                {record && record.vendorContractGaps > 0 && (
                  <Notice tone="error" compact testId="ropa-contract-gaps">
                    {record.vendorContractGaps} linked Data Processor{record.vendorContractGaps === 1 ? " has" : "s have"} no contract or
                    no DPDP clauses in the vendor register. A processor may act only under a valid contract (s.8(2)).
                  </Notice>
                )}
              </AreaSection>

              <fieldset className="rounded-lg border border-slate-200 p-3">
                <legend className="px-1 text-sm font-semibold">Other details (not scored)</legend>
                <div className="space-y-2">
                  <Text label="Sharing and disclosure" testId="ropa-field-sharing" value={form.sharing} onChange={set("sharing")} />
                </div>
              </fieldset>
            </>),
            recordTab("retention", <>
              <AreaSection code="retention" complete={!missingNow.has("retention")}>
                <Text label="How long it is kept" testId="ropa-field-retentionRule" value={form.retentionRule} onChange={set("retentionRule")} />
                <label className="block text-xs text-slate-700">
                  What ends it (s.8(7), Rule 8)
                  <select
                    data-testid="ropa-field-retentionTrigger"
                    value={form.retentionTrigger}
                    onChange={(e) => set("retentionTrigger")(e.target.value)}
                    className="mt-0.5 block w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  >
                    <option value="">— Not decided yet —</option>
                    {ROPA_RETENTION_TRIGGERS.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                {form.retentionTrigger === "law_requires" && (
                  <Text label="Which law requires keeping it (e.g. Income-tax Act, 1961 — 8 years)" testId="ropa-field-retentionLaw" value={form.retentionLaw} onChange={set("retentionLaw")} />
                )}
              </AreaSection>

              <AreaSection code="security" complete={!missingNow.has("security")}>
                <div data-testid="ropa-field-safeguards" className="text-xs text-slate-700">
                  Rule 6 minimum safeguards in place — tick what is true today
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    {ROPA_SAFEGUARDS.map((g) => (
                      <label key={g.code} className="flex items-start gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">
                        <input
                          type="checkbox"
                          data-testid={`ropa-safeguard-${g.code}`}
                          checked={form.safeguards.includes(g.code)}
                          onChange={(e) =>
                            set("safeguards")(e.target.checked ? [...form.safeguards, g.code] : form.safeguards.filter((x) => x !== g.code))
                          }
                        />
                        <span>
                          {g.label} <span className="text-slate-500">({g.clause})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-slate-500">6(1)(f), the processor contract clause, is read from the vendor register.</p>
                </div>
                <Text label="Other safeguards or details" testId="ropa-field-securitySafeguards" value={form.securitySafeguards} onChange={set("securitySafeguards")} />
                <Tri label="AI or automated processing?" testId="ropa-field-aiProcessing" value={form.aiProcessing} onChange={set("aiProcessing")} />
              </AreaSection>

              <AreaSection code="risk_review" complete={!missingNow.has("risk_review")}>
                <label className="block text-xs text-slate-700">
                  Next review
                  <input
                    type="date"
                    data-testid="ropa-field-nextReviewAt"
                    value={form.nextReviewAt}
                    onChange={(e) => set("nextReviewAt")(e.target.value)}
                    className="mt-0.5 block rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  />
                </label>
                <label className="block text-xs text-slate-700">
                  Last reviewed
                  <input
                    type="date"
                    data-testid="ropa-field-lastReviewedAt"
                    value={form.lastReviewedAt}
                    onChange={(e) => set("lastReviewedAt")(e.target.value)}
                    className="mt-0.5 block rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  />
                </label>
                <label className="block text-xs text-slate-700">
                  Assessor's rating — may raise the derived rating, never lower it
                  <select
                    data-testid="ropa-field-riskRatingAssessor"
                    value={form.riskRatingAssessor}
                    onChange={(e) => set("riskRatingAssessor")(e.target.value)}
                    className="mt-0.5 block rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  >
                    <option value="">— Use the derived rating —</option>
                    {ROPA_RISK_RATINGS.map((r) => (
                      <option key={r} value={r}>
                        {ROPA_RISK_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </label>
                {form.riskRatingAssessor !== "" && (
                  <Text
                    label="Why the rating is raised (kept with the rating, and shown in exports)"
                    testId="ropa-field-riskRatingAssessorReason"
                    value={form.riskRatingAssessorReason}
                    onChange={set("riskRatingAssessorReason")}
                    required
                  />
                )}
                <div data-testid="ropa-risk-factors" className="text-xs text-slate-700">
                  <p className="font-semibold">
                    Why it is rated {ROPA_RISK_LABEL[preview.risk.derived]}
                    {record ? <span className="font-normal text-slate-500"> · risk model {record.risk.modelVersion}</span> : null}:
                  </p>
                  {preview.risk.factors.length === 0 ? (
                    <p>No risk factor applies.</p>
                  ) : (
                    <ul className="list-inside list-disc">
                      {preview.risk.factors.map((code) => {
                        const f = ROPA_RISK_FACTORS.find((x) => x.code === code)!;
                        return (
                          <li key={code}>
                            {f.label} (+{f.points})
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </AreaSection>
            </>),
            recordTab("evidence", <>
              <AreaSection code="evidence" complete={!missingNow.has("evidence")}>
                <Text
                  label="Evidence that exists (description)"
                  testId="ropa-field-evidenceNote"
                  value={form.evidenceNote}
                  onChange={set("evidenceNote")}
                />
                <p className="text-xs text-slate-500">
                  This area is complete when a stored file is attached{creating ? " — save the record first, then attach it" : " below"}.
                  A description alone does not count.
                </p>
              </AreaSection>
            </>),
          ]}
        />
      </form>

      {record && organizationId && (
        // The stored files belong to the Evidence tab, outside the record's form (a form may not hold another).
        <div hidden={tab !== "evidence"} data-testid="ropa-evidence-tab">
          <RecordEvidence
            organizationId={organizationId}
            record={record}
            currentUserId={currentUserId}
            canWrite={can("ropa.write") && can("evidence.write")}
            onChanged={load}
          />
        </div>
      )}

        {(editable || creating) && (
          <div data-testid="ropa-save-bar" className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white py-3">
            <button
              type="submit"
              form={formId}
              data-testid="ropa-save"
              disabled={busy || form.name.trim() === ""}
              className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {busy ? "Saving…" : creating ? "Create the record" : "Save changes"}
            </button>
            {saved && (
              <Notice tone="success" compact testId="ropa-saved">
                Saved. Completeness and risk were recalculated by the register.
              </Notice>
            )}
            {saveError && (
              <Notice tone="error" compact testId="ropa-save-error" className="w-full">
                {saveError}
              </Notice>
            )}
          </div>
        )}

      {record && payload && payload.gaps.length > 0 && (
        <section data-testid="ropa-record-gaps" className="space-y-2 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold">Gaps on this record</h3>
          <ul className="space-y-1 text-sm">
            {payload.gaps
              .filter((g) => g.state === "open")
              .map((g) => (
                <li key={g.id} className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${SEVERITY_STYLE[g.severity] ?? ""}`}>{GAP_SEVERITY_LABEL[g.severity]}</span>
                  {g.label} — {g.recommendedFix}
                </li>
              ))}
          </ul>
          <Link href="/dashboard/ropa/gaps" className="text-xs text-indigo-700 hover:underline">
            Assign and track the actions
          </Link>
        </section>
      )}
      {record && savedMissing.size > 0 && (
        <p className="text-xs text-slate-500">
          {savedMissing.size} area{savedMissing.size === 1 ? " is" : "s are"} still missing. Gaps are refreshed from the
          register on the gaps page.
        </p>
      )}
    </div>
  );
}

function Text({
  label,
  testId,
  value,
  onChange,
  multiline,
  required,
}: {
  label: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  const cls = "mt-0.5 block w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:bg-slate-50";
  return (
    <label className="block text-xs text-slate-700">
      {label}
      {multiline ? (
        <textarea data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} rows={2} maxLength={2000} className={cls} />
      ) : (
        <input data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} required={required} maxLength={2000} className={cls} />
      )}
    </label>
  );
}

function Tri({ label, testId, value, onChange }: { label: string; testId: string; value: TriState; onChange: (v: TriState) => void }) {
  return (
    <label className="block text-xs text-slate-700">
      {label}
      <select
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value as TriState)}
        className="mt-0.5 block rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        {(["yes", "no", "unknown"] as const).map((t) => (
          <option key={t} value={t}>
            {TRI_LABEL[t]}
          </option>
        ))}
      </select>
      {value === "unknown" && <span className="ml-2 text-amber-800">Not known counts as a risk until it is answered.</span>}
    </label>
  );
}

function Picker({
  label,
  testId,
  items,
  chosen,
  onChange,
}: {
  label: string;
  testId: string;
  items: { id: string; name: string }[];
  chosen: string[];
  onChange: (ids: string[]) => void;
}) {
  if (items.length === 0) return <p className="text-xs text-slate-500">{label}: nothing in the register yet.</p>;
  return (
    <div data-testid={testId} className="text-xs text-slate-700">
      {label}
      <div className="mt-1 flex flex-wrap gap-2">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">
            <input
              type="checkbox"
              checked={chosen.includes(item.id)}
              onChange={(e) => onChange(e.target.checked ? [...chosen, item.id] : chosen.filter((x) => x !== item.id))}
            />
            {item.name}
          </label>
        ))}
      </div>
    </div>
  );
}

function Lifecycle({
  organizationId,
  record,
  currentUserId,
  canWrite,
  canReview,
  dirty,
  onChanged,
}: {
  organizationId: string;
  record: RopaRecord;
  currentUserId: string | null;
  canWrite: boolean;
  canReview: boolean;
  dirty: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!canWrite) return null;

  async function move(status: RopaStatus | "archive") {
    setError(null);
    setBusy(true);
    const url = `/api/v1/organizations/${organizationId}/ropa/${record.id}`;
    const r =
      status === "archive"
        ? await apiFetch(url, { method: "DELETE" })
        : await apiFetch(url, { method: "PATCH", body: JSON.stringify({ status }) });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    await onChanged();
  }

  const isOwner = record.ownerUserId !== null && record.ownerUserId === currentUserId;
  const button = (label: string, status: RopaStatus | "archive", testId: string, primary = false) => (
    <button
      type="button"
      data-testid={testId}
      onClick={() => move(status)}
      disabled={busy || dirty}
      className={
        primary
          ? "rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
          : "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50"
      }
    >
      {label}
    </button>
  );

  return (
    <section data-testid="ropa-lifecycle" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap gap-2">
        {record.status === "draft" && button("Submit for review", "in_review", "ropa-submit", true)}
        {record.status === "in_review" && (
          <>
            {canReview && button("Approve", "approved", "ropa-approve", true)}
            {button("Send back to draft", "draft", "ropa-send-back")}
          </>
        )}
        {record.status === "approved" && button("Reopen to correct it", "draft", "ropa-reopen")}
        {record.status === "archived" && button("Restore", "draft", "ropa-restore")}
        {record.status !== "archived" && button("Archive", "archive", "ropa-archive")}
      </div>
      {record.status === "in_review" && (
        <p className="text-xs text-slate-600">
          Approval needs a reviewer who is not the record's owner, and a record that is at least Usable ({ROPA_APPROVAL_MIN_SCORE}/100).
          {isOwner && canReview ? " You own this record, so another reviewer must approve it." : ""}
        </p>
      )}
      {dirty && <p className="text-xs text-amber-800">Save or discard your changes before moving the record on.</p>}
      {error && (
        <Notice tone="error" compact testId="ropa-lifecycle-error">
          {error}
        </Notice>
      )}
    </section>
  );
}

function RecordEvidence({
  organizationId,
  record,
  currentUserId,
  canWrite,
  onChanged,
}: {
  organizationId: string;
  record: RopaRecord;
  currentUserId: string | null;
  canWrite: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attachable = canWrite && record.status !== "archived";
  const detachable = canWrite && record.status !== "approved";

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
      // Linked to the RECORD: it completes the evidence area and never moves any answer's score.
      const linked = await apiFetch(`/api/v1/organizations/${organizationId}/evidence/${issued.data.evidence.id}/link`, {
        method: "POST",
        body: JSON.stringify({ ropaRecordId: record.id }),
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
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/ropa/${record.id}/evidence/${evidenceId}`, { method: "DELETE" });
    if (!r.success) return setError(r.error.message);
    await onChanged();
  }

  async function download(evidenceId: string) {
    const r = await apiFetch<{ url: string }>(`/api/v1/organizations/${organizationId}/evidence/${evidenceId}/download-url`);
    if (!r.success) return setError(r.error.message);
    window.open(r.data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <section data-testid="ropa-evidence" className="space-y-2 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold">Stored evidence</h3>
      {record.evidence.length === 0 ? (
        <p className="text-xs text-slate-600">Nothing attached yet. A ROPA export or a data-flow diagram is good evidence here.</p>
      ) : (
        <PagedList
          items={record.evidence}
          testId="ropa-evidence-list"
          renderItem={(e) => (
            <li key={e.id} data-testid={`ropa-evidence-${e.id}`} className="rounded-md border border-slate-200 bg-white p-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono">{e.fileName}</span>
                <span>{REVIEW_STATUS_LABEL[e.reviewStatus] ?? e.reviewStatus}</span>
                <Can permission="evidence.read">
                  <button type="button" onClick={() => download(e.id)} className="text-indigo-700 hover:underline">
                    Download
                  </button>
                </Can>
                {detachable && (
                  <button type="button" data-testid={`ropa-detach-${e.id}`} onClick={() => detach(e.id)} className="text-slate-600 hover:underline">
                    Detach
                  </button>
                )}
              </div>
              <Can permission="evidence.review">
                {e.uploadedBy !== null && e.uploadedBy === currentUserId ? (
                  <p className="mt-1 text-slate-600">You uploaded this file, so another reviewer must review it.</p>
                ) : (
                  <ReviewForm organizationId={organizationId} evidence={e} onReviewed={onChanged} />
                )}
              </Can>
            </li>
          )}
        />
      )}
      {attachable && (
        <form onSubmit={attach} className="flex flex-wrap items-center gap-2 text-xs">
          <input type="file" data-testid="ropa-evidence-file" accept={EVIDENCE_CONTENT_TYPES.join(",")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button
            type="submit"
            data-testid="ropa-attach-evidence"
            disabled={busy || !file}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 hover:bg-slate-100 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Attach evidence"}
          </button>
        </form>
      )}
      {error && (
        <Notice tone="error" compact testId="ropa-evidence-error">
          {error}
        </Notice>
      )}
    </section>
  );
}

/** One completeness area of the form: whether it is complete, and what it is worth. Module-level so inputs keep focus. */
function AreaSection({ code, complete, children }: { code: RopaAreaCode; complete: boolean; children: ReactNode }) {
  const a = ROPA_COMPLETENESS_AREAS.find((x) => x.code === code)!;
  return (
    <fieldset data-testid={`ropa-area-${code}`} data-complete={complete} className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-sm font-semibold">
        {a.label}{" "}
        <span
          data-testid={`ropa-area-state-${code}`}
          className={`ml-1 rounded-full px-2 py-0.5 text-xs font-normal ${complete ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}
        >
          {complete ? `Complete · ${a.weight} pts` : `Missing · worth ${a.weight} pts`}
        </span>
      </legend>
      <p className="mb-2 text-xs text-slate-500">{a.rule}</p>
      <div className="space-y-2">{children}</div>
    </fieldset>
  );
}
