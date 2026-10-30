"use client";

import {
  BOARD_COMPLAINT_TEXT,
  CONSENT_LANGUAGES,
  CONSENT_LANGUAGE_LABEL,
  NOTICE_LIMITS,
  NOTICE_SECTIONS,
  noticeDataItems,
  noticePurposeProblems,
  WITHDRAW_TEXT,
  AI_TRANSLATION_LANGUAGES,
  CONSENT_LANGUAGE_LABEL as LANGUAGE_NAME,
  type ConsentLanguage,
  type NoticePurpose,
} from "@truststack/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DraftButton } from "@/components/ai/draft-panel";
import { Notice as MessageBox } from "@/components/feedback/notice";
import type { AiStoredDraft } from "@/lib/client/ai";
import { useToast } from "@/components/feedback/toast";
import { apiFetch } from "@/lib/client/api";
import { Can, usePermissions } from "@/lib/client/permissions";
import { formatInstant, type Notice } from "@/lib/client/consent";

const input = "mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
const button = "rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50";
const quiet = "rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50";

/** A purpose as the form edits it: the data items one per line. */
interface PurposeDraft {
  key: string;
  title: string;
  uses: string;
  dataItems: string;
}

const toDraft = (p: NoticePurpose): PurposeDraft => ({ ...p, dataItems: p.dataItems.join("\n") });
const fromDraft = (p: PurposeDraft): NoticePurpose => ({
  key: p.key.trim(),
  title: p.title.trim(),
  uses: p.uses.trim(),
  dataItems: p.dataItems
    .split("\n")
    .map((d) => d.trim())
    .filter((d) => d !== ""),
});

/**
 * One version of the privacy notice (s.5, Rule 3): a draft is edited here and
 * published by someone holding consent.publish; a published version is shown
 * read-only — a correction is a new version, started from it.
 *
 * Slice 11 Stage 2b (D-133): a new version may start from an ACCEPTED AI draft
 * (`?draft=`) — a notice drafted from the processing register, or a Hindi or
 * Marathi translation of a published one. The person checks every field, then
 * saves and publishes through this form's own routes; the AI writes nothing here.
 */
export function NoticeEditor({
  noticeId,
  fromId,
  draftId = null,
  saved = false,
}: {
  noticeId: string | null;
  fromId: string | null;
  draftId?: string | null;
  saved?: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [language, setLanguage] = useState<ConsentLanguage>("en");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [purposes, setPurposes] = useState<PurposeDraft[]>([{ key: "", title: "", uses: "", dataItems: "" }]);
  const [withdrawMeans, setWithdrawMeans] = useState("");
  const [rightsMeans, setRightsMeans] = useState("");
  const [complaintMeans, setComplaintMeans] = useState("");
  // A new draft moves to its own address; the confirmation travels with it.
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(saved ? { ok: true, text: "Draft saved." } : null);
  const [busy, setBusy] = useState(false);
  // Slice 10.5 B3 (F3.7): what is still missing shows once someone leaves a purpose field or saves — not on a blank form.
  const [touched, setTouched] = useState(false);
  const [loaded, setLoaded] = useState(noticeId === null && fromId === null && draftId === null);
  const [aiSource, setAiSource] = useState<{ translation: boolean; acceptedBy: string | null } | null>(null);

  function fill(n: Notice) {
    setLanguage(n.language);
    setTitle(n.title);
    setSummary(n.summary ?? "");
    setPurposes(n.purposes.length > 0 ? n.purposes.map(toDraft) : [{ key: "", title: "", uses: "", dataItems: "" }]);
    setWithdrawMeans(n.withdrawMeans ?? "");
    setRightsMeans(n.rightsMeans ?? "");
    setComplaintMeans(n.complaintMeans ?? "");
  }

  // An accepted AI draft: its person-edited text pre-fills a NEW version (nothing is saved yet).
  useEffect(() => {
    if (!organizationId || !draftId || noticeId) return;
    apiFetch<{ draft: AiStoredDraft }>(`/api/v1/organizations/${organizationId}/ai/drafts/${draftId}`).then((r) => {
      setLoaded(true);
      if (!r.success) return setMessage({ ok: false, text: r.error.message });
      const d = r.data.draft;
      const out = d.status === "accepted" && (d.task === "notice_draft" || d.task === "notice_translation_draft") ? d.acceptedOutput : null;
      if (!out) return setMessage({ ok: false, text: "That draft is not an accepted notice draft. Start from a blank notice instead." });
      setLanguage((out.language as ConsentLanguage) ?? "en");
      setTitle(String(out.title ?? ""));
      setSummary(String(out.summary ?? ""));
      const ps = (out.purposes as NoticePurpose[] | undefined) ?? [];
      setPurposes(ps.length > 0 ? ps.map(toDraft) : [{ key: "", title: "", uses: "", dataItems: "" }]);
      setAiSource({ translation: d.task === "notice_translation_draft", acceptedBy: d.decidedByName });
    });
  }, [organizationId, draftId, noticeId]);

  useEffect(() => {
    if (!organizationId) return;
    const id = noticeId ?? fromId;
    if (!id) return;
    apiFetch<{ notice: Notice }>(`/api/v1/organizations/${organizationId}/privacy-notices/${id}`).then((r) => {
      setLoaded(true);
      if (!r.success) return setMessage({ ok: false, text: r.error.message });
      fill(r.data.notice);
      if (noticeId) setNotice(r.data.notice);
    });
  }, [organizationId, noticeId, fromId]);

  if (permissions.kind === "loading" || !loaded) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!organizationId) return null;

  const readOnly = notice?.status === "published";
  const parsed = purposes.map(fromDraft);
  const problems = noticePurposeProblems(parsed);
  const content = {
    title,
    summary,
    purposes: parsed,
    withdrawMeans,
    rightsMeans,
    complaintMeans,
  };

  async function save(publish: boolean) {
    setTouched(true);
    setBusy(true);
    setMessage(null);
    const base = `/api/v1/organizations/${organizationId}/privacy-notices`;
    const r = notice
      ? await apiFetch<{ notice: Notice }>(`${base}/${notice.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...content, ...(publish ? { status: "published" } : {}) }),
        })
      : await apiFetch<{ notice: Notice }>(base, { method: "POST", body: JSON.stringify({ language, ...content }) });
    if (!r.success) {
      setBusy(false);
      return setMessage({ ok: false, text: r.error.message });
    }
    // A NEW draft moves to its own address, which shows "Draft saved." and the Publish button. Until
    // that page is up, this one stays busy and offers no Publish: a click in between published the
    // draft and was then overwritten by "Draft saved." (the consent e2e race, D-136).
    if (!notice) {
      toast.success("Draft saved.");
      router.replace(`/dashboard/consent/notices/${r.data.notice.id}?saved=1`);
      return;
    }
    setBusy(false);
    setNotice(r.data.notice);
    fill(r.data.notice);
    setMessage({ ok: true, text: publish ? `Version ${r.data.notice.version} is published.` : "Draft saved." });
    toast.success(publish ? `Version ${r.data.notice.version} is published.` : "Draft saved.");
  }

  async function discard() {
    if (!notice) return;
    setBusy(true);
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/privacy-notices/${notice.id}`, { method: "DELETE" });
    setBusy(false);
    if (!r.success) return setMessage({ ok: false, text: r.error.message });
    router.push("/dashboard/consent");
  }

  const set = (i: number, field: keyof PurposeDraft, value: string) =>
    setPurposes(purposes.map((p, j) => (j === i ? { ...p, [field]: value } : p)));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/consent" className="text-xs text-indigo-800 hover:underline">
          ← Notice and consent
        </Link>
        <h2 data-testid="notice-heading" className="text-lg font-semibold">
          {notice
            ? `${notice.languageLabel} privacy notice — version ${notice.version} (${notice.statusLabel.toLowerCase()})`
            : "A new version of the privacy notice"}
        </h2>
        {notice?.publishedAt && (
          <p className="text-sm text-slate-600">
            Published {formatInstant(notice.publishedAt)}
            {notice.publishedByName ? ` by ${notice.publishedByName}` : ""}. A published version never changes.
          </p>
        )}
        <p className="text-sm text-slate-600">
          Rule 3 asks for a notice a person can understand on its own, in clear and plain language: every purpose, what it provides or
          enables, and the personal data it needs, itemised; and how to withdraw consent, exercise their rights and complain to the
          Board. TrustStack adds to every published notice the links to your public request and grievance forms, and fixed wording on withdrawal and on the Board.
        </p>
      </div>

      {aiSource && !notice && (
        <MessageBox tone="info" compact testId="notice-from-draft">
          {aiSource.translation ? "Pre-filled from an AI translation" : "Pre-filled from an AI draft"}
          {aiSource.acceptedBy ? ` accepted by ${aiSource.acceptedBy}` : ""}. A legal draft: check every purpose with counsel, then save it
          {aiSource.translation ? " — each purpose keeps its key, so a consent means the same in every language" : ""}. Nothing is saved until you
          save.
        </MessageBox>
      )}

      {readOnly ? (
        <section data-testid="notice-published" className="space-y-4 rounded-xl border border-slate-200 p-4 text-sm">
          <h3 className="text-base font-semibold">{notice!.title}</h3>
          {notice!.summary && <p>{notice!.summary}</p>}
          <div>
            <p className="font-medium">{NOTICE_SECTIONS.data}</p>
            <p>{notice!.dataItems.join(", ")}</p>
          </div>
          <div>
            <p className="font-medium">{NOTICE_SECTIONS.purposes}</p>
            <ul className="list-disc pl-5">
              {notice!.purposes.map((p) => (
                <li key={p.key}>
                  <strong>{p.title}</strong> — {p.uses} ({p.dataItems.join(", ")})
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Can permission="consent.write">
              <Link href={`/dashboard/consent/notices/new?from=${notice!.id}`} data-testid="notice-new-from" className={quiet}>
                Start a new version from this one
              </Link>
            </Can>
            {/* Slice 11 Stage 2b (D-133.2): Hindi and Marathi first; the button hides without consent.write or the assistant. */}
            {AI_TRANSLATION_LANGUAGES.filter((l) => l !== notice!.language).map((l) => (
              <DraftButton
                key={l}
                organizationId={organizationId}
                task="notice_translation_draft"
                body={{ noticeId: notice!.id, language: l }}
                label={`Translate into ${LANGUAGE_NAME[l]}`}
                subject={`${notice!.languageLabel} notice, version ${notice!.version} → ${LANGUAGE_NAME[l]}`}
                onAccepted={(d: AiStoredDraft) => router.push(`/dashboard/consent/notices/new?draft=${d.id}`)}
                testId={`notice-translate-${l}`}
              />
            ))}
          </div>
        </section>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save(false);
          }}
          className="space-y-4 rounded-xl border border-slate-200 p-4"
        >
          {!notice && (
            <label className="block text-xs text-slate-600">
              Language
              <select data-testid="notice-language" value={language} onChange={(e) => setLanguage(e.target.value as ConsentLanguage)} className={input}>
                {CONSENT_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {CONSENT_LANGUAGE_LABEL[l]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs text-slate-600">
            Title
            <input data-testid="notice-title" required maxLength={NOTICE_LIMITS.title} value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
          </label>
          <label className="block text-xs text-slate-600">
            Introduction (optional)
            <textarea data-testid="notice-summary" rows={3} maxLength={NOTICE_LIMITS.summary} value={summary} onChange={(e) => setSummary(e.target.value)} className={input} />
          </label>

          <fieldset className="space-y-3" onBlur={() => setTouched(true)}>
            <legend className="text-sm font-medium">Purposes (Rule 3(b))</legend>
            {purposes.map((p, i) => (
              <div key={i} data-testid={`notice-purpose-${i}`} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                <label className="block text-xs text-slate-600">
                  Key (what the widget and records name it by, e.g. <code>alumni_updates</code>)
                  <input data-testid={`purpose-key-${i}`} value={p.key} onChange={(e) => set(i, "key", e.target.value)} className={input} />
                </label>
                <label className="block text-xs text-slate-600">
                  Title
                  <input data-testid={`purpose-title-${i}`} value={p.title} onChange={(e) => set(i, "title", e.target.value)} className={input} />
                </label>
                <label className="block text-xs text-slate-600 sm:col-span-2">
                  What it provides or enables
                  <textarea data-testid={`purpose-uses-${i}`} rows={2} value={p.uses} onChange={(e) => set(i, "uses", e.target.value)} className={input} />
                </label>
                <label className="block text-xs text-slate-600 sm:col-span-2">
                  The personal data it needs — one item per line
                  <textarea data-testid={`purpose-data-${i}`} rows={3} value={p.dataItems} onChange={(e) => set(i, "dataItems", e.target.value)} className={input} />
                </label>
                {purposes.length > 1 && (
                  <button type="button" className="justify-self-start text-xs text-red-800 hover:underline" onClick={() => setPurposes(purposes.filter((_, j) => j !== i))}>
                    Remove this purpose
                  </button>
                )}
              </div>
            ))}
            {purposes.length < NOTICE_LIMITS.purposes && (
              <button
                type="button"
                data-testid="notice-add-purpose"
                className={quiet}
                onClick={() => setPurposes([...purposes, { key: "", title: "", uses: "", dataItems: "" }])}
              >
                Add a purpose
              </button>
            )}
            <p className="text-xs text-slate-600">
              The itemised personal data, across every purpose: {noticeDataItems(parsed).join(", ") || "none yet"}.
            </p>
          </fieldset>

          <label className="block text-xs text-slate-600">
            {NOTICE_SECTIONS.withdraw} — other means, if any
            <textarea data-testid="notice-withdraw" rows={2} value={withdrawMeans} onChange={(e) => setWithdrawMeans(e.target.value)} className={input} />
            <span className="mt-1 block text-slate-500">Always shown: “{WITHDRAW_TEXT}”</span>
          </label>
          <label className="block text-xs text-slate-600">
            {NOTICE_SECTIONS.rights} — other means, if any
            <textarea data-testid="notice-rights" rows={2} value={rightsMeans} onChange={(e) => setRightsMeans(e.target.value)} className={input} />
            <span className="mt-1 block text-slate-500">Always shown: links to your public request and grievance forms, and your contact.</span>
          </label>
          <label className="block text-xs text-slate-600">
            {NOTICE_SECTIONS.board} — anything to add
            <textarea data-testid="notice-board" rows={2} value={complaintMeans} onChange={(e) => setComplaintMeans(e.target.value)} className={input} />
            <span className="mt-1 block text-slate-500">Always shown: “{BOARD_COMPLAINT_TEXT}”</span>
          </label>

          {problems.length > 0 && (touched || notice !== null) && (
            <MessageBox tone="warning" compact testId="notice-problems"><ul className="list-disc space-y-0.5 pl-4">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul></MessageBox>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="submit" data-testid="notice-save" disabled={busy} className={quiet}>
              Save draft
            </button>
            {notice && (
              <>
                <Can permission="consent.publish">
                  <button type="button" data-testid="notice-publish" disabled={busy || problems.length > 0} className={button} onClick={() => void save(true)}>
                    Publish version {notice.version}
                  </button>
                </Can>
                <button type="button" data-testid="notice-discard" disabled={busy} className={quiet} onClick={() => void discard()}>
                  Discard the draft
                </button>
              </>
            )}
          </div>
        </form>
      )}
      {message && (
        <MessageBox tone={message.ok ? "success" : "error"} compact testId="notice-message">
          {message.text}
        </MessageBox>
      )}
    </div>
  );
}
