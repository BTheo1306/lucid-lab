import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Data & IT Readiness | Lucid-Lab',
  description: 'Source, access, rights, risk, hosting and target architecture checks before AI development.',
  alternates: { canonical: 'https://lucid-lab.fr/en/readiness-data-si' },
}

export default function Page() {
  return <ServicePage lang="en" pageKey="data" />
}
