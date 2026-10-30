import { BreachDetail } from "./breach-detail";

export const metadata = { title: "Breach · TrustStack DPDP Compass" };

export default async function BreachPage({ params }: { params: Promise<{ breachId: string }> }) {
  const { breachId } = await params;
  return <BreachDetail breachId={breachId} />;
}
