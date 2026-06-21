import type { Metadata } from 'next'

import { AuditFlashPage } from '@/components/marketing/AuditFlashPage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Audit Flash gratuit | Lucid-Lab',
  description:
    '30 minutes gratuites pour qualifier un besoin IA, identifier le premier système utile à construire et décider si Lucid-Lab est pertinent.',
  alternates: pageAlternates('/audit-flash', '/en/audit-flash', 'fr'),
}

export default function Page() {
  return <AuditFlashPage lang="fr" />
}
