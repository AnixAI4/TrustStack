import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { NOTICE_LANGUAGES } from '@/lib/platform/constants'
import { PublicNoticeView } from '@/components/platform/modules/privacy-notice/PublicNoticeView'
import type { PrivacyNotice, PrivacyNoticeVersion } from '@/types/dpdp'

interface Props {
  params: Promise<{ slug: string }>
}

async function loadNotice(slug: string) {
  const supabase = createAdminClient()
  if (!supabase) return null

  const { data: notice } = await supabase
    .from('privacy_notices')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!notice || !(notice as PrivacyNotice).current_version_id) return null
  const noticeRow = notice as PrivacyNotice

  const [{ data: version }, { data: org }] = await Promise.all([
    supabase
      .from('privacy_notice_versions')
      .select('*')
      .eq('id', noticeRow.current_version_id as string)
      .maybeSingle(),
    supabase
      .from('organizations')
      .select('name, logo_url')
      .eq('id', noticeRow.organization_id)
      .single(),
  ])

  if (!version) return null
  return {
    version: version as PrivacyNoticeVersion,
    orgName: org?.name || slug,
    orgLogoUrl: (org?.logo_url as string | null) || null,
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const result = await loadNotice(slug)
  const name = result?.orgName || slug
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  return {
    title: `${name} - Privacy Notice`,
    description: `Privacy Notice for ${name} under the Digital Personal Data Protection Act 2023`,
    alternates: { canonical: `${baseUrl}/trustdeck/public/${slug}` },
  }
}

export default async function PublicNoticePage({ params }: Props) {
  const { slug } = await params
  const result = await loadNotice(slug)
  if (!result) notFound()

  const { version, orgName, orgLogoUrl } = result
  const row = version as unknown as Record<string, string | null>
  const availableLanguages = NOTICE_LANGUAGES.filter(l => !!row[l.column]).map(l => l.code)

  return (
    <PublicNoticeView
      organizationName={orgName}
      logoUrl={orgLogoUrl}
      version={version}
      availableLanguages={availableLanguages}
    />
  )
}
