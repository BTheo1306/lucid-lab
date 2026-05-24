import type { Metadata } from 'next'

import { AuditFlashPage } from '@/components/marketing/AuditFlashPage'

export const metadata: Metadata = {
  title: 'Audit Flash gratuit | Lucid-Lab',
  description:
    '30 minutes gratuites pour qualifier un besoin IA, identifier le premier système utile à construire et décider si Lucid-Lab est pertinent.',
  alternates: {
    canonical: 'https://lucid-lab.fr/audit-flash',
    languages: {
      'fr-FR': 'https://lucid-lab.fr/audit-flash',
      'en-US': 'https://lucid-lab.fr/en/audit-flash',
    },
  },
}

export default function Page() {
  return <AuditFlashPage lang="fr" />
}
