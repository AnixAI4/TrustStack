"use client";

import { BREACH_NATURE_LABEL, BREACH_NATURES, BREACH_SEVERITIES, GAP_SEVERITY_LABEL } from "@truststack/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { apiFetch } from "@/lib/client/api";
import { istInputToInstant, nowIstInput, type BreachDetailPayload } from "@/lib/client/breaches";
import { usePermissions } from "@/lib/client/permissions";

/**
 * Record a personal data breach (Slice 10, Stage 1). Only what a person knows
 * is asked: the code and the Board report's due time are the database's.
 * When the organisation became AWARE starts the Rule 7(2)(b) clock and cannot
 * be edited afterwards — so the form asks for it first, and says so.
 */
export function NewBreachForm() {
  const permissions = usePermissions();
  const router = useRouter();
  const toast = useToast();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canWrite = permissions.kind === "ready" && permissions.value.permissions.includes("breach.write");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!organizationId) return;
    const form = new FormData(e.currentTarget);
    const value = (k: string) => {
      const v = String(form.get(k) ?? "").trim();
      return v === "" ? null : v;
    };
    const affected = value("principalsAffected");
    setSaving(true);
    setError(null);
    const r = await apiFetch<BreachDetailPayload>(`/api/v1/organizations/${organizationId}/breaches`, {
      method: "POST",
      body: JSON.stringify({
        title: value("title"),
        nature: value("nature"),
        severity: value("severity"),
        awareAt: istInputToInstant(String(form.get("awareAt"))),
        occurredAt: value("occurredAt") ? istInputToInstant(value("occurredAt")!) : null,
        location: value("location"),
        principalsAffected: affected === null ? null : Number(affected),
        dataCategories: value("dataCategories"),
        description: value("description"),
        likelyImpact: value("likelyImpact"),
        containmentMeasures: value("containmentMeasures"),
      }),
    });
    setSaving(false);
    if (!r.success) return setError(r.error.message);
    toast.success("Breach recorded.", "The Rule 7 timeline starts from when the organisation became aware.");
    router.push(`/dashboard/breaches/${r.data.incident.id}`);
  }

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (!canWrite) {
    return (
      <Notice tone="warning" testId="breach-new-forbidden">
        Recording a breach needs the breach register's write permission. Tell your DPDP Programme Owner straight away.
      </Notice>
    );
  }

  const input = "mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
  return (
    <form onSubmit={submit} data-testid="breach-new-form" className="space-y-4">
      <div>
        <Link href="/dashboard/breaches" className="text-xs text-indigo-700 hover:underline">
          ← Back to the register
        </Link>
        <h2 className="mt-1 text-lg font-semibold">Record a personal data breach</h2>
        <p className="text-sm text-slate-600">
          Record it as soon as the organisation becomes aware. The detailed report to the Board is due seventy-two hours
          from that moment (Rule 7(2)(b)); TrustStack works out the due time. All times are India Standard Time.
        </p>
      </div>

      <label className="block text-sm">
        When did the organisation become aware? (IST)
        <input name="awareAt" type="datetime-local" required defaultValue={nowIstInput()} data-testid="breach-aware-at" className={input} />
        <span className="text-xs text-slate-500">This starts the clock and cannot be changed once recorded.</span>
      </label>
      <label className="block text-sm">
        Short title
        <input name="title" required maxLength={200} data-testid="breach-title" className={input} placeholder="e.g. Marks list shared through a public link" />
        <span className="text-xs text-slate-500">The title travels to the actions list and the reports — describe what happened, never name the people affected.</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Nature
          <select name="nature" required data-testid="breach-nature" className={input} defaultValue="unauthorised_access">
            {BREACH_NATURES.map((n) => (
              <option key={n} value={n}>
                {BREACH_NATURE_LABEL[n]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Severity (your assessment)
          <select name="severity" required data-testid="breach-severity" className={input} defaultValue="high">
            {BREACH_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {GAP_SEVERITY_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          When did it occur, if known? (IST)
          <input name="occurredAt" type="datetime-local" data-testid="breach-occurred-at" className={input} />
        </label>
        <label className="block text-sm">
          Approximate number of people affected
          <input name="principalsAffected" type="number" min={0} data-testid="breach-principals-affected" className={input} />
        </label>
      </div>
      <label className="block text-sm">
        Where it happened (system, site)
        <input name="location" maxLength={500} data-testid="breach-location" className={input} />
      </label>
      <label className="block text-sm">
        Personal data involved
        <input name="dataCategories" maxLength={2000} data-testid="breach-data-categories" className={input} />
      </label>
      <label className="block text-sm">
        What happened — nature and extent
        <textarea name="description" rows={3} maxLength={4000} data-testid="breach-description" className={input} />
      </label>
      <label className="block text-sm">
        Likely impact on the people affected
        <textarea name="likelyImpact" rows={2} maxLength={4000} data-testid="breach-likely-impact" className={input} />
      </label>
      <label className="block text-sm">
        Containment so far
        <textarea name="containmentMeasures" rows={2} maxLength={4000} data-testid="breach-containment" className={input} />
      </label>

      {error && (
        <Notice tone="error" compact testId="breach-new-error">
          {error}
        </Notice>
      )}
      <button
        type="submit"
        disabled={saving}
        data-testid="breach-save"
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        {saving ? "Recording…" : "Record the breach"}
      </button>
    </form>
  );
}
