import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Build & Run | Lucid-Lab',
  description: 'Déploiement, monitoring, documentation, runbooks, formation et transfert d’exploitation des systèmes IA métier.',
  alternates: pageAlternates('/build-run', '/en/build-run', 'fr'),
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="buildRun" />
}
