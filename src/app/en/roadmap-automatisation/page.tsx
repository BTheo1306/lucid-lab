import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Automation Roadmap | Lucid-Lab',
  description: 'A ranked automation backlog that turns manual processes into sequenced business builds.',
  alternates: { canonical: 'https://lucid-lab.fr/en/roadmap-automatisation' },
}

export default function Page() {
  return <ServicePage lang="en" pageKey="roadmap" />
}
