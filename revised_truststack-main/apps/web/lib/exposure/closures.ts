import "server-only";
import { addDays, FORECAST_CONFIG } from "@truststack/core";
import { todayInIndia } from "@/lib/ropa/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * The pace the forecast reads (Slice 9, §4.6): every action closed in the
 * organisation — from either parent, any assessment — over the trailing
 * eight weeks, as the date in India it was closed (D-055).
 *
 * Stored `gap_actions.closed_at` only: the database stamps it when an action
 * closes, so nobody can back-date a closure to flatter the pace. Read as the
 * caller (RLS applies) and PAGED past PostgREST's 1,000-row cap. The SQL
 * mirror reads the same rows (`app.exposure_closures`); the window itself is
 * applied by core's `weeklyClosures`, so the margin here only saves reading.
 */
export async function readActionClosures(supabase: AppSupabaseClient, organizationId: string, today: string): Promise<string[]> {
  // One extra day either side of the window absorbs the India/UTC offset.
  const since = new Date(`${addDays(today, -(FORECAST_CONFIG.trailingWeeks * 7 + 1))}T00:00:00+05:30`).toISOString();
  const out: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("gap_actions")
      .select("id, closed_at")
      .eq("organization_id", organizationId)
      .not("closed_at", "is", null)
      .gte("closed_at", since)
      .order("closed_at")
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    for (const row of data ?? []) if (row.closed_at) out.push(todayInIndia(new Date(row.closed_at)));
    if ((data ?? []).length < 1000) return out;
  }
}
