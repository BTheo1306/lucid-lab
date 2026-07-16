import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Agents IA & Outils Internes',
  description: 'Agents IA, dashboards, portails, connecteurs et automatisations métier branchés aux outils existants.',
  alternates: pageAlternates('/agents-ia-outils-internes', '/en/agents-ia-outils-internes', 'fr'),
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="agents" />
}
