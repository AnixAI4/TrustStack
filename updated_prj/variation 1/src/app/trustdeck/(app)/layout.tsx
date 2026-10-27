import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlatformChrome } from '@/components/platform/dashboard/PlatformChrome'
import { pilotSubscribeUrl } from '@/lib/pilot-paths'
import { requirePlatformOrg } from '@/lib/platform/org'
import { getVerifiedUser } from '@/lib/supabase/verified-user'
import { PlatformOrgProvider } from '@/contexts/PlatformOrgContext'

export default async function PlatformAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const user = await getVerifiedUser(supabase)
  if (!user) redirect('/auth/sign-in?next=/trustdeck')

  const ctx = await requirePlatformOrg(supabase, user.id)
  if (!ctx.ok && ctx.status === 402) {
    redirect(pilotSubscribeUrl('/trustdeck'))
  }
  if (!ctx.ok) redirect('/trustdeck/create-organization')

  return (
    <PlatformOrgProvider org={ctx.org}>
      <PlatformChrome orgName={ctx.org.name}>{children}</PlatformChrome>
    </PlatformOrgProvider>
  )
}
