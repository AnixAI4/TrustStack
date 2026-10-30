"use client";

import {
  AI_USAGE_TYPES,
  DATA_LOCATIONS,
  DATA_PRINCIPAL_CODES,
  HOSTING_MODELS,
  SYSTEM_TYPES,
  VENDOR_ROLES,
  type ScopeAnswers,
  type TriState,
} from "@truststack/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { apiFetch } from "@/lib/client/api";
import { Can, usePermissions } from "@/lib/client/permissions";
import type { AssessmentSummary, GenerationSummary } from "@/lib/client/assessments";

/**
 * The scope wizard. Every step reads and writes through the API; nothing is
 * derived in the browser — risk tags and packs come from the server (core).
 * Registers save per row; the two answer steps save when you press Next
 * (Slice 10.5 B1, F1.11 — one primary button, the same PUT the old "Save
 * answers" made). A failed save keeps the step. Resumable by design.
 */

type Item = Record<string, unknown> & { id: string };

interface ScopeResponse {
  industryCode: string | null;
  dataPrincipalCountEstimate: number | null;
  answers: ScopeAnswers;
  saved: boolean;
  storedRiskTags: string[];
  derivedAt: string | null;
  preview: Preview;
}

interface Preview {
  industryCode: string | null;
  profile: {
    dataProcessorCount: number;
    vendorDependency: string;
    dataPrincipalCount: number;
    processingScale: string;
    largeScaleNotice: string | null;
    enhancedReview: { required: boolean; triggers: string[] };
  };
  riskTags: { tag: string; reasons: string[] }[];
  /** Anix staff only (D-071). */
  questionPacks?: string[];
  stale: boolean;
}

const STEPS = ["Industry & scale", "Data Principals", "Departments", "Systems", "Vendors", "Risk questions", "Preview"] as const;

const ENHANCED_REVIEW_LABELS: Record<string, string> = {
  children_data: "children’s data",
  sensitive_documents: "identity, financial or health documents",
  biometric_data: "biometric data",
  ai_profiling: "AI profiling, scoring or proctoring",
  high_vendor_dependency: "high vendor dependency",
  cross_border_unknown: "unknown cross-border processing",
};

const label = (value: string) => value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const inputCls = "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50";

export function ScopeWizard() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canWrite = permissions.kind === "ready" && permissions.value.permissions.includes("scope.write");
  const [step, setStep] = useState(0);
  const [scope, setScope] = useState<ScopeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // The answer step on screen registers its save here; Next calls it before moving on.
  const saveStep = useRef<(() => Promise<boolean>) | null>(null);

  const loadScope = useCallback(async () => {
    if (!organizationId) return;
    const r = await apiFetch<ScopeResponse>(`/api/v1/organizations/${organizationId}/scope`);
    if (r.success) setScope(r.data);
    else setError(r.error.message);
  }, [organizationId]);

  useEffect(() => {
    if (permissions.kind === "error") setError(permissions.message);
    void loadScope();
  }, [permissions, loadScope]);

  if (error) return <Notice tone="error" testId="scope-error">{error}</Notice>;
  if (!organizationId || !scope) return <p className="text-sm text-slate-500">Loading scope…</p>;

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        {/* The top bar already says "Scope" (F1.6). */}
        <p className="text-sm text-slate-600">
          Describe how this organisation actually processes personal data. Risk tags and question packs are derived from
          your answers — answer <strong>Unknown</strong> rather than guessing; unknown is treated as a risk.
        </p>
        {!canWrite && (
          <p data-testid="scope-readonly" className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Read-only: editing the scope needs the DPDP Programme Owner, Organisation Admin or consultant role.
          </p>
        )}
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Steps">
        {STEPS.map((name, i) => (
          <li key={name}>
            <button
              type="button"
              data-testid={`step-${i + 1}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
              className={`rounded-full border px-3 py-1 text-xs ${i === step ? "border-indigo-700 bg-indigo-700 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}
            >
              {i + 1}. {name}
            </button>
          </li>
        ))}
      </ol>

      <div className="border-t border-slate-100 pt-4">
        {step === 0 && (
          <AnswersStep organizationId={organizationId} scope={scope} canWrite={canWrite} part="industry" onSaved={setScope} register={saveStep} />
        )}
        {step === 1 && (
          <RegisterStep
            organizationId={organizationId}
            segment="data-principal-types"
            title="Data Principal types"
            canWrite={canWrite}
            fields={[
              { key: "code", label: "Type", kind: "select", options: DATA_PRINCIPAL_CODES },
              { key: "label", label: "Label", kind: "text" },
              { key: "includesChildren", label: "Includes under-18s?", kind: "tri" },
              { key: "estimatedCount", label: "Approx. count", kind: "number" },
            ]}
            summary={(i) => `${i.label} · ${label(String(i.code))} · under-18s: ${i.includesChildren}${i.estimatedCount != null ? ` · ~${Number(i.estimatedCount).toLocaleString("en-IN")}` : ""}`}
          />
        )}
        {step === 2 && (
          <RegisterStep
            organizationId={organizationId}
            segment="departments"
            title="Departments"
            canWrite={canWrite}
            fields={[{ key: "name", label: "Department name", kind: "text" }]}
            summary={(i) => String(i.name)}
          />
        )}
        {step === 3 && <SystemsStep organizationId={organizationId} canWrite={canWrite} />}
        {step === 4 && <VendorsStep organizationId={organizationId} canWrite={canWrite} />}
        {step === 5 && (
          <AnswersStep organizationId={organizationId} scope={scope} canWrite={canWrite} part="risk" onSaved={setScope} register={saveStep} />
        )}
        {step === 6 && <PreviewStep organizationId={organizationId} />}
      </div>

      <div className="flex justify-between border-t border-slate-100 pt-4">
        <button
          type="button"
          data-testid="step-back"
          disabled={step === 0 || saving}
          onClick={() => setStep(step - 1)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          data-testid="step-next"
          disabled={step === STEPS.length - 1 || saving}
          onClick={async () => {
            // An answer step saves first (only for someone who may write); a failed save stays on the step.
            const save = saveStep.current;
            if (canWrite && save) {
              setSaving(true);
              const saved = await save();
              setSaving(false);
              if (!saved) return;
            }
            saveStep.current = null;
            if (step === 5) void loadScope();
            setStep(step + 1);
          }}
          className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : "Next"}
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function TriRadio({ name, value, onChange, disabled }: { name: string; value: TriState; onChange: (v: TriState) => void; disabled: boolean }) {
  return (
    <div role="radiogroup" className="flex gap-3 text-sm">
      {(["yes", "no", "unknown"] as const).map((v) => (
        <label key={v} className="flex items-center gap-1">
          <input type="radio" name={name} value={v} checked={value === v} disabled={disabled} onChange={() => onChange(v)} />
          {label(v)}
        </label>
      ))}
    </div>
  );
}

function AnswersStep({
  organizationId,
  scope,
  canWrite,
  part,
  onSaved,
  register,
}: {
  organizationId: string;
  scope: ScopeResponse;
  canWrite: boolean;
  part: "industry" | "risk";
  onSaved: (s: ScopeResponse) => void;
  /** The wizard's Next calls this step's save (F1.11). */
  register: { current: (() => Promise<boolean>) | null };
}) {
  const toast = useToast();
  const [industries, setIndustries] = useState<{ code: string; name: string }[]>([]);
  const [industryCode, setIndustryCode] = useState(scope.industryCode ?? "general");
  const [count, setCount] = useState<number | null>(scope.dataPrincipalCountEstimate);
  const [answers, setAnswers] = useState<ScopeAnswers>(scope.answers);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiFetch<{ industries: { code: string; name: string }[] }>("/api/v1/industries").then((r) => {
      if (r.success) setIndustries(r.data.industries);
    });
  }, []);

  async function save(): Promise<boolean> {
    setMessage(null);
    const r = await apiFetch<ScopeResponse>(`/api/v1/organizations/${organizationId}/scope`, {
      method: "PUT",
      body: JSON.stringify({ industryCode, dataPrincipalCountEstimate: count, answers }),
    });
    if (r.success) {
      onSaved(r.data);
      toast.success("Scope answers saved.", `Risk tags: ${r.data.storedRiskTags.map(label).join(", ") || "none"}.`);
      return true;
    }
    setMessage({ ok: false, text: r.error.message });
    return false;
  }

  // Next saves whatever is on screen now: re-register on every render, so the latest answers go.
  useEffect(() => {
    register.current = save;
  });
  // A step that is no longer on screen has nothing for Next to save.
  useEffect(
    () => () => {
      register.current = null;
    },
    [register],
  );

  const tri = (key: keyof ScopeAnswers, question: string) => (
    <div className="space-y-1">
      <p className="text-sm font-medium">{question}</p>
      <TriRadio
        name={key}
        value={answers[key] as TriState}
        disabled={!canWrite}
        onChange={(v) => setAnswers({ ...answers, [key]: v })}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {part === "industry" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">
            Primary industry
            <select data-testid="industry-select" className={inputCls} disabled={!canWrite} value={industryCode} onChange={(e) => setIndustryCode(e.target.value)}>
              {industries.map((i) => (
                <option key={i.code} value={i.code}>{i.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium">
            Approx. number of Data Principals (all types)
            <input
              className={inputCls}
              type="number"
              min={0}
              disabled={!canWrite}
              value={count ?? ""}
              onChange={(e) => setCount(e.target.value === "" ? null : Number(e.target.value))}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {tri("childrenData", "Does the organisation process personal data of children (under 18)?")}
          {tri(
            "guardianData",
            "Does the organisation process personal data of persons with disability who have a lawful guardian?",
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium">Is AI or automated analytics used on personal data? (select all that apply)</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {AI_USAGE_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    disabled={!canWrite}
                    checked={answers.aiUsageTypes.includes(t)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? t === "none"
                          ? ["none" as const]
                          : [...answers.aiUsageTypes.filter((x) => x !== "none"), t]
                        : answers.aiUsageTypes.filter((x) => x !== t);
                      setAnswers({ ...answers, aiUsageTypes: next });
                    }}
                  />
                  {label(t)}
                </label>
              ))}
            </div>
          </div>
          {tri("crossBorder", "Is personal data transferred or processed outside India?")}
          {tri("marketingTracking", "Are cookies, marketing tools or profiling used?")}
          {tri("publicFacingPortal", "Does a public website or app collect personal data?")}
          {tri("sensitiveDocuments", "Are identity, academic, financial or health documents collected?")}
          {tri(
            "usesDataProcessors",
            "Does the organisation use any Data Processors — vendors, SaaS tools, cloud, payroll, email or support providers that handle personal data on your behalf?",
          )}
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              disabled={!canWrite}
              checked={answers.multiLocation}
              onChange={(e) => setAnswers({ ...answers, multiLocation: e.target.checked })}
            />
            Multiple campuses, branches or subsidiaries
          </label>
        </div>
      )}
      {message && (
        <Notice tone={message.ok ? "success" : "error"} testId="answers-message">
          {message.text}
        </Notice>
      )}
      {canWrite && <p className="text-xs text-slate-500">Next saves these answers.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------

type Field =
  | { key: string; label: string; kind: "text" | "number" | "tri" }
  | { key: string; label: string; kind: "select"; options: readonly string[]; optionLabels?: Record<string, string>; allowEmpty?: boolean }
  | { key: string; label: string; kind: "multi"; options: { value: string; label: string }[] };

function defaultsFor(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(
    fields.map((f) => [
      f.key,
      f.kind === "tri" ? "unknown" : f.kind === "number" ? null : f.kind === "multi" ? [] : f.kind === "select" ? (f.allowEmpty ? null : f.options[0]) : "",
    ]),
  );
}

function RegisterStep({
  organizationId,
  segment,
  title,
  fields,
  summary,
  canWrite,
}: {
  organizationId: string;
  segment: string;
  title: string;
  fields: Field[];
  summary: (item: Item) => string;
  canWrite: boolean;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>(defaultsFor(fields));
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await apiFetch<{ items: Item[] }>(`/api/v1/organizations/${organizationId}/${segment}`);
    if (r.success) setItems(r.data.items);
    else setMessage(r.error.message);
  }, [organizationId, segment]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/${segment}`, { method: "POST", body: JSON.stringify(draft) });
    if (r.success) {
      setDraft(defaultsFor(fields));
      await load();
    } else setMessage(r.error.message);
  }

  async function remove(id: string) {
    setMessage(null);
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/${segment}/${id}`, { method: "DELETE" });
    if (!r.success) setMessage(r.error.message);
    await load();
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">{title}</h3>
      {items === null ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p data-testid={`${segment}-empty`} className="text-sm text-slate-500">None recorded yet.</p>
      ) : (
        <ul data-testid={`${segment}-list`} className="divide-y divide-slate-100 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <span>{summary(item)}</span>
              {canWrite && (
                <button type="button" aria-label={`Remove ${summary(item)}`} onClick={() => remove(item.id)} className="text-xs text-red-700 hover:underline">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {message && <Notice tone="error" testId={`${segment}-message`}>{message}</Notice>}
      {canWrite && (
        <form onSubmit={add} data-testid={`${segment}-form`} className="space-y-3 rounded-lg bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1 text-sm">
                <p className="font-medium">{f.label}</p>
                {f.kind === "text" && (
                  <input aria-label={f.label} required className={inputCls} value={String(draft[f.key] ?? "")} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
                )}
                {f.kind === "number" && (
                  <input
                    aria-label={f.label}
                    type="number"
                    min={0}
                    className={inputCls}
                    value={draft[f.key] == null ? "" : String(draft[f.key])}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                )}
                {f.kind === "tri" && (
                  <TriRadio name={`${segment}-${f.key}`} value={draft[f.key] as TriState} disabled={false} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />
                )}
                {f.kind === "select" && (
                  <select
                    aria-label={f.label}
                    className={inputCls}
                    value={draft[f.key] == null ? "" : String(draft[f.key])}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value === "" ? null : e.target.value })}
                  >
                    {f.allowEmpty && <option value="">—</option>}
                    {f.options.map((o) => (
                      <option key={o} value={o}>{f.optionLabels?.[o] ?? label(o)}</option>
                    ))}
                  </select>
                )}
                {f.kind === "multi" && (
                  <div className="flex flex-wrap gap-3">
                    {f.options.length === 0 && <span className="text-slate-500">None available</span>}
                    {f.options.map((o) => {
                      const selected = (draft[f.key] as string[]).includes(o.value);
                      return (
                        <label key={o.value} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setDraft({
                                ...draft,
                                [f.key]: selected ? (draft[f.key] as string[]).filter((x) => x !== o.value) : [...(draft[f.key] as string[]), o.value],
                              })
                            }
                          />
                          {o.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button type="submit" data-testid={`${segment}-add`} className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white">
            Add
          </button>
        </form>
      )}
    </div>
  );
}

function useOptions(organizationId: string, segment: string, labelKey: string) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    apiFetch<{ items: Item[] }>(`/api/v1/organizations/${organizationId}/${segment}`).then((r) => {
      if (r.success) setOptions(r.data.items.map((i) => ({ value: i.id, label: String(i[labelKey]) })));
    });
  }, [organizationId, segment, labelKey]);
  return options;
}

function SystemsStep({ organizationId, canWrite }: { organizationId: string; canWrite: boolean }) {
  const departments = useOptions(organizationId, "departments", "name");
  const deptName = Object.fromEntries(departments.map((d) => [d.value, d.label]));
  return (
    <RegisterStep
      organizationId={organizationId}
      segment="systems"
      title="Systems that hold personal data"
      canWrite={canWrite}
      fields={[
        { key: "name", label: "System name", kind: "text" },
        { key: "systemType", label: "Type", kind: "select", options: SYSTEM_TYPES },
        { key: "hostingModel", label: "Hosting", kind: "select", options: HOSTING_MODELS },
        { key: "dataLocation", label: "Data location", kind: "select", options: DATA_LOCATIONS },
        { key: "processesChildrenData", label: "Processes children's data?", kind: "tri" },
        { key: "ownerDepartmentId", label: "Owning department", kind: "select", options: departments.map((d) => d.value), optionLabels: deptName, allowEmpty: true },
      ]}
      summary={(i) =>
        `${i.name} · ${label(String(i.systemType))} · ${label(String(i.hostingModel))} · data in ${label(String(i.dataLocation))}${i.ownerDepartmentId ? ` · ${deptName[String(i.ownerDepartmentId)] ?? ""}` : ""}`
      }
    />
  );
}

function VendorsStep({ organizationId, canWrite }: { organizationId: string; canWrite: boolean }) {
  const systems = useOptions(organizationId, "systems", "name");
  return (
    <RegisterStep
      organizationId={organizationId}
      segment="vendors"
      title="Vendors and Data Processors"
      canWrite={canWrite}
      fields={[
        { key: "name", label: "Vendor name", kind: "text" },
        { key: "vendorRole", label: "Role", kind: "select", options: VENDOR_ROLES },
        { key: "contractExists", label: "Contract in place?", kind: "tri" },
        { key: "dpdpClauses", label: "DPDP clauses in contract?", kind: "tri" },
        { key: "crossBorder", label: "Processes data outside India?", kind: "tri" },
        { key: "subProcessorsKnown", label: "Sub-processors known?", kind: "tri" },
        { key: "systemIds", label: "Systems it touches", kind: "multi", options: systems },
      ]}
      summary={(i) => `${i.name} · ${label(String(i.vendorRole))} · DPDP clauses: ${i.dpdpClauses} · cross-border: ${i.crossBorder}`}
    />
  );
}

function PreviewStep({ organizationId }: { organizationId: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Preview>(`/api/v1/organizations/${organizationId}/scope/preview-assessment`, { method: "POST" }).then((r) => {
      if (r.success) setPreview(r.data);
      else setError(r.error.message);
    });
  }, [organizationId]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!preview) return <p className="text-sm text-slate-500">Deriving risk tags…</p>;

  return (
    <div className="space-y-5">
      {preview.stale && (
        <Notice tone="warning" testId="preview-stale">
          The registers changed since the answers were last saved. Save the risk questions (step 6) to store these tags.
        </Notice>
      )}
      <div data-testid="preview-profile" className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Processing scale</p>
          <p className="text-sm font-semibold">{label(preview.profile.processingScale)}</p>
          <p className="text-xs text-slate-600">About {preview.profile.dataPrincipalCount.toLocaleString("en-IN")} Data Principals</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Vendor dependency</p>
          <p className="text-sm font-semibold">{label(preview.profile.vendorDependency)}</p>
          <p className="text-xs text-slate-600">{preview.profile.dataProcessorCount} Data Processors</p>
        </div>
      </div>
      {preview.profile.largeScaleNotice && (
        <p data-testid="large-scale-notice" className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
          {preview.profile.largeScaleNotice}
        </p>
      )}
      {preview.profile.enhancedReview.required && (
        <Notice tone="warning" testId="enhanced-review">
          Enhanced review recommended regardless of size:{" "}
          {preview.profile.enhancedReview.triggers.map((t) => ENHANCED_REVIEW_LABELS[t] ?? label(t)).join(", ")}.
        </Notice>
      )}
      <p className="text-xs text-slate-500">
        These are TrustStack readiness triggers. The platform does not classify an organisation as a Significant Data
        Fiduciary and does not certify compliance.
      </p>
      <div>
        <h3 className="font-medium">Risk tags</h3>
        {preview.riskTags.length === 0 ? (
          <p className="text-sm text-slate-500">No risk tags.</p>
        ) : (
          <ul data-testid="preview-tags" className="mt-2 space-y-2">
            {preview.riskTags.map((t) => (
              <li key={t.tag} data-testid={`tag-${t.tag}`} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold">{label(t.tag)}</p>
                <ul className="list-disc pl-5 text-xs text-slate-600">
                  {t.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Pack codes are Anix's working detail: the API sends them only to
          `question.read_bank` holders (D-071). */}
      {preview.questionPacks && (
        <div>
          <h3 className="font-medium">Question packs</h3>
          <ul data-testid="preview-packs" className="mt-2 flex flex-wrap gap-2">
            {preview.questionPacks.map((p) => (
              <li key={p} className="rounded-full bg-indigo-50 px-2 py-0.5 font-mono text-xs text-indigo-800">{p}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">Questions are loaded from these packs when the assessment is generated.</p>
        </div>
      )}
      <Can permission="assessment.write">
        <GenerateAssessment organizationId={organizationId} stale={preview.stale} />
      </Can>
    </div>
  );
}

/**
 * Step 7's action. Disabled while the scope is stale: generating from answers
 * that were never saved would snapshot a scope nobody agreed to.
 */
function GenerateAssessment({ organizationId, stale }: { organizationId: string; stale: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState("DPDP Compass Baseline");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [generation, setGeneration] = useState<GenerationSummary | null>(null);

  async function generate() {
    setBusy(true);
    setMessage(null);
    const result = await apiFetch<{ assessment: AssessmentSummary; generation: GenerationSummary }>(
      `/api/v1/organizations/${organizationId}/assessments`,
      { method: "POST", body: JSON.stringify({ name: name.trim() }) },
    );
    setBusy(false);
    if (!result.success) {
      setMessage({ ok: false, text: result.error.message });
      return;
    }
    setGeneration(result.data.generation);
    setMessage({ ok: true, text: `Generated ${result.data.generation.questionCount} questions.` });
    toast.success("Assessment generated.", `${result.data.generation.questionCount} questions, from your scope.`);
    router.push(`/dashboard/assessments/${result.data.assessment.id}`);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-medium">Generate assessment</h3>
      <p className="mt-1 text-xs text-slate-600">
        The question set is frozen at generation. Later edits to the question bank do not change it.
      </p>
      {stale && (
        <Notice tone="warning" testId="generate-blocked" className="mt-2">
          Save the risk questions (step 6) before generating — the scope has unsaved changes.
        </Notice>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          data-testid="assessment-name"
          className="min-w-56 flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Assessment name"
        />
        <button
          type="button"
          data-testid="generate-assessment"
          disabled={stale || busy || name.trim().length === 0}
          onClick={generate}
          className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Generating…" : "Generate assessment"}
        </button>
      </div>
      {message && (
        <p
          data-testid="generate-message"
          className={`mt-2 rounded-md px-3 py-2 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
        >
          {message.text}
        </p>
      )}
      {generation?.triggerCoverage && generation.triggerCoverage.unresolved > 0 && (
        <p className="mt-2 text-xs text-slate-600">
          {generation.triggerCoverage.unresolved} questions are shown as Potentially Applicable because the wizard
          cannot decide their condition. They are asked, never hidden.
        </p>
      )}
    </div>
  );
}
