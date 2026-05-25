import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Lucid-Lab Method | Lucid-Lab',
  description: 'Lucid-Lab method from workflow diagnosis to production release, documentation, monitoring and team handover.',
  alternates: { canonical: 'https://lucid-lab.fr/en/method' },
}

export default function Page() {
  return <ServicePage lang="en" pageKey="method" />
}
