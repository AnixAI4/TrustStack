/**
 * Secure API wrapper that combines all security checks.
 * Use this to wrap API route handlers for consistent security.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  getClientIdentifier,
  isIpBlocked,
  blockIp,
  type RateLimitType,
} from "./rate-limiter";
import { validateCsrfToken } from "./csrf";

export interface ApiGuardOptions {
  /** Require user authentication */
  requireAuth?: boolean;
  /** Rate limit type to apply */
  rateLimit?: RateLimitType;
  /** Require CSRF token validation */
  requireCsrf?: boolean;
  /** Allowed HTTP methods */
  allowedMethods?: string[];
  /** Require specific content type */
  requireContentType?: string;
  /** Custom request validator */
  validateRequest?: (request: NextRequest) => Promise<{ valid: boolean; error?: string }>;
}

export interface ApiContext {
  user: { id: string; email?: string } | null;
  clientIp: string;
}

type ApiHandler = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse>;

/**
 * Security headers to add to all API responses
 */
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Create a JSON error response with security headers
 */
function errorResponse(
  error: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse {
  const body = { error, ...details };
  const response = NextResponse.json(body, { status });
  return addSecurityHeaders(response);
}

/**
 * Track suspicious activity
 */
const suspiciousActivity = new Map<string, number>();

function trackSuspiciousActivity(ip: string): void {
  const count = (suspiciousActivity.get(ip) || 0) + 1;
  suspiciousActivity.set(ip, count);
  
  // Block IP after 10 suspicious requests
  if (count >= 10) {
    blockIp(ip, 3600000); // Block for 1 hour
    suspiciousActivity.delete(ip);
  }
}

/**
 * Validate request origin
 */
function validateOrigin(request: NextRequest): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (!origin && !referer) return false;

  let sourceOrigin = origin;
  if (!sourceOrigin && referer) {
    try {
      sourceOrigin = new URL(referer).origin;
    } catch {
      return false;
    }
  }

  const allowedOrigins = new Set([request.nextUrl.origin]);
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      allowedOrigins.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
    } catch {
      return false;
    }
  }
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://127.0.0.1:3000");
  }

  return Boolean(sourceOrigin && allowedOrigins.has(sourceOrigin));
}

/**
 * Check for common attack patterns in request
 */
function checkForAttackPatterns(request: NextRequest): { safe: boolean; reason?: string } {
  const url = request.url;
  const userAgent = request.headers.get("user-agent") || "";
  
  // Check for suspicious user agents (common scanning tools)
  const suspiciousAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /dirbuster/i,
    /gobuster/i,
    /nuclei/i,
    /burp/i,
  ];
  
  for (const pattern of suspiciousAgents) {
    if (pattern.test(userAgent)) {
      return { safe: false, reason: "Suspicious user agent" };
    }
  }
  
  // Check for path traversal in URL
  if (url.includes("..") || url.includes("%2e%2e")) {
    return { safe: false, reason: "Path traversal attempt" };
  }
  
  // Check for null bytes
  if (url.includes("%00") || url.includes("\0")) {
    return { safe: false, reason: "Null byte injection" };
  }
  
  return { safe: true };
}

/**
 * Wrap an API handler with security checks
 */
export function withApiGuard(
  handler: ApiHandler,
  options: ApiGuardOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  const {
    requireAuth = false,
    rateLimit = "api",
    requireCsrf = false,
    allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"],
    requireContentType,
    validateRequest,
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const clientIp = getClientIdentifier(request);

    try {
      // 1. Check if IP is blocked
      if (isIpBlocked(clientIp)) {
        return errorResponse("Access denied", 403);
      }

      // 2. Check for attack patterns
      const attackCheck = checkForAttackPatterns(request);
      if (!attackCheck.safe) {
        trackSuspiciousActivity(clientIp);
        return errorResponse("Forbidden", 403);
      }

      // 3. Validate HTTP method
      if (!allowedMethods.includes(request.method)) {
        return errorResponse("Method not allowed", 405);
      }

      // 4. Validate origin (CORS-like protection)
      if (!validateOrigin(request)) {
        trackSuspiciousActivity(clientIp);
        return errorResponse("Invalid origin", 403);
      }

      // 5. Check content type for POST/PUT/PATCH
      if (
        requireContentType &&
        ["POST", "PUT", "PATCH"].includes(request.method)
      ) {
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes(requireContentType)) {
          return errorResponse("Invalid content type", 415);
        }
      }

      // 6. Apply rate limiting
      const rateLimitResult = checkRateLimit(clientIp, rateLimit);
      if (!rateLimitResult.allowed) {
        return errorResponse("Too many requests", 429, {
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        });
      }

      // 7. CSRF validation for state-changing requests
      if (
        requireCsrf &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
      ) {
        const csrfResult = validateCsrfToken(request);
        if (!csrfResult.valid) {
          trackSuspiciousActivity(clientIp);
          return errorResponse("Invalid CSRF token", 403);
        }
      }

      // 8. Authentication check
      let user: { id: string; email?: string } | null = null;
      if (requireAuth) {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          return errorResponse("Authentication required", 401);
        }
        
        user = { id: data.user.id, email: data.user.email };
      }

      // 9. Custom request validation
      if (validateRequest) {
        const validationResult = await validateRequest(request);
        if (!validationResult.valid) {
          return errorResponse(validationResult.error || "Invalid request", 400);
        }
      }

      // 10. Execute the handler
      const context: ApiContext = { user, clientIp };
      const response = await handler(request, context);

      // Add security headers and rate limit info
      const secureResponse = addSecurityHeaders(response);
      secureResponse.headers.set(
        "X-RateLimit-Remaining",
        rateLimitResult.remaining.toString()
      );
      secureResponse.headers.set(
        "X-RateLimit-Reset",
        Math.ceil(rateLimitResult.resetIn / 1000).toString()
      );

      return secureResponse;
    } catch (error) {
      console.error("API Guard error:", error);
      return errorResponse("Internal server error", 500);
    }
  };
}

/**
 * Helper to create authenticated API handlers
 */
export function withAuth(handler: ApiHandler) {
  return withApiGuard(handler, { requireAuth: true });
}

/**
 * Helper for payment endpoints (strict security)
 */
export function withPaymentSecurity(handler: ApiHandler) {
  return withApiGuard(handler, {
    requireAuth: true,
    rateLimit: "payment",
    requireCsrf: false, // Razorpay handles its own verification
    allowedMethods: ["POST"],
    requireContentType: "application/json",
  });
}

/**
 * Helper for scanner endpoints
 */
export function withScannerSecurity(handler: ApiHandler) {
  return withApiGuard(handler, {
    requireAuth: true,
    rateLimit: "scanner",
    allowedMethods: ["POST"],
    // JSON (URL scan) and multipart/form-data (PDF upload) are both allowed;
    // the route handler validates the body shape.
  });
}
