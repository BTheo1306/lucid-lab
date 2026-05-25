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
    <div className="min-h-screen bg-[#f8f7f3] flex flex-col lg:h-screen lg:overflow-hidden">
      <Header />
      
      <main className="pt-[68px] flex-1 flex flex-col lg:grid lg:grid-cols-[0.9fr_1.11fr] lg:overflow-hidden">
        {/* Left Column: Context & Information */}
        <div className="p-6 md:p-8 lg:p-10 border-b border-[#dedbd2] lg:border-b-0 lg:border-r lg:overflow-y-auto flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f93]">{t.title}</p>
            <h1 className="text-[26px] font-bold leading-[1.1] tracking-tight text-[#111111] md:text-[34px] lg:text-[38px]">
              {t.headline}
            </h1>
            <p className="text-[13.5px] leading-relaxed text-[#5f5a52]">{t.subtitle}</p>
            
            {/* Minimalist aside parameters band */}
            <div className="grid grid-cols-2 gap-2 mt-4 sm:flex sm:flex-wrap sm:gap-2">
              {t.aside.map((item) => (
                <div key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#d8d3c9]/80 bg-white text-[11.5px] font-bold text-[#111111]">
                  <span className="size-1.5 rounded-full bg-[#1f6f93]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* During call timeline */}
          <div className="rounded-[6px] border border-[#d8d3c9]/80 bg-white p-4 space-y-3">
            <h2 className="text-[15px] font-bold text-[#111111] flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1f6f93]" />
              {t.duringTitle}
            </h2>
            <ul className="space-y-2">
              {t.during.map((item, index) => (
                <li key={item} className="flex gap-2.5 text-[12.5px] leading-relaxed text-[#5a544b]">
                  <span className="mt-1 font-mono text-[10px] text-[#1f6f93] font-bold">0{index + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* What remains */}
          <div className="rounded-[6px] border border-stone-800 bg-[#111111] p-4 text-white">
            <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C85E1A]" />
              {t.remainsTitle}
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-stone-300">{t.remains}</p>
          </div>

          {/* FAQ quick questions accordion */}
          <div>
            <h2 className="text-[15px] font-bold text-[#111111] mb-3">{t.faqTitle}</h2>
            <div className="divide-y divide-[#dedbd2] border border-[#dedbd2] rounded-[6px] bg-white">
              {t.faq.slice(0, 2).map(([q, a]) => (
                <div key={q} className="p-3">
                  <h3 className="text-[12.5px] font-bold text-[#111111]">{q}</h3>
                  <p className="mt-1 text-[12px] leading-normal text-[#5f5a52]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pre-qualification Form */}
        <div className="p-6 md:p-8 lg:p-10 lg:overflow-y-auto flex flex-col justify-center bg-white">
          <div className="max-w-[620px] mx-auto w-full space-y-4">
            <div>
              <h2 className="text-[20px] font-bold leading-none text-[#111111]">{t.formTitle}</h2>
              <p className="mt-1 text-[12.5px] leading-normal text-[#5f5a52]">{t.formSubtitle}</p>
            </div>
            
            <div className="rounded-[8px] border border-[#d8d3c9] bg-[#fbfaf7] p-4 md:p-5">
              <AuditFlashForm lang={lang} mode="full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
