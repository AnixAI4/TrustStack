/** Session key for the last TrustStack site page before entering /trustdeck. */
export const PLATFORM_RETURN_KEY = "truststack:platform-return";

const PLATFORM_PREFIX = "/trustdeck";

export function isPlatformPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === PLATFORM_PREFIX || pathname.startsWith(`${PLATFORM_PREFIX}/`);
}

/** Remember the current site path so TrustDeck can send the user back there. */
export function rememberPlatformReturnPath(pathname: string | null | undefined): void {
  if (typeof window === "undefined" || !pathname) return;
  if (isPlatformPath(pathname)) return;
  // Skip auth/welcome gates - prefer a real content page.
  if (
    pathname === "/welcome" ||
    pathname.startsWith("/auth") ||
    pathname === "/subscribe"
  ) {
    return;
  }
  try {
    sessionStorage.setItem(PLATFORM_RETURN_KEY, pathname);
  } catch {
    /* private mode / quota */
  }
}

/** Path to leave TrustDeck for - last site page, or home. */
export function getPlatformReturnPath(): string {
  if (typeof window === "undefined") return "/";
  try {
    const stored = sessionStorage.getItem(PLATFORM_RETURN_KEY);
    if (
      stored &&
      stored.startsWith("/") &&
      !stored.startsWith("//") &&
      !isPlatformPath(stored)
    ) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "/";
}
