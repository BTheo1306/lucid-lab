import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Client Cases | Lucid-Lab',
  description: 'Anonymized client cases, treated workflows, delivered AI systems, business metrics and transferred deliverables.',
  alternates: { canonical: 'https://lucid-lab.fr/en/case-studies' },
}

export default function Page() {
  return <ServicePage lang="en" pageKey="cases" />
}
