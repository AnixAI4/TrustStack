import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name, slug)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  // If no org yet, send to org creation
  if (!membership) redirect('/create-organization')

  const org = membership.organizations as unknown as { id: string; name: string; slug: string }
  const userName = (user.user_metadata?.full_name as string) || ''

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F8FC]">
      <Sidebar orgName={org.name} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar userEmail={user.email ?? ''} userName={userName} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
