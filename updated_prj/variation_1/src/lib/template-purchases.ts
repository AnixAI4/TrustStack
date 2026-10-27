import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

const META_KEY = "purchased_templates";

export {
  templatePricePaise,
  templatePriceDisplay,
} from "@/lib/template-pricing";

export function getPurchasedSlugsFromUser(user: User | null | undefined): string[] {
  const raw = user?.app_metadata?.[META_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === "string");
}

export function userOwnsTemplate(
  user: User | null | undefined,
  slug: string
): boolean {
  return getPurchasedSlugsFromUser(user).includes(slug);
}

/** Persist a purchase on the user (service role). */
export async function grantTemplatePurchase(
  userId: string,
  slug: string
): Promise<{ ok: true; slugs: string[] } | { ok: false; error: string }> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Server missing SUPABASE_SERVICE_KEY" };
  }

  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    return { ok: false, error: error?.message || "User not found" };
  }

  const existing = getPurchasedSlugsFromUser(data.user);
  if (existing.includes(slug)) {
    return { ok: true, slugs: existing };
  }

  const slugs = [...existing, slug];
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...data.user.app_metadata,
      [META_KEY]: slugs,
    },
  });

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true, slugs };
}
