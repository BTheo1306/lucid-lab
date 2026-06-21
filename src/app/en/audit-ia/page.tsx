import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'AI Audit & Opportunities | Lucid-Lab',
  description: 'Workflow, data, AI use-case, risk and priority audit to choose the first business system to build.',
  alternates: pageAlternates('/audit-ia', '/en/audit-ia', 'en'),
}

export default function Page() {
  return <ServicePage lang="en" pageKey="audit" />
}
