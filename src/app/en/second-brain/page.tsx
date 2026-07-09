import type { Metadata } from 'next'

import { SecondBrainPage } from '@/components/marketing/SecondBrainPage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Second Brain: Claude installed with your full company context | Lucid-Lab',
  description:
    'We install Claude connected to your company context: knowledge base, email, calendar, Drive and CRM connectors, two proof automations, team training. In 14 days.',
  alternates: pageAlternates('/second-brain', '/en/second-brain', 'en'),
}

export default function Page() {
  return <SecondBrainPage lang="en" />
}
