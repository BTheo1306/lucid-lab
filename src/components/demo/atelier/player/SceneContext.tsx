'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { Mode } from '@/lib/demo/atelier/types'

export interface SceneApi {
  /** True once the step has fired, by script or by a presenter click. */
  fired: (id: string) => boolean
  /** Presenter click: fires a step by hand, same state as the script. */
  fire: (id: string) => void
  mode: Mode
  reduced: boolean
  speed: number
  sceneIndex: number
}

const SceneContext = createContext<SceneApi | null>(null)

export function SceneProvider({ value, children }: { value: SceneApi; children: ReactNode }) {
  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
}

export function useScene(): SceneApi {
  const api = useContext(SceneContext)
  if (!api) throw new Error('useScene doit être appelé sous SceneProvider')
  return api
}
