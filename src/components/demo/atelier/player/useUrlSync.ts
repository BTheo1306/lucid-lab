'use client'

import { useEffect } from 'react'

import type { PlayerStatus } from './usePlayer'

/**
 * Mirrors the current scene into ?scene=N without going through the router
 * (no RSC refetch, no scroll reset). Other params (autoplay, record) stay.
 */
export function useUrlSync(scene: number, status: PlayerStatus) {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (status === 'idle') url.searchParams.delete('scene')
    else url.searchParams.set('scene', String(scene))
    if (url.href !== window.location.href) {
      window.history.replaceState(window.history.state, '', url)
    }
  }, [scene, status])
}
