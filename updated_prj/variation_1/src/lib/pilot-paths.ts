/** Only allow same-origin relative paths as post-checkout destinations. */
export function safeInternalPath(
  next: string | null | undefined,
  fallback = "/"
): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("..")) {
    return fallback;
  }
  return next.split("#")[0] || fallback;
}

export function pilotSubscribeUrl(nextPath: string): string {
  const next = safeInternalPath(nextPath, "/trustdeck");
  return `/subscribe?next=${encodeURIComponent(next)}`;
}
