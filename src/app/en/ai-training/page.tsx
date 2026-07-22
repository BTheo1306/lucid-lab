import type { Metadata } from 'next'

import { FormationsPage } from '@/components/marketing/FormationsPage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Enterprise AI training | Lucid-Lab',
  description:
    'On-site and remote AI training for companies: AI literacy for leadership, Claude and ChatGPT day to day, second brain, agents and automations, GDPR and EU AI Act governance. On your real cases.',
  alternates: pageAlternates('/formations-ia', '/en/ai-training', 'en'),
}

export default function Page() {
  return <FormationsPage lang="en" />
}
