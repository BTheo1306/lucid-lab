'use client'

import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react'

import type { Mode } from '@/lib/demo/atelier/types'

import { GRAY_200, GRAY_600, INK, WHITE } from '../tokens'
import { Kbd } from './Kbd'
import type { PlayerStatus } from '../player/usePlayer'

interface ControlsProps {
  mode: Mode
  status: PlayerStatus
  fullscreen: boolean
  fullscreenSupported: boolean
  onPrev: () => void
  onNext: () => void
  onReplay: () => void
  onPause: () => void
  onFullscreen: () => void
}

function IconButton({ label, onClick, children, primary = false }: { label: string; onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-[6px] border transition-colors hover:bg-[#F2F2EE]"
      style={{ borderColor: primary ? INK : GRAY_200, background: primary ? INK : WHITE, color: primary ? WHITE : INK }}
    >
      {children}
    </button>
  )
}

export function Controls({ mode, status, fullscreen, fullscreenSupported, onPrev, onNext, onReplay, onPause, onFullscreen }: ControlsProps) {
  if (mode === 'record') return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="hidden items-center gap-2 pr-2 text-[11px] lg:flex" style={{ color: GRAY_600 }}>
        <Kbd>←</Kbd>
        <Kbd>→</Kbd>
        <span>ou</span>
        <Kbd>Espace</Kbd>
        <span className="pl-1">R rejouer</span>
        <span>F plein écran</span>
        <span>Échap quitter</span>
      </div>
      <IconButton label="Scène précédente" onClick={onPrev}>
        <ChevronLeft size={18} aria-hidden="true" />
      </IconButton>
      <IconButton label="Rejouer la scène" onClick={onReplay}>
        <RotateCcw size={16} aria-hidden="true" />
      </IconButton>
      {mode === 'autoplay' ? (
        <IconButton label={status === 'paused' ? 'Reprendre' : 'Pause'} onClick={onPause}>
          {status === 'paused' ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
        </IconButton>
      ) : null}
      {fullscreenSupported ? (
        <IconButton label={fullscreen ? 'Quitter le plein écran' : 'Plein écran'} onClick={onFullscreen}>
          {fullscreen ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
        </IconButton>
      ) : null}
      <IconButton label="Scène suivante" onClick={onNext} primary>
        <ChevronRight size={18} aria-hidden="true" />
      </IconButton>
    </div>
  )
}
