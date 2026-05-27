import type { Metadata } from 'next'

import { ServicePage } from '@/components/marketing/ServicePage'

export const metadata: Metadata = {
  title: 'AI Agents & Internal Tools | Lucid-Lab',
  description: 'AI agents, dashboards, portals, connectors and business automations connected to existing tools.',
  alternates: { canonical: 'https://lucid-lab.fr/en/agents-ia-outils-internes' },
}

export default function Page() {
  return <ServicePage lang="en" pageKey="agents" />
}
