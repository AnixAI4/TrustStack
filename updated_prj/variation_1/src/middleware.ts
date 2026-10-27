import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  requiredPilotApiFeature,
  requiredPilotFeature,
} from "@/lib/paid-routes";
import { resolvePilotTier } from "@/lib/security/pilot-gate";
import {
  DEVICE_COOKIE,
  hashDeviceToken,
  validDeviceToken,
} from "@/lib/security/device-session";

// Marketing, legal and educational surfaces stay reachable without an account
// so anonymous visitors - and compliance scanners auditing this site itself - // can always reach the homepage, privacy notice, cookie policy and consent
// banner. Paid product surfaces (the platform app, scanner runs, template
// downloads, certification exams) are gated separately below/at the API layer.
const PUBLIC_PATHS = [
  "/welcome",
  "/auth",
  "/api/auth",
  "/privacy",
  "/terms",
  "/cookies",
  "/rights",
  "/learn",
  "/quiz",
  "/act",
  "/rules",
  "/courses",
  "/section",
  "/rule",
  "/blog",
  "/about",
  "/assurance",
  "/invite",
  "/certification/verify",
  "/trustdeck/public",
];

// Anonymous public-portal APIs (DSR, grievance, consent widget, vendor questionnaire).
// These must bypass auth middleware — otherwise fetch gets an HTML redirect to /welcome.
const PUBLIC_API_PATHS = [
  "/api/trustdeck/dsr/submit",
  "/api/trustdeck/dsr/otp/",
  "/api/trustdeck/grievance/submit",
  "/api/trustdeck/consent/record",
  "/api/trustdeck/consent/withdraw",
  "/api/trustdeck/consent/config",
  "/api/trustdeck/vendors/questionnaire/submit",
  // External schedulers authenticate with CRON_SECRET inside the route.
  "/api/trustdeck/breach/escalations/run",
];

// Exact-match public routes (no sub-path prefix matching) - the homepage only.
const PUBLIC_EXACT_PATHS = ["/"];

const STATIC_PATHS = [
  "/_next",
  "/favicon",
  "/images",
  "/fonts",
  "/icons",
  "/i18n",
];

// Blocked paths that should never be accessed
const BLOCKED_PATHS = [
  "/.env",
  "/.git",
  "/wp-admin",
  "/wp-login",
  "/phpMyAdmin",
  "/admin.php",
  "/.htaccess",
  "/config",
  "/.aws",
  "/.ssh",
];

// Suspicious patterns in URLs
const SUSPICIOUS_PATTERNS = [
  /\.\./, // Path traversal
  /%2e%2e/i, // Encoded path traversal
  /%00/, // Null byte
  /<script/i, // XSS attempt
  /javascript:/i, // XSS attempt
  /\bon\w+\s*=/i, // Event handler XSS
  /union\s+select/i, // SQL injection
  /\bexec\s*\(/i, // Code execution
];

function isStaticPath(pathname: string): boolean {
  // Only genuine asset extensions bypass auth. Matching any "." let a path like
  // /trustdeck/report.summary skip the auth branch entirely.
  return (
    STATIC_PATHS.some((p) => pathname.startsWith(p)) ||
    /\.(?:js|css|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|txt|xml|json|mp4|webm|pdf|docx)$/i.test(
      pathname
    )
  );
}

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_EXACT_PATHS.includes(pathname) ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(p))
  );
}

function isBlockedPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return BLOCKED_PATHS.some((p) => lower.startsWith(p.toLowerCase()));
}

function hasSuspiciousPattern(url: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(url));
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Simple in-memory rate limiting for middleware
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 200; // requests per window

function checkMiddlewareRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  
  if (!entry || now > entry.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Cleanup old entries periodically (basic memory management)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now > entry.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000);

function isTemplateBinary(pathname: string): boolean {
  return /^\/templates\/[^/]+\.(docx|pdf)$/i.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request);

  // 0. Template binaries are never downloadable - Pilot is view-only.
  // Must run before the static-path short-circuit (paths with "." are static).
  if (isTemplateBinary(pathname)) {
    console.warn(`Blocked template binary download from ${clientIp}: ${pathname}`);
    return new NextResponse("Template downloads are not available.", {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // 1. Block known malicious paths
  if (isBlockedPath(pathname)) {
    console.warn(`Blocked path access from ${clientIp}: ${pathname}`);
    return new NextResponse("Not Found", { status: 404 });
  }

  // 2. Check for suspicious patterns in URL
  if (hasSuspiciousPattern(request.url)) {
    console.warn(`Suspicious URL from ${clientIp}: ${request.url}`);
    return new NextResponse("Bad Request", { status: 400 });
  }

  // 3. Apply rate limiting
  if (!checkMiddlewareRateLimit(clientIp)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  // 4. Add security headers to response
  const addSecurityHeaders = (response: NextResponse): NextResponse => {
    // Prevent clickjacking
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    // Prevent MIME sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");
    // XSS protection
    response.headers.set("X-XSS-Protection", "0");
    // Referrer policy
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions policy
    response.headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );
    return response;
  };

  if (isStaticPath(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (isPublicPath(pathname)) {
    if (user && pathname === "/welcome") {
      const redirect = request.nextUrl.searchParams.get("redirect");
      // Validate redirect parameter to prevent open redirect
      if (
        redirect &&
        redirect.startsWith("/") &&
        !redirect.startsWith("//") &&
        !redirect.includes("..") &&
        redirect !== "/welcome"
      ) {
        return NextResponse.redirect(new URL(redirect, request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
    return addSecurityHeaders(supabaseResponse);
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (pathname === "/subscribe") {
      return NextResponse.redirect(
        new URL("/auth/sign-up?plan=pilot", request.url)
      );
    }
    const welcomeUrl = new URL("/welcome", request.url);
    welcomeUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(welcomeUrl);
  }

  if (process.env.ENFORCE_DEVICE_SESSIONS === "1" && supabase) {
    const token = request.cookies.get(DEVICE_COOKIE)?.value;
    if (!validDeviceToken(token)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "device_session_required" },
          { status: 401 }
        );
      }
      const deviceUrl = new URL("/auth/device", request.url);
      deviceUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(deviceUrl);
    }

    const deviceHash = await hashDeviceToken(token);
    const { data: active, error: deviceError } = await supabase.rpc(
      "is_device_active",
      { p_user_id: user.id, p_device_hash: deviceHash }
    );

    if (deviceError) {
      return NextResponse.json(
        { error: "Session verification unavailable" },
        { status: 503 }
      );
    }

    if (!active) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "device_session_revoked" }, { status: 401 });
      }
      const deviceUrl = new URL("/auth/device", request.url);
      deviceUrl.searchParams.set("redirect", pathname);
      deviceUrl.searchParams.set("revoked", "1");
      return NextResponse.redirect(deviceUrl);
    }
  }

  // Paid surfaces are enforced here, on the server, so gated content is never
  // sent to the browser. The client-side overlays alone were removable in
  // DevTools because the markup had already been delivered.
  const trustDeckApi =
    pathname === "/api/trustdeck" || pathname.startsWith("/api/trustdeck/");
  const paidFeature = pathname.startsWith("/api/")
    // Protected TrustDeck routes call requirePlatformOrg (or the equivalent
    // create-org guard) themselves. Avoid a second remote tier lookup here.
    ? trustDeckApi ? null : requiredPilotApiFeature(pathname)
    : requiredPilotFeature(pathname);
  if (paidFeature && supabase) {
    const tier = await resolvePilotTier(supabase, user.id);
    if (tier !== "pilot") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Active Pilot subscription required", feature: paidFeature },
          { status: 403 }
        );
      }
      const subscribeUrl = new URL("/subscribe", request.url);
      subscribeUrl.searchParams.set("redirect", pathname);
      subscribeUrl.searchParams.set("feature", paidFeature);
      return NextResponse.redirect(subscribeUrl);
    }
  }

  return addSecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
