import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Roadmap Automatisation',
  description: 'Transformation des processus manuels en backlog d’automatisation priorisé, séquencé et relié aux gains métier.',
  alternates: pageAlternates('/roadmap-automatisation', '/en/roadmap-automatisation', 'fr'),
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="roadmap" />
}
