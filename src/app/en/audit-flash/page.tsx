import type { Metadata } from 'next'

import { AuditFlashPage } from '@/components/marketing/AuditFlashPage'

export const metadata: Metadata = {
  title: 'Free Audit Flash | Lucid-Lab',
  description:
    'A free 30-minute call to qualify an AI need, identify the first useful system to build and decide whether Lucid-Lab is relevant.',
  alternates: {
    canonical: 'https://lucid-lab.fr/en/audit-flash',
    languages: {
      'fr-FR': 'https://lucid-lab.fr/audit-flash',
      'en-US': 'https://lucid-lab.fr/en/audit-flash',
    },
  },
}

export default function Page() {
  return <AuditFlashPage lang="en" />
}
