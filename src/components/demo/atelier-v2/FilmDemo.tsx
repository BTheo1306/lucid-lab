'use client'

import { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'

import { FILM_SCENES, filmSceneAt } from '@/lib/demo/atelier-v2/scenario'
import type { Mode } from '@/lib/demo/atelier/types'

import { Controls } from '../atelier/chrome/Controls'
import { ProgressRail } from '../atelier/chrome/ProgressRail'
import { SceneProvider, type SceneApi } from '../atelier/player/SceneContext'
import { useFullscreen, useFullscreenSupported } from '../atelier/player/useFullscreen'
import { useKeyboard } from '../atelier/player/useKeyboard'
import { usePlayer } from '../atelier/player/usePlayer'
import { useSceneTimeline } from '../atelier/player/useSceneTimeline'
import { useUrlSync } from '../atelier/player/useUrlSync'
import { EASE, PAPER } from '../atelier/tokens'
import { Camera, FULL_SHOT, type Shot } from './chrome/Camera'
import { Narration } from './chrome/Narration'
import { Statement } from './chrome/Statement'
import { SCREENS } from './screens'

interface FilmDemoProps {
  initialScene: number
  mode: Mode
  speed: number
}

export function FilmDemo({ initialScene, mode, speed }: FilmDemoProps) {
  const [state, dispatch] = usePlayer(FILM_SCENES, mode, initialScene)
  const scene = filmSceneAt(state.scene)
  const prefersReduced = useReducedMotion()
  const reduced = Boolean(prefersReduced) && mode !== 'record'
  const rootRef = useRef<HTMLDivElement>(null)
  const fullscreenSupported = useFullscreenSupported()
  const { toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen(rootRef, (on) => dispatch({ type: 'FULLSCREEN', on }))

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
    active: state.status === 'playing' || (state.status === 'idle' && mode === 'presenter'),
    reduced,
    speed,
    onStep: (count) => dispatch({ type: 'STEP_FIRED', count }),
    onDone: () => dispatch({ type: 'SCENE_DONE' }),
  })

  useKeyboard(
    mode !== 'record',
    {
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
    },
    FILM_SCENES.length - 1,
  )

  useUrlSync(state.scene, state.status)

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

  // The camera follows the last fired step that names a region.
  const shot = useMemo<Shot>(() => {
    let current: Shot = FULL_SHOT
    for (const step of scene.steps) {
      if (firedSet.has(step.id) && step.shot) current = { region: step.shot, zoom: step.zoom, anchor: step.anchor }
    }
    return current
  }, [scene, firedSet])

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

  const Screen = SCREENS[scene.id]
  const isIntro = scene.id === 'intro'

  return (
    <MotionConfig reducedMotion={mode === 'record' ? 'never' : 'user'}>
      <div ref={rootRef} data-demo-root="" data-demo-mode={mode} data-demo-status={state.status} className="grid min-h-[100dvh] grid-rows-[auto_1fr_auto]" style={{ background: PAPER }}>
        <div className="min-w-0">{isIntro ? <div className="h-4" /> : <Statement sceneIndex={state.scene} eyebrow={scene.eyebrow} headline={scene.headline} sub={scene.sub} />}</div>
        <div className="relative min-h-0 min-w-0 overflow-hidden px-6 md:px-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${state.scene}-${state.sceneKey}`}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mx-auto h-full w-full min-w-0 max-w-[1264px]"
            >
              <SceneProvider value={api}>
                {isIntro ? (
                  <Screen onStart={() => dispatch({ type: 'START' })} />
                ) : (
                  <Camera shot={shot} reduced={reduced}>
                    <Screen onStart={() => dispatch({ type: 'START' })} />
                  </Camera>
                )}
              </SceneProvider>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="min-w-0">
          {isIntro ? null : <Narration sceneIndex={state.scene} text={scene.caption} />}
          <div className="mx-auto flex w-full max-w-[1264px] justify-end px-6 pt-2 md:px-10">
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
          <ProgressRail scenes={FILM_SCENES} current={state.scene} interactive={mode !== 'record'} onSelect={(n) => dispatch({ type: 'GOTO', scene: n })} />
        </div>
      </div>
    </MotionConfig>
  )
}
