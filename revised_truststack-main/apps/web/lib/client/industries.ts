"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";

/**
 * Industry labels for display (Slice 10.5 B1, F1.2, F1.10): "University /
 * Higher Education", never the code `university`. Read from the scope
 * wizard's own list (`GET /api/v1/industries`) — not from core's `INDUSTRIES`,
 * which carries each industry's overlay pack, bank internals the browser must
 * never receive (D-071). One request per page view, shared.
 */
let industries: Promise<Map<string, string>> | null = null;

function loadIndustries(): Promise<Map<string, string>> {
  industries ??= apiFetch<{ industries: { code: string; name: string }[] }>("/api/v1/industries").then((r) => {
    if (!r.success) {
      industries = null;
      return new Map();
    }
    return new Map(r.data.industries.map((i) => [i.code, i.name]));
  });
  return industries;
}

/** The industry's label, or null while loading or when the code is not set. */
export function useIndustryLabel(code: string | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!code) return setLabel(null);
    let cancelled = false;
    void loadIndustries().then((map) => {
      if (!cancelled) setLabel(map.get(code) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);
  return label;
}
