"use client";

import {
  INTAKE_LIMITS,
  PUBLIC_RIGHTS_KINDS,
  PUBLIC_RIGHTS_KIND_HELP,
  RIGHTS_CAPACITIES,
  RIGHTS_CAPACITY_LABEL,
  RIGHTS_KIND_LABEL,
  RIGHTS_NAME_LIMIT,
  RIGHTS_SHORT_LIMIT,
  RIGHTS_TEXT_LIMIT,
  type IntakeSurface,
  type RightsCapacity,
  type RightsKind,
} from "@truststack/core";
import { useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { apiFetch, type ApiResult } from "@/lib/client/api";

type Step =
  | { kind: "form" }
  | { kind: "code"; submissionId: string; email: string; emailed: boolean }
  | { kind: "done"; requestCode: string; receivedOn: string; respondBy: string; emailed: boolean };

const input = "w-full rounded-md border border-slate-300 bg-white px-3 py-2";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

/** The refusal's outcome, when the server named one (`details[0].issue`). */
function outcomeOf<T>(r: ApiResult<T>): string | null {
  return r.success ? null : (r.error.details?.find((d) => d.field === "outcome")?.issue ?? null);
}

/**
 * A public rights request or grievance, in three steps: the form; the
 * six-digit code emailed to the person (it proves the address, nothing more);
 * the reference and the respond-by date. Asks only what the register records.
 */
export function IntakeForm({
  slug,
  surface,
  organizationName,
}: {
  slug: string;
  surface: IntakeSurface;
  organizationName: string;
}) {
  const [step, setStep] = useState<Step>({ kind: "form" });
  const [kind, setKind] = useState<RightsKind>(surface === "grievance" ? "grievance" : "access");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [capacity, setCapacity] = useState<RightsCapacity>("self");
  const [identifier, setIdentifier] = useState("");
  const [summary, setSummary] = useState("");
  const [related, setRelated] = useState("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeContact, setNomineeContact] = useState("");
  const [nomineeRelationship, setNomineeRelationship] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; restart: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const base = `/api/v1/public/${slug}/submissions`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await apiFetch<{ submissionId: string; email: string; emailed: boolean }>(base, {
      method: "POST",
      body: JSON.stringify({
        surface,
        kind,
        requesterName,
        requesterEmail,
        requesterPhone: requesterPhone || null,
        requesterCapacity: capacity,
        principalIdentifier: identifier || null,
        summary,
        relatedRequestCode: surface === "grievance" && related ? related : null,
        nominee:
          kind === "nomination"
            ? { name: nomineeName, contact: nomineeContact || null, relationship: nomineeRelationship || null }
            : null,
      }),
    });
    setBusy(false);
    if (!r.success) {
      const detail = r.error.details?.find((d) => d.field !== "outcome")?.issue;
      return setError({ text: detail ? `${r.error.message} ${detail}` : r.error.message, restart: false });
    }
    setCode("");
    setStep({ kind: "code", submissionId: r.data.submissionId, email: r.data.email, emailed: r.data.emailed });
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== "code") return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const r = await apiFetch<{ requestCode: string; receivedOn: string; respondBy: string; emailed: boolean }>(
      `${base}/${step.submissionId}/confirm`,
      { method: "POST", body: JSON.stringify({ code }) },
    );
    setBusy(false);
    if (!r.success) {
      const outcome = outcomeOf(r);
      return setError({ text: r.error.message, restart: outcome === "locked" || outcome === "expired" || outcome === "already_confirmed" });
    }
    const { requestCode, receivedOn, respondBy, emailed } = r.data;
    setStep({ kind: "done", requestCode, receivedOn, respondBy, emailed });
  }

  async function resend() {
    if (step.kind !== "code") return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const r = await apiFetch<{ email: string; emailed: boolean }>(`${base}/${step.submissionId}/resend`, { method: "POST" });
    setBusy(false);
    if (!r.success) {
      const outcome = outcomeOf(r);
      return setError({ text: r.error.message, restart: outcome === "locked" || outcome === "expired" || outcome === "already_confirmed" });
    }
    setCode("");
    setStep({ ...step, emailed: r.data.emailed });
    // A failed send says so once, in the code step's own line (F1.12) — not a second message here.
    setNotice(r.data.emailed ? `A new code is on its way to ${r.data.email}. The old one no longer works.` : null);
  }

  function restart() {
    setStep({ kind: "form" });
    setError(null);
    setNotice(null);
    setCode("");
  }

  const errorBox = error && (
    <Notice tone="error" testId="intake-error">
      <p>{error.text}</p>
      {error.restart && (
        <button type="button" data-testid="intake-restart" onClick={restart} className="font-medium underline">
          Start again
        </button>
      )}
    </Notice>
  );

  if (step.kind === "done") {
    return (
      <Notice tone="success" testId="intake-done">
        <h2 className="text-lg font-semibold text-emerald-900">
          {surface === "grievance" ? "Your grievance has been received" : "Your request has been received"}
        </h2>
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-emerald-800">Reference</dt>
          <dd data-testid="intake-reference" className="font-mono font-semibold">
            {step.requestCode}
          </dd>
          <dt className="text-emerald-800">Received on</dt>
          <dd data-testid="intake-received-on">{formatDate(step.receivedOn)}</dd>
          <dt className="text-emerald-800">To be answered by</dt>
          <dd data-testid="intake-respond-by">{formatDate(step.respondBy)}</dd>
        </dl>
        <p className="text-sm text-emerald-900">
          {organizationName} must answer within ninety days of receipt (DPDP Rules, 2025, Rule 14(3)). Quote the reference in any
          message about it. Before acting on a request about your personal data, {organizationName} may ask you to confirm your identity.
        </p>
        <p className="text-sm text-emerald-900">
          {step.emailed ? "We have emailed you these details." : "We could not email you these details — please note the reference."}
        </p>
      </Notice>
    );
  }

  if (step.kind === "code") {
    return (
      <form data-testid="intake-code-form" onSubmit={confirm} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p data-testid="intake-code-sent" className="text-sm text-slate-700">
          {step.emailed
            ? `We sent a six-digit code to ${step.email}. Enter it within ${INTAKE_LIMITS.codeMinutes} minutes. Nothing reaches ${organizationName} until the code is entered.`
            : `We could not send the email just now. Wait a minute, then choose Send a new code. Nothing reaches ${organizationName} until a code is entered.`}
        </p>
        <label className="block space-y-1 text-sm font-medium">
          Code
          <input
            data-testid="intake-code"
            className={`${input} max-w-[12rem] font-mono text-lg tracking-widest`}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            data-testid="intake-confirm"
            disabled={busy || code.length !== 6}
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Checking…" : "Confirm"}
          </button>
          <button
            type="button"
            data-testid="intake-resend"
            disabled={busy}
            onClick={() => void resend()}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
          >
            Send a new code
          </button>
        </div>
        {notice && (
          <p data-testid="intake-notice" className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {notice}
          </p>
        )}
        {errorBox}
      </form>
    );
  }

  return (
    <form data-testid="intake-form" onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      {surface === "rights" ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">What would you like to do?</legend>
          {PUBLIC_RIGHTS_KINDS.map((k) => (
            <label key={k} className="flex gap-3 rounded-md border border-slate-200 p-3 text-sm has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-50">
              <input data-testid={`intake-kind-${k}`} type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
              <span>
                <span className="font-medium">{RIGHTS_KIND_LABEL[k]}</span>
                <span className="block text-slate-600">{PUBLIC_RIGHTS_KIND_HELP[k]}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="text-sm text-slate-700">
          Tell {organizationName} what went wrong with your personal data, or with how a request you made was handled (s.13).
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Your name
          <input data-testid="intake-name" className={input} required maxLength={RIGHTS_NAME_LIMIT} value={requesterName} onChange={(e) => setRequesterName(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Your email
          <input
            data-testid="intake-email"
            className={input}
            type="email"
            required
            maxLength={320}
            value={requesterEmail}
            onChange={(e) => setRequesterEmail(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Phone (optional)
          <input data-testid="intake-phone" className={input} maxLength={40} value={requesterPhone} onChange={(e) => setRequesterPhone(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          You are
          <select data-testid="intake-capacity" className={input} value={capacity} onChange={(e) => setCapacity(e.target.value as RightsCapacity)}>
            {RIGHTS_CAPACITIES.map((c) => (
              <option key={c} value={c}>
                {c === "self" ? "The person the data is about" : RIGHTS_CAPACITY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium sm:col-span-2">
          How {organizationName} knows you (optional)
          <input
            data-testid="intake-identifier"
            className={input}
            maxLength={RIGHTS_NAME_LIMIT}
            placeholder="A student, customer or account number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </label>
        {surface === "grievance" && (
          <label className="space-y-1 text-sm font-medium sm:col-span-2">
            Is this about an earlier request? Its reference (optional)
            <input
              data-testid="intake-related"
              className={`${input} font-mono uppercase`}
              maxLength={40}
              placeholder="DPR-2026-001"
              value={related}
              onChange={(e) => setRelated(e.target.value)}
            />
          </label>
        )}
      </div>

      {kind === "nomination" && (
        <fieldset className="grid gap-4 rounded-md border border-slate-200 p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium">The person you nominate (s.14)</legend>
          <label className="space-y-1 text-sm font-medium">
            Their name
            <input data-testid="intake-nominee-name" className={input} required maxLength={RIGHTS_NAME_LIMIT} value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Relationship to you (optional)
            <input className={input} maxLength={RIGHTS_NAME_LIMIT} value={nomineeRelationship} onChange={(e) => setNomineeRelationship(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm font-medium sm:col-span-2">
            How to reach them (optional)
            <input className={input} maxLength={RIGHTS_SHORT_LIMIT} value={nomineeContact} onChange={(e) => setNomineeContact(e.target.value)} />
          </label>
        </fieldset>
      )}

      <label className="block space-y-1 text-sm font-medium">
        {surface === "grievance" ? "Your grievance" : "Your request"}
        <textarea
          data-testid="intake-summary"
          className={`${input} min-h-32`}
          required
          maxLength={RIGHTS_TEXT_LIMIT}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </label>

      <p className="text-xs text-slate-500">
        We will email you a six-digit code to confirm your address. Nothing reaches {organizationName} until you enter it. The
        ninety days start on the day you submit.
      </p>
      <button
        type="submit"
        data-testid="intake-submit"
        disabled={busy}
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send — we'll email you a code"}
      </button>
      {errorBox}
    </form>
  );
}
