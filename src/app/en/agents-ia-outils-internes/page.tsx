import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'
import { pageAlternates } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'AI Agents & Internal Tools | Lucid-Lab',
  description: 'AI agents, dashboards, portals, connectors and business automations connected to existing tools.',
  alternates: pageAlternates('/agents-ia-outils-internes', '/en/agents-ia-outils-internes', 'en'),
}

export default function Page() {
  return <ServicePage lang="en" pageKey="agents" />
}
