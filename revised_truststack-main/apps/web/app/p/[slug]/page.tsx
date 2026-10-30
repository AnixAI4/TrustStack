import { publicPaths } from "@truststack/core";
import Link from "next/link";
import { readPublicNotice } from "@/lib/intake/rpc";
import { publicProfileOr404, PublicShell } from "./profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your personal data", robots: { index: false } };

/** The organisation's public page: the two ways in (Rule 14(1)), its contact (Rule 9), and its privacy notice once published (Rule 3). */
export default async function PublicHome({ params }: { params: Promise<{ slug: string }> }) {
  const profile = await publicProfileOr404((await params).slug);
  const paths = publicPaths(profile.slug);
  const notice = await readPublicNotice(profile.slug, null);
  return (
    <PublicShell profile={profile} title="Your personal data">
      <p className="text-slate-700">
        Under the Digital Personal Data Protection Act, 2023 you may ask {profile.name} about the personal data it holds about you,
        and raise a grievance if you are not satisfied with how it has been handled.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          data-testid="public-rights-link"
          href={paths.rights}
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300"
        >
          <p className="font-semibold">Make a request</p>
          <p className="text-sm text-slate-600">Access, correction, completion, updating or erasure of your data, or nominating someone (s.11–14).</p>
        </Link>
        <Link
          data-testid="public-grievance-link"
          href={paths.grievance}
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300"
        >
          <p className="font-semibold">Raise a grievance</p>
          <p className="text-sm text-slate-600">About how your personal data was processed, or how a request was answered (s.13).</p>
        </Link>
      </div>
      {notice && (
        <Link
          data-testid="public-notice-link"
          href={paths.notice}
          className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300"
        >
          <p className="font-semibold">Read our privacy notice</p>
          <p className="text-sm text-slate-600">What personal data we process, why, and how to withdraw your consent (s.5).</p>
        </Link>
      )}
    </PublicShell>
  );
}
