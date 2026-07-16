import type { Metadata } from 'next'

import { AuditFlashPage } from '@/components/marketing/AuditFlashPage'
import { breadcrumbSchema, jsonLd, pageAlternates, serviceSchema } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Free Audit Flash',
  description:
    'A free 30-minute call to qualify an AI need, identify the first useful system to build and decide whether Lucid-Lab is relevant.',
  alternates: pageAlternates('/audit-flash', '/en/audit-flash', 'en'),
}

const schema = [
  {
    ...serviceSchema({
      name: 'Audit Flash',
      description:
        'A free 30-minute call to qualify an AI need and identify the first useful system to build.',
      url: 'https://lucid-lab.fr/en/audit-flash',
      lang: 'en',
    }),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  },
  breadcrumbSchema([
    { name: 'Home', item: 'https://lucid-lab.fr/en' },
    { name: 'Audit Flash', item: 'https://lucid-lab.fr/en/audit-flash' },
  ]),
]

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <AuditFlashPage lang="en" />
    </>
  )
}
