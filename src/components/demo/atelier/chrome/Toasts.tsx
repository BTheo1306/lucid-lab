'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'

import { EASE, GOOD, INK, WHITE } from '../tokens'

export interface ToastItem {
  id: string
  text: string
}

function Toast({ text, ttl }: { text: string; ttl: number }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), ttl)
    return () => window.clearTimeout(t)
  }, [ttl])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex items-center gap-2.5 rounded-[8px] px-3.5 py-2.5 text-[13px] font-medium"
          style={{ background: INK, color: WHITE }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: GOOD }}>
            <Check size={12} aria-hidden="true" />
          </span>
          {text}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/** Stack of confirmations inside a frame. Each toast hides itself after `ttl` ms. */
export function Toasts({ items, ttl = 3200 }: { items: ToastItem[]; ttl?: number }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute bottom-5 right-5 z-20 flex flex-col items-end gap-2">
      {items.map((t) => (
        <Toast key={t.id} text={t.text} ttl={ttl} />
      ))}
    </div>
  )
}
