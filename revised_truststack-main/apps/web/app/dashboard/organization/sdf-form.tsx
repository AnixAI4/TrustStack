"use client";

import { SDF_NOTICE } from "@truststack/core";
import { useEffect, useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";

interface SdfNotification {
  notifiedOn: string;
  reference: string;
}

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; saved: SdfNotification | null };

const input = "w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500";

/**
 * The Significant Data Fiduciary notification (Slice 9, D-028). ENTERED by a
 * person with `organization.update`, never inferred: penalty head 4 (s.10)
 * applies only once it is recorded, and no scope answer or internal trigger
 * can set it.
 */
export function SdfForm() {
  const toast = useToast();
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canEdit = permissions.kind === "ready" && permissions.value.permissions.includes("organization.update");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [notifiedOn, setNotifiedOn] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (permissions.kind === "error") setState({ kind: "error", message: permissions.message });
    if (!organizationId) return;
    apiFetch<{ organization: { sdfNotification: SdfNotification | null } }>(`/api/v1/organizations/${organizationId}`).then((r) => {
      if (!r.success) return setState({ kind: "error", message: r.error.message });
      const saved = r.data.organization.sdfNotification;
      setState({ kind: "ready", saved });
      setNotifiedOn(saved?.notifiedOn ?? "");
      setReference(saved?.reference ?? "");
    });
  }, [organizationId, permissions]);

  if (state.kind !== "ready") {
    return state.kind === "error" ? (
      <Notice tone="error">{state.message}</Notice>
    ) : (
      <p className="text-sm text-slate-500">Loading…</p>
    );
  }

  async function send(value: SdfNotification | null) {
    setSaving(true);
    setMessage(null);
    const r = await apiFetch<{ organization: { sdfNotification: SdfNotification | null } }>(
      `/api/v1/organizations/${organizationId}`,
      { method: "PATCH", body: JSON.stringify({ sdfNotification: value }) },
    );
    setSaving(false);
    if (!r.success) return setMessage({ ok: false, text: r.error.message });
    const saved = r.data.organization.sdfNotification;
    setState({ kind: "ready", saved });
    setNotifiedOn(saved?.notifiedOn ?? "");
    setReference(saved?.reference ?? "");
    setMessage({ ok: true, text: saved ? "Notification recorded." : "Notification removed." });
    toast.success(saved ? "Notification recorded." : "Notification removed.");
  }

  return (
    <form
      data-testid="sdf-form"
      onSubmit={(e) => {
        e.preventDefault();
        void send({ notifiedOn, reference });
      }}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <div>
        <h2 className="text-lg font-semibold">Significant Data Fiduciary notification</h2>
        <p data-testid="sdf-notice" className="text-sm text-slate-600">{SDF_NOTICE}</p>
      </div>
      <p data-testid="sdf-status" className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {state.saved
          ? `Recorded: notified on ${state.saved.notifiedOn} (reference ${state.saved.reference}). The additional obligations of section 10 are assessed.`
          : "None recorded. The additional obligations of section 10 are not assessed."}
      </p>
      {canEdit ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Date of the notification
              <input
                data-testid="sdf-notified-on"
                className={input}
                type="date"
                required
                value={notifiedOn}
                onChange={(e) => setNotifiedOn(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Gazette or notification reference
              <input
                data-testid="sdf-reference"
                className={input}
                required
                maxLength={200}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              data-testid="sdf-save"
              disabled={saving}
              className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Record notification"}
            </button>
            {state.saved && (
              <button
                type="button"
                data-testid="sdf-clear"
                disabled={saving}
                onClick={() => void send(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
              >
                Remove notification
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600">Only an Organisation Admin or consultant can record a notification.</p>
      )}
      {message && (
        <Notice tone={message.ok ? "success" : "error"} testId="sdf-message">
          {message.text}
        </Notice>
      )}
    </form>
  );
}
