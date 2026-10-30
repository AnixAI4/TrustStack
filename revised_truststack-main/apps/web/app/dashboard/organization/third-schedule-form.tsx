"use client";

import { THIRD_SCHEDULE_CLASS_LABEL, THIRD_SCHEDULE_CLASSES, type ThirdScheduleClass } from "@truststack/core";
import { useEffect, useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";

type Saved = { class: ThirdScheduleClass; label: string } | null;
type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; saved: Saved };

/**
 * The Third-Schedule class (Slice 10, Stage 5; Rule 8(1)). ENTERED by a person
 * with `organization.update`, never inferred from size or sector: only an
 * organisation in one of the three classes has the deemed three-year period
 * and the 48-hour notice before erasure (Rule 8(1)–(2)).
 */
export function ThirdScheduleForm() {
  const toast = useToast();
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canEdit = permissions.kind === "ready" && permissions.value.permissions.includes("organization.update");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [choice, setChoice] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (permissions.kind === "error") setState({ kind: "error", message: permissions.message });
    if (!organizationId) return;
    apiFetch<{ organization: { thirdScheduleClass: Saved } }>(`/api/v1/organizations/${organizationId}`).then((r) => {
      if (!r.success) return setState({ kind: "error", message: r.error.message });
      setState({ kind: "ready", saved: r.data.organization.thirdScheduleClass });
      setChoice(r.data.organization.thirdScheduleClass?.class ?? "");
    });
  }, [organizationId, permissions]);

  if (state.kind !== "ready") {
    return state.kind === "error" ? <p className="rounded-md bg-red-50 p-4 text-sm text-red-800">{state.message}</p> : <p className="text-sm text-slate-500">Loading…</p>;
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const r = await apiFetch<{ organization: { thirdScheduleClass: Saved } }>(`/api/v1/organizations/${organizationId}`, {
      method: "PATCH",
      body: JSON.stringify({ thirdScheduleClass: choice || null }),
    });
    setSaving(false);
    if (!r.success) return setMessage({ ok: false, text: r.error.message });
    setState({ kind: "ready", saved: r.data.organization.thirdScheduleClass });
    setMessage({ ok: true, text: r.data.organization.thirdScheduleClass ? "Class recorded." : "Class removed." });
    toast.success(r.data.organization.thirdScheduleClass ? "Third Schedule class recorded." : "Third Schedule class removed.");
  }

  return (
    <section data-testid="third-schedule-form" className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold">Third-Schedule class (Rule 8(1))</h2>
        <p className="text-sm text-slate-600">
          Only these three classes have the deemed three-year retention period and must tell a person at least 48 hours
          before erasing their data (Rule 8(1)–(2)). Record a class only if the organisation is in it — TrustStack never
          infers it from size or sector.
        </p>
      </div>
      <p data-testid="third-schedule-status" className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {state.saved ? `Recorded: ${state.saved.label}.` : "None recorded. Rule 8(1)–(2) do not apply."}
      </p>
      {canEdit ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm font-medium">
            Class
            <select data-testid="third-schedule-class" value={choice} onChange={(e) => setChoice(e.target.value)} className="block rounded-md border border-slate-300 px-3 py-2">
              <option value="">None of these</option>
              {THIRD_SCHEDULE_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {THIRD_SCHEDULE_CLASS_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <button type="button" data-testid="third-schedule-save" disabled={saving} onClick={() => void save()} className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">Only an Organisation Admin or consultant can record a class.</p>
      )}
      {message && (
        <Notice tone={message.ok ? "success" : "error"} testId="third-schedule-message">
          {message.text}
        </Notice>
      )}
    </section>
  );
}
