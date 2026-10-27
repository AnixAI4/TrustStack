import type { Metadata } from "next";
import { ScannerWorkspace } from "@/components/scanner/ScannerWorkspace";

export const metadata: Metadata = {
  title: "DPDP Compliance Scanner - consent, cookies & policy checks",
  description:
    "Scan any public website for DPDP-relevant signals: consent banners, privacy notices, cookie practices, trackers and related findings - with a scored report and prioritised fixes.",
};

export default function ScannerPage() {
  return <ScannerWorkspace />;
}
