/**
 * CSRF Protection utilities.
 * Uses a double-submit cookie pattern for stateless CSRF protection.
 */

import crypto from "crypto";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Generate a secure random CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Validate CSRF token from request
 * Compares the token in the cookie with the one in the header
 */
export function validateCsrfToken(request: Request): {
  valid: boolean;
  error?: string;
} {
  const cookieHeader = request.headers.get("cookie") || "";
  const csrfHeader = request.headers.get(CSRF_HEADER_NAME);

  // Parse CSRF token from cookie
  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const cookieToken = cookies[CSRF_COOKIE_NAME];

  if (!cookieToken) {
    return { valid: false, error: "CSRF cookie missing" };
  }

  if (!csrfHeader) {
    return { valid: false, error: "CSRF header missing" };
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(cookieToken, csrfHeader)) {
    return { valid: false, error: "CSRF token mismatch" };
  }

  return { valid: true };
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Create Set-Cookie header for CSRF token
 */
export function createCsrfCookie(token: string, secure: boolean = true): string {
  const parts = [
    `${CSRF_COOKIE_NAME}=${token}`,
    "Path=/",
    "SameSite=Strict",
    "HttpOnly",
  ];
  
  if (secure) {
    parts.push("Secure");
  }
  
  // 1 hour expiry
  parts.push(`Max-Age=${60 * 60}`);
  
  return parts.join("; ");
}

/**
 * Get CSRF token info for client
 */
export const CSRF_CONFIG = {
  cookieName: CSRF_COOKIE_NAME,
  headerName: CSRF_HEADER_NAME,
} as const;
