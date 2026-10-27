import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_PURPOSES } from '@/lib/constants'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'No organization found' }, { status: 403 })

    const [configRes, purposesRes] = await Promise.all([
      supabase
        .from('consent_configs')
        .select('id, widget_version, languages, position, primary_color, show_reject_all, require_age_confirmation, whatsapp_enabled, whatsapp_template_id, created_at, updated_at')
        .eq('organization_id', member.organization_id)
        .single(),
      supabase
        .from('consent_purposes')
        .select('*')
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: true }),
    ])

    return NextResponse.json({
      config: configRes.data || null,
      purposes: purposesRes.data || [],
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface PurposeInput {
  purpose_key: string
  name_en: string
  name_hi?: string | null
  name_ta?: string | null
  name_te?: string | null
  description_en: string
  required: boolean
  dpdp_basis?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'No organization found' }, { status: 403 })

    const body = await request.json()
    const {
      purposes,
      languages,
      position,
      primary_color,
      show_reject_all,
      require_age_confirmation,
      whatsapp_enabled,
      whatsapp_template_id,
    } = body

    const { data: existing } = await supabase
      .from('consent_configs')
      .select('id, widget_version')
      .eq('organization_id', member.organization_id)
      .single()

    const newVersion = existing ? String(parseInt(existing.widget_version) + 1) : '1'

    const configPayload = {
      widget_version: newVersion,
      languages: languages || ['en'],
      position: position || 'bottom-bar',
      primary_color: (primary_color || '003366').replace('#', ''),
      show_reject_all: show_reject_all ?? true,
      require_age_confirmation: require_age_confirmation ?? false,
      whatsapp_enabled: whatsapp_enabled ?? false,
      whatsapp_template_id: whatsapp_template_id || null,
      updated_at: new Date().toISOString(),
    }

    const { data: config, error: configError } = existing
      ? await supabase
          .from('consent_configs')
          .update(configPayload)
          .eq('id', existing.id)
          .select('*')
          .single()
      : await supabase
          .from('consent_configs')
          .insert({ organization_id: member.organization_id, ...configPayload })
          .select('*')
          .single()

    if (configError) {
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
    }

    const purposeList: PurposeInput[] = purposes || DEFAULT_PURPOSES

    await supabase
      .from('consent_purposes')
      .delete()
      .eq('organization_id', member.organization_id)

    const { data: savedPurposes, error: purposeError } = await supabase
      .from('consent_purposes')
      .insert(
        purposeList.map((p: PurposeInput) => ({
          organization_id: member.organization_id,
          purpose_key: p.purpose_key,
          name_en: p.name_en,
          name_hi: p.name_hi || null,
          name_ta: p.name_ta || null,
          name_te: p.name_te || null,
          description_en: p.description_en,
          required: p.required,
          dpdp_basis: p.dpdp_basis || 'consent_s6',
        }))
      )
      .select('*')

    if (purposeError) {
      return NextResponse.json({ error: 'Failed to save purposes' }, { status: 500 })
    }

    // Immutable audit snapshot of this version (purposes + settings). Best-effort:
    // if the consent_config_versions table hasn't been created yet, the save still
    // succeeds — we just skip the snapshot. See db/consent_config_versions.sql.
    try {
      await supabase.from('consent_config_versions').insert({
        organization_id: member.organization_id,
        version: newVersion,
        purposes: (savedPurposes || []).map((p: PurposeInput) => ({
          purpose_key: p.purpose_key,
          name_en: p.name_en,
          name_hi: p.name_hi || null,
          name_ta: p.name_ta || null,
          name_te: p.name_te || null,
          description_en: p.description_en,
          required: p.required,
          dpdp_basis: p.dpdp_basis || 'consent_s6',
        })),
        languages: configPayload.languages,
        position: configPayload.position,
        primary_color: configPayload.primary_color,
        show_reject_all: configPayload.show_reject_all,
        require_age_confirmation: configPayload.require_age_confirmation,
        whatsapp_enabled: configPayload.whatsapp_enabled,
      })
    } catch {
      // snapshot is best-effort; never block a config save on it
    }

    return NextResponse.json({ success: true, config, purposes: savedPurposes })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
