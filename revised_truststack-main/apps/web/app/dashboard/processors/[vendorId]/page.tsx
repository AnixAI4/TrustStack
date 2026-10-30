import { ProcessorDetail } from "./processor-detail";

export const metadata = { title: "Processor · TrustStack DPDP Compass" };

export default async function ProcessorPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  return <ProcessorDetail vendorId={vendorId} />;
}
