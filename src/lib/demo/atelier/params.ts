import { SCENE_COUNT } from './scenario'
import type { Mode } from './types'

export type DemoSearchParams = Record<string, string | string[] | undefined>

export interface DemoParams {
  initialScene: number
  mode: Mode
  /** Divides every delay. Development aid only. */
  speed: number
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export function parseDemoParams(sp: DemoSearchParams): DemoParams {
  const record = first(sp.record) === '1'
  const autoplay = first(sp.autoplay) === '1'
  const mode: Mode = record ? 'record' : autoplay ? 'autoplay' : 'presenter'

  const sceneRaw = Number.parseInt(first(sp.scene) ?? '0', 10)
  const initialScene = Number.isFinite(sceneRaw) ? Math.min(Math.max(sceneRaw, 0), SCENE_COUNT - 1) : 0

  const speedRaw = Number.parseFloat(first(sp.speed) ?? '1')
  const speed = Number.isFinite(speedRaw) ? Math.min(Math.max(speedRaw, 0.25), 8) : 1

  return { initialScene, mode, speed }
}
