"use client";

import {
  RIGHTS_CAPACITIES,
  RIGHTS_CAPACITY_LABEL,
  RIGHTS_CHANNEL_LABEL,
  RIGHTS_CHANNELS,
  RIGHTS_KIND_LABEL,
  RIGHTS_KIND_PROVISION,
  RIGHTS_KINDS,
  type RightsKind,
} from "@truststack/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { apiFetch } from "@/lib/client/api";
import { todayInIndia } from "@/lib/client/gaps";
import { usePermissions } from "@/lib/client/permissions";
import type { RightsDetailPayload, RightsRegisterPayload } from "@/lib/client/rights";

/**
 * Record a Data Principal's request or grievance (Slice 10, Stage 2), as
 * staff: what arrived by email, letter, phone or in person. Only what a
 * person knows is asked — the code and the respond-by date are the
 * database's. The day it was RECEIVED starts the ninety days and cannot be
 * edited afterwards, so the form asks for it first, and says so.
 */
export function NewRightsRequestForm() {
  const permissions = usePermissions();
  const router = useRouter();
  const toast = useToast();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canWrite = permissions.kind === "ready" && permissions.value.permissions.includes("rights.write");
  const [kind, setKind] = useState<RightsKind>("access");
  const [earlier, setEarlier] = useState<{ id: string; requestCode: string; kindLabel: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The requests a grievance (or a follow-up) may be about.
  useEffect(() => {
    if (!organizationId) return;
    apiFetch<RightsRegisterPayload>(`/api/v1/organizations/${organizationId}/rights-requests`).then((r) => {
      if (r.success) setEarlier(r.data.requests.map((x) => ({ id: x.id, requestCode: x.requestCode, kindLabel: x.kindLabel })));
    });
  }, [organizationId]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!organizationId) return;
    const form = new FormData(e.currentTarget);
    const value = (k: string) => {
      const v = String(form.get(k) ?? "").trim();
      return v === "" ? null : v;
    };
    setSaving(true);
    setError(null);
    const nomination = kind === "nomination";
    const r = await apiFetch<RightsDetailPayload>(`/api/v1/organizations/${organizationId}/rights-requests`, {
      method: "POST",
      body: JSON.stringify({
        kind,
        receivedOn: value("receivedOn"),
        channel: value("channel"),
        requesterName: value("requesterName"),
        requesterEmail: value("requesterEmail"),
        requesterPhone: value("requesterPhone"),
        requesterCapacity: value("requesterCapacity"),
        principalIdentifier: value("principalIdentifier"),
        summary: value("summary"),
        relatedRequestId: value("relatedRequestId"),
        ...(nomination
          ? { nomineeName: value("nomineeName"), nomineeContact: value("nomineeContact"), nomineeRelationship: value("nomineeRelationship") }
          : {}),
      }),
    });
    setSaving(false);
    if (!r.success) return setError(r.error.message);
    toast.success("Recorded.", "The response clock runs from the date of receipt.");
    router.push(`/dashboard/rights/${r.data.request.id}`);
  }

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (!canWrite) {
    return (
      <Notice tone="warning" testId="rights-new-forbidden">
        Recording a request or grievance needs the rights register&apos;s write permission. Pass it to your DPDP Programme
        Owner the day it arrives.
      </Notice>
    );
  }

  const input = "mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
  return (
    <form onSubmit={submit} data-testid="rights-new-form" className="space-y-4">
      <div>
        <Link href="/dashboard/rights" className="text-xs text-indigo-700 hover:underline">
          ← Back to the register
        </Link>
        <h2 className="mt-1 text-lg font-semibold">Record a request or grievance</h2>
        <p className="text-sm text-slate-600">
          Record it on the day it reaches the organisation. The Rules allow a response within a reasonable period not
          exceeding ninety days from receipt (Rule 14(3)); TrustStack works out the date, and shows its own 30-day target
          beside it. Dates are India&apos;s calendar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          What is it?
          <select
            name="kind"
            required
            value={kind}
            onChange={(e) => setKind(e.target.value as RightsKind)}
            data-testid="rights-kind"
            className={input}
          >
            {RIGHTS_KINDS.map((k) => (
              <option key={k} value={k}>
                {RIGHTS_KIND_LABEL[k]} ({RIGHTS_KIND_PROVISION[k]})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          When was it received?
          <input name="receivedOn" type="date" required defaultValue={todayInIndia()} max={todayInIndia()} data-testid="rights-received-on" className={input} />
          <span className="text-xs text-slate-500">This starts the ninety days and cannot be changed once recorded.</span>
        </label>
        <label className="block text-sm">
          How did it arrive?
          <select name="channel" required defaultValue="email" data-testid="rights-channel" className={input}>
            {RIGHTS_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {RIGHTS_CHANNEL_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Who made it?
          <select name="requesterCapacity" defaultValue="self" data-testid="rights-capacity" className={input}>
            {RIGHTS_CAPACITIES.map((c) => (
              <option key={c} value={c}>
                {RIGHTS_CAPACITY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold">The person — personal data, kept in this register only</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Name
            <input name="requesterName" required maxLength={200} data-testid="rights-requester-name" className={input} />
          </label>
          <label className="block text-sm">
            Identifier they gave (optional)
            <input
              name="principalIdentifier"
              maxLength={200}
              data-testid="rights-identifier"
              className={input}
              placeholder="e.g. enrolment, customer or patient number"
            />
          </label>
          <label className="block text-sm">
            Email (optional)
            <input name="requesterEmail" type="email" maxLength={320} data-testid="rights-requester-email" className={input} />
          </label>
          <label className="block text-sm">
            Phone (optional)
            <input name="requesterPhone" maxLength={40} data-testid="rights-requester-phone" className={input} />
          </label>
        </div>
      </fieldset>

      <label className="block text-sm">
        What they asked for, or complained of
        <textarea name="summary" required rows={3} maxLength={4000} data-testid="rights-summary-text" className={input} />
      </label>

      {earlier.length > 0 && (
        <label className="block text-sm">
          About an earlier request (optional)
          <select name="relatedRequestId" defaultValue="" data-testid="rights-related" className={input}>
            <option value="">None</option>
            {earlier.map((x) => (
              <option key={x.id} value={x.id}>
                {x.requestCode} — {x.kindLabel}
              </option>
            ))}
          </select>
        </label>
      )}

      {kind === "nomination" && (
        <fieldset data-testid="rights-nominee" className="space-y-3 rounded-xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold">The nominee (s.14, Rule 14(4))</legend>
          <p className="text-xs text-slate-600">
            The individual who will exercise the person&apos;s rights on their death or incapacity. To nominate more than one,
            record one nomination for each.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              Name
              <input name="nomineeName" required maxLength={200} data-testid="rights-nominee-name" className={input} />
            </label>
            <label className="block text-sm">
              Contact (optional)
              <input name="nomineeContact" maxLength={500} data-testid="rights-nominee-contact" className={input} />
            </label>
            <label className="block text-sm">
              Relationship (optional)
              <input name="nomineeRelationship" maxLength={200} data-testid="rights-nominee-relationship" className={input} />
            </label>
          </div>
        </fieldset>
      )}

      {error && (
        <Notice tone="error" compact testId="rights-new-error">
          {error}
        </Notice>
      )}
      <button
        type="submit"
        disabled={saving}
        data-testid="rights-save"
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        {saving ? "Recording…" : kind === "grievance" ? "Record the grievance" : "Record the request"}
      </button>
    </form>
  );
}
