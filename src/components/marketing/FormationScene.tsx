'use client'

// Hero animation for /formations-ia, playing on the double meaning of
// "formation": scattered, jittery gray dots (the team before training) take
// flight and dock into a clean V formation flying forward (the team after),
// warming from gray to ember as they land. Waves keep cycling so the flock
// continuously rebuilds itself. Plain 2D canvas, light and cheap.

import { useEffect, useRef } from 'react'

const WING = 20 // dots per wing, plus the apex dot
const DOTS = WING * 2 + 1
const CYCLE = 10 // seconds

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

const smootherstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t))
  return x * x * x * (x * (x * 6 - 15) + 10)
}

type Dot = {
  slotX: number
  slotY: number
  offset: number // stagger within the cycle
  seedX: number
  seedY: number
  scatterX: number
  scatterY: number
  wing: -1 | 0 | 1
  rank: number // 0 = apex, grows toward the back of the wing
}

function buildDots(rand: () => number): Dot[] {
  const dots: Dot[] = []
  const push = (slotX: number, slotY: number, wing: -1 | 0 | 1, rank: number) => {
    dots.push({
      slotX: slotX + (rand() - 0.5) * 0.006,
      slotY: slotY + (rand() - 0.5) * 0.006,
      offset: rand() * 0.3,
      seedX: rand() * Math.PI * 2,
      seedY: rand() * Math.PI * 2,
      scatterX: 0.05 + rand() * 0.3,
      scatterY: 0.12 + rand() * 0.76,
      wing,
      rank,
    })
  }
  // apex, then two wings sweeping back-left with a slight curve
  push(0.82, 0.48, 0, 0)
  for (let k = 1; k <= WING; k++) {
    const x = 0.82 - k * 0.024
    const spread = k * 0.0125 + k * k * 0.00012
    push(x, 0.48 - spread, -1, k)
    push(x, 0.48 + spread, 1, k)
  }
  return dots
}

// Lifecycle inside one cycle: scattered -> flight -> docked -> fade out.
const FLIGHT_START = 0.18
const FLIGHT_END = 0.38
const FADE_START = 0.94

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
    const dots = buildDots(rand)
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
    // dot indices along each wing, apex first, for the wing lines
    const wingIndices: Record<'-1' | '1', number[]> = { '-1': [0], '1': [0] }
    dots.forEach((d, idx) => {
      if (d.wing !== 0) wingIndices[String(d.wing) as '-1' | '1'][d.rank] = idx
    })

    // Where a dot is (in unit space) and how "landed" it is, at time t.
    const evalDot = (d: Dot, t: number) => {
      const tau = reducedMotion ? 0.6 : ((t / CYCLE + d.offset) % 1)
      // the whole formation breathes and leans forward slightly
      const driftX = Math.sin(t * 0.5) * 0.008 + 0.01 * Math.sin(t * 0.23 + d.rank * 0.3)
      const driftY = Math.cos(t * 0.4 + d.rank * 0.18) * 0.008
      const slotX = d.slotX + driftX
      const slotY = d.slotY + driftY

      let alpha: number, docked: number, x: number, y: number
      if (tau < FLIGHT_START) {
        // scattered and jittery on the left
        docked = 0
        alpha = Math.min(1, tau / 0.05) * 0.75
        x = d.scatterX + Math.sin(t * 1.1 + d.seedX) * 0.022
        y = d.scatterY + Math.cos(t * 0.9 + d.seedY) * 0.03
      } else if (tau < FLIGHT_END) {
        // flight toward the slot, along a soft arc
        const s = smootherstep((tau - FLIGHT_START) / (FLIGHT_END - FLIGHT_START))
        docked = s
        alpha = 0.75 + 0.25 * s
        const sx = d.scatterX + Math.sin(t * 1.1 + d.seedX) * 0.022 * (1 - s)
        const sy = d.scatterY + Math.cos(t * 0.9 + d.seedY) * 0.03 * (1 - s)
        x = sx + (slotX - sx) * s
        y = sy + (slotY - sy) * s + Math.sin(s * Math.PI) * (d.wing === 0 ? -0.04 : d.wing * -0.05)
      } else if (tau < FADE_START) {
        docked = 1
        alpha = 1
        x = slotX
        y = slotY
      } else {
        docked = 1
        alpha = 1 - (tau - FADE_START) / (1 - FADE_START)
        x = slotX
        y = slotY
      }
      return { x, y, alpha, docked }
    }

    let raf = 0
    let running = true
    let lastRender = 0

    const renderFrame = () => {
      lastRender = performance.now()
      const t = (lastRender - start) / 1000
      ctx.clearRect(0, 0, W, H)
      const px = (u: number) => u * W + mx * 7
      const py = (u: number) => u * H + my * 7

      const states = dots.map((d) => evalDot(d, t))

      // wing lines between consecutive docked dots
      ctx.lineWidth = 1
      for (const wing of ['-1', '1'] as const) {
        const chain = wingIndices[wing]
        let prev = states[chain[0]]
        for (let rank = 1; rank <= WING; rank++) {
          const cur = states[chain[rank]]
          // only draw the wing line once both ends have really landed
          const landed = prev.docked > 0.85 && cur.docked > 0.85 ? 1 : 0
          const link = landed * Math.min(prev.alpha, cur.alpha)
          if (link > 0.05) {
            ctx.strokeStyle = `rgba(200,94,26,${(0.08 + 0.14 * link).toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(px(prev.x), py(prev.y))
            ctx.lineTo(px(cur.x), py(cur.y))
            ctx.stroke()
          }
          prev = cur
        }
      }

      // dots
      for (let k = 0; k < dots.length; k++) {
        const d = dots[k]
        const s = states[k]
        if (s.alpha <= 0.01) continue
        const isApex = d.rank === 0
        const r = (2 + s.docked * 0.7 + (isApex ? 0.9 : 0)) * (W / 560)
        // gray while lost, ember once in formation
        const cr = Math.round(110 + (200 - 110) * s.docked)
        const cg = Math.round(104 + (94 - 104) * s.docked)
        const cb = Math.round(95 + (26 - 95) * s.docked)
        ctx.shadowBlur = 12 * s.docked
        ctx.shadowColor = 'rgba(200,94,26,0.55)'
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${s.alpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(px(s.x), py(s.y), r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
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
