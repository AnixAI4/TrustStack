"use client";

import { useEffect, useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { apiFetch } from "@/lib/client/api";
import { useIndustryLabel } from "@/lib/client/industries";
import { usePermissions } from "@/lib/client/permissions";

interface Profile {
  id: string;
  name: string;
  legalName: string | null;
  organizationType: string;
  industryCode: string | null;
  website: string | null;
  headquartersCity: string | null;
  employeeCount: number | null;
  dataPrincipalCountEstimate: number | null;
}

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; profile: Profile };

const input = "w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500";

export function ProfileForm() {
  const toast = useToast();
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canEdit = permissions.kind === "ready" && permissions.value.permissions.includes("organization.update");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [draft, setDraft] = useState<Profile | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const industry = useIndustryLabel(draft?.industryCode);

  useEffect(() => {
    if (permissions.kind === "error") setState({ kind: "error", message: permissions.message });
    if (!organizationId) return;
    apiFetch<{ organization: Profile }>(`/api/v1/organizations/${organizationId}`).then((r) => {
      if (r.success) {
        setState({ kind: "ready", profile: r.data.organization });
        setDraft(r.data.organization);
      } else setState({ kind: "error", message: r.error.message });
    });
  }, [organizationId, permissions]);

  if (state.kind === "loading" || !draft) {
    return state.kind === "error" ? (
      <Notice tone="error" testId="profile-error">{state.message}</Notice>
    ) : (
      <p className="text-sm text-slate-500">Loading organisation…</p>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    const r = await apiFetch<{ organization: Profile }>(`/api/v1/organizations/${organizationId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: draft.name,
        legalName: draft.legalName || null,
        website: draft.website || null,
        headquartersCity: draft.headquartersCity || null,
        employeeCount: draft.employeeCount,
      }),
    });
    setSaving(false);
    if (r.success) {
      setDraft(r.data.organization);
      setMessage({ ok: true, text: "Profile saved." });
      toast.success("Profile saved.");
    } else setMessage({ ok: false, text: r.error.message });
  }

  const set = (patch: Partial<Profile>) => setDraft({ ...draft, ...patch });

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold">Organisation profile</h2>
        <p className="text-sm text-slate-600">
          Industry and Data Principal scale are set in the{" "}
          <a href="/dashboard/scope" className="text-indigo-700 underline">scope wizard</a>.
        </p>
      </div>
      {!canEdit && (
        <p data-testid="profile-readonly" className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          You can view the profile. Only an Organisation Admin or consultant can edit it.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Display name
          <input className={input} required disabled={!canEdit} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Legal name
          <input className={input} disabled={!canEdit} value={draft.legalName ?? ""} onChange={(e) => set({ legalName: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Website
          <input className={input} type="url" disabled={!canEdit} value={draft.website ?? ""} onChange={(e) => set({ website: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Headquarters city
          <input className={input} disabled={!canEdit} value={draft.headquartersCity ?? ""} onChange={(e) => set({ headquartersCity: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Employees
          <input
            className={input}
            type="number"
            min={0}
            disabled={!canEdit}
            value={draft.employeeCount ?? ""}
            onChange={(e) => set({ employeeCount: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </label>
        <div className="space-y-1 text-sm">
          <p className="font-medium">Industry</p>
          <p data-testid="profile-industry" className="py-2 text-slate-700">{draft.industryCode ? (industry ?? "") : "Not set"}</p>
        </div>
      </div>
      {message && (
        <Notice tone={message.ok ? "success" : "error"} testId="profile-message">
          {message.text}
        </Notice>
      )}
      {canEdit && (
        <button type="submit" disabled={saving} className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save profile"}
        </button>
      )}
    </form>
  );
}
