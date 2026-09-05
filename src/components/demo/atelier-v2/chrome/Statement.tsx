'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { EASE, EMBER_700, GRAY_600, INK } from '../../atelier/tokens'

interface StatementProps {
  sceneIndex: number
  eyebrow: string | null
  headline: string
  sub?: string
}

/** The sentence above the screen: a mono eyebrow with the time, then one bold claim. */
export function Statement({ sceneIndex, eyebrow, headline, sub }: StatementProps) {
  return (
    <div className="mx-auto w-full max-w-[1264px] px-6 pb-3 pt-6 md:px-10">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={sceneIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          {eyebrow ? (
            <div className="mb-2 font-mono text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: EMBER_700 }}>
              {eyebrow}
            </div>
          ) : null}
          <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[40px]" style={{ color: INK }} tabIndex={-1}>
            {headline}
          </h2>
          {sub ? (
            <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed md:text-[16px]" style={{ color: GRAY_600 }}>
              {sub}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
