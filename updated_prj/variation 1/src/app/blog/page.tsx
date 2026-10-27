import type { Metadata } from "next";
import { EditorialPressHero } from "@/components/sections/EditorialPressHero";
import { BlogBrowser } from "@/components/resources/BlogBrowser";
import { CtaBand } from "@/components/sections/CtaBand";
import { HERO_CONFIGS } from "@/content/hero-configs";

export const metadata: Metadata = {
  title: "Insights | DPDP analysis, guides & commentary",
};

export default function BlogPage() {
  return (
    <>
      <EditorialPressHero {...HERO_CONFIGS.blog} />
      <BlogBrowser />
      <CtaBand />
    </>
  );
}
