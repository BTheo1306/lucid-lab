'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const INK = '#0A0A0A'
const PAPER = '#FAFAF7'
const GRAY_200 = '#E5E5E5'
const GRAY_600 = '#525252'
const GRAY_100 = '#F2F2EE'

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const team = [
  {
    name: 'Théo',
    role: 'CTO & Co-fondateur',
    photo: '/team/theo.png',
    linkedin: 'https://www.linkedin.com/in/th%C3%A9o-b%C3%A9nard/',
  },
  {
    name: 'Anthony',
    role: 'CEO & Co-fondateur',
    photo: '/team/anthony.png',
    linkedin: 'https://www.linkedin.com/in/anthonypoire/',
  },
  {
    name: 'Jules',
    role: 'COO & Co-fondateur',
    photo: '/team/jules.png',
    linkedin: 'https://www.linkedin.com/in/jules-gouron-455b58300/',
  },
]

const content = {
  fr: {
    label: 'L\'équipe',
    title: 'Qui construit vos systèmes.',
    subtitle: 'Une équipe restreinte, des expertises complémentaires. Pas d\'intermédiaire entre vous et ceux qui exécutent.',
  },
  en: {
    label: 'The team',
    title: 'Who builds your systems.',
    subtitle: 'A tight team, complementary skills. No layer between you and the people who execute.',
  },
}

export function TeamSection({ lang = 'fr' }: { lang?: 'fr' | 'en' }) {
  const t = content[lang]

  return (
    <motion.section
      style={{ background: PAPER, color: INK, borderTop: `1px solid ${GRAY_200}` }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative scroll-mt-[68px]"
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-12 pt-8 md:px-10 md:pb-16 md:pt-10">
        <div className="mb-10 max-w-xl">
          <p
            className="mb-3 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: GRAY_600 }}
          >
            {t.label}
          </p>
          <h2
            className="mb-3 text-[30px] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[36px]"
            style={{ color: INK }}
          >
            {t.title}
          </h2>
          <p className="text-[16px] leading-[1.6]" style={{ color: GRAY_600 }}>
            {t.subtitle}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.name}
              className="group relative overflow-hidden rounded-[14px] border"
              style={{ background: GRAY_100, borderColor: GRAY_200 }}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              <div className="flex items-center justify-between p-5">
                <div>
                  <p
                    className="text-[17px] font-bold tracking-[-0.01em]"
                    style={{ color: INK }}
                  >
                    {member.name}
                  </p>
                  <p className="mt-0.5 text-[13px]" style={{ color: GRAY_600 }}>
                    {member.role}
                  </p>
                </div>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`LinkedIn de ${member.name}`}
                  className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                  style={{ color: GRAY_600 }}
                >
                  <LinkedinIcon className="size-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
