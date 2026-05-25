import type { Locale } from '@/lib/i18n/client'
import { AuditFlashForm } from '@/components/marketing/AuditFlashForm'
import { Header } from '@/components/ui/header'

const page = {
  fr: {
    title: 'Audit Flash',
    headline: '30 minutes pour qualifier votre besoin et valider la faisabilité technique.',
    subtitle:
      'Un échange exploratoire, sans engagement. Partagez votre contexte, nous analysons la maturité de vos données et définissons le chantier IA le plus rentable pour votre organisation.',
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
      'An exploratory call, no commitment. Share your context, we analyze your data maturity and define the most profitable AI initiative for your organization.',
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
      
      <main className="pt-[68px] flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full">
        {/* Left Column: Context & Information */}
        <div className="p-6 md:p-10 lg:p-14 lg:w-5/12 xl:w-2/5 flex flex-col justify-start space-y-10 lg:sticky lg:top-[68px] lg:h-[calc(100vh-68px)] lg:overflow-y-auto custom-scrollbar">
          
          <div className="space-y-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500">{t.title}</p>
            <h1 className="text-[28px] font-extrabold leading-[1.1] tracking-tight text-stone-900 md:text-[34px] lg:text-[38px]">
              {t.headline}
            </h1>
            <p className="text-[14px] leading-relaxed text-stone-600">{t.subtitle}</p>
            
            {/* Minimalist aside parameters band */}
            <div className="flex flex-wrap gap-2 mt-6">
              {t.aside.map((item) => (
                <div key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#E5E5E5]/40 border border-stone-200 text-[11.5px] font-semibold tracking-wide text-stone-700">
                  <span className="size-1.5 rounded-full bg-[#EC5A1D]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-stone-200/60" />

          {/* During call timeline */}
          <div className="space-y-4">
            <h2 className="text-[14px] font-bold text-stone-900 flex items-center gap-2 uppercase tracking-wide">
              {t.duringTitle}
            </h2>
            <ul className="space-y-3">
              {t.during.map((item, index) => (
                <li key={item} className="flex gap-3 text-[13px] leading-relaxed text-stone-600">
                  <span className="mt-[2px] font-mono text-[10px] text-stone-400 font-bold shrink-0">0{index + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What remains */}
          <div className="rounded-[8px] bg-[#0A0A0A] p-5 lg:p-6 text-white shadow-xl shadow-stone-200/50">
            <h2 className="text-[14px] font-bold text-white flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#EC5A1D]" />
              {t.remainsTitle}
            </h2>
            <p className="mt-3 text-[12.5px] leading-relaxed text-stone-400">{t.remains}</p>
          </div>

          {/* FAQ quick questions accordion */}
          <div className="pb-10 pt-4">
             <div className="w-full h-px bg-stone-200/60 mb-6" />
            <h2 className="text-[14px] font-bold text-stone-900 mb-4">{t.faqTitle}</h2>
            <div className="space-y-4">
              {t.faq.map(([q, a]) => (
                <div key={q}>
                  <h3 className="text-[13px] font-bold text-stone-800">{q}</h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-stone-500">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pre-qualification Form */}
        <div className="lg:w-7/12 xl:w-3/5 p-6 md:p-10 lg:p-14 lg:min-h-[calc(100vh-68px)] flex flex-col justify-center bg-white border-l border-stone-200 shadow-[0_0_40px_rgba(0,0,0,0.02)]">
          <div className="max-w-[650px] mx-auto w-full space-y-6">
            <div>
              <h2 className="text-[24px] font-extrabold tracking-tight text-stone-900">{t.formTitle}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-stone-500">{t.formSubtitle}</p>
            </div>
            
            <div className="rounded-[12px] border border-stone-200 bg-[#FDFDFB] p-6 lg:p-8 shadow-sm">
              <AuditFlashForm lang={lang} mode="full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
