import {
  BOARD_COMPLAINT_TEXT,
  CONSENT_LANGUAGE_LABEL,
  isConsentLanguage,
  isPublicSlug,
  NOTICE_SECTIONS,
  noticeDataItems,
  publicPaths,
  WITHDRAW_TEXT,
} from "@truststack/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readPublicNotice } from "@/lib/intake/rpc";
import { PublicShell } from "../profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy notice", robots: { index: false } };

/**
 * The organisation's privacy notice (s.5, Rule 3): the latest PUBLISHED
 * version in the language asked for (else English, else the newest), with
 * every Rule 3(c) means — withdrawing consent, the public request and
 * grievance forms, and complaining to the Board. The same not-found page as
 * every public page when there is none (D-084).
 */
export default async function PublicNoticePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  if (!isPublicSlug(slug)) notFound();
  const page = await readPublicNotice(slug, lang && isConsentLanguage(lang) ? lang : null);
  if (!page) notFound();
  const { organization, notice, languages } = page;
  const paths = publicPaths(organization.slug);

  return (
    <PublicShell back profile={organization} title={notice.title}>
      <p data-testid="notice-version" className="text-xs text-slate-500">
        {CONSENT_LANGUAGE_LABEL[notice.language]} · version {notice.version} · published{" "}
        {new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date(notice.publishedAt))}
      </p>
      {languages.length > 1 && (
        <p data-testid="notice-languages" className="text-sm">
          Also in:{" "}
          {languages
            .filter((l) => l !== notice.language)
            .map((l, i) => (
              <span key={l}>
                {i > 0 && " · "}
                <Link href={`${paths.notice}?lang=${l}`} className="text-indigo-800 underline">
                  {CONSENT_LANGUAGE_LABEL[l]}
                </Link>
              </span>
            ))}
        </p>
      )}
      {notice.summary && <p className="text-slate-700">{notice.summary}</p>}

      <section className="space-y-2">
        <h2 className="font-semibold">{NOTICE_SECTIONS.data}</h2>
        <ul data-testid="notice-data-items" className="list-disc pl-5 text-slate-700">
          {noticeDataItems(notice.purposes).map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">{NOTICE_SECTIONS.purposes}</h2>
        <ul data-testid="notice-purposes" className="space-y-3">
          {notice.purposes.map((p) => (
            <li key={p.key} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-slate-700">{p.uses}</p>
              <p className="text-xs text-slate-500">Personal data: {p.dataItems.join(", ")}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">{NOTICE_SECTIONS.withdraw}</h2>
        <p data-testid="notice-withdraw" className="text-sm text-slate-700">
          {WITHDRAW_TEXT}
        </p>
        {notice.withdrawMeans && <p className="text-sm text-slate-700">{notice.withdrawMeans}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">{NOTICE_SECTIONS.rights}</h2>
        <p className="text-sm text-slate-700">
          You may ask for a summary of your personal data, its correction, completion, updating or erasure, or nominate someone
          (sections 11–14):{" "}
          <Link data-testid="notice-rights-link" href={paths.rights} className="text-indigo-800 underline">
            make a request
          </Link>
          , or{" "}
          <Link data-testid="notice-grievance-link" href={paths.grievance} className="text-indigo-800 underline">
            raise a grievance
          </Link>
          .
        </p>
        {notice.rightsMeans && <p className="text-sm text-slate-700">{notice.rightsMeans}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">{NOTICE_SECTIONS.board}</h2>
        <p data-testid="notice-board" className="text-sm text-slate-700">
          {BOARD_COMPLAINT_TEXT}
        </p>
        {notice.complaintMeans && <p className="text-sm text-slate-700">{notice.complaintMeans}</p>}
      </section>
    </PublicShell>
  );
}
