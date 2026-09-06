'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { EASE, GRAY_700 } from '../../atelier/tokens'

/** The spoken line, also readable when the sound is off. */
export function Narration({ sceneIndex, text }: { sceneIndex: number; text: string }) {
  return (
    <div className="mx-auto w-full max-w-[1264px] px-6 pt-4 md:px-10">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={sceneIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          aria-live="polite"
          aria-atomic="true"
          className="max-w-[92ch] text-[15px] leading-[1.6] md:text-[16.5px]"
          style={{ color: GRAY_700 }}
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
