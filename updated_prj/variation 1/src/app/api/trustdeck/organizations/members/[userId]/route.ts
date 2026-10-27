import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformOrg } from "@/lib/platform/org";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const orgContext = await requirePlatformOrg(supabase, user.id);
  if (!orgContext.ok) {
    return NextResponse.json({ error: orgContext.error }, { status: orgContext.status });
  }
  if (user.id === userId) {
    return NextResponse.json({ error: "Owners cannot remove themselves" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Member service unavailable" }, { status: 503 });
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
  ) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { data: target } = await admin
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .or(`organization_id.eq.${organizationId},org_id.eq.${organizationId}`)
    .maybeSingle();
  if (!target || target.role === "owner") {
    return NextResponse.json({ error: "Member cannot be removed" }, { status: 400 });
  }

  const { error } = await admin
    .from("organization_members")
    .delete()
    .eq("user_id", userId)
    .or(`organization_id.eq.${organizationId},org_id.eq.${organizationId}`);
  if (error) return NextResponse.json({ error: "Could not remove member" }, { status: 500 });
  return NextResponse.json({ success: true });
}
