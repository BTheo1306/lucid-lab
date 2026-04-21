'use client'

import { motion } from "framer-motion"
import { ChevronRight, ChevronDown } from "lucide-react"
import { Header } from "@/components/ui/header"
import { HeroSection, LogosSection } from "@/components/ui/hero-section"
import { BookingSection } from "@/components/ui/calendar-booking"
import React, { lazy, Suspense } from "react"

const FeaturesBento = lazy(() => import("@/components/ui/features-bento").then(m => ({ default: m.FeaturesBento })))

/* ─────────────────────────── PILLARS ──────────────────────────────────────── */
function PillarsIntro() { return null }

/* ─────────────────────────── PILLAR CARDS ──────────────────────────────────── */
const pillars = [
  {
    num: "01",
    label: "Strat\u00e9gie Op\u00e9rationnelle",
    labelColor: "text-amber-400",
    accentColor: "#f59e0b",
    dotColor: "bg-amber-400",
    title: "Du chaos\nau plan d\u2019action.",
    description:
      "Cartographie compl\u00e8te de votre organisation, identification des goulots d\u2019\u00e9tranglement et plan d\u2019ex\u00e9cution prioris\u00e9. En 30 minutes, vous passez du flou \u00e0 un cap clair et chiffr\u00e9.",
    features: ["Cartographie des processus de bout en bout", "Plan d\u2019ex\u00e9cution livr\u00e9", "Architecture cible & retour sur investissement chiffr\u00e9"],
    backTitle: "Ce que vous recevez.",
    backItems: [
      "Audit initial de 30 min (gratuit)",
      "Cartographie compl\u00e8te de vos processus",
      "Plan d\u2019ex\u00e9cution prioris\u00e9 par retour sur investissement",
      "Architecture technique cible d\u00e9taill\u00e9e",
      "Livrable actionnable, pr\u00eat \u00e0 ex\u00e9cuter sans interm\u00e9diaire",
    ],
    backCta: "R\u00e9server l\u2019Audit Flash",
  },
  {
    num: "02",
    label: "D\u00e9veloppement & D\u00e9ploiement",
    labelColor: "text-violet-400",
    accentColor: "#a78bfa",
    dotColor: "bg-violet-400",
    title: "D\u00e9veloppement.\nAutomatisation IA.",
    description:
      "On con\u00e7oit et on d\u00e9ploie vos syst\u00e8mes autonomes : agents d\u2019intelligence artificielle, automatisations sur mesure, connecteurs et pipelines de donn\u00e9es. Sur votre infrastructure. Aucune d\u00e9pendance.",
    features: ["Agents IA & automatisations sur mesure", "Connecteurs, extracteurs & pipelines de donn\u00e9es", "Mise en production compl\u00e8te"],
    backTitle: "Ce qu\u2019on construit.",
    backItems: [
      "Agents IA autonomes (acquisition, support, qualification)",
      "Automatisations sur mesure avec OpenAI et Claude",
      "Connecteurs et int\u00e9grations sur votre infrastructure",
      "Tableaux de bord et surveillance en temps r\u00e9el (cas P\u00e9riscope)",
      "Code, automatisations et documentation : 100\u00a0% \u00e0 vous",
    ],
    backCta: "Voir nos cas clients",
  },
  {
    num: "03",
    label: "Accompagnement au changement",
    labelColor: "text-emerald-400",
    accentColor: "#34d399",
    dotColor: "bg-emerald-400",
    title: "Vos \u00e9quipes reprennent\nla main.",
    description:
      "Nous faisons \u00e9voluer vos syst\u00e8mes, formons vos \u00e9quipes et s\u00e9curisons vos appels d\u2019offres. L\u2019IA ex\u00e9cute, vos collaborateurs pilotent la strat\u00e9gie et l\u2019avenir de l\u2019entreprise.",
    features: ["Mont\u00e9e en charge & supervision continue", "Formation des \u00e9quipes & gouvernance IA", "R\u00e9ponse aux appels d\u2019offres"],
    backTitle: "Comment on op\u00e8re.",
    backItems: [
      "Mont\u00e9e en charge sans augmenter la masse salariale",
      "Formation des \u00e9quipes internes \u00e0 l\u2019automatisation et \u00e0 l\u2019IA",
      "Gouvernance IA, conformit\u00e9 et cadrage juridique",
      "R\u00e9ponse aux appels d\u2019offres grands comptes",
      "Rapport mensuel : performance, co\u00fbts, retour sur investissement",
    ],
    backCta: "\u00c9changer avec un expert",
  },
]

function PillarCards() {
  const [flippedIndex, setFlippedIndex] = React.useState<number | null>(null)
  const flipRefs = React.useRef<(HTMLDivElement | null)[]>([null, null, null])

  const handleTiltMove = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
    const el = flipRefs.current[i]
    if (!el || flippedIndex === i) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = ((e.clientX - left - width / 2) / width) * 8
    const y = -((e.clientY - top - height / 2) / height) * 8
    el.style.transition = 'transform 0.1s ease-out'
    el.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`
  }

  const handleTiltLeave = (i: number) => {
    const el = flipRefs.current[i]
    if (!el || flippedIndex === i) return
    el.style.transition = 'transform 0.5s ease-out'
    el.style.transform = 'rotateY(0deg) rotateX(0deg)'
  }

  const handleFlip = (i: number) => {
    const el = flipRefs.current[i]
    if (!el) return
    const isFlipped = flippedIndex === i
    el.style.transition = 'transform 0.65s cubic-bezier(0.23,1,0.32,1)'
    el.style.transform = isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)'
    setFlippedIndex(isFlipped ? null : i)
  }

  return (
    <section
      id="processus"
      className="relative max-sm:px-2"
    >
      <div
        className="relative mx-auto max-w-[1264px] border-x border-[#e5e5e5] px-[48px] py-[100px] max-sm:px-6 max-sm:py-16 overflow-hidden"
        style={{
          background:
            'radial-gradient(84.42% 84.32% at 51.63% 100%, #FFB451 0%, #EFC680 24.76%, #B4D8FF 47.6%, #D2E8FF 75%, #FAFDFF 100%)',
        }}
      >
        {/* Intro text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 grid gap-8 md:grid-cols-[1fr_1fr] md:items-center"
        >
          <h2 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#000] sm:text-[40px]">
            Stratégie Opérationnelle.
            <br />
            Développement &amp; Déploiement.
            <br />
            Accompagnement au changement.
          </h2>
          <p className="text-[16px] leading-[1.6] text-[#666] md:max-w-md md:pb-1">
            Une chaîne de valeur complète : on cartographie votre organisation, on construit les systèmes qui la font avancer, on les déploie.
            <br />
            De la startup agile au grand groupe, nous intervenons partout avec le même niveau d’exigence.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ perspective: '1000px' }}
              className="h-[460px]"
            >
              <div
                ref={(el) => { flipRefs.current[i] = el }}
                onClick={() => handleFlip(i)}
                onMouseMove={(e) => handleTiltMove(e, i)}
                onMouseLeave={() => handleTiltLeave(i)}
                className="relative h-full w-full cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* ── FRONT ── */}
                <div
                  className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-[#0f0f0f] border border-white/[0.06] p-7"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div
                    className="absolute top-0 inset-x-0 h-px"
                    style={{ background: `linear-gradient(to right, transparent 10%, ${p.accentColor}99 50%, transparent 90%)` }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-white/15">{p.num}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${p.labelColor}`}>{p.label}</span>
                  </div>
                  <h3 className="mt-8 whitespace-pre-line text-[1.4rem] font-bold leading-[1.2] tracking-[-0.02em] text-white">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/40">
                    {p.description}
                  </p>
                  <div className="mt-7 space-y-3">
                    {p.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2.5">
                        <span className={`h-1 w-1 rounded-full shrink-0 ${p.dotColor}`} />
                        <span className="text-[13px] text-white/55">{feat}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-8 text-[10px] text-white/20 tracking-wide">
                    Cliquez pour les détails
                  </div>
                </div>

                {/* ── BACK ── */}
                <div
                  className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-[#0f0f0f] border border-white/[0.06] p-7"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div
                    className="absolute top-0 inset-x-0 h-px"
                    style={{ background: `linear-gradient(to right, transparent 10%, ${p.accentColor}99 50%, transparent 90%)` }}
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${p.labelColor}`}>{p.label}</span>
                    <span className="text-[10px] text-white/25">&#8592; retour</span>
                  </div>
                  <h3 className="mt-5 text-[1.25rem] font-bold leading-[1.2] tracking-[-0.02em] text-white">
                    {p.backTitle}
                  </h3>
                  <ul className="mt-5 flex-1 space-y-3.5">
                    {p.backItems.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className={`mt-[6px] h-1 w-1 rounded-full shrink-0 ${p.dotColor}`} />
                        <span className="text-[13px] leading-snug text-white/55">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#booking"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-6 block w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] py-3 text-center text-[13px] font-medium text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    {p.backCta}
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── HOW IT WORKS ──────────────────────────────────── */
const howSteps = [
  { num: "01", title: "Audit Flash · 30 min · gratuit.", desc: "Vous décrivez votre business et son goulot d’étranglement. On qualifie, identifie le chaos, on chiffre le coût d’opportunité et on décide ensemble ce que l’automatisation pourrait apporter." },
  { num: "02", title: "Roadmap d’Exécution.", desc: "L’audit. Processus cartographié au complet, architecture cible (Outil A + Outil B + IA), cost/bénéfice chiffré, Roadmap claire et définie. Un blueprint actionnable, pas un PowerPoint, pas des promesses, un véritable levier d’action." },
  { num: "03", title: "Build & Run.", desc: "On code, on intègre, on déploie. Agents IA, workflows n8n, APIs, scrapers. La mise en production sur votre infra avec monitoring régulier pour suivre les impacts opérationnels avec vous et vos équipes. Pédagogie, formation, training... nous sommes présents à chaque étape de votre bascule." },
  { num: "04", title: "Accompagnement au changement et maintenance.", desc: "Scaling, formation équipes, gouvernance IA, support sur appels d’offres. Vos équipes reprennent la main sur la stratégie et se focussent sur leur Core business, l’IA exécute. Lucid-Lab vous accompagne dans vos prochains challenges et la continuité des opérations." },
]

function HowItWorks() {
  return (
    <section id="solutions" className="max-sm:px-2">
      <div className="mx-auto max-w-[1264px] border-x border-[#e5e5e5] px-[48px] py-[100px] max-sm:px-6 max-sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#000] sm:text-[40px]">
            L&apos;Offre Escalier.
            <br />
            <span className="text-[#999]">De l&apos;Audit Flash à une automatisation continue.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 divide-y md:divide-y-0 md:divide-x divide-[#e5e5e5] md:grid-cols-4">
          {howSteps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="py-6 md:py-0 md:px-6 first:md:pl-0 last:md:pr-0"
            >
              <span className="text-[28px] font-semibold text-[#ddd]">
                {step.num}
              </span>
              <h3 className="mt-3 text-[16px] font-bold text-[#000]">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#666]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-14 flex flex-wrap items-center gap-4"
        >
          <a
            href="#booking"
            className="flex h-[42px] items-center rounded-[10px] bg-black px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#222]"
          >
            Réserver l&apos;Audit Flash
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────── FAQ ──────────────────────────────────────────── */
const faqs = [
  {
    q: "C\u2019est quoi exactement, une Full-Stack Transformation Engine ?",
    a: "Une cha\u00eene unique qui couvre les trois maillons de la transformation : Strat\u00e9gie Op\u00e9rationnelle (Process Mapping, Roadmap d\u2019Ex\u00e9cution), Software Dev (APIs, scrapers, int\u00e9grations) et IA Engineering (agents autonomes, workflows n8n, pipelines data). On r\u00e9sout vos goulots d\u2019\u00e9tranglement via une architecture pr\u00e9cise pour garantir un r\u00e9sultat mesurable , pas trois prompts et un PowerPoint.",
  },
  {
    q: "En quoi vous \u00eates diff\u00e9rents d\u2019une agence de conseil ou d\u2019une boutique no-code ?",
    a: "On ne conseille pas, on construit. On est des Operational Strategists : on prend le chaos, on le map, on livre des syst\u00e8mes autonomes en production sur votre infrastructure. Code, workflows et docs vous appartiennent \u00e0 100 %. Aucun lock-in.",
  },
  {
    q: "Vous accompagnez quel type d\u2019entreprises ?",
    a: "De la startup agile au paquebot industriel. Cas r\u00e9cents : Turismo (full scaling op\u00e9rationnel sans gonfler la masse salariale), Universal et nos LinkedIn Bots (lead generation autonome), P\u00e9riscope (monitoring data temps r\u00e9el), et de nombreux petits business de niche : design d\u2019int\u00e9rieur, massoth\u00e9rapeutes, cr\u00e9ateurs Mym. Si \u00e7a a un process, on peut le syst\u00e9matiser.",
  },
  {
    q: "Et pour les grands comptes : appels d\u2019offres, conformit\u00e9, RGPD ?",
    a: "On a un volet d\u00e9di\u00e9 \u00ab Accompagnement au changement \u00bb pour les grandes structures : r\u00e9ponse \u00e0 appels d\u2019offres, gouvernance IA, conformit\u00e9 RGPD, h\u00e9bergement souverain et formation des \u00e9quipes internes. L\u2019humain garde la main sur la strat\u00e9gie, l\u2019IA ex\u00e9cute.",
  },
]

function FAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null)

  return (
    <section id="faq" className="relative border-t border-b border-[#e5e5e5]">
      {/* Plain background (swapped with booking) */}
      <div className="relative mx-auto max-w-[1264px] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-white"
        />
        <div className="relative px-[48px] py-[100px] max-sm:px-6 max-sm:py-16">

          <div className="grid grid-cols-1 gap-16 md:grid-cols-[1fr_1.1fr] md:gap-20 items-center">
            {/* Left: Image — vertically centered to the right column */}
            <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] self-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/workflow.png"
                alt="Lucid-Lab Workflow"
                loading="lazy"
                decoding="async"
                className="h-[400px] w-full object-cover"
              />
            </div>

            {/* Right: Header + Accordion */}
            <div className="flex flex-col">
              <div className="mb-10">
                <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999]">
                  FAQ&apos;s
                </p>
                <h2 className="mt-2 text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#000]">
                  Une question ?
                </h2>
                <p className="mt-3 text-[14px] leading-[1.7] text-[#999] max-w-sm">
                  Tout ce que vous devez savoir avant de commencer.
                </p>
              </div>

              <div className="divide-y divide-[#e5e5e5]">
                {faqs.map((faq, i) => {
                  const isOpen = openIndex === i
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : i)}
                        className="flex w-full items-center justify-between py-5 text-left"
                      >
                        <span className="pr-4 text-[15px] font-semibold text-[#000]">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={`size-4 shrink-0 text-[#999] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isOpen ? "max-h-60 pb-5" : "max-h-0"
                        }`}
                      >
                        <p className="text-[14px] leading-[1.7] text-[#666]">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
/* ─────────────────────────── FINAL CTA / TEAM ────────────────────────────── */
const teamMembers = [
  {
    name: 'Anthony POIRIER',
    role: 'CEO · Co-fondateur',
    avatar: '/team/anthony.png',
    objectPos: 'center top',
  },
  {
    name: 'Théo BENARD',
    role: 'CTO · Co-fondateur',
    avatar: '/team/theo.png',
    objectPos: 'center top',
  },
  {
    name: 'Jules GOURON',
    role: 'COO · Co-fondateur',
    avatar: '/team/jules.png',
    objectPos: 'center 35%',
  },
]

function FinalCTA() {
  return (
    <section id="team" className="max-sm:px-2">
      <div className="mx-auto max-w-[1264px] border-x border-[#e5e5e5] px-[48px] py-[100px] max-sm:px-6 max-sm:py-16">
        {/* Top: headline + CTA */}
        <div className="mb-20 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999]">
              L&apos;équipe
            </p>
            <h2 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#000] sm:text-[44px]">
              Operational Strategists.<br />Pas chefs de projet.
            </h2>
            <p className="mt-4 max-w-lg text-[16px] leading-[1.65] text-[#666]">
              Vous parlez directement aux ingénieurs et architectes qui construisent vos systèmes. Pas d&apos;intermédiaire, pas de re-brief, pas de contexte perdu.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <a
              href="#booking"
              className="flex h-[44px] items-center rounded-[10px] bg-black px-8 text-[14px] font-medium text-white transition-colors hover:bg-[#222]"
            >
              Réserver l&apos;Audit Flash
            </a>
            <span className="text-[12px] text-[#999]">30 min · gratuit · sans engagement</span>
          </div>
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {teamMembers.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group"
            >
              <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-[#fafafa]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.avatar}
                  alt={m.name}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: m.objectPos }}
                  className="h-[220px] w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                />
              </div>
              <div className="mt-3 px-0.5">
                <p className="text-[14px] font-semibold text-[#000]">{m.name}</p>
                <p className="mt-0.5 text-[12px] text-[#999]">{m.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── FOOTER ──────────────────────────────────────── */const scrollTo = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (href.startsWith('#')) {
    e.preventDefault()
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
function Footer() {
  return (
    <footer className="border-t border-[#e5e5e5]">
      <div className="mx-auto max-w-[1264px] border-x border-[#e5e5e5]">
        {/* Top: wordmark + nav columns */}
        <div className="grid grid-cols-1 gap-12 px-[48px] py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr] max-sm:px-6">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <a href="#" onClick={scrollTo('#')} className="w-fit flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Lucid-Lab" className="h-6 w-auto" />
              <span
                className="text-[18px] font-bold tracking-tight text-black"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                Lucid-Lab
              </span>
            </a>
            <p className="max-w-[260px] text-[13px] leading-[1.6] text-[#999]">
              Full-Stack Transformation Engine. Pour startups, PMEs et paquebots industriels.
            </p>
          </div>

          {/* Col: Produit */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#bbb]">Produit</span>
            <ul className="mt-4 space-y-3">
              {[['Expertises', '#solutions'], ['Processus', '#processus']].map(([label, href]) => (
                <li key={label}>
                  <a href={href} onClick={scrollTo(href)} className="text-[13px] text-[#666] transition-colors hover:text-black">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col: Ressources */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#bbb]">Ressources</span>
            <ul className="mt-4 space-y-3">
              {[['FAQ', '#faq'], ['Cas clients', '#cas-clients'], ['Réserver un appel', '#booking']].map(([label, href]) => (
                <li key={label}>
                  <a href={href} onClick={scrollTo(href)} className="text-[13px] text-[#666] transition-colors hover:text-black">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col: Contact */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#bbb]">Contact</span>
            <ul className="mt-4 space-y-3">
              {[['info@lucid-lab.fr', 'mailto:info@lucid-lab.fr']].map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-[13px] text-[#666] transition-colors hover:text-black">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-[#e5e5e5] px-[48px] py-6 md:flex-row md:items-center max-sm:px-6">
          <span className="text-[12px] text-[#bbb]">© 2026 Lucid-Lab. Tous droits réservés.</span>
          <div className="flex items-center gap-6">
            <a href="/mentions-legales" className="text-[12px] text-[#bbb] transition-colors hover:text-black">Mentions légales</a>
            <a href="/confidentialite" className="text-[12px] text-[#bbb] transition-colors hover:text-black">Confidentialité</a>
            <span className="text-[12px] text-[#bbb]">Paris, France 🇫🇷</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────── BLUE CTA SECTION ──────────────────────────────── */
function BlueCTA() {
  return (
    <section className="bg-[#F7F5F1]">
      <div
        className="mx-auto max-w-[1264px]"
        style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #1a3461 0%, #0D1738 55%)' }}
      >
        <div className="px-[48px] py-[80px] text-center max-sm:px-6 max-sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mx-auto max-w-2xl text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[44px]">
              On ne rédige pas de rapports.
              <br />
              On modifie votre opérationnel.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[16px] leading-[1.65] text-white/50">
              30 minutes pour passer de votre chaos à une Roadmap d&apos;Exécution chiffrée. Pas de PowerPoint. Pas d&apos;engagement.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#booking"
                className="flex h-[44px] items-center rounded-[10px] bg-white px-8 text-[14px] font-medium text-[#0D1738] transition-colors hover:bg-white/90"
              >
                Réserver l&apos;Audit Flash
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── PAGE ─────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="flex w-full flex-col">
      <Header />
      <main className="grow">
        <HeroSection />
        <LogosSection />
        <PillarCards />
        <HowItWorks />
        <Suspense fallback={<div className="h-[820px]" />}>
          <FeaturesBento />
        </Suspense>
        <BookingSection />
        <FAQ />
        <BlueCTA />
      </main>
      <Footer />
    </div>
  )
}
