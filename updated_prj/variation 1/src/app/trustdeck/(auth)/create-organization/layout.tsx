import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/platform/supabase/admin'
import { getCurrentUserTier } from '@/lib/subscription-access'
import { pilotSubscribeUrl } from '@/lib/pilot-paths'
import { getUserPlatformOrg } from '@/lib/platform/org'

/** Free users must buy Pilot; users who already have an org skip to the dashboard. */
export default async function CreateOrganizationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (
    process.env.NODE_ENV === 'development'
    && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ) {
    redirect('/trustdeck/overview')
  }

  const tier = await getCurrentUserTier()
  if (tier !== 'pilot') {
    redirect(pilotSubscribeUrl('/trustdeck/create-organization'))
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in?next=/trustdeck/create-organization')

  let org = await getUserPlatformOrg(supabase, user.id)
  if (!org) {
    try {
      const admin = createAdminClient()
      org = await getUserPlatformOrg(admin, user.id)
    } catch {
      // ignore
    }
  }
  if (org) redirect('/trustdeck/overview')

  return children
}
