import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Protected page prefixes. Pages live in PLAIN folders (`app/dashboard/`),
 * never route groups like `app/(dashboard)/` — a group drops the URL segment,
 * so the prefix never matches and the page silently skips this guard (D-012).
 * `e2e/auth-guard.spec.ts` fails if that regresses.
 *
 * `/api/v1/*` routes are NOT redirected here: they authenticate themselves and
 * answer 401 in the API envelope, never an HTML redirect.
 */
const PROTECTED_PREFIXES = ["/dashboard"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    // 307: temporary, method-preserving (spec §8).
    return NextResponse.redirect(loginUrl, 307);
  }

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url), 307);
  }

  return response;
}

export const config = {
  // `widget/` is the consent widget's static file, loaded by other websites: no session to refresh.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/v1/health|widget/).*)"],
};
