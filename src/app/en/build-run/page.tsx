import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Build & Run | Lucid-Lab',
  description: 'Deployment, monitoring, documentation, runbooks, training and operations handover for business AI systems.',
  alternates: pageAlternates('/build-run', '/en/build-run', 'en'),
}

export default function Page() {
  return <ServicePage lang="en" pageKey="buildRun" />
}
