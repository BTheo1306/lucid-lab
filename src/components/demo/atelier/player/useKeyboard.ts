'use client'

import { useEffect, useRef } from 'react'

export interface KeyboardHandlers {
  next: () => void
  prev: () => void
  replay: () => void
  fullscreen: () => void
  exit: () => void
  pause: () => void
  goto: (scene: number) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/** Presenter shortcuts. Disabled entirely in record mode. */
export function useKeyboard(enabled: boolean, handlers: KeyboardHandlers) {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      const h = handlersRef.current
      switch (event.key) {
        case 'ArrowRight':
        case ' ':
          event.preventDefault()
          h.next()
          return
        case 'ArrowLeft':
          event.preventDefault()
          h.prev()
          return
        case 'r':
        case 'R':
          h.replay()
          return
        case 'f':
        case 'F':
          h.fullscreen()
          return
        case 'p':
        case 'P':
          h.pause()
          return
        case 'Escape':
          h.exit()
          return
        default:
          break
      }
      if (/^[0-9]$/.test(event.key)) {
        // 1 to 9 open scenes 1 to 9, 0 opens the last one (bilan).
        h.goto(event.key === '0' ? 9 : Number.parseInt(event.key, 10))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
