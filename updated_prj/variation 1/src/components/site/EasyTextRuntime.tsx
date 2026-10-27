"use client";

import { useEffect } from "react";
import { EASY_MAP } from "@/content/easy-generated";
import { fallbackEasyText, lookupEasyText } from "@/content/easy-static";
import { easyKey, normalizeEasy } from "@/lib/easy-hash";
import { requestRetranslate } from "@/lib/content-runtime-events";

const SKIP_SELECTOR = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "input",
  "textarea",
  "code",
  "pre",
  "[data-rm='easy']",
  "[data-easy-ignore]",
].join(",");

const EASY_ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"] as const;
const ATTRIBUTE_SKIP_SELECTOR = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "code",
  "pre",
  "[data-rm='easy']",
  "[data-easy-ignore]",
].join(",");

type OriginalAttribute = {
  name: (typeof EASY_ATTRIBUTES)[number];
  original: string;
  simplified: string;
};

function replacementFor(text: string): string | undefined {
  const normalized = normalizeEasy(text);
  if (!normalized) return undefined;
  return (
    EASY_MAP[easyKey(normalized)] ??
    lookupEasyText(normalized) ??
    fallbackEasyText(normalized)
  );
}

function keepOuterWhitespace(original: string, replacement: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${replacement}${trailing}`;
}

function shouldSkipTextNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest(SKIP_SELECTOR)) return true;
  return !normalizeEasy(node.data);
}

export function EasyTextRuntime() {
  useEffect(() => {
    const originals = new Map<Text, { original: string; simplified: string }>();
    const originalAttributes = new Map<Element, Map<string, OriginalAttribute>>();
    let contentObserver: MutationObserver | null = null;
    let pending = false;
    let applyTimer: number | undefined;

    const restore = () => {
      contentObserver?.disconnect();
      contentObserver = null;
      pending = false;
      if (applyTimer !== undefined) window.clearTimeout(applyTimer);
      applyTimer = undefined;
      // Force English technical source back (even if Locale rewrote our easy text).
      for (const [node, state] of originals) {
        if (node.isConnected) node.data = state.original;
      }
      for (const [element, attributes] of originalAttributes) {
        if (!element.isConnected) continue;
        for (const state of attributes.values()) {
          element.setAttribute(state.name, state.original);
        }
      }
      originals.clear();
      originalAttributes.clear();
    };

    const apply = () => {
      pending = false;
      if (document.documentElement.getAttribute("data-reading") !== "easy") {
        return;
      }
      const root = document.body;
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          return shouldSkipTextNode(node as Text)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        },
      });

      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);

      let changed = false;
      for (const node of nodes) {
        const state = originals.get(node);
        // Locale may have translated our easy English - don't fight it mid-frame.
        if (
          state &&
          node.data !== state.original &&
          node.data !== state.simplified
        ) {
          continue;
        }
        const original = state?.original ?? node.data;
        const replacement = replacementFor(original);
        if (!replacement) continue;
        const next = keepOuterWhitespace(original, replacement);
        originals.set(node, { original, simplified: next });
        if (node.data !== next) {
          node.data = next;
          changed = true;
        }
      }

      for (const [element] of originalAttributes) {
        if (!element.isConnected) originalAttributes.delete(element);
      }

      const selector = EASY_ATTRIBUTES.map((name) => `[${name}]`).join(",");
      for (const element of document.body.querySelectorAll(selector)) {
        if (element.closest(ATTRIBUTE_SKIP_SELECTOR)) continue;
        let states = originalAttributes.get(element);

        for (const name of EASY_ATTRIBUTES) {
          const current = element.getAttribute(name);
          if (!current) continue;
          const previous = states?.get(name);
          if (
            previous &&
            current !== previous.original &&
            current !== previous.simplified
          ) {
            continue;
          }
          const original =
            previous && current === previous.simplified
              ? previous.original
              : current;
          const replacement = replacementFor(original);
          if (!replacement) continue;
          const simplified = keepOuterWhitespace(original, replacement);
          if (current === simplified) continue;

          states ??= new Map();
          states.set(name, { name, original, simplified });
          element.setAttribute(name, simplified);
          changed = true;
        }

        if (states) originalAttributes.set(element, states);
      }

      // Ask LocaleTextRuntime to translate easy English → active locale.
      if (changed) requestRetranslate();
    };

    const schedule = () => {
      if (pending) return;
      pending = true;
      queueMicrotask(apply);
    };

    const sync = () => {
      if (document.documentElement.getAttribute("data-reading") !== "easy") {
        restore();
        // Technical English is back - re-translate into the active locale.
        requestRetranslate();
        return;
      }

      if (!contentObserver) {
        contentObserver = new MutationObserver(schedule);
        contentObserver.observe(document.body, {
          attributes: true,
          attributeFilter: [...EASY_ATTRIBUTES],
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
      // Defer so LocaleTextRuntime can restore translated → English first.
      if (applyTimer !== undefined) window.clearTimeout(applyTimer);
      applyTimer = window.setTimeout(() => {
        applyTimer = undefined;
        schedule();
      }, 20);
    };

    const attrObserver = new MutationObserver(sync);
    attrObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reading"],
    });
    sync();

    return () => {
      attrObserver.disconnect();
      restore();
    };
  }, []);

  return null;
}
