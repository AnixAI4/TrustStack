import type { Metadata } from "next";
import { IndustryExperience } from "@/components/sections/IndustryExperience";
import { IndustryAdvisor } from "@/components/sections/IndustryAdvisor";

export const metadata: Metadata = {
  title: "Industries - DPDP playbooks by sector",
};

export default function IndustriesPage() {
  return (
    <>
      <IndustryExperience />
      <IndustryAdvisor id="advisor" />
    </>
  );
}
