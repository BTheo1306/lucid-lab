import type { ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'

import { PAPER, PAPER_DARK, PAPER_LIGHT } from '../tokens'

/** The brand paper: flat off-white with a very soft light at the centre. */
export function Paper({ children }: { children?: ReactNode }) {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${PAPER_LIGHT} 0%, ${PAPER} 55%, ${PAPER_DARK} 100%)` }}>
      {children}
    </AbsoluteFill>
  )
}
