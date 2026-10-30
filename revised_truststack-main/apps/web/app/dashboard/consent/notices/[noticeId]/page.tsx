import { NoticeEditor } from "../notice-editor";

export const metadata = { title: "Privacy notice · TrustStack DPDP Compass" };

export default async function NoticePage({
  params,
  searchParams,
}: {
  params: Promise<{ noticeId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  return <NoticeEditor noticeId={(await params).noticeId} fromId={null} saved={(await searchParams).saved === "1"} />;
}
