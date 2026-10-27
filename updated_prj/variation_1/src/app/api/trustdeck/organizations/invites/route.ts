import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateEmail } from "@/lib/security/validation";
import { requirePlatformOrg } from "@/lib/platform/org";

const INVITE_ROLES = new Set(["admin", "member", "dpo", "viewer", "board"]);

async function adminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const orgContext = await requirePlatformOrg(supabase, user.id);
  if (!orgContext.ok) return null;

  const admin = createAdminClient();
  if (!admin) return null;
  const { data: membership } = await admin
    .from("organization_members")
    .select("org_id, organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const organizationId = membership?.organization_id || membership?.org_id;
  if (
    organizationId !== orgContext.organizationId ||
    !["owner", "admin"].includes(membership?.role ?? "")
  ) return null;
  return { admin, user, organizationId: orgContext.organizationId };
}

export async function GET() {
  const context = await adminContext();
  if (!context) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const [{ data: members }, { data: invites }, { data: subscription, error: subError }] =
    await Promise.all([
      context.admin
        .from("organization_members")
        .select("user_id, role, joined_at")
        .or(`organization_id.eq.${context.organizationId},org_id.eq.${context.organizationId}`),
      context.admin
        .from("organization_invites")
        .select("id, email, role, expires_at, created_at")
        .eq("organization_id", context.organizationId)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
      context.admin
        .from("truststack_subscriptions")
        .select("seats")
        .eq("org_id", context.organizationId)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (subError) {
    return NextResponse.json({ error: "Invite security migration is not applied" }, { status: 503 });
  }

  const roster = await Promise.all(
    (members ?? []).map(async (member) => {
      const { data } = await context.admin.auth.admin.getUserById(member.user_id);
      return { ...member, email: data.user?.email ?? null };
    })
  );

  return NextResponse.json({
    seats: subscription?.seats ?? 1,
    used: roster.length,
    pending: invites?.length ?? 0,
    members: roster,
    invites: invites ?? [],
  });
}

export async function POST(request: NextRequest) {
  const context = await adminContext();
  if (!context) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  let body: { email?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const role = body.role?.trim().toLowerCase() ?? "member";
  if (!validateEmail(email).valid || !INVITE_ROLES.has(role)) {
    return NextResponse.json({ error: "Valid email and role are required" }, { status: 400 });
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: inviteId, error } = await context.admin.rpc(
    "create_organization_invite",
    {
      p_org_id: context.organizationId,
      p_email: email,
      p_role: role,
      p_token_hash: tokenHash,
      p_invited_by: context.user.id,
    }
  );

  if (error) {
    const known = [
      "seat_limit_reached",
      "active_org_pilot_required",
      "admin_required",
      "invalid_email",
      "invalid_role",
    ].find((code) => error.message.includes(code));
    return NextResponse.json(
      { error: known || "Could not create invitation" },
      { status: known === "seat_limit_reached" ? 409 : known ? 400 : 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const inviteUrl = `${appUrl.replace(/\/$/, "")}/invite/${token}`;
  let delivery: "email" | "link" = "link";
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (resendKey) {
    const { data: org } = await context.admin
      .from("organizations")
      .select("name")
      .eq("id", context.organizationId)
      .single();
    const result = await new Resend(resendKey).emails.send({
      from: process.env.RESEND_FROM_EMAIL || "TrustStack <onboarding@resend.dev>",
      to: email,
      subject: `You're invited to ${org?.name || "a TrustStack workspace"}`,
      text: `You have been invited as ${role}. Accept within 7 days: ${inviteUrl}`,
    });
    if (result.error) {
      await context.admin
        .from("organization_invites")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", inviteId);
      return NextResponse.json({ error: "Could not deliver invitation" }, { status: 502 });
    }
    delivery = "email";
  }

  return NextResponse.json({
    success: true,
    delivery,
    ...(process.env.NODE_ENV !== "production" ? { invite_url: inviteUrl } : {}),
  });
}

export async function DELETE(request: NextRequest) {
  const context = await adminContext();
  if (!context) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Invite id is required" }, { status: 400 });

  const { error } = await context.admin
    .from("organization_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .is("accepted_at", null);
  if (error) return NextResponse.json({ error: "Could not revoke invitation" }, { status: 500 });
  return NextResponse.json({ success: true });
}
