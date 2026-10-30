import { RightsDetail } from "./rights-detail";

export const metadata = { title: "Request · TrustStack DPDP Compass" };

export default async function RightsRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  return <RightsDetail requestId={requestId} />;
}
