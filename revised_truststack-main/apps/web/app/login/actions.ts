"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { activeMembershipsFor, recordAuditEvents } from "@/lib/audit/record";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SignInState {
  error: string | null;
  email: string;
}

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

/** Only same-origin relative paths; blocks `//evil.example` open redirects. */
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input.", email };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    // Supabase's message is generic by design ("Invalid login credentials"); show it.
    return { error: error?.message ?? "Sign-in failed.", email };
  }

  const { userId, organizationIds } = await activeMembershipsFor(supabase, data.user.id);
  if (userId) {
    await recordAuditEvents(
      supabase,
      organizationIds.map((organizationId) => ({
        organizationId,
        userId,
        eventType: "auth.sign_in",
        entityType: "user",
        entityId: userId,
        description: "User signed in with email and password",
        metadata: { method: "password" },
      })),
    );
  }

  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { userId, organizationIds } = await activeMembershipsFor(supabase, user.id);
    if (userId) {
      await recordAuditEvents(
        supabase,
        organizationIds.map((organizationId) => ({
          organizationId,
          userId,
          eventType: "auth.sign_out",
          entityType: "user",
          entityId: userId,
          description: "User signed out",
        })),
      );
    }
  }
  // "local": end THIS session only. The default ("global") revokes every
  // session the user has — other browsers, API clients — which is surprising
  // and let a parallel e2e sign-out break another spec's bearer token.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
