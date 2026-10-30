import { IntakeForm } from "../intake-form";
import { publicProfileOr404, PublicShell } from "../profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Raise a grievance", robots: { index: false } };

/** The public grievance form (s.13; Rule 14(3)). */
export default async function PublicGrievancePage({ params }: { params: Promise<{ slug: string }> }) {
  const profile = await publicProfileOr404((await params).slug);
  return (
    <PublicShell back profile={profile} title="Raise a grievance">
      <IntakeForm slug={profile.slug} surface="grievance" organizationName={profile.name} />
    </PublicShell>
  );
}
