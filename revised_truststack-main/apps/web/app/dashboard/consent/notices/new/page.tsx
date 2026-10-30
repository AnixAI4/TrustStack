import { NoticeEditor } from "../notice-editor";

export const metadata = { title: "New privacy notice version · TrustStack DPDP Compass" };

/** `?from=` starts from a published version; `?draft=` from an accepted AI draft or translation (Slice 11 Stage 2b). */
export default async function NewNoticePage({ searchParams }: { searchParams: Promise<{ from?: string; draft?: string }> }) {
  const params = await searchParams;
  return <NoticeEditor noticeId={null} fromId={params.from ?? null} draftId={params.draft ?? null} />;
}
