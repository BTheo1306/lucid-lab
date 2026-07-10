'use client'

// Scroll-driven particle scene for /second-brain.
// One particle cloud morphs through three shapes as the dark zone scrolls:
// scattered fragments (the problem) -> brain (the second brain) -> lattice
// (the structured knowledge base). Ember/amber palette on ink, additive glow.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const COUNT = 9000
const AMBIENT_COUNT = 160

const INK = '#0A0A0A'

// [r, g, b, weight]
const PALETTE: [number, number, number, number][] = [
  [0.784, 0.369, 0.102, 0.36], // #C85E1A ember
  [0.894, 0.627, 0.463, 0.30], // #E4A076 amber
  [0.949, 0.706, 0.314, 0.24], // #F2B450 gold
  [0.980, 0.980, 0.969, 0.10], // paper spark
]

function pickColor(rand: () => number): [number, number, number] {
  let t = rand()
  for (const [r, g, b, w] of PALETTE) {
    if (t < w) return [r, g, b]
    t -= w
  }
  return [PALETTE[0][0], PALETTE[0][1], PALETTE[0][2]]
}

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

// ─── Shape targets ──────────────────────────────────────────────────────────

// Scattered fragments: a wide fog with a few dense clumps (the silos).
function scatterShape(rand: () => number): Float32Array {
  const arr = new Float32Array(COUNT * 3)
  const clumps = [
    [-2.6, 0.95, -0.7], [2.45, 1.15, -1.1], [-1.7, -1.05, -0.4],
    [1.9, -0.85, -0.9], [0.15, 0.25, -1.5],
  ]
  for (let i = 0; i < COUNT; i++) {
    let x: number, y: number, z: number
    if (rand() < 0.62) {
      const c = clumps[Math.floor(rand() * clumps.length)]
      const g = () => (rand() + rand() + rand() - 1.5) * 0.62
      x = c[0] + g(); y = c[1] + g() * 0.8; z = c[2] + g() * 0.7
    } else {
      x = (rand() - 0.5) * 7.2
      y = (rand() - 0.5) * 4.0
      z = -1.2 + (rand() - 0.5) * 2.2
    }
    arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z
  }
  return arr
}

// Procedural brain: cortex shell with fissure and gyri ridges + cerebellum.
function brainShape(rand: () => number): Float32Array {
  const arr = new Float32Array(COUNT * 3)
  const S = 1.5
  for (let i = 0; i < COUNT; i++) {
    if (rand() < 0.88) {
      // cortex
      const theta = Math.acos(2 * rand() - 1)
      const phi = rand() * Math.PI * 2
      let r = 0.9 + 0.1 * Math.sqrt(rand())
      r *= 1
        + 0.055 * Math.sin(theta * 7 + 1.7) * Math.cos(phi * 5 + 0.6)
        + 0.032 * Math.sin(theta * 13 + 0.4) * Math.sin(phi * 11 + 2.1)
      let x = r * Math.sin(theta) * Math.cos(phi) * 1.02
      let y = r * Math.cos(theta) * 0.82
      const z = r * Math.sin(theta) * Math.sin(phi) * 1.32
      // longitudinal fissure on top
      if (y > 0.1) {
        const gap = Math.exp(-(x * x) / 0.02) * Math.min(1, (y - 0.1) / 0.3)
        x += Math.sign(x || rand() - 0.5) * 0.09 * gap
      }
      // flatten the underside
      if (y < -0.35) y *= 0.82
      arr[i * 3] = x * S; arr[i * 3 + 1] = (y + 0.08) * S; arr[i * 3 + 2] = z * S
    } else {
      // cerebellum
      const theta = Math.acos(2 * rand() - 1)
      const phi = rand() * Math.PI * 2
      let r = 0.86 + 0.14 * rand()
      const y0 = Math.cos(theta)
      r *= 1 + 0.07 * Math.sin(y0 * 22)
      arr[i * 3] = r * Math.sin(theta) * Math.cos(phi) * 0.52 * S
      arr[i * 3 + 1] = (y0 * 0.30 - 0.48) * S
      arr[i * 3 + 2] = (r * Math.sin(theta) * Math.sin(phi) * 0.40 - 0.72) * S
    }
  }
  return arr
}

// Structured lattice: a crisp grid, the knowledge base in order.
function latticeShape(rand: () => number): Float32Array {
  const arr = new Float32Array(COUNT * 3)
  const nx = 26, ny = 14, nz = 25 // 9100 cells >= COUNT
  const sx = 3.6, sy = 2.0, sz = 1.9
  let i = 0
  outer: for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        if (i >= COUNT) break outer
        const j = () => (rand() - 0.5) * 0.02
        arr[i * 3] = (ix / (nx - 1) - 0.5) * sx + j()
        arr[i * 3 + 1] = (iy / (ny - 1) - 0.5) * sy + j()
        arr[i * 3 + 2] = (iz / (nz - 1) - 0.5) * sz - 0.4 + j()
        i++
      }
    }
  }
  return arr
}

// Soft round sprite for glow points.
function dotTexture(): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Thin triangle outline sprite, the ambient nod to the reference.
function triTexture(): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(32, 10); ctx.lineTo(54, 50); ctx.lineTo(10, 50); ctx.closePath()
  ctx.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const smootherstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t))
  return x * x * x * (x * (x * 6 - 15) + 10)
}

export default function SecondBrainScene({
  zoneId,
  sectionIds,
}: {
  zoneId: string
  sectionIds: [string, string, string]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.innerWidth < 1024) return // canvas is CSS-hidden below lg anyway
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const rand = mulberry32(20260710)
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: true })
    renderer.setClearColor(new THREE.Color(INK), 0)
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 30)
    camera.position.set(0, 0, 4.3)

    const group = new THREE.Group()
    scene.add(group)

    // ── Morphing cloud ──
    const shapes = [scatterShape(rand), brainShape(rand), latticeShape(rand)]
    const positions = new Float32Array(shapes[0])
    const colors = new Float32Array(COUNT * 3)
    const delays = new Float32Array(COUNT)
    const seeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const [r, g, b] = pickColor(rand)
      colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b
      delays[i] = rand()
      seeds[i] = rand() * Math.PI * 2
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.PointsMaterial({
      size: 0.045,
      map: dotTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    group.add(new THREE.Points(geo, mat))

    // ── Ambient drifting specks and triangles ──
    const ambPos = new Float32Array(AMBIENT_COUNT * 3)
    const ambCol = new Float32Array(AMBIENT_COUNT * 3)
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      ambPos[i * 3] = (rand() - 0.5) * 9
      ambPos[i * 3 + 1] = (rand() - 0.5) * 5.4
      ambPos[i * 3 + 2] = -1.6 + rand() * 2.4
      const [r, g, b] = pickColor(rand)
      ambCol[i * 3] = r; ambCol[i * 3 + 1] = g; ambCol[i * 3 + 2] = b
    }
    const makeAmbient = (tex: THREE.Texture, count: number, offset: number, size: number, opacity: number) => {
      const g2 = new THREE.BufferGeometry()
      g2.setAttribute('position', new THREE.BufferAttribute(ambPos.slice(offset * 3, (offset + count) * 3), 3))
      g2.setAttribute('color', new THREE.BufferAttribute(ambCol.slice(offset * 3, (offset + count) * 3), 3))
      const m2 = new THREE.PointsMaterial({
        size, map: tex, vertexColors: true, transparent: true, opacity,
        depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
      })
      const pts = new THREE.Points(g2, m2)
      scene.add(pts)
      return { geo: g2, mat: m2 }
    }
    const ambientDots = makeAmbient(dotTexture(), AMBIENT_COUNT - 40, 0, 0.10, 0.35)
    const ambientTris = makeAmbient(triTexture(), 40, AMBIENT_COUNT - 40, 0.16, 0.28)

    // ── Zone and section measurements ──
    let zoneTop = 0, zoneBottom = 1, anchors = [0, 0.5, 1]
    const measure = () => {
      const zone = document.getElementById(zoneId)
      if (!zone) return
      const zr = zone.getBoundingClientRect()
      zoneTop = zr.top + window.scrollY
      zoneBottom = zoneTop + zr.height
      anchors = sectionIds.map((id) => {
        const el = document.getElementById(id)
        if (!el) return zoneTop
        const r = el.getBoundingClientRect()
        return r.top + window.scrollY + r.height / 2
      })
      const { width, height } = canvas.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    measure()
    // Re-measure once layout settles (fonts, images) and on resize.
    const settleTimer = window.setTimeout(measure, 1200)
    window.addEventListener('resize', measure)

    // ── Mouse parallax ──
    let mx = 0, my = 0
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse, { passive: true })

    // ── Render loop ──
    let raf = 0
    let running = true
    const clock = new THREE.Clock()

    let lastRender = 0
    const renderFrame = () => {
      lastRender = performance.now()
      const time = clock.getElapsedTime()
      const vh = window.innerHeight
      const focus = window.scrollY + vh * 0.55

      // Canvas opacity: only inside the dark zone.
      const fadeIn = smootherstep((focus - zoneTop) / (vh * 0.5))
      const fadeOut = 1 - smootherstep((focus - (zoneBottom - vh * 0.35)) / (vh * 0.5))
      const opacity = Math.min(fadeIn, fadeOut)
      canvas.style.opacity = opacity.toFixed(3)
      if (opacity <= 0.001) return

      // Phase: 0 scatter -> 1 brain -> 2 lattice, anchored at section centers.
      let phase: number
      if (reducedMotion) {
        phase = 1
      } else if (focus <= anchors[0]) {
        phase = 0
      } else if (focus >= anchors[2]) {
        phase = 2
      } else if (focus < anchors[1]) {
        phase = (focus - anchors[0]) / (anchors[1] - anchors[0])
      } else {
        phase = 1 + (focus - anchors[1]) / (anchors[2] - anchors[1])
      }

      const seg = Math.min(1, Math.floor(phase))
      const frac = phase - seg
      const from = shapes[seg]
      const to = shapes[seg + 1]
      const wobble = 0.05 - 0.03 * Math.min(1, phase) // calmer as it organizes
      for (let i = 0; i < COUNT; i++) {
        const t = smootherstep((frac - delays[i] * 0.35) / 0.65)
        const s = seeds[i]
        const w = Math.sin(time * (0.6 + delays[i] * 0.5) + s) * wobble
        positions[i * 3] = from[i * 3] + (to[i * 3] - from[i * 3]) * t + w
        positions[i * 3 + 1] = from[i * 3 + 1] + (to[i * 3 + 1] - from[i * 3 + 1]) * t + Math.cos(time * 0.5 + s * 1.7) * wobble
        positions[i * 3 + 2] = from[i * 3 + 2] + (to[i * 3 + 2] - from[i * 3 + 2]) * t
      }
      geo.attributes.position.needsUpdate = true

      // Dim the cloud while the bento cards sit on top of it.
      mat.opacity = 0.85 - 0.4 * Math.max(0, phase - 1)

      // Slow presence: breathing scale on the brain, gentle rotation always.
      const brainHold = 1 - Math.min(1, Math.abs(phase - 1) * 2)
      group.scale.setScalar(1 + brainHold * 0.06 * Math.sin(time * 0.8))
      // Turn the lattice slightly so its depth reads instead of a flat moiré.
      const latticeTurn = 0.24 * Math.max(0, Math.min(1, phase - 1))
      group.rotation.y += ((mx * 0.14 + Math.sin(time * 0.05) * 0.06 + latticeTurn) - group.rotation.y) * 0.04
      group.rotation.x += ((my * 0.08 - latticeTurn * 0.35) - group.rotation.x) * 0.04

      // Ambient drift upward, wrapping.
      const ap = ambientDots.geo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < ap.count; i++) {
        let y = ap.getY(i) + 0.0009
        if (y > 2.8) y = -2.8
        ap.setY(i, y)
      }
      ap.needsUpdate = true

      renderer.render(scene, camera)
    }

    const frame = () => {
      if (!running) return
      raf = requestAnimationFrame(frame)
      if (document.hidden) return
      renderFrame()
    }
    // Paint the current scroll state immediately (before the rAF loop kicks
    // in), and keep tracking scroll even when the browser throttles rAF
    // (hidden or occluded tab). The 30 ms guard avoids double work at 60 fps.
    renderFrame()
    const onScroll = () => { if (performance.now() - lastRender > 30) renderFrame() }
    window.addEventListener('scroll', onScroll, { passive: true })
    frame()
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__sbRender = renderFrame
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll', onScroll)
      geo.dispose(); mat.dispose()
      ambientDots.geo.dispose(); ambientDots.mat.dispose()
      ambientTris.geo.dispose(); ambientTris.mat.dispose()
      renderer.dispose()
    }
  }, [zoneId, sectionIds])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden h-full w-full lg:block"
      style={{ opacity: 0, transition: 'opacity 0.2s linear' }}
    />
  )
}
