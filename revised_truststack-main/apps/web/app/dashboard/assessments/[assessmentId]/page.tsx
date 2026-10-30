import { AssessmentDetail } from "./assessment-detail";

export const metadata = { title: "Assessment · TrustStack DPDP Compass" };

export default async function AssessmentPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  return <AssessmentDetail assessmentId={assessmentId} />;
}
