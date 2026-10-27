"use client";

import { useEffect, useState } from "react";
import { TemplateDownloads } from "@/components/resources/TemplateDownloads";

/** Sidebar download block - only after purchase (matches original layout). */
export function TemplateDownloadAside({ slug }: { slug: string }) {
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/templates/purchases", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { purchased?: string[] };
        if (!cancelled && Array.isArray(data.purchased)) {
          setOwned(data.purchased.includes(slug));
        }
      } catch {
        // leave hidden
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!owned) return null;

  return (
    <div className="rounded-lg border border-line bg-surface-2/40 p-5">
      <h2 className="font-display text-sm font-semibold text-text">Download</h2>
      <div className="mt-3">
        <TemplateDownloads slug={slug} stacked />
      </div>
    </div>
  );
}
