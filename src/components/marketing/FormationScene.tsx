'use client'

// Hero animation for /formations-ia: two tool cards (Claude and ChatGPT,
// with their marks) send knowledge pulses along curved paths to a team of
// people. Each person lights up as pulses reach them, sometimes sends a
// question back, and the whole scene reads at a glance: your teams, trained
// on the AI tools they actually use. Plain 2D canvas.

import { useEffect, useRef } from 'react'

const EMBER = '#C85E1A'
const CLAUDE_CORAL = '#D97757'
const INK = '#141414'

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
const smooth = (t: number) => { const x = clamp01(t); return x * x * (3 - 2 * x) }

// People on the right, tools on the left (unit space).
const PEOPLE: { x: number; y: number }[] = [
  { x: 0.66, y: 0.16 },
  { x: 0.82, y: 0.26 },
  { x: 0.68, y: 0.42 },
  { x: 0.86, y: 0.52 },
  { x: 0.66, y: 0.66 },
  { x: 0.82, y: 0.78 },
  { x: 0.68, y: 0.9 },
]
const CARDS = [
  { x: 0.22, y: 0.32, label: 'Claude' },
  { x: 0.22, y: 0.68, label: 'ChatGPT' },
]
// which card teaches which person (alternating, a couple learn from both)
const EDGES: { card: number; person: number }[] = [
  { card: 0, person: 0 }, { card: 0, person: 1 }, { card: 0, person: 2 }, { card: 0, person: 4 },
  { card: 1, person: 3 }, { card: 1, person: 4 }, { card: 1, person: 5 }, { card: 1, person: 6 },
]

type Pulse = { edge: number; t0: number; reverse: boolean }

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

    // pulse traffic: a new pulse every beat on a random edge
    const pulses: Pulse[] = []
    const glow = new Float32Array(PEOPLE.length)
    const ring = new Float32Array(PEOPLE.length) // arrival ripple age
    let nextPulseAt = 0.6

    const start = performance.now()
    let raf = 0
    let running = true
    let lastRender = 0
    let lastTime = 0

    // ── drawing helpers ──
    const claudeMark = (x: number, y: number, s: number) => {
      // radiating starburst
      ctx.strokeStyle = CLAUDE_CORAL
      ctx.lineCap = 'round'
      ctx.lineWidth = 2.4 * s
      for (let k = 0; k < 12; k++) {
        const a = (Math.PI * 2 * k) / 12
        const r0 = 2.6 * s, r1 = (k % 2 === 0 ? 7.4 : 6.2) * s
        ctx.beginPath()
        ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0)
        ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1)
        ctx.stroke()
      }
    }

    const gptMark = (x: number, y: number, s: number) => {
      // six interlocking arcs, the hexagonal knot silhouette
      ctx.strokeStyle = INK
      ctx.lineCap = 'round'
      ctx.lineWidth = 2.2 * s
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI * 2 * k) / 6
        const cxk = x + Math.cos(a) * 3.4 * s
        const cyk = y + Math.sin(a) * 3.4 * s
        ctx.beginPath()
        ctx.arc(cxk, cyk, 4.6 * s, a - 0.5, a + 2.4)
        ctx.stroke()
      }
    }

    const person = (x: number, y: number, s: number, lit: number, alpha: number) => {
      const cr = Math.round(90 + (200 - 90) * lit)
      const cg = Math.round(86 + (94 - 86) * lit)
      const cb = Math.round(80 + (26 - 80) * lit)
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`
      ctx.shadowBlur = 14 * lit
      ctx.shadowColor = 'rgba(200,94,26,0.55)'
      // head
      ctx.beginPath()
      ctx.arc(x, y - 6 * s, 3.1 * s, 0, Math.PI * 2)
      ctx.fill()
      // shoulders
      ctx.beginPath()
      ctx.arc(x, y + 4.4 * s, 5.4 * s, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    const renderFrame = () => {
      lastRender = performance.now()
      const t = reducedMotion ? 100 : (lastRender - start) / 1000
      const dt = Math.min(0.1, t - lastTime)
      lastTime = t

      ctx.clearRect(0, 0, W, H)
      const s = W / 560
      const px = (u: number) => u * W + mx * 7
      const py = (u: number) => u * H + my * 7

      // schedule pulses
      if (!reducedMotion && t >= nextPulseAt) {
        pulses.push({ edge: Math.floor(rand() * EDGES.length), t0: t, reverse: rand() < 0.22 })
        nextPulseAt = t + 0.5 + rand() * 0.5
      }

      // decay person glow, advance rings
      for (let i = 0; i < PEOPLE.length; i++) {
        glow[i] = Math.max(reducedMotion ? 0.7 : 0.12, glow[i] - dt * 0.5)
        if (ring[i] > 0) ring[i] += dt
        if (ring[i] > 0.9) ring[i] = 0
      }

      // edges as soft curves
      for (const { card, person: pi } of EDGES) {
        const c = CARDS[card]
        const p = PEOPLE[pi]
        const midX = (c.x + p.x) / 2
        const midY = (c.y + p.y) / 2 + (p.y > c.y ? 0.06 : -0.06)
        ctx.strokeStyle = `rgba(10,10,10,${(0.1 + 0.1 * glow[pi]).toFixed(3)})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px(c.x + 0.085), py(c.y))
        ctx.quadraticCurveTo(px(midX), py(midY), px(p.x - 0.02), py(p.y))
        ctx.stroke()
      }

      // pulses traveling along the curves
      for (let k = pulses.length - 1; k >= 0; k--) {
        const pulse = pulses[k]
        const age = (t - pulse.t0) / 1.1
        if (age >= 1) {
          if (!pulse.reverse) {
            const pi = EDGES[pulse.edge].person
            glow[pi] = 1
            ring[pi] = 0.001
          }
          pulses.splice(k, 1)
          continue
        }
        const { card, person: pi } = EDGES[pulse.edge]
        const c = CARDS[card]
        const p = PEOPLE[pi]
        const midX = (c.x + p.x) / 2
        const midY = (c.y + p.y) / 2 + (p.y > c.y ? 0.06 : -0.06)
        const tt = smooth(pulse.reverse ? 1 - age : age)
        const x0 = c.x + 0.085, y0 = c.y
        const x1 = p.x - 0.02, y1 = p.y
        const bx = (1 - tt) * (1 - tt) * x0 + 2 * (1 - tt) * tt * midX + tt * tt * x1
        const by = (1 - tt) * (1 - tt) * y0 + 2 * (1 - tt) * tt * midY + tt * tt * y1
        ctx.fillStyle = EMBER
        ctx.shadowBlur = 10 * s
        ctx.shadowColor = 'rgba(200,94,26,0.7)'
        ctx.beginPath()
        ctx.arc(px(bx), py(by), 2.4 * s, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // people, with arrival ripples
      for (let i = 0; i < PEOPLE.length; i++) {
        const p = PEOPLE[i]
        const bobY = Math.sin(t * 0.7 + i * 1.4) * 2.5 * s
        if (ring[i] > 0) {
          const rr = ring[i] / 0.9
          ctx.strokeStyle = `rgba(200,94,26,${(0.4 * (1 - rr)).toFixed(3)})`
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.arc(px(p.x), py(p.y) + bobY, (8 + 26 * rr) * s, 0, Math.PI * 2)
          ctx.stroke()
        }
        person(px(p.x), py(p.y) + bobY, s * 1.15, glow[i], 0.5 + 0.5 * glow[i])
      }

      // tool cards, floating gently
      for (let k = 0; k < CARDS.length; k++) {
        const c = CARDS[k]
        const bobY = Math.sin(t * 0.55 + k * 2.1) * 3 * s
        const cw = 118 * s, ch = 44 * s
        const cx = px(c.x), cy = py(c.y) + bobY
        ctx.save()
        ctx.shadowBlur = 22 * s
        ctx.shadowColor = 'rgba(10,10,10,0.16)'
        ctx.fillStyle = 'rgba(255,255,255,0.96)'
        ctx.beginPath()
        ctx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 12 * s)
        ctx.fill()
        ctx.restore()
        ctx.strokeStyle = 'rgba(10,10,10,0.1)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 12 * s)
        ctx.stroke()

        if (k === 0) claudeMark(cx - cw / 2 + 22 * s, cy, s)
        else gptMark(cx - cw / 2 + 22 * s, cy, s)

        ctx.fillStyle = INK
        ctx.font = `600 ${Math.round(13 * s)}px Figtree, system-ui, sans-serif`
        ctx.textBaseline = 'middle'
        ctx.fillText(c.label, cx - cw / 2 + 40 * s, cy + 1)
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
