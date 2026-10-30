import { ScheduleDetail } from "./schedule-detail";

export const metadata = { title: "Retention schedule · TrustStack DPDP Compass" };

export default async function RetentionSchedulePage({ params }: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = await params;
  return <ScheduleDetail scheduleId={scheduleId} />;
}
