"use client";

import { isPublicSlug, publicPaths, suggestPublicSlug } from "@truststack/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";

interface Contact {
  name: string;
  email: string;
  phone: string | null;
  isDpo: boolean;
}

interface PublicPages {
  slug: string | null;
  contact: Contact | null;
}

interface Organisation {
  name: string;
  publicPages: PublicPages;
}

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; saved: PublicPages; name: string };

const input = "w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500";

/**
 * The organisation's public pages (Slice 10 Stage 3a): the address Data
 * Principals use to make a request or a grievance (Rule 14(1)–(2)), and the
 * Rule 9 contact every page and email names. Set by `organization.update`
 * only. No address = no public pages.
 */
export function PublicPagesForm() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canEdit = permissions.kind === "ready" && permissions.value.permissions.includes("organization.update");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isDpo, setIsDpo] = useState(false);
  // "warn": saved, but the pages are still closed — not a success to read past.
  const [message, setMessage] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  function load(org: Organisation) {
    const saved = org.publicPages;
    setState({ kind: "ready", saved, name: org.name });
    setSlug(saved.slug ?? "");
    setName(saved.contact?.name ?? "");
    setEmail(saved.contact?.email ?? "");
    setPhone(saved.contact?.phone ?? "");
    setIsDpo(saved.contact?.isDpo ?? false);
  }

  useEffect(() => {
    if (permissions.kind === "error") setState({ kind: "error", message: permissions.message });
    if (!organizationId) return;
    apiFetch<{ organization: Organisation }>(`/api/v1/organizations/${organizationId}`).then((r) => {
      if (!r.success) return setState({ kind: "error", message: r.error.message });
      load(r.data.organization);
    });
  }, [organizationId, permissions]);

  if (state.kind !== "ready") {
    return state.kind === "error" ? (
      <Notice tone="error">{state.message}</Notice>
    ) : (
      <p className="text-sm text-slate-500">Loading…</p>
    );
  }

  async function send(value: PublicPages, done: string, tone: "ok" | "warn" = "ok") {
    setSaving(true);
    setMessage(null);
    const r = await apiFetch<{ organization: Organisation }>(`/api/v1/organizations/${organizationId}`, {
      method: "PATCH",
      body: JSON.stringify({ publicPages: value }),
    });
    setSaving(false);
    if (!r.success) return setMessage({ tone: "error", text: r.error.details?.[0]?.issue ?? r.error.message });
    load(r.data.organization);
    setMessage({ tone, text: done });
  }

  const contact = (): Contact => ({ name, email, phone: phone || null, isDpo });
  const live = state.saved.slug;
  const slugValid = slug === "" || isPublicSlug(slug);
  const suggestion = suggestPublicSlug(state.name);

  return (
    <form
      data-testid="public-pages-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (slug) void send({ slug, contact: contact() }, "Public pages saved.");
        else
          void send(
            { slug: null, contact: contact() },
            "Contact saved — but the public pages are still closed: the address box is empty. Type an address and save again to open them.",
            "warn",
          );
      }}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <div>
        <h2 className="text-lg font-semibold">Public pages</h2>
        <p className="text-sm text-slate-600">
          Where Data Principals make a request about their personal data or raise a grievance (DPDP Rules, 2025, Rule 14).
          Each page and every email they receive names the contact below (Rule 9). A request made online is received the
          day it is submitted; the ninety days start then.
        </p>
      </div>
      <p data-testid="public-pages-status" className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {live ? (
          <>
            Open at{" "}
            <Link data-testid="public-pages-link" className="font-medium text-indigo-700 underline" href={publicPaths(live).home} target="_blank">
              {publicPaths(live).home}
            </Link>{" "}
            — requests at <span className="font-mono">{publicPaths(live).rights}</span>, grievances at{" "}
            <span className="font-mono">{publicPaths(live).grievance}</span>.
          </>
        ) : (
          "Closed. Nobody can make a request or a grievance online until an address and a contact are set."
        )}
      </p>
      {canEdit ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium sm:col-span-2">
              Public address
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-500">/p/</span>
                <input
                  data-testid="public-slug"
                  className={`${input} font-mono`}
                  maxLength={63}
                  placeholder={`e.g. ${suggestion || "your-organisation"}`}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                />
                {slug === "" && suggestion && (
                  <button
                    type="button"
                    data-testid="public-slug-suggest"
                    onClick={() => setSlug(suggestion)}
                    className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Use {suggestion}
                  </button>
                )}
              </div>
              <span className={`block text-xs ${slugValid ? "text-slate-500" : "text-red-700"}`}>
                3–63 lower-case letters, digits and hyphens. Leave empty to close the public pages.
              </span>
            </label>
            <label className="space-y-1 text-sm font-medium">
              Contact name
              <input data-testid="public-contact-name" className={input} required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Contact email
              <input
                data-testid="public-contact-email"
                className={input}
                type="email"
                required
                maxLength={320}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Contact phone (optional)
              <input data-testid="public-contact-phone" className={input} maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 self-end text-sm font-medium">
              <input data-testid="public-contact-is-dpo" type="checkbox" checked={isDpo} onChange={(e) => setIsDpo(e.target.checked)} />
              This is our Data Protection Officer
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              data-testid="public-pages-save"
              disabled={saving || !slugValid}
              className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save public pages"}
            </button>
            {live && (
              <button
                type="button"
                data-testid="public-pages-close"
                disabled={saving}
                onClick={() => void send({ slug: null, contact: contact() }, "The public pages are closed.")}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
              >
                Close public pages
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600">Only an Organisation Admin or consultant can open or change the public pages.</p>
      )}
      {message && (
        <p
          data-testid="public-pages-message"
          className={`rounded-md px-3 py-2 text-sm ${
            message.tone === "ok" ? "bg-emerald-50 text-emerald-800" : message.tone === "warn" ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
