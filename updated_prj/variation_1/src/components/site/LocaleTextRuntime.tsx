"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { RETRANSLATE_EVENT } from "@/lib/content-runtime-events";

type RawCatalog = {
  version: number;
  locale: string;
  fingerprint?: string;
  exact: Record<string, string>;
  patterns: [string, string][];
};

type CompiledPattern = {
  expression: RegExp;
  groups: number[];
  target: string;
};

type Catalog = RawCatalog & { compiledPatterns: CompiledPattern[] };

type OriginalText = {
  original: string;
  translated: string;
};

type OriginalAttribute = OriginalText & { name: string };

const TRANSLATABLE_ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"] as const;
const SKIP_SELECTOR = [
  "script",
  "style",
  "noscript",
  "canvas",
  "code",
  "pre",
  "kbd",
  "samp",
  "[contenteditable='true']",
  "[data-i18n-ignore]",
  "[translate='no']",
].join(",");

const catalogCache = new Map<string, Promise<Catalog>>();
const catalogFetchedAt = new Map<string, number>();
const CATALOG_REVALIDATE_MS = 60_000;

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function textKey(text: string): string {
  const normalized = normalizeText(text);
  let hash = 0x811c9dc5;
  for (let index = 0; index < normalized.length; index++) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function escapeExpression(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compilePattern(source: string, target: string): CompiledPattern {
  const groups: number[] = [];
  let expression = "";
  let cursor = 0;
  const placeholders = /\{\{(\d+)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = placeholders.exec(source))) {
    expression += escapeExpression(source.slice(cursor, match.index));
    expression += "(.+?)";
    groups.push(Number(match[1]));
    cursor = match.index + match[0].length;
  }
  expression += escapeExpression(source.slice(cursor));
  return { expression: new RegExp(`^${expression}$`, "u"), groups, target };
}

function compileCatalog(catalog: RawCatalog): Catalog {
  return {
    ...catalog,
    compiledPatterns: catalog.patterns
      .map(([source, target]) => compilePattern(source, target))
      .sort(
        (left, right) =>
          right.expression.source.length - left.expression.source.length
      ),
  };
}

/**
 * Load locale catalog. Revalidates at most once a minute so a regenerated
 * `public/i18n/site/{locale}.json` is picked up without a full browser restart.
 */
async function loadCatalog(locale: Locale): Promise<Catalog> {
  const existingPromise = catalogCache.get(locale);
  const fetchedAt = catalogFetchedAt.get(locale) ?? 0;
  const freshEnough =
    existingPromise && Date.now() - fetchedAt < CATALOG_REVALIDATE_MS;
  if (freshEnough) return existingPromise;

  const previousPromise = existingPromise;
  const request = fetch(`/i18n/site/${locale}.json`, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = (await response.json()) as RawCatalog;
      if (raw.version !== 1 || raw.locale !== locale) {
        throw new Error("Catalog identity mismatch");
      }

      if (previousPromise) {
        try {
          const previous = await previousPromise;
          if (
            previous.fingerprint &&
            raw.fingerprint &&
            previous.fingerprint === raw.fingerprint
          ) {
            return previous;
          }
        } catch {
          /* compile fresh below */
        }
      }

      return compileCatalog(raw);
    })
    .catch((error) => {
      catalogCache.delete(locale);
      catalogFetchedAt.delete(locale);
      throw error;
    });

  catalogCache.set(locale, request);
  catalogFetchedAt.set(locale, Date.now());
  return request;
}

function replacementFor(text: string, catalog: Catalog): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized) return undefined;
  const exact = catalog.exact[textKey(normalized)];
  if (exact) return exact;

  for (const pattern of catalog.compiledPatterns) {
    const match = pattern.expression.exec(normalized);
    if (!match) continue;
    return pattern.target.replace(/\{\{(\d+)\}\}/g, (_, rawIndex: string) => {
      const group = pattern.groups.indexOf(Number(rawIndex));
      const captured = group >= 0 ? (match[group + 1] ?? "") : "";
      return catalog.exact[textKey(captured)] ?? captured;
    });
  }
  return undefined;
}

function replacementForTitle(title: string, catalog: Catalog): string | undefined {
  const direct = replacementFor(title, catalog);
  if (direct) return direct;
  const parts = title.split(" | ");
  if (parts.length < 2) return undefined;
  let changed = false;
  const translated = parts.map((part) => {
    const replacement = replacementFor(part, catalog);
    if (replacement) changed = true;
    return replacement ?? part;
  });
  return changed ? translated.join(" | ") : undefined;
}

function keepOuterWhitespace(original: string, replacement: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${replacement}${trailing}`;
}

function shouldSkip(element: Element | null): boolean {
  return !element || element.matches(SKIP_SELECTOR) || Boolean(element.closest(SKIP_SELECTOR));
}

/**
 * Client-side site translator: swaps English DOM text for the active locale
 * using `/public/i18n/site/{locale}.json`. Re-applies on every route change so
 * App Router navigations stay translated across all pages.
 */
export function LocaleTextRuntime({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.i18nLocale = locale;

    if (locale === "en") {
      root.dataset.i18nCatalog = "native";
      delete root.dataset.i18nTranslated;
      return;
    }

    let cancelled = false;
    let scheduled = false;
    let observer: MutationObserver | undefined;
    let readingObserver: MutationObserver | undefined;
    let onRetranslate: (() => void) | undefined;
    const originalTexts = new Map<Text, OriginalText>();
    const originalAttributes = new Map<Element, Map<string, OriginalAttribute>>();
    let originalTitle: OriginalText | undefined;
    let originalDescription: OriginalAttribute | undefined;
    const routeTimers: number[] = [];

    root.dataset.i18nCatalog = "loading";

    /** Force DOM back to the English source we last translated from. */
    const restore = () => {
      observer?.disconnect();
      for (const [node, state] of originalTexts) {
        if (node.isConnected) node.data = state.original;
      }
      for (const [element, attributes] of originalAttributes) {
        if (!element.isConnected) continue;
        for (const state of attributes.values()) {
          element.setAttribute(state.name, state.original);
        }
      }
      if (originalTitle) document.title = originalTitle.original;
      const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (description && originalDescription) {
        description.content = originalDescription.original;
      }
      originalTexts.clear();
      originalAttributes.clear();
      originalTitle = undefined;
      originalDescription = undefined;
    };

    loadCatalog(locale)
      .then((catalog) => {
        if (cancelled) return;

        const observe = () => {
          observer?.observe(document.documentElement, {
            attributes: true,
            attributeFilter: [...TRANSLATABLE_ATTRIBUTES, "content"],
            characterData: true,
            childList: true,
            subtree: true,
          });
        };

        const apply = () => {
          scheduled = false;
          let translatedCount = 0;

          for (const [node] of originalTexts) {
            if (!node.isConnected) originalTexts.delete(node);
          }
          for (const [element] of originalAttributes) {
            if (!element.isConnected) originalAttributes.delete(element);
          }

          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
              return shouldSkip((node as Text).parentElement)
                ? NodeFilter.FILTER_REJECT
                : NodeFilter.FILTER_ACCEPT;
            },
          });
          const textNodes: Text[] = [];
          while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

          for (const node of textNodes) {
            const current = node.data;
            const previous = originalTexts.get(node);
            // If we already translated this node, keep using that English source.
            // If Easy Read (or React) rewrote the node, translate the new English.
            const original =
              previous &&
              (current === previous.translated || current === previous.original)
                ? previous.original
                : current;
            const replacement = replacementFor(original, catalog);
            if (!replacement) continue;
            const translated = keepOuterWhitespace(original, replacement);
            translatedCount++;
            if (current !== translated) {
              originalTexts.set(node, { original, translated });
              node.data = translated;
            } else if (!previous) {
              originalTexts.set(node, { original, translated });
            }
          }

          const selector = TRANSLATABLE_ATTRIBUTES.map((name) => `[${name}]`).join(",");
          for (const element of document.body.querySelectorAll(selector)) {
            if (shouldSkip(element)) continue;
            let states = originalAttributes.get(element);
            for (const name of TRANSLATABLE_ATTRIBUTES) {
              const current = element.getAttribute(name);
              if (!current) continue;
              const previous = states?.get(name);
              const original = previous && current === previous.translated ? previous.original : current;
              const translated = replacementFor(original, catalog);
              if (!translated) continue;
              translatedCount++;
              if (current !== translated) {
                states ??= new Map();
                states.set(name, { name, original, translated });
                element.setAttribute(name, translated);
              }
            }
            if (states) originalAttributes.set(element, states);
          }

          const currentTitle = document.title;
          const sourceTitle =
            originalTitle && currentTitle === originalTitle.translated
              ? originalTitle.original
              : currentTitle;
          const translatedTitle = replacementForTitle(sourceTitle, catalog);
          if (translatedTitle) {
            translatedCount++;
            if (currentTitle !== translatedTitle) {
              originalTitle = { original: sourceTitle, translated: translatedTitle };
              document.title = translatedTitle;
            }
          }

          const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
          if (description) {
            const current = description.content;
            const source =
              originalDescription && current === originalDescription.translated
                ? originalDescription.original
                : current;
            const translated = replacementFor(source, catalog);
            if (translated) {
              translatedCount++;
              if (current !== translated) {
                originalDescription = {
                  name: "content",
                  original: source,
                  translated,
                };
                description.content = translated;
              }
            }
          }

          root.dataset.i18nTranslated = String(translatedCount);
          root.dataset.i18nCatalog = "ready";
        };

        const schedule = () => {
          if (scheduled) return;
          scheduled = true;
          queueMicrotask(apply);
        };

        observer = new MutationObserver(schedule);
        observe();
        schedule();
        // Soft navigations / streaming RSC can land after the first pass.
        routeTimers.push(
          window.setTimeout(schedule, 50),
          window.setTimeout(schedule, 250),
          window.setTimeout(schedule, 800),
          // Scanner / report pages hydrate async (quota, history, report payload).
          window.setTimeout(schedule, 2000),
          window.setTimeout(schedule, 4500)
        );

        /**
         * Easy Read toggles `data-reading` and rewrites English → plain English.
         * Restore to English first, wait for EasyTextRuntime, then translate again
         * so Easy copy is shown in the active locale (not stuck in English).
         */
        const afterEasyPass = () => {
          if (cancelled) return;
          observe();
          schedule();
        };

        readingObserver = new MutationObserver(() => {
          root.dataset.i18nCatalog = "loading";
          restore();
          routeTimers.push(
            window.setTimeout(afterEasyPass, 40),
            window.setTimeout(afterEasyPass, 120),
            window.setTimeout(afterEasyPass, 350)
          );
        });
        readingObserver.observe(root, {
          attributes: true,
          attributeFilter: ["data-reading"],
        });

        onRetranslate = () => {
          if (cancelled) return;
          schedule();
          routeTimers.push(
            window.setTimeout(afterEasyPass, 40),
            window.setTimeout(afterEasyPass, 160)
          );
        };
        window.addEventListener(RETRANSLATE_EVENT, onRetranslate);
      })
      .catch((error) => {
        if (cancelled) return;
        root.dataset.i18nCatalog = "error";
        console.error(`[i18n] Failed to load ${locale} site catalog`, error);
      });

    return () => {
      cancelled = true;
      for (const timer of routeTimers) window.clearTimeout(timer);
      readingObserver?.disconnect();
      if (onRetranslate) {
        window.removeEventListener(RETRANSLATE_EVENT, onRetranslate);
      }
      restore();
    };
  }, [locale, pathname]);

  return null;
}
