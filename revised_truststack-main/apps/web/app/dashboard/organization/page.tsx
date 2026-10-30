import { Tabs } from "@/components/ui/tabs";
import { AiForm } from "./ai-form";
import { ProfileForm } from "./profile-form";
import { PublicPagesForm } from "./public-pages-form";
import { SdfForm } from "./sdf-form";
import { ThirdScheduleForm } from "./third-schedule-form";

export const metadata = { title: "Organisation settings · TrustStack DPDP Compass" };

/**
 * Organisation settings (Slice 10.5 B1, F1.10): different settings, one at a
 * time — the profile first; the AI assistant's switch last (Slice 11 Stage 1b). Each tab is the same form as before, saving
 * on its own; the panels stay mounted, so a half-typed form survives a switch.
 */
export default function OrganizationPage() {
  return (
    <Tabs
      label="Organisation settings"
      testId="organization-tabs"
      tabs={[
        { id: "profile", label: "Profile", content: <ProfileForm /> },
        { id: "sdf", label: "Significant Data Fiduciary", content: <SdfForm /> },
        { id: "third-schedule", label: "Third Schedule class", content: <ThirdScheduleForm /> },
        { id: "public-pages", label: "Public pages", content: <PublicPagesForm /> },
        { id: "ai", label: "AI assistant", content: <AiForm /> },
      ]}
    />
  );
}
