import type { Locale } from '@/lib/i18n/client'
import { AuditFlashForm } from '@/components/marketing/AuditFlashForm'
import { Header } from '@/components/ui/header'
import { MarketingFooter } from '@/components/marketing/HomePage'

const page = {
  fr: {
    title: 'Audit Flash',
    headline: '30 minutes pour qualifier votre besoin et valider la faisabilité technique.',
    subtitle:
      'Un échange exploratoire de 30 minutes, 100% sans engagement. Partagez votre contexte, nous analysons la maturité de vos données et définissons le chantier IA le plus rentable pour votre organisation.',
    formTitle: 'Pré-qualification technique',
    formSubtitle: 'Ces informations nous permettent d\'analyser votre environnement avant l\'appel. Aucun objectif commercial.',
    duringTitle: 'Déroulé de la session',
    during: [
      'Analyse approfondie de vos processus et contraintes actuels.',
      'Ciblage du premier chantier d\'automatisation prioritaire.',
      'Arbitrage technique : outils sur étagère vs développement sur-mesure.',
      'Recommandations architecturales et de sécurité data.',
      'Si pertinent : organisation d\'un second échange de cadrage.',
    ],
    remainsTitle: 'Valeur livrée dès l\'appel',
    remains:
      "Une évaluation objective de vos processus, des pistes techniques actionnables et les conseils d’ingénieurs seniors. Aucune présentation commerciale, uniquement de l'expertise directe.",
    aside: ['30 min', 'Audit technique', 'Sans engagement', 'Booking direct'],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Faut-il déjà avoir un cas IA clair ?', 'Non. Identifier une friction métier ou un processus manuel chronophage est suffisant pour démarrer l\'analyse.'],
      ['Des tarifs sont-ils annoncés lors du call ?', 'Non. Le chiffrage dépend entièrement de la complexité du système à construire et des prérequis de sécurité.'],
      ['S\'agit-il d\'un appel commercial ?', 'Absolument pas. L\'audit est mené par des profils ingénieurs pour statuer sur la viabilité technique de vos idées.'],
    ],
  },
  en: {
    title: 'Audit Flash',
    headline: '30 minutes to qualify your needs and validate technical feasibility.',
    subtitle:
      'An exploratory 30-minute call, 100% no commitment. Share your context, we analyze your data maturity and define the most profitable AI initiative for your organization.',
    formTitle: 'Technical Pre-qualification',
    formSubtitle: 'This information allows us to review your environment prior to the call. No sales pitches.',
    duringTitle: 'Session outline',
    during: [
      'In-depth analysis of your current processes and constraints.',
      'Targeting of the highest-priority automation build.',
      'Technical arbitration: off-the-shelf tools vs custom development.',
      'Architectural and data-security recommendations.',
      'If relevant: planning a secondary framing discussion.',
    ],
    remainsTitle: 'Value delivered immediately',
    remains:
      'An objective evaluation of your workflows, actionable technical avenues, and guidance from senior engineers. No commercial slides, only direct expertise.',
    aside: ['30 min', 'Tech audit', 'No commitment', 'Instant booking'],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Do I need a clear AI use case already?', 'No. Identifying a business friction or a time-consuming manual process is enough to start the analysis.'],
      ['Are prices discussed during the call?', 'No. Pricing depends entirely on the complexity of the system and the security prerequisites.'],
      ['Is this a sales call?', 'Absolutely not. The audit is led by engineering profiles to determine the technical viability of your ideas.'],
    ],
  },
} as const

export function AuditFlashPage({ lang }: { lang: Locale }) {
  const t = page[lang]

  return (
    <div className="min-h-screen bg-[#FDFDFB] flex flex-col font-sans">
      <Header />
      
      <main className="pt-[68px] flex-1 flex flex-col lg:flex-row max-w-[1500px] mx-auto w-full">
        {/* Left Column: Context & Information */}
        <div className="p-6 md:p-10 lg:pl-20 lg:pr-14 xl:pl-32 xl:pr-20 lg:w-1/2 flex flex-col justify-start pt-6 lg:pt-10 pb-12 lg:pb-24">
          <div className="max-w-[560px] w-full mx-auto md:ml-auto md:mr-0 lg:ml-auto lg:mr-0 space-y-6 lg:space-y-8">
          
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 mb-2">{t.title}</p>
            <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-tight text-stone-900 md:text-[30px] lg:text-[34px]">
              {t.headline}
            </h1>
            <p className="text-[13.5px] leading-relaxed text-stone-600">{t.subtitle}</p>
          </div>

          <div className="w-full h-px bg-stone-200/60" />

          {/* During call timeline */}
          <div className="space-y-3">
            <h2 className="text-[13px] font-bold text-stone-900 flex items-center gap-2 uppercase tracking-wide">
              {t.duringTitle}
            </h2>
            <ul className="space-y-2">
              {t.during.map((item, index) => (
                <li key={item} className="flex gap-3 text-[12.5px] leading-relaxed text-stone-600">
                  <span className="mt-[2px] font-mono text-[10px] text-stone-400 font-bold shrink-0">0{index + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full h-px bg-stone-200/60 hidden lg:block" />

          {/* FAQ quick questions accordion */}
          <div className="pt-1">
            <h2 className="text-[13px] font-bold text-stone-900 mb-3 uppercase tracking-wide">{t.faqTitle}</h2>
            <div className="space-y-3">
              {t.faq.map(([q, a]) => (
                <div key={q}>
                  <h3 className="text-[12.5px] font-bold text-stone-800">{q}</h3>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-stone-500">{a}</p>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* Right Column: Pre-qualification Form */}
        <div className="lg:w-1/2 p-6 md:p-10 lg:p-16 flex flex-col justify-start bg-white border-l border-stone-200 shadow-[0_0_40px_rgba(0,0,0,0.02)] pt-6 lg:pt-10 pb-12 lg:pb-24">
          <div className="max-w-[500px] w-full mx-auto space-y-6">
            <div>
              <h2 className="text-[18px] font-extrabold tracking-tight text-stone-900">{t.formTitle}</h2>
            </div>
            
            <div className="rounded-[10px] border border-stone-200 bg-[#FDFDFB] p-4 lg:p-6 shadow-sm">
              <AuditFlashForm lang={lang} mode="full" />
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter lang={lang} />
    </div>
  )
}
