import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Data & SI Readiness | Lucid-Lab',
  description: 'Vérification des sources, accès, droits, risques, hébergement et architecture cible avant le développement IA.',
  alternates: { canonical: 'https://lucid-lab.fr/readiness-data-si' },
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="data" />
}
