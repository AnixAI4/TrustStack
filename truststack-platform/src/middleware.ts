import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard']

// Public API routes — no auth required (called by embedded widgets or public forms)
const PUBLIC_API_ROUTES = [
  '/api/consent/record',
  '/api/consent/config',
  '/api/consent/withdraw',
  '/api/grievance/submit',
  // M5 DSR — public portal endpoints (admin-client; the auth DSR routes under
  // /api/dsr/requests + /api/dsr/stats self-enforce auth in-handler).
  '/api/dsr/submit',
  '/api/dsr/otp/',
  // Public hosted privacy notice: GET /api/privacy-notice/[slug]. The action
  // sub-routes (generate/translate/publish/save) sit under the same prefix but
  // each enforces auth in its own handler (getUser → 401), so whitelisting the
  // prefix here only affects the public [slug] read.
  '/api/privacy-notice/',
  // M7 Vendor DPA — public vendor questionnaire (signed-token GET + submit).
  // Only the /questionnaire/* sub-tree is public; the rest of /api/vendors/*
  // (list/create/[id]/stats/dpa/send-questionnaire) self-enforces auth.
  '/api/vendors/questionnaire/',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass through static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // Public API routes — always allow
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Only run auth check for protected routes
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
  if (!isProtected) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
