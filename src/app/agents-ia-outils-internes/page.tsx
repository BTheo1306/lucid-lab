import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Agents IA & Outils Internes | Lucid-Lab',
  description: 'Agents IA, dashboards, portails, connecteurs et automatisations métier branchés aux outils existants.',
  alternates: { canonical: 'https://lucid-lab.fr/agents-ia-outils-internes' },
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="agents" />
}
