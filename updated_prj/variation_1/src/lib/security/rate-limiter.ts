/**
 * In-memory rate limiter for API protection.
 * For production, consider using Redis or a distributed store.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 60000); // Clean up every minute

export const RATE_LIMITS = {
  // General API calls
  api: { windowMs: 60000, maxRequests: 60 }, // 60 requests per minute
  // Auth endpoints (stricter)
  auth: { windowMs: 900000, maxRequests: 10 }, // 10 attempts per 15 minutes
  // Login specifically (very strict to prevent brute force)
  login: { windowMs: 900000, maxRequests: 5 }, // 5 attempts per 15 minutes
  // Payment endpoints
  payment: { windowMs: 60000, maxRequests: 10 }, // 10 per minute
  // Scanner (resource intensive)
  scanner: { windowMs: 60000, maxRequests: 5 }, // 5 scans per minute
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Check if a request should be rate limited
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType = "api"
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    store.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");
  
  // Cloudflare
  if (cfIp) return cfIp;
  // Forwarded (take first IP)
  if (forwarded) return forwarded.split(",")[0].trim();
  // Real IP header
  if (realIp) return realIp;
  
  return "unknown";
}

/**
 * Reset rate limit for a specific identifier (e.g., after successful auth)
 */
export function resetRateLimit(identifier: string, type: RateLimitType): void {
  const key = `${type}:${identifier}`;
  store.delete(key);
}

/**
 * Block an IP temporarily (for suspicious activity)
 */
const blockedIps = new Map<string, number>();

export function blockIp(ip: string, durationMs: number = 3600000): void {
  blockedIps.set(ip, Date.now() + durationMs);
}

export function isIpBlocked(ip: string): boolean {
  const blockedUntil = blockedIps.get(ip);
  if (!blockedUntil) return false;
  
  if (Date.now() > blockedUntil) {
    blockedIps.delete(ip);
    return false;
  }
  
  return true;
}
