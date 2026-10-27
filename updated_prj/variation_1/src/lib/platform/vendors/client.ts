import type { Vendor, VendorType } from '@/types/dpdp'

export type VendorFormPayload = {
  name?: string
  vendor_type?: VendorType
  website?: string
  contact_name?: string
  contact_email?: string
  data_categories?: string[]
  cross_border?: boolean
  transfer_countries?: string[]
  notes?: string
}

export function vendorFormToApiBody(data: VendorFormPayload) {
  return {
    name: data.name,
    vendor_type: data.vendor_type,
    website: data.website,
    contact_name: data.contact_name,
    contact_email: data.contact_email,
    personal_data_categories: data.data_categories,
    india_data_residency: data.cross_border === undefined ? undefined : !data.cross_border,
    data_location: data.transfer_countries,
    notes: data.notes,
  }
}

export async function createVendorFromForm(data: VendorFormPayload): Promise<Vendor> {
  const res = await fetch('/api/trustdeck/vendors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vendorFormToApiBody(data)),
  })
  const json = (await res.json()) as { success?: boolean; data?: Vendor; error?: string }
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || 'Failed to save vendor')
  }
  return json.data
}
