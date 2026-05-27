import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Cas clients | Lucid-Lab',
  description: 'Cas clients anonymisés, workflows traités, systèmes IA livrés, métriques métier et livrables transférés.',
  alternates: { canonical: 'https://lucid-lab.fr/cas-clients' },
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="cases" />
}
