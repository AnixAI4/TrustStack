import "server-only";
import { compileSharingList, sharingListText, SHARING_LAW_NOTE, type RopaLawfulBasis, type SharingSourceRecord, type VendorRole } from "@truststack/core";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { readAllRecords } from "@/lib/ropa/shape";

/**
 * The s.11(1)(b) list for an access request (D-139): read through the
 * processing register's own reader and the record–processor links, with the
 * caller's JWT (RLS applies), then compiled in core. No arithmetic here (D-069).
 */
interface LinkRow {
  ropa_record_id: string;
  vendors: { name: string; service: string | null; vendor_role: string } | null;
}

async function readAllRecordVendors(supabase: AppSupabaseClient, organizationId: string): Promise<LinkRow[]> {
  const page = 1000;
  const out: LinkRow[] = [];
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from("ropa_vendors")
      .select("ropa_record_id, vendors(name, service, vendor_role)")
      .eq("organization_id", organizationId)
      .order("ropa_record_id")
      .order("vendor_id")
      .range(from, from + page - 1);
    if (error) throw error;
    out.push(...((data ?? []) as unknown as LinkRow[]));
    if ((data ?? []).length < page) return out;
  }
}

export async function readSharingList(supabase: AppSupabaseClient, organizationId: string) {
  const [records, links] = await Promise.all([readAllRecords(supabase, organizationId), readAllRecordVendors(supabase, organizationId)]);
  const vendorsOf = new Map<string, SharingSourceRecord["vendors"][number][]>();
  for (const l of links) {
    if (!l.vendors) continue;
    const list = vendorsOf.get(l.ropa_record_id) ?? [];
    list.push({ name: l.vendors.name, service: l.vendors.service, role: l.vendors.vendor_role as VendorRole });
    vendorsOf.set(l.ropa_record_id, list);
  }
  const list = compileSharingList(
    records.map((r) => ({
      recordCode: r.record_code,
      name: r.name,
      status: r.status,
      lawfulBasis: (r.lawful_basis ?? null) as RopaLawfulBasis | null,
      dataCategories: r.data_categories,
      sharing: r.sharing,
      vendors: vendorsOf.get(r.id) ?? [],
    })),
  );
  return { ...list, text: sharingListText(list), lawNote: SHARING_LAW_NOTE };
}
