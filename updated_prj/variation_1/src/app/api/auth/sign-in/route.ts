import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withApiGuard, type ApiContext } from "@/lib/security/api-guard";
import { resetRateLimit } from "@/lib/security/rate-limiter";
import { validateEmail, validateRequestBody } from "@/lib/security/validation";

async function handleSignIn(request: NextRequest, context: ApiContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const validation = validateRequestBody<{ email: string; password: string }>(
    body,
    ["email", "password"]
  );
  if (!validation.valid || !validation.data) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const email = validation.data.email.trim().toLowerCase();
  const password = validation.data.password;
  if (!validateEmail(email).valid || typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  resetRateLimit(context.clientIp, "login");
  return NextResponse.json({ success: true, userId: data.user.id });
}

export const POST = withApiGuard(handleSignIn, {
  requireAuth: false,
  rateLimit: "login",
  allowedMethods: ["POST"],
  requireContentType: "application/json",
});
