'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { EASE } from '../tokens'

interface RevealProps {
  show: boolean
  children: ReactNode
  className?: string
  /** Extra delay in seconds once `show` flips, for staggered lists. */
  delay?: number
  y?: number
  style?: React.CSSProperties
}

/** Fades and lifts children in when `show` becomes true. Stays hidden before. */
export function Reveal({ show, children, className, delay = 0, y = 8, style }: RevealProps) {
  return (
    <motion.div
      initial={false}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.4, ease: EASE, delay: show ? delay : 0 }}
      className={className}
      style={{ ...style, pointerEvents: show ? undefined : 'none' }}
      aria-hidden={!show}
    >
      {children}
    </motion.div>
  )
}
