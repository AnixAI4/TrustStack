import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/platform/supabase/admin";
import {
  finalizeDsrMagicLink,
  parseDsrCompleteNext,
} from "@/lib/platform/dsr/finalize-verification";
import { safeInternalPath } from "@/lib/pilot-paths";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeInternalPath(searchParams.get("next"), "/");

  const dsrComplete = parseDsrCompleteNext(next);

  const isRecovery =
    type === "recovery" || next.includes("/auth/reset-password");

  const buildSuccessUrl = (extra?: Record<string, string>) => {
    const base = isRecovery
      ? `${origin}/auth/reset-password`
      : `${origin}${next}`;
    if (!extra || Object.keys(extra).length === 0) return base;
    const url = new URL(base);
    for (const [key, value] of Object.entries(extra)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  };

  const failUrl = isRecovery
    ? `${origin}/auth/reset-password?error=link_expired`
    : dsrComplete
      ? buildSuccessUrl({ error: "auth_callback_failed" })
      : `${origin}/auth/sign-in?error=auth_callback_failed`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.redirect(failUrl);
  }

  let successUrl = buildSuccessUrl();

  const response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let authOk = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth callback exchangeCodeForSession:", error.message);
      return NextResponse.redirect(failUrl);
    }
    authOk = true;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as
        | "recovery"
        | "signup"
        | "invite"
        | "magiclink"
        | "email_change"
        | "email",
    });
    if (error) {
      console.error("auth callback verifyOtp:", error.message);
      return NextResponse.redirect(failUrl);
    }
    authOk = true;
  } else {
    console.error(
      "auth callback missing params:",
      Object.fromEntries(searchParams.entries())
    );
    return NextResponse.redirect(failUrl);
  }

  if (authOk && dsrComplete) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const admin = createAdminClient();
      const outcome = await finalizeDsrMagicLink(
        admin,
        user.email,
        dsrComplete.orgSlug,
        dsrComplete.reference,
      );

      await supabase.auth.signOut();

      if (outcome === "verified" || outcome === "already") {
        successUrl = buildSuccessUrl({ verified: "1" });
      } else {
        successUrl = buildSuccessUrl({
          error:
            outcome === "email_mismatch"
              ? "email_mismatch"
              : "auth_callback_failed",
        });
      }

      const dsrResponse = NextResponse.redirect(successUrl);
      response.cookies.getAll().forEach((cookie) => {
        dsrResponse.cookies.set(cookie);
      });
      return dsrResponse;
    }

    await supabase.auth.signOut();
    return NextResponse.redirect(buildSuccessUrl({ error: "auth_callback_failed" }));
  }

  return response;
}
