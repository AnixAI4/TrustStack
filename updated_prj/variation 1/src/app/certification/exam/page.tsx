import type { Metadata } from "next";
import { DpdpExam } from "@/components/sections/DpdpExam";

export const metadata: Metadata = {
  title: "DPDP Practitioner Exam",
  description:
    "Answer five DPDP Practitioner certification questions correctly to unlock a personalised, verifiable certificate.",
  robots: { index: false, follow: false },
};

export default function ExamPage() {
  return <DpdpExam />;
}
