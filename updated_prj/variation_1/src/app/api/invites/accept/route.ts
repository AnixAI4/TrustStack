import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const token = body.token?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Invitation service unavailable" }, { status: 503 });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await admin.rpc("accept_organization_invite", {
    p_token_hash: tokenHash,
    p_user_id: user.id,
    p_email: user.email,
  });

  if (error) {
    const known = [
      "invite_not_found",
      "invite_already_used",
      "invite_expired",
      "email_mismatch",
      "seat_limit_reached",
      "active_org_pilot_required",
    ].find((code) => error.message.includes(code));
    return NextResponse.json(
      { error: known || "Could not accept invitation" },
      { status: known === "email_mismatch" ? 403 : known ? 409 : 503 }
    );
  }

  return NextResponse.json({ success: true, ...(data as object) });
}
