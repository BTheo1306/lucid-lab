import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Méthode Lucid-Lab',
  description: 'Méthode Lucid-Lab du diagnostic workflow à la mise en production, documentation, monitoring et transfert aux équipes.',
  alternates: pageAlternates('/methode', '/en/method', 'fr'),
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="method" />
}
