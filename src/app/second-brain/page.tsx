import type { Metadata } from 'next'

import { SecondBrainPage } from '@/components/marketing/SecondBrainPage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Second Brain : Claude connecté à votre entreprise | Lucid-Lab',
  description:
    'On installe Claude et on le connecte à ce que votre entreprise sait déjà : offres, process, clients. Base de connaissance, connexion à vos outils, deux automatisations et formation, en 14 jours.',
  alternates: pageAlternates('/second-brain', '/en/second-brain', 'fr'),
}

export default function Page() {
  return <SecondBrainPage lang="fr" />
}
