'use client'

import { useReducer } from 'react'

import type { Mode, Scene } from '@/lib/demo/atelier/types'

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'finished'

export interface PlayerState {
  /** The scenes this player runs (v1 or v2 scenario). */
  scenes: Scene[]
  mode: Mode
  status: PlayerStatus
  scene: number
  /** Number of scripted steps fired in the current scene (a prefix of scene.steps). */
  firedCount: number
  /** Step ids fired by a presenter click, possibly out of order. */
  manual: string[]
  /** Bumped to remount the scene (replay, goto). */
  sceneKey: number
  fullscreen: boolean
}

export type PlayerAction =
  | { type: 'START' }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'GOTO'; scene: number }
  | { type: 'REPLAY' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'STEP_FIRED'; count: number }
  | { type: 'FIRE_MANUAL'; id: string }
  | { type: 'SCENE_DONE' }
  | { type: 'EXIT' }
  | { type: 'FULLSCREEN'; on: boolean }

function clampScene(state: PlayerState, n: number): number {
  return Math.min(Math.max(n, 0), state.scenes.length - 1)
}

function sceneAt(state: PlayerState, n: number): Scene {
  return state.scenes[clampScene(state, n)]
}

function enter(state: PlayerState, scene: number, firedCount = 0): PlayerState {
  return { ...state, status: 'playing', scene: clampScene(state, scene), firedCount, manual: [], sceneKey: state.sceneKey + 1 }
}

export function initialPlayerState(scenes: Scene[], mode: Mode, initialScene: number): PlayerState {
  const startsPlaying = mode === 'presenter' && initialScene > 0
  return {
    scenes,
    mode,
    status: startsPlaying ? 'playing' : 'idle',
    scene: Math.min(Math.max(initialScene, 0), scenes.length - 1),
    firedCount: 0,
    manual: [],
    sceneKey: 0,
    fullscreen: false,
  }
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  const stepCount = sceneAt(state, state.scene).steps.length
  const last = state.scene >= state.scenes.length - 1

  switch (action.type) {
    case 'START': {
      if (state.status !== 'idle') return state
      // The presenter skips the intro hold; autoplay lets it breathe.
      if (state.mode === 'presenter') return enter(state, Math.max(state.scene, 1))
      return { ...state, status: 'playing' }
    }
    case 'NEXT': {
      if (state.status === 'idle') return playerReducer(state, { type: 'START' })
      if (state.status === 'finished') return state
      // One press completes the scene, the next one moves on.
      if (state.firedCount < stepCount) return { ...state, status: 'playing', firedCount: stepCount }
      if (last) return { ...state, status: 'finished' }
      return enter(state, state.scene + 1)
    }
    case 'PREV': {
      if (state.scene <= 0) return state
      const prev = state.scene - 1
      return enter(state, prev, sceneAt(state, prev).steps.length)
    }
    case 'GOTO':
      return enter(state, action.scene)
    case 'REPLAY':
      return enter(state, state.scene)
    case 'TOGGLE_PAUSE': {
      if (state.status === 'playing') return { ...state, status: 'paused' }
      if (state.status === 'paused') return { ...state, status: 'playing' }
      return state
    }
    case 'STEP_FIRED':
      return action.count > state.firedCount ? { ...state, firedCount: Math.min(action.count, stepCount) } : state
    case 'FIRE_MANUAL':
      return state.manual.includes(action.id) ? state : { ...state, manual: [...state.manual, action.id] }
    case 'SCENE_DONE': {
      if (state.mode === 'presenter' || state.status !== 'playing') return state
      if (last) return { ...state, status: 'finished', firedCount: stepCount }
      return enter(state, state.scene + 1)
    }
    case 'EXIT':
      return { ...state, status: 'idle', scene: 0, firedCount: 0, manual: [], sceneKey: state.sceneKey + 1 }
    case 'FULLSCREEN':
      return state.fullscreen === action.on ? state : { ...state, fullscreen: action.on }
  }
}

export function usePlayer(scenes: Scene[], mode: Mode, initialScene: number) {
  return useReducer(playerReducer, undefined, () => initialPlayerState(scenes, mode, initialScene))
}
