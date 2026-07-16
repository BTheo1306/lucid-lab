import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Client Cases',
  description: 'Anonymized client cases, treated workflows, delivered AI systems, business metrics and transferred deliverables.',
  alternates: pageAlternates('/cas-clients', '/en/case-studies', 'en'),
}

export default function Page() {
  return <ServicePage lang="en" pageKey="cases" />
}
