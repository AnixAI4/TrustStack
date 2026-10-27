"use client";

import { useEffect, useCallback } from "react";

/**
 * SecurityShield - Client-side protection against:
 * - Right-click context menu
 * - Developer tools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 * - Text selection and copying
 * - Dragging elements
 * - Print screen attempts
 * - View source shortcuts
 * 
 * Note: These are deterrents, not absolute security.
 * Server-side protection is always the primary defense.
 */
export function SecurityShield() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  // Block right-click context menu
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Block keyboard shortcuts for dev tools and copying
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // F12 - Dev Tools
    if (e.key === "F12") {
      e.preventDefault();
      return false;
    }

    // Ctrl/Cmd + Shift + I - Inspect Element
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
      e.preventDefault();
      return false;
    }

    // Ctrl/Cmd + Shift + J - Console
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "j") {
      e.preventDefault();
      return false;
    }

    // Ctrl/Cmd + Shift + C - Inspect Element (Chrome)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      return false;
    }

    // Ctrl/Cmd + U - View Source
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
      e.preventDefault();
      return false;
    }

    // Ctrl/Cmd + S - Save Page
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      return false;
    }

    // Ctrl/Cmd + P - Print (can reveal content)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
      e.preventDefault();
      return false;
    }

    // Ctrl/Cmd + C - Copy (only block outside input fields)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (!isInput) {
        e.preventDefault();
        return false;
      }
    }

    // Ctrl/Cmd + A - Select All (only block outside input fields)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (!isInput) {
        e.preventDefault();
        return false;
      }
    }

    return true;
  }, []);

  // Block copy event
  const handleCopy = useCallback((e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;
    if (!isInput) {
      e.preventDefault();
      return false;
    }
  }, []);

  // Block cut event
  const handleCut = useCallback((e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;
    if (!isInput) {
      e.preventDefault();
      return false;
    }
  }, []);

  // Block drag start
  const handleDragStart = useCallback((e: DragEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG" || target.tagName === "A") {
      e.preventDefault();
      return false;
    }
  }, []);

  // Block text selection via selectstart
  const handleSelectStart = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;
    if (!isInput) {
      e.preventDefault();
      return false;
    }
  }, []);

  // Detect dev tools via debugger (basic detection)
  useEffect(() => {
    let devToolsOpen = false;

    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          // You could redirect or show a warning here
          console.clear();
        }
      } else {
        devToolsOpen = false;
      }
    };

    // Check periodically
    const interval = setInterval(detectDevTools, 1000);

    // Also check on resize (dev tools opening changes dimensions)
    window.addEventListener("resize", detectDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", detectDevTools);
    };
  }, []);

  // Clear console periodically to deter inspection
  useEffect(() => {
    const interval = setInterval(() => {
      console.clear();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Attach all event listeners
  useEffect(() => {
    // Context menu (right-click)
    document.addEventListener("contextmenu", handleContextMenu);

    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeyDown);

    // Copy/Cut
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);

    // Drag
    document.addEventListener("dragstart", handleDragStart);

    // Text selection
    document.addEventListener("selectstart", handleSelectStart);

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, [
    handleContextMenu,
    handleKeyDown,
    handleCopy,
    handleCut,
    handleDragStart,
    handleSelectStart,
  ]);

  return null;
}
