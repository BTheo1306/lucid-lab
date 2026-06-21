import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Automation Roadmap | Lucid-Lab',
  description: 'A ranked automation backlog that turns manual processes into sequenced business builds.',
  alternates: pageAlternates('/roadmap-automatisation', '/en/roadmap-automatisation', 'en'),
}

export default function Page() {
  return <ServicePage lang="en" pageKey="roadmap" />
}
