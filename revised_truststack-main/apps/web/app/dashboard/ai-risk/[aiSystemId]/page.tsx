import { AiDetail } from "./ai-detail";

export const metadata = { title: "AI system · TrustStack DPDP Compass" };

export default async function AiSystemPage({ params }: { params: Promise<{ aiSystemId: string }> }) {
  const { aiSystemId } = await params;
  return <AiDetail aiSystemId={aiSystemId} />;
}
