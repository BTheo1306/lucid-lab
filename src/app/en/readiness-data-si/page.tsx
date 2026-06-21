import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Data & IT Readiness | Lucid-Lab',
  description: 'Source, access, rights, risk, hosting and target architecture checks before AI development.',
  alternates: pageAlternates('/readiness-data-si', '/en/readiness-data-si', 'en'),
}

export default function Page() {
  return <ServicePage lang="en" pageKey="data" />
}
