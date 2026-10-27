import type { TrustStackFeature } from "@/lib/supabase/types";

/** Paths that require an active Pilot subscription. */
export function requiredPilotFeature(
  pathname: string
): TrustStackFeature | null {
  // Scanner is available on Free (1 preview) and Pilot (1/day) - quota enforced in-app.
  if (pathname === "/scanner" || pathname.startsWith("/scanner/")) {
    return null;
  }
  if (pathname === "/security" || pathname.startsWith("/security/")) {
    return "scanner_full";
  }
  if (pathname === "/tools" || pathname.startsWith("/tools/")) {
    return "tools";
  }
  // Templates are à la carte (₹99 unlock) - not bundled with Pilot.
  if (pathname === "/templates" || pathname.startsWith("/templates/")) {
    return null;
  }
  if (pathname.startsWith("/certification")) {
    // Public certificate lookup stays free.
    if (pathname.startsWith("/certification/verify")) return null;
    return "certifications";
  }
  // TrustDeck (compliance dashboard) - Pilot only.
  // Public portals (DSR / grievance / questionnaires) stay free.
  if (pathname.startsWith("/trustdeck/public")) {
    return null;
  }
  if (pathname === "/trustdeck" || pathname.startsWith("/trustdeck/")) {
    return "platform";
  }
  return null;
}

/** Paid API surfaces must be gated independently of their UI pages. */
export function requiredPilotApiFeature(
  pathname: string
): TrustStackFeature | null {
  if (pathname === "/api/security-scanner") return "scanner_full";
  if (pathname === "/api/security-compliance-manager") return "tools";
  if (pathname === "/api/chat") return "trustchat";
  if (pathname === "/api/trustdeck" || pathname.startsWith("/api/trustdeck/")) {
    return "platform";
  }
  return null;
}

export function featureForHref(href: string): TrustStackFeature | null {
  if (!href || href.startsWith("mailto:") || href.startsWith("#")) return null;
  try {
    const path = href.startsWith("http")
      ? new URL(href).pathname
      : href.split("?")[0]?.split("#")[0] || "";
    return requiredPilotFeature(path);
  } catch {
    return null;
  }
}

export const PAID_NAV_HREFS = new Set([
  "/tools",
  "/certification",
  "/security",
  "/trustdeck",
]);
