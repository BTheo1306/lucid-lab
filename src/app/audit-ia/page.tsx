import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Audit IA & Opportunités',
  description: 'Audit des workflows, données, cas d’usage IA, risques et priorités pour choisir le premier système métier à construire.',
  alternates: pageAlternates('/audit-ia', '/en/audit-ia', 'fr'),
}

export default function Page() {
  return <ServicePage lang="fr" pageKey="audit" />
}
