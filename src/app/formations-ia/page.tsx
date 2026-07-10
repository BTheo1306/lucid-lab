import type { Metadata } from 'next'

import { FormationsPage } from '@/components/marketing/FormationsPage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Formations IA pour entreprises | Lucid-Lab',
  description:
    'Formations IA en entreprise, sur vos cas réels : comprendre l’IA pour décider, Claude et ChatGPT au quotidien, second brain, agents et automatisations, règles d’usage et conformité.',
  alternates: pageAlternates('/formations-ia', '/en/ai-training', 'fr'),
}

export default function Page() {
  return <FormationsPage lang="fr" />
}
