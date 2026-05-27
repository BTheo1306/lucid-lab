import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Roadmap Automatisation | Lucid-Lab',
  description: 'Transformation des processus manuels en backlog d’automatisation priorisé, séquencé et relié aux gains métier.',
  alternates: { canonical: 'https://lucid-lab.fr/roadmap-automatisation' },
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="roadmap" />
}
