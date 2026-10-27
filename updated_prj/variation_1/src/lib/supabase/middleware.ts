import { createServerClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export type SessionUpdate = {
  supabaseResponse: NextResponse;
  user: { id: string } | null;
  supabase: SupabaseClient | null;
};

export async function updateSession(
  request: NextRequest
): Promise<SessionUpdate> {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { supabaseResponse, user: null, supabase: null };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verify the signed access token locally when the project uses asymmetric
  // keys. The SDK refreshes near-expiry sessions and safely falls back to the
  // Auth server for symmetric keys.
  const { data, error } = await supabase.auth.getClaims();
  const user = !error && data?.claims.sub ? { id: data.claims.sub } : null;

  return { supabaseResponse, user, supabase };
}
