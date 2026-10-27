import type { Metadata } from "next";
import { ScannerReportLoader } from "@/components/scanner/ScannerReportLoader";

export const metadata: Metadata = {
  title: "DPDP Assessment Report - TrustStack",
  description:
    "Full DPDP readiness assessment with findings, remediation plan, and downloadable PDF.",
};

export default async function ScannerReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return (
    <main className="container-x min-h-[70vh]">
      <ScannerReportLoader reportId={decodeURIComponent(reportId)} />
    </main>
  );
}
