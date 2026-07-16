import type { Metadata } from 'next'

import { AuditFlashPage } from '@/components/marketing/AuditFlashPage'
import { breadcrumbSchema, jsonLd, pageAlternates, serviceSchema } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Audit Flash gratuit',
  description:
    '30 minutes gratuites pour qualifier un besoin IA, identifier le premier système utile à construire et décider si Lucid-Lab est pertinent.',
  alternates: pageAlternates('/audit-flash', '/en/audit-flash', 'fr'),
}

const schema = [
  {
    ...serviceSchema({
      name: 'Audit Flash',
      description:
        'Appel de 30 minutes gratuit pour qualifier un besoin IA et identifier le premier système utile à construire.',
      url: 'https://lucid-lab.fr/audit-flash',
      lang: 'fr',
    }),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  },
  breadcrumbSchema([
    { name: 'Accueil', item: 'https://lucid-lab.fr' },
    { name: 'Audit Flash', item: 'https://lucid-lab.fr/audit-flash' },
  ]),
]

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <AuditFlashPage lang="fr" />
    </>
  )
}
