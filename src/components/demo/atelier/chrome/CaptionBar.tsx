'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { EASE, EMBER_700, GRAY_600, INK } from '../tokens'

interface CaptionBarProps {
  sceneIndex: number
  clock: string | null
  title: string
  caption: string
}

export function CaptionBar({ sceneIndex, clock, title, caption }: CaptionBarProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [sceneIndex])

  return (
    <div className="mx-auto flex w-full max-w-[1264px] flex-col gap-1.5 px-6 pt-5 md:flex-row md:items-baseline md:gap-6 md:px-10">
      <div className="flex shrink-0 items-baseline gap-3">
        {clock ? (
          <span className="font-mono text-[12px] font-semibold tracking-[0.14em]" style={{ color: EMBER_700 }}>
            {clock}
          </span>
        ) : null}
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-[18px] font-bold leading-tight outline-none md:text-[20px]"
          style={{ color: INK }}
        >
          {title}
        </h2>
      </div>
      <div className="relative min-h-[1.6em] flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={sceneIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: EASE }}
            aria-live="polite"
            aria-atomic="true"
            className="text-[14px] leading-[1.55] md:text-[15px]"
            style={{ color: GRAY_600 }}
          >
            {caption}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
