'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore, type RefObject } from 'react'

const noop = () => () => {}

/** Whether the browser allows the Fullscreen API (false on iOS Safari and on the server). */
export function useFullscreenSupported(): boolean {
  return useSyncExternalStore(
    noop,
    () => document.fullscreenEnabled,
    () => false,
  )
}

export function useFullscreen(ref: RefObject<HTMLElement | null>, onChange: (on: boolean) => void) {
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    const handle = () => onChangeRef.current(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handle)
    return () => document.removeEventListener('fullscreenchange', handle)
  }, [])

  const toggle = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else if (typeof el.requestFullscreen === 'function') {
      void el.requestFullscreen().catch(() => undefined)
    }
  }, [ref])

  const exit = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
  }, [])

  return { toggle, exit }
}
