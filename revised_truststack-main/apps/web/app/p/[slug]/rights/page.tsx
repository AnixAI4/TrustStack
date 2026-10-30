import { IntakeForm } from "../intake-form";
import { publicProfileOr404, PublicShell } from "../profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Make a request about your personal data", robots: { index: false } };

/** The public rights form (s.11, s.12, s.14; Rule 14(1)–(2), (4)). */
export default async function PublicRightsPage({ params }: { params: Promise<{ slug: string }> }) {
  const profile = await publicProfileOr404((await params).slug);
  return (
    <PublicShell back profile={profile} title="Make a request about your personal data">
      <IntakeForm slug={profile.slug} surface="rights" organizationName={profile.name} />
    </PublicShell>
  );
}
