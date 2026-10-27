"use client";

import { useEffect } from "react";

/**
 * Client-side content-protection deterrents (see content_protection.md).
 *
 * These raise the bar against casual copying / inspection. They are deliberately
 * conservative and are NOT a substitute for the durable server-side protections
 * (security headers in next.config.ts, server-side rendering with auth, and
 * keeping proprietary logic + secrets on the backend):
 *
 *  - Text selection is blocked site-wide via CSS (globals.css), but inputs,
 *    textareas and contenteditable stay selectable so forms, the chat bot and
 *    the interactive tools keep working.
 *  - The DevTools `debugger` deterrent only runs in PRODUCTION builds, so it
 *    never disrupts local development, HMR or the live preview. It uses a
 *    setTimeout chain (not a tight `while` loop) so it pauses on breakpoints
 *    when DevTools is open without freezing/DoS-ing an ordinary visitor.
 *
 * To relax these during development, simply remove <SecurityWrapper /> from
 * src/app/layout.tsx (or gate the listeners below behind a flag).
 */

const COPY_NOTICE =
  "© TrustStack - DPDP.in. This content is protected and provided for privacy " +
  "awareness in the public interest. Reproduction without permission is prohibited.";

/** Editable controls keep native behaviour (selection, right-click, copy). */
function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  const tag = el.tagName.toUpperCase();
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable === true
  );
}

export function SecurityWrapper() {
  // Deterrents run in PRODUCTION only so development / inspection works freely locally.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    // 1) Disable the context menu (right-click "Save As" / "Inspect").
    const onContextMenu = (e: MouseEvent) => {
      if (isEditable(e.target)) return; // keep right-click inside form fields
      e.preventDefault();
    };

    // 2) Block common inspect / view-source / save shortcuts.
    const onKeyDown = (e: KeyboardEvent) => {
      const k = (e.key || "").toUpperCase();
      const blocked =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (k === "I" || k === "J" || k === "C")) ||
        (e.ctrlKey && (k === "U" || k === "S"));
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 3) Replace copied page content with a copyright notice (forms exempt).
    const onCopy = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      e.clipboardData?.setData("text/plain", COPY_NOTICE);
    };

    // 4) Stop drag-saving of images / video frames.
    const onDragStart = (e: DragEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toUpperCase();
      if (tag === "IMG" || tag === "VIDEO" || tag === "PICTURE") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy", onCopy);
    document.addEventListener("dragstart", onDragStart);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  // DevTools deterrent - PRODUCTION ONLY (never interferes with development).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    let timer = 0;
    const tick = () => {
      // Pauses execution when DevTools is open, making step-through inspection
      // of the bundle painful. A setTimeout chain keeps it non-blocking so it
      // does not freeze an ordinary visitor's browser.
      debugger;
      timer = window.setTimeout(tick, 1000);
    };
    timer = window.setTimeout(tick, 1000);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
