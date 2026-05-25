import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Méthode Lucid-Lab | Lucid-Lab',
  description: 'Méthode Lucid-Lab du diagnostic workflow à la mise en production, documentation, monitoring et transfert aux équipes.',
  alternates: { canonical: 'https://lucid-lab.fr/methode' },
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="method" />
}
