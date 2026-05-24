import type { Locale } from '@/lib/i18n/client'
import { AuditFlashForm } from '@/components/marketing/AuditFlashForm'
import { MarketingFooter } from '@/components/marketing/HomePage'
import { Header } from '@/components/ui/header'

const page = {
  fr: {
    title: 'Audit Flash',
    headline: '30 minutes pour qualifier ton besoin et décider si on est pertinents.',
    subtitle:
      'Un call gratuit, sans engagement. Tu poses le contexte, on lit le problème, on identifie le premier chantier qui ferait sens et on te dit franchement si Lucid-Lab est le bon builder.',
    formTitle: 'Pré-qualification',
    formSubtitle: 'Ces informations alimentent notre CRM et préparent le call. On ne vend rien pendant le formulaire.',
    duringTitle: 'Pendant le call',
    during: [
      'Lecture rapide du contexte et du problème.',
      'Identification du premier chantier qui ferait sens.',
      'Arbitrage rapide vs pérenne, sur étagère vs sur mesure.',
      'Réponses techniques directes.',
      'Si pertinent : second échange avec une offre structurée.',
    ],
    remainsTitle: 'Ce qui te reste même sans suite',
    remains:
      "Une lecture extérieure honnête, des pistes techniques concrètes et le contact d'une équipe qui sait construire. Pas de slides commerciales pendant le call. Du concret tout de suite.",
    aside: ['30 min', 'Gratuit', 'Sans engagement', 'Redirection TidyCal après envoi'],
    faqTitle: 'Questions rapides',
    faq: [
      ['Est-ce que je dois déjà avoir un cas IA clair ?', 'Non. Il suffit d’avoir un workflow, un outil ou une friction métier à examiner.'],
      ['Est-ce que vous affichez des prix après le formulaire ?', 'Non. Le scope dépend du système à construire, de la maturité data/SI et du niveau de run attendu.'],
      ['Est-ce un call conseil ?', 'Non. Le diagnostic sert uniquement à décider quoi construire et si nous sommes utiles.'],
    ],
  },
  en: {
    title: 'Audit Flash',
    headline: '30 minutes to qualify your need and decide if we are relevant.',
    subtitle:
      'A free call, no commitment. You share context, we read the problem, identify the first sensible build and tell you honestly whether Lucid-Lab is the right builder.',
    formTitle: 'Pre-qualification',
    formSubtitle: 'This feeds our CRM and prepares the call. The form is not a sales pitch.',
    duringTitle: 'During the call',
    during: [
      'Quick reading of context and problem.',
      'Identification of the first sensible build.',
      'Fast vs durable, off-the-shelf vs custom arbitration.',
      'Direct technical answers.',
      'If relevant: a second exchange with a structured offer.',
    ],
    remainsTitle: 'What stays with you even if we stop there',
    remains:
      'An honest external read, concrete technical options and contact with a team that knows how to build. No commercial slides during the call. Useful signal immediately.',
    aside: ['30 min', 'Free', 'No commitment', 'TidyCal redirect after submit'],
    faqTitle: 'Quick questions',
    faq: [
      ['Do I need a clear AI use case already?', 'No. A workflow, tool or business friction to inspect is enough.'],
      ['Do you show prices after the form?', 'No. Scope depends on the system to build, data/IT maturity and expected run level.'],
      ['Is this a consulting call?', 'No. The diagnostic exists only to decide what to build and whether we are useful.'],
    ],
  },
} as const

export function AuditFlashPage({ lang }: { lang: Locale }) {
  const t = page[lang]

  return (
    <div className="min-h-screen bg-[#f8f7f3]">
      <Header />
      <main className="pt-[68px]">
        <section className="border-b border-[#dedbd2]">
          <div className="mx-auto grid max-w-[1264px] gap-10 border-x border-[#dedbd2] px-5 py-12 sm:px-8 md:px-12 md:py-20 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#1f6f93]">{t.title}</p>
              <h1 className="mt-5 max-w-4xl text-[42px] font-semibold leading-[1.02] tracking-normal text-[#111111] md:text-[68px]">
                {t.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-[18px] leading-[1.7] text-[#5f5a52]">{t.subtitle}</p>
            </div>
            <aside className="self-start rounded-[8px] border border-[#d8d3c9] bg-white p-5">
              <div className="space-y-3">
                {t.aside.map((item) => (
                  <div key={item} className="flex items-center justify-between border-b border-[#ece8df] pb-3 last:border-0 last:pb-0">
                    <span className="text-[14px] font-semibold text-[#111111]">{item}</span>
                    <span className="size-2 rounded-full bg-[#1f6f93]" />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-[#dedbd2] bg-white">
          <div className="mx-auto grid max-w-[1264px] gap-10 border-x border-[#dedbd2] px-5 py-12 sm:px-8 md:px-12 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-[32px] font-semibold leading-[1.05] text-[#111111] md:text-[46px]">{t.formTitle}</h2>
              <p className="mt-4 text-[16px] leading-[1.7] text-[#5f5a52]">{t.formSubtitle}</p>
            </div>
            <div className="rounded-[8px] border border-[#d8d3c9] bg-[#fbfaf7] p-5 md:p-7">
              <AuditFlashForm lang={lang} mode="full" />
            </div>
          </div>
        </section>

        <section className="border-b border-[#dedbd2]">
          <div className="mx-auto grid max-w-[1264px] gap-10 border-x border-[#dedbd2] px-5 py-12 sm:px-8 md:px-12 md:py-20 lg:grid-cols-2">
            <div className="rounded-[8px] border border-[#d8d3c9] bg-white p-6">
              <h2 className="text-[30px] font-semibold text-[#111111]">{t.duringTitle}</h2>
              <ul className="mt-6 space-y-4">
                {t.during.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-[1.6] text-[#5f5a52]">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-[#1f6f93]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[8px] border border-[#d8d3c9] bg-[#111111] p-6 text-white">
              <h2 className="text-[30px] font-semibold">{t.remainsTitle}</h2>
              <p className="mt-6 text-[16px] leading-[1.8] text-white/68">{t.remains}</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-[1264px] border-x border-[#dedbd2] px-5 py-12 sm:px-8 md:px-12 md:py-20">
            <h2 className="text-[32px] font-semibold text-[#111111]">{t.faqTitle}</h2>
            <div className="mt-8 divide-y divide-[#dedbd2] rounded-[8px] border border-[#dedbd2] bg-white">
              {t.faq.map(([q, a]) => (
                <div key={q} className="p-6">
                  <h3 className="text-[18px] font-semibold text-[#111111]">{q}</h3>
                  <p className="mt-2 text-[15px] leading-[1.65] text-[#5f5a52]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter lang={lang} />
    </div>
  )
}
