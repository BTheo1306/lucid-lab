import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Data & SI Readiness | Lucid-Lab',
  description: 'Vérification des sources, accès, droits, risques, hébergement et architecture cible avant le développement IA.',
  alternates: pageAlternates('/readiness-data-si', '/en/readiness-data-si', 'fr'),
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="data" />
}
