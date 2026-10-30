import "server-only";
import { contactLine, fiduciaryName, isPublicSlug } from "@truststack/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readPublicProfile, type PublicProfile } from "@/lib/intake/rpc";

/**
 * The organisation behind a public address, or the SAME not-found page for an
 * unknown slug, a malformed one and a tenant without public pages (D-084).
 */
export async function publicProfileOr404(slug: string): Promise<PublicProfile> {
  if (!isPublicSlug(slug)) notFound();
  const profile = await readPublicProfile(slug);
  if (!profile) notFound();
  return profile;
}

/**
 * Every public page: whose page it is, and the Rule 9 contact it must name.
 * One name for the organisation — its display name, the legal name once in
 * the footer (F5.2) — and, below the home page, a way back to it (F5.3).
 */
export function PublicShell({
  profile,
  title,
  back = false,
  children,
}: {
  profile: PublicProfile;
  title: string;
  /** A "← Back to …" link to the organisation's public home page. */
  back?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main data-public-content className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <header className="space-y-1 border-b-2 border-brand-navy pb-4">
        <Link href={`/p/${profile.slug}`} className="text-xs font-semibold uppercase tracking-wide text-brand-blue hover:underline">
          {profile.name}
        </Link>
        {back && (
          <p>
            <Link data-testid="public-back" href={`/p/${profile.slug}`} className="text-sm text-brand-blue hover:underline">
              ← Back to {profile.name}&rsquo;s privacy page
            </Link>
          </p>
        )}
        <h1 data-testid="public-title" className="text-2xl font-semibold text-brand-navy">
          {title}
        </h1>
      </header>
      {children}
      <footer className="space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
        <p data-testid="public-contact">
          <span className="font-medium text-slate-800">Questions about your personal data:</span> {contactLine(profile.contact)}
        </p>
        <p className="text-xs text-slate-500">
          {fiduciaryName(profile.name, profile.legalName)} answers every request and grievance within ninety days of receipt (DPDP Rules,
          2025, Rule 14(3)). This page is provided by TrustStack DPDP Compass on its behalf.
        </p>
      </footer>
    </main>
  );
}
