import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Cas clients',
  description: 'Cas clients anonymisés, workflows traités, systèmes IA livrés, métriques métier et livrables transférés.',
  alternates: pageAlternates('/cas-clients', '/en/case-studies', 'fr'),
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="cases" />
}
