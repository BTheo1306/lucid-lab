import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'Audit IA & Opportunités | Lucid-Lab',
  description: 'Audit des workflows, données, cas d’usage IA, risques et priorités pour choisir le premier système métier à construire.',
  alternates: { canonical: 'https://lucid-lab.fr/audit-ia' },
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="audit" />
}
