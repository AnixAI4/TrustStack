import { Questionnaire } from "./questionnaire";

export const metadata = { title: "Processor assessment · TrustStack DPDP Compass" };

export default async function ProcessorAssessmentPage({ params }: { params: Promise<{ vendorId: string; assessmentId: string }> }) {
  const { vendorId, assessmentId } = await params;
  return <Questionnaire vendorId={vendorId} assessmentId={assessmentId} />;
}
