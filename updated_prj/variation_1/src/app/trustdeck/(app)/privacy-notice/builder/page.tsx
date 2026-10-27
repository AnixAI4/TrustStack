import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NoticeBuilder } from '@/components/platform/modules/privacy-notice/NoticeBuilder'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import { ModulePageHeader } from '@/components/platform/ui/ModulePageHeader'

export default function PrivacyNoticeBuilderPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ModulePageHeader
        eyebrow="DPDP Section 5"
        title="Build your privacy notice"
        description="Define your processing activities, rights channels, retention terms, and supported languages."
        action={
          <Link href="/trustdeck/privacy-notice" className="btn btn-ghost inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to notices
          </Link>
        }
      />
      <ModulePage>
        <NoticeBuilder />
      </ModulePage>
    </div>
  )
}
