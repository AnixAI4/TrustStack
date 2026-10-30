"use client";

import { useCallback, useEffect, useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { forgetAiStatus, type AiStatus } from "@/lib/client/ai";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";

interface AiSetting {
  enabled: boolean;
  contractRef: string | null;
  enabledAt: string | null;
  enabledByName: string | null;
}

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; setting: AiSetting; status: AiStatus };

const input = "w-full rounded-md border border-line-strong px-3 py-2 text-sm disabled:bg-surface-muted disabled:text-ink-soft";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

/**
 * The AI assistant's switch (Slice 11 Stage 1b; A2, A4; D-124). Shown to
 * everyone in the organisation; changed only with `organization.update`.
 *
 * On needs the reference of the client's contract (DPA) that names the AI
 * provider, because the provider is a sub-processor and a Data Fiduciary may
 * engage a processor "only under a valid contract" (s.8(2)). Off is immediate.
 * A `bfsi` or `healthcare` tenant without counsel's sign-off (s.16(2)), or an
 * SDF (Rule 13(4)), is held off — the database refuses it too. The platform's
 * kill switch wins over all of it.
 */
export function AiForm() {
  const toast = useToast();
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canEdit = permissions.kind === "ready" && permissions.value.permissions.includes("organization.update");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [contractRef, setContractRef] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!organizationId) return;
    const [org, ai] = await Promise.all([
      apiFetch<{ organization: { ai: AiSetting } }>(`/api/v1/organizations/${organizationId}`),
      apiFetch<{ ai: AiStatus }>(`/api/v1/organizations/${organizationId}/ai`),
    ]);
    if (!org.success) return setState({ kind: "error", message: org.error.message });
    if (!ai.success) return setState({ kind: "error", message: ai.error.message });
    setState({ kind: "ready", setting: org.data.organization.ai, status: ai.data.ai });
    setContractRef(org.data.organization.ai.contractRef ?? "");
  }, [organizationId]);

  useEffect(() => {
    if (permissions.kind === "error") setState({ kind: "error", message: permissions.message });
    void load();
  }, [load, permissions]);

  if (state.kind !== "ready") {
    return state.kind === "error" ? <Notice tone="error">{state.message}</Notice> : <p className="text-sm text-ink-soft">Loading…</p>;
  }
  const { setting, status } = state;
  const held = status.offReason === "sector" || status.offReason === "sdf";
  const platformOff = status.offReason === "platform";

  async function send(enabled: boolean) {
    setSaving(true);
    setMessage(null);
    const r = await apiFetch<{ organization: { ai: AiSetting } }>(`/api/v1/organizations/${organizationId}`, {
      method: "PATCH",
      body: JSON.stringify({ ai: { enabled, contractRef: contractRef.trim() || null } }),
    });
    setSaving(false);
    if (!r.success) return setMessage({ ok: false, text: r.error.message });
    forgetAiStatus(organizationId!);
    const text = enabled
      ? setting.enabled
        ? "Contract reference updated."
        : "The AI assistant is on."
      : "The AI assistant is off. Nothing more is sent to the AI provider.";
    setMessage({ ok: true, text });
    toast.success(text);
    await load();
  }

  return (
    <form
      data-testid="ai-settings"
      onSubmit={(e) => {
        e.preventDefault();
        void send(true);
      }}
      className="space-y-4 rounded-xl border border-line bg-surface p-6"
    >
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">AI assistant</h2>
        <p className="text-sm text-ink-soft">
          The TrustStack Assistant explains a question, the evidence on an answer, a gap or an action, and why a domain scores what it
          does — grounded in the DPDP Act and Rules and your own records. It explains and suggests; it never approves evidence, closes a
          gap or changes a score. A person reviews everything it says.
        </p>
        <p className="text-sm text-ink-soft">
          It sends the AI provider only what each explanation needs: never a person&apos;s name, email or phone number, and never the
          contents of an uploaded file. The provider is a sub-processor, so your contract with TrustStack must name it before the
          assistant is turned on (DPDP Act s.8(2)).
        </p>
      </div>

      <p data-testid="ai-settings-status" className="rounded-md bg-surface-muted px-3 py-2 text-sm text-ink">
        {setting.enabled
          ? `On since ${setting.enabledAt ? when(setting.enabledAt) : "—"}${setting.enabledByName ? `, turned on by ${setting.enabledByName}` : ""}, under contract ${setting.contractRef}.`
          : setting.contractRef
            ? `Off. The last contract reference recorded was ${setting.contractRef}.`
            : "Off. No contract reference has been recorded."}
      </p>

      {platformOff && (
        <Notice tone="info" testId="ai-settings-platform">
          {status.message}
        </Notice>
      )}
      {held && (
        <Notice tone="warning" title="Held off" testId="ai-settings-hold">
          {status.message}
        </Notice>
      )}

      {canEdit ? (
        <div className="space-y-3">
          <label className="block space-y-1 text-sm font-medium">
            Contract (DPA) reference that names the AI provider
            <input
              data-testid="ai-settings-contract"
              className={input}
              maxLength={200}
              value={contractRef}
              onChange={(e) => setContractRef(e.target.value)}
              placeholder="For example: DPA-2026-014, clause 9 (AI sub-processor)"
            />
            <span className="block text-xs font-normal text-ink-soft">Required to turn the assistant on. A contract number, not a person&apos;s details.</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {setting.enabled ? (
              <>
                <button
                  type="button"
                  data-testid="ai-settings-off"
                  disabled={saving}
                  onClick={() => void send(false)}
                  className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-dark disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Turn the assistant off"}
                </button>
                <button
                  type="submit"
                  data-testid="ai-settings-update"
                  disabled={saving || contractRef.trim() === "" || contractRef.trim() === setting.contractRef}
                  className="rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted disabled:opacity-60"
                >
                  Update the reference
                </button>
              </>
            ) : (
              <button
                type="submit"
                data-testid="ai-settings-on"
                disabled={saving || held || platformOff || contractRef.trim() === ""}
                className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-dark disabled:opacity-60"
              >
                {saving ? "Saving…" : "Turn the assistant on"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p data-testid="ai-settings-readonly" className="text-sm text-ink-soft">
          Only an Organisation Admin or consultant can turn the assistant on or off.
        </p>
      )}

      {message && (
        <Notice tone={message.ok ? "success" : "error"} testId="ai-settings-message">
          {message.text}
        </Notice>
      )}
    </form>
  );
}
