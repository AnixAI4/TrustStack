import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicSupabaseEnv } from "@/lib/env";
import type { Database } from "./database.types";

/** Every request-path client is typed against the generated schema. */
export type AppSupabaseClient = SupabaseClient<Database>;

/**
 * Request-scoped Supabase client for Server Components, Server Actions and
 * route handlers. Uses the ANON key plus the caller's session, so every query
 * runs as `authenticated` under RLS (D-015).
 */
export async function createSupabaseServerClient(): Promise<AppSupabaseClient> {
  const { url, anonKey } = publicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // middleware.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Client for an `/api/v1` request. A `Authorization: Bearer <jwt>` header wins
 * (API clients, tests); otherwise the browser's cookie session is used. Either
 * way it is the anon key + the user's JWT — RLS always applies.
 */
export async function createSupabaseForRequest(request: Request): Promise<{
  supabase: AppSupabaseClient;
  accessToken: string | undefined;
}> {
  const header = request.headers.get("authorization");
  const bearer = header?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearer) {
    const { url, anonKey } = publicSupabaseEnv();
    const supabase = createClient<Database>(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { supabase, accessToken: bearer };
  }

  return { supabase: await createSupabaseServerClient(), accessToken: undefined };
}
