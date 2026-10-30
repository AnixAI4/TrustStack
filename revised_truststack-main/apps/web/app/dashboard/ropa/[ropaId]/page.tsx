import { RecordView } from "../record-view";

export const metadata = { title: "Processing record · TrustStack DPDP Compass" };

export default async function RopaRecordPage({ params }: { params: Promise<{ ropaId: string }> }) {
  const { ropaId } = await params;
  return <RecordView recordId={ropaId} />;
}
