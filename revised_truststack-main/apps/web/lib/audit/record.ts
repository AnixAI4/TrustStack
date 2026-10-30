import "server-only";
import { headers } from "next/headers";
import type { Json } from "@/lib/supabase/database.types";
import type { AppSupabaseClient } from "@/lib/supabase/server";

export interface AuditEvent {
  organizationId: string;
  userId: string;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Appends to audit_logs AS THE SIGNED-IN USER. RLS (`audit_logs_insert_member_as_self`)
 * only accepts rows for the caller's own organisations with their own user_id,
 * so a forged entry fails at the database — not just here. Rule 6(c).
 */
export async function recordAuditEvents(supabase: AppSupabaseClient, events: AuditEvent[]) {
  if (events.length === 0) return;
  const h = await headers();
  const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const userAgent = h.get("user-agent");

  const { error } = await supabase.from("audit_logs").insert(
    events.map((e) => ({
      organization_id: e.organizationId,
      user_id: e.userId,
      event_type: e.eventType,
      entity_type: e.entityType,
      entity_id: e.entityId ?? null,
      description: e.description,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: (e.metadata ?? {}) as Json,
    })),
  );
  if (error) throw new Error(`audit write failed: ${error.message}`);
}

/** Resolves the app user and their active organisation ids for the current session. */
export async function activeMembershipsFor(supabase: AppSupabaseClient, authUserId: string) {
  const { data: appUser, error } = await supabase
    .from("users")
    .select("id")
    .eq("auth_provider_user_id", authUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!appUser) return { userId: null, organizationIds: [] as string[] };

  const { data: rows, error: mError } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", appUser.id)
    .eq("status", "active");
  if (mError) throw new Error(mError.message);
  return { userId: appUser.id, organizationIds: (rows ?? []).map((r) => r.organization_id) };
}
