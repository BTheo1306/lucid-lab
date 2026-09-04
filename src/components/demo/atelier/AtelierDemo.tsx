'use client'

import { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'

import { SCENES, sceneAt } from '@/lib/demo/atelier/scenario'
import type { Mode } from '@/lib/demo/atelier/types'

import { CaptionBar } from './chrome/CaptionBar'
import { Controls } from './chrome/Controls'
import { ProgressRail } from './chrome/ProgressRail'
import { SceneProvider, type SceneApi } from './player/SceneContext'
import { useFullscreen, useFullscreenSupported } from './player/useFullscreen'
import { useKeyboard } from './player/useKeyboard'
import { usePlayer } from './player/usePlayer'
import { useSceneTimeline } from './player/useSceneTimeline'
import { useUrlSync } from './player/useUrlSync'
import { SCENE_COMPONENTS } from './scenes'
import { EASE, PAPER } from './tokens'

interface AtelierDemoProps {
  initialScene: number
  mode: Mode
  speed: number
}

export function AtelierDemo({ initialScene, mode, speed }: AtelierDemoProps) {
  const [state, dispatch] = usePlayer(mode, initialScene)
  const scene = sceneAt(state.scene)
  const prefersReduced = useReducedMotion()
  const reduced = Boolean(prefersReduced) && mode !== 'record'
  const rootRef = useRef<HTMLDivElement>(null)
  const fullscreenSupported = useFullscreenSupported()
  const { toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen(rootRef, (on) => dispatch({ type: 'FULLSCREEN', on }))

  // Autoplay and record start on their own, once the fonts are in (no swap in the first frames).
  useEffect(() => {
    if (mode === 'presenter') return
    let cancelled = false
    const go = () => {
      if (!cancelled) dispatch({ type: 'START' })
    }
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    if (fonts?.ready) fonts.ready.then(go, go)
    else go()
    return () => {
      cancelled = true
    }
  }, [mode, dispatch])

  useSceneTimeline(scene, state.sceneKey, {
    // The presenter's intro is idle (waiting for a click) but still animates in.
    active: state.status === 'playing' || (state.status === 'idle' && mode === 'presenter'),
    reduced,
    speed,
    onStep: (count) => dispatch({ type: 'STEP_FIRED', count }),
    onDone: () => dispatch({ type: 'SCENE_DONE' }),
  })

  useKeyboard(mode !== 'record', {
    next: () => dispatch({ type: 'NEXT' }),
    prev: () => dispatch({ type: 'PREV' }),
    replay: () => dispatch({ type: 'REPLAY' }),
    fullscreen: toggleFullscreen,
    exit: () => {
      if (state.fullscreen) exitFullscreen()
      else dispatch({ type: 'EXIT' })
    },
    pause: () => dispatch({ type: 'TOGGLE_PAUSE' }),
    goto: (n) => dispatch({ type: 'GOTO', scene: n }),
  })

  useUrlSync(state.scene, state.status)

  // Signal for the recorder and for anyone watching the DOM.
  useEffect(() => {
    const root = document.documentElement
    root.dataset.demoState = state.status
    root.dataset.demoScene = String(state.scene)
    root.dataset.demoMode = mode
    window.dispatchEvent(new CustomEvent('demo:state', { detail: { status: state.status, scene: state.scene } }))
  }, [state.status, state.scene, mode])

  useEffect(() => {
    return () => {
      const root = document.documentElement
      delete root.dataset.demoState
      delete root.dataset.demoScene
      delete root.dataset.demoMode
    }
  }, [])

  const firedSet = useMemo(() => {
    const ids = scene.steps.slice(0, state.firedCount).map((s) => s.id)
    return new Set([...ids, ...state.manual])
  }, [scene, state.firedCount, state.manual])

  const api = useMemo<SceneApi>(
    () => ({
      fired: (id) => firedSet.has(id),
      fire: (id) => dispatch({ type: 'FIRE_MANUAL', id }),
      mode,
      reduced,
      speed,
      sceneIndex: state.scene,
    }),
    [firedSet, dispatch, mode, reduced, speed, state.scene],
  )

  const SceneComponent = SCENE_COMPONENTS[scene.id]
  const showCaption = scene.id !== 'intro'

  return (
    <MotionConfig reducedMotion={mode === 'record' ? 'never' : 'user'}>
      <div ref={rootRef} data-demo-root="" data-demo-mode={mode} data-demo-status={state.status} className="grid min-h-[100dvh] grid-rows-[auto_1fr_auto]" style={{ background: PAPER }}>
        <div className="min-w-0">{showCaption ? <CaptionBar sceneIndex={state.scene} clock={scene.clock} title={scene.title} caption={scene.caption} /> : <div className="h-6" />}</div>
        <div className="relative min-h-0 min-w-0 overflow-hidden px-6 py-4 md:px-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${state.scene}-${state.sceneKey}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mx-auto h-full w-full min-w-0 max-w-[1264px]"
            >
              <SceneProvider value={api}>
                <SceneComponent onStart={() => dispatch({ type: 'START' })} />
              </SceneProvider>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="min-w-0">
          <div className="mx-auto flex w-full max-w-[1264px] justify-end px-6 md:px-10">
            <Controls
              mode={mode}
              status={state.status}
              fullscreen={state.fullscreen}
              fullscreenSupported={fullscreenSupported}
              onPrev={() => dispatch({ type: 'PREV' })}
              onNext={() => dispatch({ type: 'NEXT' })}
              onReplay={() => dispatch({ type: 'REPLAY' })}
              onPause={() => dispatch({ type: 'TOGGLE_PAUSE' })}
              onFullscreen={toggleFullscreen}
            />
          </div>
          <ProgressRail scenes={SCENES} current={state.scene} interactive={mode !== 'record'} onSelect={(n) => dispatch({ type: 'GOTO', scene: n })} />
        </div>
      </div>
    </MotionConfig>
  )
}
