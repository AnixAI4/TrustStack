"use client";

import {
  AI_CHILD_TRACKING_QUESTION,
  AI_REGISTER_USAGE_TYPES,
  AI_SYSTEM_STATUS_LABEL,
  AI_SYSTEM_STATUSES,
  AI_USAGE_LABEL,
  ROPA_CHILD_EXEMPTIONS,
  TRI_STATES,
  type TriState,
} from "@truststack/core";
import { useState } from "react";
import { TRI_LABEL, type AiSystem } from "@/lib/client/retention";

/** The fields of an AI register row, shared by the "add" form and the edit form. */
export function AiFields({
  initial,
  scopeSystems,
  today,
}: {
  initial?: AiSystem;
  scopeSystems: readonly { id: string; name: string; systemType: string }[];
  today: string;
}) {
  const input = "mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
  const [childTracking, setChildTracking] = useState<TriState>(initial?.childTracking ?? "unknown");
  // AI systems first: the scope's `ai` type is what this register is for.
  const systems = [...scopeSystems].sort((a, b) => Number(b.systemType === "ai") - Number(a.systemType === "ai") || a.name.localeCompare(b.name));
  return (
    <>
      <label className="flex flex-col text-xs text-slate-600">
        Name
        <input name="name" data-testid="ai-name" required maxLength={200} defaultValue={initial?.name ?? ""} className={`${input} w-64`} />
      </label>
      <label className="flex flex-col text-xs text-slate-600">
        System in the scope
        <select name="systemId" data-testid="ai-system" defaultValue={initial?.systemId ?? ""} className={input}>
          <option value="">None</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.systemType === "ai" ? " (AI)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-slate-600">
        AI use
        <select name="usageType" data-testid="ai-usage" defaultValue={initial?.usageType ?? ""} className={input}>
          <option value="">Not one of these</option>
          {AI_REGISTER_USAGE_TYPES.map((u) => (
            <option key={u} value={u}>
              {AI_USAGE_LABEL[u]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex w-full flex-col text-xs text-slate-600">
        What it is for
        <textarea name="purpose" data-testid="ai-purpose" required maxLength={2000} rows={2} defaultValue={initial?.purpose ?? ""} className={input} />
      </label>
      <label className="flex w-full flex-col text-xs text-slate-600">
        The personal data it uses
        <textarea name="personalData" data-testid="ai-personal-data" required maxLength={2000} rows={2} defaultValue={initial?.personalData ?? ""} className={input} />
      </label>
      <label className="flex flex-col text-xs text-slate-600">
        {AI_CHILD_TRACKING_QUESTION} (s.9(3))
        <select
          name="childTracking"
          data-testid="ai-child-tracking"
          value={childTracking}
          onChange={(e) => setChildTracking(e.target.value as TriState)}
          className={input}
        >
          {TRI_STATES.map((t) => (
            <option key={t} value={t}>
              {TRI_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      {childTracking === "yes" && (
        <label className="flex flex-col text-xs text-slate-600">
          The Fourth Schedule exemption relied on (Rule 12)
          <select name="childExemption" data-testid="ai-child-exemption" defaultValue={initial?.childExemption ?? ""} className={`${input} w-96`}>
            <option value="">None recorded</option>
            {ROPA_CHILD_EXEMPTIONS.map((e) => (
              <option key={e.code} value={e.code}>
                {e.label} ({e.part})
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex w-full flex-col text-xs text-slate-600">
        The human-review step
        <textarea name="humanReview" data-testid="ai-human-review" maxLength={2000} rows={2} defaultValue={initial?.humanReview ?? ""} className={input} />
      </label>
      <label className="flex flex-col text-xs text-slate-600">
        Status
        <select name="status" data-testid="ai-status" defaultValue={initial?.status ?? "in_use"} className={input}>
          {AI_SYSTEM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {AI_SYSTEM_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-slate-600">
        Last reviewed
        <input name="lastReviewedOn" data-testid="ai-reviewed-on" type="date" max={today} defaultValue={initial?.lastReviewedOn ?? ""} className={input} />
      </label>
    </>
  );
}

/** The row's fields from a submitted form, as the API takes them. An empty review date is left out (a review is never removed). */
export function aiBody(form: FormData): Record<string, unknown> {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const reviewed = text("lastReviewedOn");
  return {
    name: text("name"),
    systemId: text("systemId") || null,
    usageType: text("usageType") || null,
    purpose: text("purpose"),
    personalData: text("personalData"),
    childTracking: text("childTracking"),
    // Only on "yes"; otherwise the exemption goes with the answer.
    childExemption: text("childTracking") === "yes" ? text("childExemption") || null : null,
    humanReview: text("humanReview") || null,
    status: text("status"),
    ...(reviewed ? { lastReviewedOn: reviewed } : {}),
  };
}
