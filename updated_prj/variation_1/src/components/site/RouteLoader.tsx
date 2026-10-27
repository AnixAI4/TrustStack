"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Minimal navigation indicator: a single thin accent line pinned to the top of
 * the viewport. It trickles forward while a client-side navigation is in flight,
 * snaps to 100% when the new route commits, then fades out. No overlay, no
 * spinner, no label - just a quiet line.
 *
 * Navigation is detected by intercepting <a> clicks + watching usePathname().
 */
export function RouteLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (trickle.current) clearInterval(trickle.current);
    setVisible(true);
    setProgress(8);
    trickle.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        const inc = p < 35 ? 9 : p < 65 ? 4 : 1.5;
        return Math.min(90, p + inc);
      });
    }, 220);
  };

  const finish = () => {
    if (trickle.current) clearInterval(trickle.current);
    setProgress(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
  };

  // Intercept anchor clicks → start the bar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;
      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;
      const href = anchor.getAttribute("href") ?? "";
      // Skip external links, hash anchors, mailto, tel, or same-page
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto") ||
        href.startsWith("tel") ||
        href === pathname
      )
        return;
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  // pathname changed → finish the bar
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      finish();
    }
    return () => {
      if (trickle.current) clearInterval(trickle.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname]);

  // Show a loading ("progress") cursor across the page while navigating
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("route-loading", visible);
    return () => root.classList.remove("route-loading");
  }, [visible]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[99] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 220ms ease" }}
    >
      <div
        className="h-full bg-accent"
        style={{
          width: `${progress}%`,
          transition: "width 200ms ease",
          boxShadow: "0 0 8px rgb(var(--accent-rgb) / 0.6)",
        }}
      />
    </div>
  );
}


