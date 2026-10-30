"use client";

import {
  CONSENT_ACTIONS,
  CONSENT_ACTION_LABEL,
  CONSENT_LANGUAGES,
  CONSENT_LANGUAGE_LABEL,
  PRINCIPAL_KINDS,
  PRINCIPAL_KIND_LABEL,
  VERIFICATION_METHODS_FOR,
  VERIFICATION_METHOD_LABEL,
  WIDGET_POSITIONS,
  WIDGET_POSITION_LABEL,
  widgetSnippet,
  widgetTranslationPending,
  type ConsentAction,
  type ConsentLanguage,
  type PrincipalKind,
  type VerificationMethod,
  type WidgetPosition,
} from "@truststack/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DraftButton } from "@/components/ai/draft-panel";
import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { Tabs } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/client/api";
import { Can, usePermissions } from "@/lib/client/permissions";
import {
  CONSENT_ACTION_STYLE,
  formatInstant,
  type ConsentHistoryPayload,
  type ConsentRecordView,
  type ConsentRegisterPayload,
  type WidgetVersion,
} from "@/lib/client/consent";

const input = "mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
const button = "rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50";
const quiet = "rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50";

/**
 * Notice and consent (Slice 10, Stage 3b): the organisation's privacy notice
 * (s.5, Rule 3), its consent widget (s.6) and the consent register — every
 * choice a Data Principal made, append-only, with how a parent or guardian
 * was verified (s.9(1), Rules 10–11).
 *
 * Staff write the notice. From Slice 11 Stage 2b the assistant may DRAFT one from
 * the processing register (D-133.3) — the person checks, saves and publishes it in
 * the notice editor. The counts are over each person's LATEST record, counted by
 * the database.
 */
export function ConsentHome() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [payload, setPayload] = useState<ConsentRegisterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!organizationId) return;
    apiFetch<ConsentRegisterPayload>(`/api/v1/organizations/${organizationId}/consent`).then((r) => {
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
  }, [organizationId]);
  useEffect(load, [load]);

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="consent-error">
        {error}
      </Notice>
    );
  }
  if (!payload || !organizationId) return <p className="text-sm text-slate-500">Loading the register…</p>;
  const { counts } = payload;
  const live = payload.configs.find((c) => c.id === payload.liveConfigId) ?? null;
  const title = purposeTitles(payload);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          The privacy notice Data Principals read before they consent (section 5, Rule 3), the consent widget on your website
          (section 6), and every choice made — given, refused or withdrawn. A child&apos;s consent is a parent&apos;s, and a person
          with disability&apos;s a lawful guardian&apos;s, verified as Rules 10 and 11 require (section 9(1)).
        </p>
      </div>

      <section data-testid="consent-summary" className="rounded-xl border border-slate-200 p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-6">
          <Stat label="People with a record" value={counts.principals} testId="consent-count-principals" />
          <Stat label="Consent given" value={counts.given} testId="consent-count-given" />
          <Stat label="Refused" value={counts.refused} testId="consent-count-refused" />
          <Stat label="Withdrawn" value={counts.withdrawn} testId="consent-count-withdrawn" />
          <Stat label="Given by a parent or guardian" value={counts.onBehalf} testId="consent-count-on-behalf" />
          <Stat label="…with no verification recorded" value={counts.unverified} testId="consent-count-unverified" alert={counts.unverified > 0} />
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          Counted over each person&apos;s latest choice. A consent given by a parent or lawful guardian with no verification recorded
          puts the children&apos;s-data penalty head at risk.
        </p>
      </section>

      {/* Slice 10.5 B3 (F3.6): one long page became three tabs. Every panel stays mounted. */}
      <Tabs
        label="Notice and consent"
        testId="consent-tabs"
        tabs={[
          {
            id: "notice",
            label: "Notice",
            badge: payload.notices.some((n) => n.status === "published") ? "Published" : "Not published",
            attention: !payload.notices.some((n) => n.status === "published"),
            content: <NoticesSection payload={payload} />,
          },
          {
            id: "widget",
            label: "Widget",
            badge: live ? `Live v${live.version}` : "Not live",
            attention: !live,
            content: <WidgetSection payload={payload} organizationId={organizationId} onChange={setPayload} live={live} title={title} />,
          },
          {
            id: "records",
            label: "Consent records",
            badge: counts.unverified > 0 ? `${counts.unverified} unverified` : String(counts.principals),
            attention: counts.unverified > 0,
            content: (
              <>
                <Can permission="consent.write">
                  <RecordSection organizationId={organizationId} live={live} onRecorded={setPayload} title={title} />
                </Can>
                <LookupSection organizationId={organizationId} title={title} />
                <RecentSection records={payload.recent} title={title} />
              </>
            ),
          },
        ]}
      />
    </div>
  );
}

/**
 * A purpose key's title, from the notices that state it (F3.6) — staff read "Alumni updates", not
 * `alumni_updates`. A published notice's title wins over a draft's; a key no notice states shows as it is.
 */
type PurposeTitle = (key: string) => string;
function purposeTitles(payload: ConsentRegisterPayload): PurposeTitle {
  const titles = new Map<string, string>();
  const ordered = [...payload.notices].sort((a, b) => Number(a.status === "published") - Number(b.status === "published"));
  for (const n of ordered) for (const p of n.purposes) if (p.title.trim()) titles.set(p.key, p.title.trim());
  return (key) => titles.get(key) ?? key;
}

function NoticesSection({ payload }: { payload: ConsentRegisterPayload }) {
  const router = useRouter();
  return (
    <section data-testid="consent-notices" className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Privacy notice</h3>
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden without consent.write or the assistant; the draft comes from the consent-based records only. */}
          <DraftButton
            organizationId={payload.organizationId}
            task="notice_draft"
            body={{}}
            subject="From the processing records that rely on consent, or whose basis is not yet decided"
            onAccepted={(d) => router.push(`/dashboard/consent/notices/new?draft=${d.id}`)}
            testId="consent-notice-draft"
          />
          <Can permission="consent.write">
            <Link href="/dashboard/consent/notices/new" data-testid="consent-notice-new" className={button}>
              Write a new version
            </Link>
          </Can>
        </div>
      </div>
      {payload.notices.length === 0 ? (
        <p data-testid="consent-notices-empty" className="text-sm text-slate-700">
          No notice is written yet. Write one: what personal data you process, for which purposes, and how a person withdraws
          consent, exercises their rights and complains to the Board (Rule 3).
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {payload.notices.map((n) => (
            <li key={n.id} data-testid={`consent-notice-${n.language}-v${n.version}`} className="flex flex-wrap items-center gap-2 py-2">
              <span className="font-mono text-xs text-slate-600">
                {n.languageLabel} · v{n.version}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${n.status === "published" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                {n.statusLabel}
              </span>
              <Link href={`/dashboard/consent/notices/${n.id}`} className="font-medium text-indigo-800 hover:underline">
                {n.title}
              </Link>
              <span className="text-xs text-slate-500">
                {n.publishedAt ? `Published ${formatInstant(n.publishedAt)}${n.publishedByName ? ` by ${n.publishedByName}` : ""}` : `Draft — ${n.purposes.length} purposes`}
              </span>
            </li>
          ))}
        </ul>
      )}
      {payload.publicSlug && payload.notices.some((n) => n.status === "published") && (
        <p className="text-xs text-slate-600">
          Published at{" "}
          <a data-testid="consent-notice-public-link" href={`/p/${payload.publicSlug}/notice`} className="text-indigo-800 underline" target="_blank" rel="noreferrer">
            /p/{payload.publicSlug}/notice
          </a>{" "}
          — the latest published version in each language.
        </p>
      )}
    </section>
  );
}

function WidgetSection({
  payload,
  organizationId,
  onChange,
  live,
  title,
}: {
  payload: ConsentRegisterPayload;
  organizationId: string;
  onChange: (p: ConsentRegisterPayload) => void;
  live: WidgetVersion | null;
  title: PurposeTitle;
}) {
  const draft = payload.configs.find((c) => c.status === "draft") ?? null;
  const notices = payload.notices;
  const seed = draft ?? live;
  const [noticeId, setNoticeId] = useState(seed?.notice?.id ?? notices.find((n) => n.status === "published")?.id ?? notices[0]?.id ?? "");
  const notice = notices.find((n) => n.id === noticeId) ?? null;
  const [purposes, setPurposes] = useState<string[]>(seed?.purposes ?? []);
  const [languages, setLanguages] = useState<ConsentLanguage[]>(seed?.languages ?? ["en", "hi", "mr"]);
  const [position, setPosition] = useState<WidgetPosition>(seed?.position ?? "bottom_bar");
  const [colour, setColour] = useState(seed?.primaryColor ?? "#1e3a8a");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  async function send(method: "POST" | "PATCH" | "DELETE", path: string, body?: object) {
    setBusy(true);
    setMessage(null);
    const r = await apiFetch<ConsentRegisterPayload>(path, { method, body: body ? JSON.stringify(body) : undefined });
    setBusy(false);
    if (r.success) onChange(r.data);
    else setMessage(r.error.message);
    return r.success;
  }
  const content = { noticeId, purposes, languages, position, primaryColor: colour };
  const pending = CONSENT_LANGUAGES.filter((l) => widgetTranslationPending(l));
  const languageBox = (l: ConsentLanguage) => (
    <label key={l} className="inline-flex items-center gap-1">
      <input
        type="checkbox"
        data-testid={`widget-language-${l}`}
        disabled={l === "en"}
        checked={languages.includes(l)}
        onChange={(e) => setLanguages(e.target.checked ? [...languages, l] : languages.filter((x) => x !== l))}
      />
      {CONSENT_LANGUAGE_LABEL[l]}
    </label>
  );
  const base = `/api/v1/organizations/${organizationId}/consent-configs`;

  return (
    <section data-testid="consent-widget" className="space-y-3 rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold">Consent widget</h3>
      {live ? (
        <div className="space-y-2 text-sm">
          <p data-testid="consent-widget-live">
            Live: version {live.version}, citing the {live.notice?.languageLabel} notice v{live.notice?.version} — offers{" "}
            {live.purposes.map(title).join(", ")}.
          </p>
          {payload.publicSlug ? (
            <div>
              <p className="text-xs text-slate-600">Paste this into every page of your website, before the closing &lt;/body&gt; tag:</p>
              <pre data-testid="consent-widget-snippet" className="mt-1 overflow-x-auto rounded-md bg-slate-50 p-2 text-xs">
                {widgetSnippet(origin, payload.publicSlug)}
              </pre>
              <p className="text-xs text-slate-500">
                Add <code>data-principal=&quot;…&quot;</code> with your own identifier for a signed-in person, and{" "}
                <code>data-principal-kind=&quot;child&quot;</code> when the person is a child — their parent then consents, and
                you record how you verified the parent here.
              </p>
            </div>
          ) : (
            <Notice tone="warning" compact testId="consent-widget-no-address">
              The widget needs your public address. Open your public pages on the{" "}
              <Link href="/dashboard/organization" className="underline">
                Organisation page
              </Link>{" "}
              first.
            </Notice>
          )}
        </div>
      ) : (
        <p data-testid="consent-widget-none" className="text-sm text-slate-700">
          No widget version is published. Publish a notice, then a widget version that offers its purposes.
        </p>
      )}

      <Can permission="consent.write">
        <div className="space-y-3 rounded-lg border border-dashed border-slate-300 p-3">
          <p className="text-sm font-medium">{draft ? `Draft version ${draft.version}` : "Make a new version"}</p>
          {notices.length === 0 ? (
            <p className="text-sm text-slate-600">Write a notice first: a widget version offers the purposes it states.</p>
          ) : (
            <>
              <label className="block text-xs text-slate-600">
                Notice it cites
                <select
                  data-testid="widget-notice"
                  value={noticeId}
                  onChange={(e) => {
                    setNoticeId(e.target.value);
                    setPurposes([]);
                  }}
                  className={input}
                >
                  {notices.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.languageLabel} v{n.version} — {n.statusLabel}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="text-sm">
                <legend className="text-xs text-slate-600">Purposes it asks consent for — none is ticked for the person in advance</legend>
                {(notice?.purposes ?? []).map((p) => (
                  <label key={p.key} className="mr-4 inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      data-testid={`widget-purpose-${p.key}`}
                      checked={purposes.includes(p.key)}
                      onChange={(e) => setPurposes(e.target.checked ? [...purposes, p.key] : purposes.filter((k) => k !== p.key))}
                    />
                    {p.title || p.key}
                  </label>
                ))}
              </fieldset>
              <fieldset className="text-sm">
                <legend className="text-xs text-slate-600">Languages (English is always offered)</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {CONSENT_LANGUAGES.filter((l) => !widgetTranslationPending(l)).map((l) => languageBox(l))}
                </div>
                {/* F3.6: the languages still awaiting a translation, folded into one line — each can still be offered. */}
                <details data-testid="widget-languages-pending" className="mt-1" open={pending.some((l) => languages.includes(l))}>
                  <summary className="cursor-pointer text-xs text-slate-600">
                    {pending.length} more languages — translation pending
                    {pending.some((l) => languages.includes(l)) ? ` (${pending.filter((l) => languages.includes(l)).length} offered)` : ""}
                  </summary>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">{pending.map((l) => languageBox(l))}</div>
                </details>
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-slate-600">
                  Where it appears
                  <select data-testid="widget-position" value={position} onChange={(e) => setPosition(e.target.value as WidgetPosition)} className={input}>
                    {WIDGET_POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {WIDGET_POSITION_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-slate-600">
                  Colour
                  <input data-testid="widget-colour" value={colour} onChange={(e) => setColour(e.target.value)} className={input} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="widget-save"
                  disabled={busy}
                  className={quiet}
                  onClick={() => (draft ? send("PATCH", `${base}/${draft.id}`, content) : send("POST", base, content))}
                >
                  Save draft
                </button>
                {draft && (
                  <>
                    <Can permission="consent.publish">
                      <button
                        type="button"
                        data-testid="widget-publish"
                        disabled={busy}
                        className={button}
                        onClick={() => send("PATCH", `${base}/${draft.id}`, { ...content, status: "published" })}
                      >
                        Publish version {draft.version}
                      </button>
                    </Can>
                    <button type="button" data-testid="widget-discard" disabled={busy} className={quiet} onClick={() => send("DELETE", `${base}/${draft.id}`)}>
                      Discard the draft
                    </button>
                  </>
                )}
              </div>
            </>
          )}
          {message && (
            <Notice tone="error" compact testId="widget-message">
              {message}
            </Notice>
          )}
        </div>
      </Can>
    </section>
  );
}

function RecordSection({
  organizationId,
  live,
  onRecorded,
  title,
}: {
  organizationId: string;
  live: WidgetVersion | null;
  onRecorded: (p: ConsentRegisterPayload) => void;
  title: PurposeTitle;
}) {
  const toast = useToast();
  const [identifier, setIdentifier] = useState("");
  const [action, setAction] = useState<ConsentAction>("given");
  const [purposes, setPurposes] = useState<string[]>([]);
  const [kind, setKind] = useState<PrincipalKind>("self");
  const [method, setMethod] = useState<VerificationMethod | "">("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const methods = VERIFICATION_METHODS_FOR[kind];

  if (!live) {
    return (
      <section data-testid="consent-record" className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
        <h3 className="font-semibold">Record a consent</h3>
        <p>A consent is recorded against a published widget version — publish one first.</p>
      </section>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const r = await apiFetch<ConsentRegisterPayload>(`/api/v1/organizations/${organizationId}/consent-records`, {
      method: "POST",
      body: JSON.stringify({
        configId: live!.id,
        identifier,
        action,
        purposes: action === "given" ? purposes : [],
        principalKind: kind,
        verificationMethod: method === "" ? null : method,
        reference,
      }),
    });
    setBusy(false);
    if (r.success) {
      onRecorded(r.data);
      setMessage({ ok: true, text: "Recorded." });
      toast.success("Consent recorded.");
      setIdentifier("");
      setReference("");
    } else setMessage({ ok: false, text: r.error.message });
  }

  return (
    <section data-testid="consent-record" className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold">Record a consent</h3>
      <p className="text-xs text-slate-600">
        For a choice made on paper, at a counter or by email — or to record how you verified a parent or guardian, as a new record
        restating the choice. The identifier is hashed and never stored.
      </p>
      <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-600">
          The person&apos;s identifier (an enrolment number, an email)
          <input data-testid="record-identifier" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={input} />
        </label>
        <label className="block text-xs text-slate-600">
          Their choice
          <select data-testid="record-action" value={action} onChange={(e) => setAction(e.target.value as ConsentAction)} className={input}>
            {CONSENT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {CONSENT_ACTION_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        {action === "given" && (
          <fieldset className="text-sm sm:col-span-2">
            <legend className="text-xs text-slate-600">Purposes consented to (widget version {live.version})</legend>
            {live.purposes.map((p) => (
              <label key={p} className="mr-4 inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  data-testid={`record-purpose-${p}`}
                  checked={purposes.includes(p)}
                  onChange={(e) => setPurposes(e.target.checked ? [...purposes, p] : purposes.filter((k) => k !== p))}
                />
                {title(p)}
              </label>
            ))}
          </fieldset>
        )}
        <label className="block text-xs text-slate-600">
          Whose consent
          <select
            data-testid="record-kind"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as PrincipalKind);
              setMethod("");
            }}
            className={input}
          >
            {PRINCIPAL_KINDS.map((k) => (
              <option key={k} value={k}>
                {PRINCIPAL_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        {methods.length > 0 && (
          <label className="block text-xs text-slate-600">
            How the parent or guardian was verified
            <select data-testid="record-method" value={method} onChange={(e) => setMethod(e.target.value as VerificationMethod | "")} className={input}>
              <option value="">Not verified yet</option>
              {methods.map((m) => (
                <option key={m} value={m}>
                  {VERIFICATION_METHOD_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block text-xs text-slate-600">
          Where it is on file (optional — a form number, not a name)
          <input data-testid="record-reference" value={reference} onChange={(e) => setReference(e.target.value)} className={input} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" data-testid="record-submit" disabled={busy} className={button}>
            Record
          </button>
          {message && (
            <Notice tone={message.ok ? "success" : "error"} compact testId="record-message" className="ml-3">
              {message.text}
            </Notice>
          )}
        </div>
      </form>
    </section>
  );
}

function LookupSection({ organizationId, title }: { organizationId: string; title: PurposeTitle }) {
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<ConsentHistoryPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const r = await apiFetch<ConsentHistoryPayload>(`/api/v1/organizations/${organizationId}/consent-records/lookup`, {
      method: "POST",
      body: JSON.stringify({ identifier }),
    });
    if (r.success) setResult(r.data);
    else setMessage(r.error.message);
  }

  return (
    <section data-testid="consent-lookup" className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold">Look up a person</h3>
      <form onSubmit={submit} className="mt-2 flex flex-wrap items-end gap-2">
        <label className="block flex-1 text-xs text-slate-600">
          Their identifier
          <input data-testid="lookup-identifier" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={input} />
        </label>
        <button type="submit" data-testid="lookup-submit" className={quiet}>
          Find
        </button>
      </form>
      {message && <Notice tone="error" compact className="mt-2">{message}</Notice>}
      {result && (
        <div className="mt-3">
          {result.records.length === 0 ? (
            <p data-testid="lookup-empty" className="text-sm text-slate-700">
              No consent is recorded for this identifier.
            </p>
          ) : (
            <>
              <p data-testid="lookup-now" className="text-sm">
                Now: <strong>{result.records[0]!.actionLabel}</strong>
                {result.records[0]!.purposes.length > 0 ? ` — ${result.records[0]!.purposes.map(title).join(", ")}` : ""}
              </p>
              <RecordList records={result.records} testId="lookup-records" title={title} />
            </>
          )}
        </div>
      )}
    </section>
  );
}

function RecentSection({ records, title }: { records: ConsentRecordView[]; title: PurposeTitle }) {
  return (
    <section data-testid="consent-recent" className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold">Latest choices</h3>
      {records.length === 0 ? (
        <p data-testid="consent-recent-empty" className="text-sm text-slate-700">
          No choice is recorded yet.
        </p>
      ) : (
        <RecordList records={records} testId="consent-recent-list" title={title} />
      )}
    </section>
  );
}

function RecordList({ records, testId, title }: { records: ConsentRecordView[]; testId: string; title: PurposeTitle }) {
  return (
    <div className="mt-2">
      <DataTable
        testId={testId}
        rows={records}
        rowKey={(r) => r.id}
        noun="choices"
        columns={[
          {
            key: "principal",
            header: "Data Principal",
            cell: (r) => (
              <span className="font-mono text-xs text-slate-500" title="Pseudonymous key">
                {r.principal}
              </span>
            ),
          },
          {
            key: "choice",
            header: "Choice",
            sortValue: (r) => r.actionLabel,
            cell: (r) => (
              <>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONSENT_ACTION_STYLE[r.action]}`}>{r.actionLabel}</span>
                {r.purposes.length > 0 && <span className="mt-1 block text-xs text-slate-700">{r.purposes.map(title).join(", ")}</span>}
              </>
            ),
          },
          {
            key: "who",
            header: "Given by",
            className: "text-xs",
            cell: (r) =>
              r.principalKind !== "self" ? (
                <span className={r.verificationMethod ? "text-slate-700" : "font-medium text-red-800"}>
                  {r.principalKindLabel} — {r.verificationLabel ?? "no verification recorded"}
                </span>
              ) : (
                <span className="text-slate-500">{r.principalKindLabel}</span>
              ),
          },
          {
            key: "recorded",
            header: "Recorded",
            className: "text-xs text-slate-500",
            sortValue: (r) => r.recordedAt,
            cell: (r) => (
              <>
                {r.sourceLabel}
                {r.recordedByName ? ` (${r.recordedByName})` : ""} · {formatInstant(r.recordedAt)} · widget v{r.configVersion}
              </>
            ),
          },
        ]}
      />
    </div>
  );
}

function Stat({ label, value, testId, alert }: { label: string; value: number; testId: string; alert?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd data-testid={testId} className={`text-lg font-semibold ${alert ? "text-red-800" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
