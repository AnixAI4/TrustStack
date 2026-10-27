import { redirect } from "next/navigation";

export default async function SectionLegacyPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const n = Number(s);
  if (n >= 1 && n <= 44) {
    redirect(`/section/${n}`);
  }
  redirect("/act");
}
