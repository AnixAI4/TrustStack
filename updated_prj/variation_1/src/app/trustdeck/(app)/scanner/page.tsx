import type { Metadata } from "next";
import { ScannerWorkspace } from "@/components/scanner/ScannerWorkspace";

export const metadata: Metadata = {
  title: "DPDP Scanner - TrustDeck",
  description:
    "Scan any public website for DPDP-relevant signals: consent banners, privacy notices, cookie practices, trackers and related findings - with a scored report and prioritised fixes.",
};

export default function TrustDeckScannerPage() {
  return <ScannerWorkspace basePath="/trustdeck/scanner" />;
}
