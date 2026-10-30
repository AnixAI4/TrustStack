import { GapRegister } from "./gap-register";

export const metadata = { title: "Gap register · TrustStack DPDP Compass" };

export default async function GapRegisterPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  return <GapRegister assessmentId={assessmentId} />;
}
