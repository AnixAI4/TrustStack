import type { Metadata } from "next";
import { ScannerReportLoader } from "@/components/scanner/ScannerReportLoader";

export const metadata: Metadata = {
  title: "DPDP Assessment Report - TrustDeck",
  description:
    "Full DPDP readiness assessment with findings, remediation plan, and downloadable PDF.",
};

export default async function TrustDeckScannerReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return (
    <div className="min-h-[70vh]">
      <ScannerReportLoader reportId={decodeURIComponent(reportId)} />
    </div>
  );
}
