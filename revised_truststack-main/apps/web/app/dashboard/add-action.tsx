"use client";

import { useState, type FormEvent } from "react";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import type { GapMember } from "@/lib/client/gaps";

/**
 * Add a remedial action to a register record — a breach (Stage 1) or a
 * Data Principal's request (Stage 2) — on the ONE action table (D-067). The
 * route answers with the record's fresh detail payload, handed to `onAdded`.
 */
export function AddAction<T>({
  url,
  members,
  onAdded,
  testIdPrefix,
}: {
  url: string;
  members: readonly GapMember[];
  onAdded: (payload: T) => void;
  /** `breach` → `breach-add-action`, `breach-add-action-form`. */
  testIdPrefix: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const owner = String(form.get("ownerUserId") ?? "");
    const due = String(form.get("dueDate") ?? "");
    setBusy(true);
    setError(null);
    const r = await apiFetch<T>(url, {
      method: "POST",
      body: JSON.stringify({ title: String(form.get("title") ?? "").trim(), ownerUserId: owner || null, dueDate: due || null }),
    });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    onAdded(r.data);
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" data-testid={`${testIdPrefix}-add-action`} onClick={() => setOpen(true)} className="text-sm font-medium text-indigo-700 hover:underline">
        Add an action
      </button>
    );
  }
  const input = "mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
  return (
    <form data-testid={`${testIdPrefix}-add-action-form`} onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-2">
      <label className="flex flex-col text-xs text-slate-600">
        What will be done
        <input name="title" required maxLength={500} className={`${input} w-72`} />
      </label>
      <label className="flex flex-col text-xs text-slate-600">
        Owner
        <select name="ownerUserId" className={input} defaultValue="">
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.fullName ?? m.userId} — {m.roleName}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-slate-600">
        Due
        <input name="dueDate" type="date" className={input} />
      </label>
      <button type="submit" disabled={busy} className="rounded-md bg-indigo-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">
        {busy ? "Adding…" : "Add"}
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
  );
}
