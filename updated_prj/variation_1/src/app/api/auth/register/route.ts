import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiGuard, type ApiContext } from "@/lib/security/api-guard";
import {
  validateEmail,
  validatePassword,
  validateRequestBody,
  hasSqlInjection,
  hasXssAttempt,
} from "@/lib/security/validation";
import { detectBot, checkHoneypot } from "@/lib/security/bot-detection";

/**
 * Creates a confirmed account so signup does not depend on email links.
 * College/corporate mail scanners often burn single-use confirmation OTPs
 * before the user ever clicks them (otp_expired every time).
 */
async function handleRegister(
  request: NextRequest,
  { clientIp }: ApiContext
): Promise<NextResponse> {
  // Bot detection
  const botCheck = detectBot(request);
  if (botCheck.isBot) {
    console.warn(`Bot detected on register from ${clientIp}:`, botCheck.reasons);
    return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Validate request structure
  const bodyValidation = validateRequestBody<{
    email: string;
    password: string;
    website?: string; // Honeypot field
  }>(body, ["email", "password"]);

  if (!bodyValidation.valid) {
    return NextResponse.json({ error: bodyValidation.error }, { status: 400 });
  }

  // Check honeypot
  const honeypotCheck = checkHoneypot(bodyValidation.data as Record<string, unknown>);
  if (honeypotCheck.isBot) {
    console.warn(`Honeypot triggered on register from ${clientIp}`);
    return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  }

  const { email: rawEmail, password } = bodyValidation.data!;

  // Validate email
  const emailValidation = validateEmail(rawEmail);
  if (!emailValidation.valid) {
    return NextResponse.json({ error: emailValidation.error }, { status: 400 });
  }
  const email = emailValidation.sanitized!;

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
  }

  // Check for injection attempts
  if (hasSqlInjection(email) || hasXssAttempt(email)) {
    console.warn(`Injection attempt on register from ${clientIp}: ${email}`);
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server auth is not configured (missing SUPABASE_SERVICE_KEY)." },
      { status: 503 }
    );
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!createError && created.user) {
    return NextResponse.json({ ok: true, userId: created.user.id });
  }

  const msg = createError?.message?.toLowerCase() ?? "";
  const alreadyExists =
    msg.includes("already") ||
    msg.includes("registered") ||
    msg.includes("exists") ||
    createError?.status === 422;

  if (!alreadyExists) {
    console.error("auth register createUser:", createError?.message);
    return NextResponse.json(
      { error: createError?.message || "Could not create account." },
      { status: 400 }
    );
  }

  // Existing unconfirmed accounts (from burned email links): confirm if password matches.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { error: "This email is already registered. Try signing in instead." },
      { status: 409 }
    );
  }

  const probe = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await probe.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError) {
    // Already confirmed and password correct - client can sign in.
    return NextResponse.json({ ok: true, alreadyExists: true });
  }

  const notConfirmed = signInError.message.toLowerCase().includes("not confirmed");
  if (!notConfirmed) {
    return NextResponse.json(
      { error: "This email is already registered. Try signing in instead." },
      { status: 409 }
    );
  }

  // generateLink returns the user without sending mail; use it to resolve id.
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
  const existing = linkData?.user;
  if (linkError || !existing) {
    console.error("auth register generateLink:", linkError?.message);
    return NextResponse.json(
      { error: "Could not repair this account. Try signing in." },
      { status: 500 }
    );
  }

  const { error: confirmError } = await admin.auth.admin.updateUserById(
    existing.id,
    { email_confirm: true }
  );
  if (confirmError) {
    console.error("auth register confirm:", confirmError.message);
    return NextResponse.json(
      { error: "Could not confirm this account. Try signing in." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, repaired: true });
}

export const POST = withApiGuard(handleRegister, {
  requireAuth: false,
  rateLimit: "auth",
  allowedMethods: ["POST"],
  requireContentType: "application/json",
});
