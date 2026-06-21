import type { Metadata } from 'next'

import { AuditFlashPage } from '@/components/marketing/AuditFlashPage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Free Audit Flash | Lucid-Lab',
  description:
    'A free 30-minute call to qualify an AI need, identify the first useful system to build and decide whether Lucid-Lab is relevant.',
  alternates: pageAlternates('/audit-flash', '/en/audit-flash', 'en'),
}

export default function Page() {
  return <AuditFlashPage lang="en" />
}
