'use client'

// Hero animation for /formations-ia: knowledge transmission. A source dot
// (the trainer) emits soft ember ripples; as each wave front passes, the
// dots of the room ignite one by one (gray -> ember with a small bloom),
// then link up with their lit neighbours into a growing network: the team
// leveling up together. Loops with a graceful fade. Plain 2D canvas.

import { useEffect, useRef } from 'react'

const COLS = 10
const ROWS = 7
const WAVE_PERIOD = 2.6 // seconds between ripples
const WAVE_SPEED = 0.24 // unit distance per second
const WAVES_PER_CYCLE = 4
const FADE = 1.4 // fade-out duration at the end of a cycle
const CYCLE = WAVE_PERIOD * WAVES_PER_CYCLE + 3.2 // hold, then fade

// Deterministic PRNG so SSR/CSR and re-mounts agree.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

type Dot = { x: number; y: number; d: number } // d = distance to the source

const SOURCE = { x: 0.16, y: 0.5 }

function buildDots(rand: () => number): { dots: Dot[]; links: [number, number][] } {
  const dots: Dot[] = []
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      // offset grid with jitter, spread over the right side of the area
      const x = 0.3 + (c / (COLS - 1)) * 0.62 + (r % 2 === 0 ? 0.012 : -0.012) + (rand() - 0.5) * 0.03
      const y = 0.14 + (r / (ROWS - 1)) * 0.72 + (rand() - 0.5) * 0.04
      const d = Math.hypot(x - SOURCE.x, y - SOURCE.y)
      dots.push({ x, y, d })
    }
  }
  // links between close neighbours
  const links: [number, number][] = []
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y)
      if (dist < 0.105) links.push([i, j])
    }
  }
  return { dots, links }
}

export default function FormationScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const rand = mulberry32(20260711)
    const { dots, links } = buildDots(rand)
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let W = 0, H = 0

    const measure = () => {
      const r = parent.getBoundingClientRect()
      W = Math.max(1, r.width)
      H = Math.max(1, r.height)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(parent)

    let mx = 0, my = 0
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse, { passive: true })

    const start = performance.now()
    let raf = 0
    let running = true
    let lastRender = 0

    const renderFrame = () => {
      lastRender = performance.now()
      const tAbs = (lastRender - start) / 1000
      const t = reducedMotion ? CYCLE - FADE - 0.1 : tAbs % CYCLE
      // graceful fade at the end of each cycle
      const globalAlpha = reducedMotion ? 1 : 1 - clamp01((t - (CYCLE - FADE)) / FADE)

      ctx.clearRect(0, 0, W, H)
      const px = (u: number) => u * W + mx * 7
      const py = (u: number) => u * H + my * 7

      // per-dot ignition level and pulse boost from passing waves
      const lit = new Float32Array(dots.length)
      const boost = new Float32Array(dots.length)
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        for (let k = 0; k < WAVES_PER_CYCLE; k++) {
          const hitTime = k * WAVE_PERIOD + dot.d / WAVE_SPEED
          const since = t - hitTime
          if (since > 0) lit[i] = Math.max(lit[i], clamp01(since / 0.4))
          const g = Math.exp(-(since * since) / (2 * 0.16 * 0.16))
          boost[i] = Math.max(boost[i], g)
        }
      }

      // links between lit neighbours, building the team network
      ctx.lineWidth = 1
      for (const [i, j] of links) {
        const l = Math.min(lit[i], lit[j])
        if (l <= 0.05) continue
        const a = (0.07 + 0.1 * l + 0.08 * Math.min(boost[i], boost[j])) * globalAlpha
        ctx.strokeStyle = `rgba(200,94,26,${a.toFixed(3)})`
        ctx.beginPath()
        ctx.moveTo(px(dots[i].x), py(dots[i].y))
        ctx.lineTo(px(dots[j].x), py(dots[j].y))
        ctx.stroke()
      }

      // expanding ripples from the source
      if (!reducedMotion) {
        for (let k = 0; k < WAVES_PER_CYCLE; k++) {
          const age = t - k * WAVE_PERIOD
          if (age < 0) continue
          const r = age * WAVE_SPEED
          if (r > 1.3) continue
          const a = 0.32 * (1 - r / 1.3) * globalAlpha
          ctx.strokeStyle = `rgba(200,94,26,${a.toFixed(3)})`
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.ellipse(px(SOURCE.x), py(SOURCE.y), r * W, r * W, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // the room
      const scale = W / 560
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const l = lit[i]
        const b = boost[i]
        const cr = Math.round(120 + (200 - 120) * l)
        const cg = Math.round(114 + (94 - 114) * l)
        const cb = Math.round(105 + (26 - 105) * l)
        const alpha = (0.35 + 0.65 * l) * globalAlpha
        const radius = (2 + 1.1 * l + 1.6 * b) * scale
        ctx.shadowBlur = (10 * l + 8 * b) * scale
        ctx.shadowColor = 'rgba(200,94,26,0.5)'
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(px(dot.x), py(dot.y), radius, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      // the source (trainer): steady ember, pulsing at each emission
      const emit = Math.exp(-Math.pow((t % WAVE_PERIOD) / 0.25, 2))
      ctx.shadowBlur = (14 + 10 * emit) * scale
      ctx.shadowColor = 'rgba(200,94,26,0.6)'
      ctx.fillStyle = `rgba(200,94,26,${(0.95 * globalAlpha).toFixed(3)})`
      ctx.beginPath()
      ctx.arc(px(SOURCE.x), py(SOURCE.y), (3.6 + 1.4 * emit) * scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    const frame = () => {
      if (!running) return
      raf = requestAnimationFrame(frame)
      if (document.hidden) return
      renderFrame()
    }
    renderFrame()
    if (!reducedMotion) {
      const onScroll = () => { if (performance.now() - lastRender > 60) renderFrame() }
      window.addEventListener('scroll', onScroll, { passive: true })
      frame()
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).__fmRender = renderFrame
      }
      return () => {
        running = false
        cancelAnimationFrame(raf)
        ro.disconnect()
        window.removeEventListener('mousemove', onMouse)
        window.removeEventListener('scroll', onScroll)
      }
    }
    return () => {
      running = false
      ro.disconnect()
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className="block h-full w-full" />
}
