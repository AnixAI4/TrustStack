import { RecordView } from "../record-view";

export const metadata = { title: "New processing record · TrustStack DPDP Compass" };

/** `?draft={id}`: an accepted AI draft pre-fills the form; the person saves (Slice 11 Stage 2a, D-129). */
export default async function NewRopaRecordPage({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const { draft } = await searchParams;
  return <RecordView recordId={null} draftId={typeof draft === "string" ? draft : null} />;
}
