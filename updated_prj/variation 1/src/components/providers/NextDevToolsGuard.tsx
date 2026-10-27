"use client";

import { useEffect } from "react";

const STYLE_ID = "truststack-hide-next-devtools-launcher";

function hideLauncher() {
  for (const portal of document.querySelectorAll("nextjs-portal")) {
    const root = portal.shadowRoot;
    if (!root || root.getElementById(STYLE_ID)) continue;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `button[aria-label="Open Next.js Dev Tools"] { display: none !important; }`;
    root.appendChild(style);
  }
}

export function NextDevToolsGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    hideLauncher();
    const observer = new MutationObserver(hideLauncher);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}