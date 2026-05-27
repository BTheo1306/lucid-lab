import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Build & Run | Lucid-Lab',
  description: 'Deployment, monitoring, documentation, runbooks, training and operations handover for business AI systems.',
  alternates: { canonical: 'https://lucid-lab.fr/en/build-run' },
}

export default function Page() {
  return <ServicePage lang="en" pageKey="buildRun" />
}
