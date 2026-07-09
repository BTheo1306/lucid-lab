import type { Metadata } from 'next'

import { FormationsPage } from '@/components/marketing/FormationsPage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Formations IA pour entreprises | Lucid-Lab',
  description:
    'Formations IA intra-entreprise : acculturation dirigeants, Claude et ChatGPT au quotidien, second brain, agents et automatisations, gouvernance RGPD et AI Act. Sur vos cas réels.',
  alternates: pageAlternates('/formations-ia', '/en/ai-training', 'fr'),
}

export default function Page() {
  return <FormationsPage lang="fr" />
}
