import { ExecutiveOverview } from "./executive-overview";
import { OrganizationPanel } from "./organization-panel";

export const metadata = { title: "Overview · TrustStack DPDP Compass" };

export default function DashboardPage() {
  return (
    <>
      <OrganizationPanel />
      <ExecutiveOverview />
    </>
  );
}
