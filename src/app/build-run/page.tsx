import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Build & Run | Lucid-Lab',
  description: 'Déploiement, monitoring, documentation, runbooks, formation et transfert d’exploitation des systèmes IA métier.',
  alternates: { canonical: 'https://lucid-lab.fr/build-run' },
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="buildRun" />
}
