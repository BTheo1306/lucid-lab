import type { Metadata } from 'next'
import HomePage from '@/components/marketing/HomePage'

export const metadata: Metadata = {
  title: 'Lucid-Lab: business AI systems in production',
  description:
    'Lucid-Lab audits workflows, prioritizes AI opportunities and builds business systems in production: agents, internal tools, automations, integrations, monitoring and documentation.',
  alternates: {
    canonical: 'https://lucid-lab.fr/en',
    languages: {
      'fr-FR': 'https://lucid-lab.fr',
      'en-US': 'https://lucid-lab.fr/en',
      'x-default': 'https://lucid-lab.fr',
    },
  },
  openGraph: {
    title: 'Lucid-Lab: business AI systems in production',
    description:
      'Workflow audit, AI roadmap, internal tools, agents, integrations, monitoring and documentation.',
    url: 'https://lucid-lab.fr/en',
    locale: 'en_US',
  },
  twitter: {
    title: 'Lucid-Lab: business AI systems in production',
    description:
      'AI audit, roadmap, build, run, monitoring and documentation for business systems in production.',
  },
}

export default function Page() {
  return <HomePage lang="en" />
}
