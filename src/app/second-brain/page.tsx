import type { Metadata } from 'next'

import { SecondBrainPage } from '@/components/marketing/SecondBrainPage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Second Brain : Claude installé avec tout votre contexte | Lucid-Lab',
  description:
    'Installation de Claude branché sur le contexte de votre entreprise : base de connaissance, connecteurs mails, agenda, Drive et CRM, deux automatisations de preuve, formation. En 14 jours.',
  alternates: pageAlternates('/second-brain', '/en/second-brain', 'fr'),
}

export default function Page() {
  return <SecondBrainPage lang="fr" />
}
