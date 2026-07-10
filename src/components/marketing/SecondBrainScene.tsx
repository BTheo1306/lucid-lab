'use client'

// Scroll-driven particle scene for /second-brain.
// The particle brain sits fully visible in the dark hero, glides to the
// center behind the statement text as you scroll, then explodes and settles
// into a wide network of interconnected nodes and lines that stays as the
// background of the rest of the dark zone. Ember/amber palette on ink.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const COUNT = 14000
const AMBIENT_COUNT = 160
const NODE_COUNT = 130

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

// Anatomical particle brain, modeled after the reference: a front 3/4 view
// of the TWO hemispheres with the longitudinal fissure clearly readable
// between them. Each hemisphere is a shaped dome covered in dense serpentine
// fold strands; the underside is not closed, it dissolves into darkness
// (no cerebellum, no stem). Also returns per-particle colors: deep ember at
// the base rising to gold on the crown, far side shaded down for volume.
function brainShape(rand: () => number): { positions: Float32Array; colors: Float32Array } {
  const pos = new Float32Array(COUNT * 3)
  const col = new Float32Array(COUNT * 3)
  const S = 1.18
  const YAW = -0.12, PITCH = 0.16 // near-frontal pose, fissure facing the camera
  const cosY = Math.cos(YAW), sinY = Math.sin(YAW)
  const cosP = Math.cos(PITCH), sinP = Math.sin(PITCH)
  // one brain-sized dome, folded at the midplane into two hemispheres
  // separated by a constant thin fissure
  const HX = 1.02, HY = 0.97, HZ = 1.14
  const ROLL = 0.09
  const cosR = Math.cos(ROLL), sinR = Math.sin(ROLL)
  let i = 0

  const write = (x: number, y: number, z: number, dim0 = 1) => {
    if (i >= COUNT) return false
    // the underside dissolves: particles below get sparser, drift down, dim
    let dim = dim0
    if (y < -0.28) {
      const d = Math.min(1, (-y - 0.28) / 0.75)
      if (rand() < d * d * 0.9) return true // thin out, but keep walking
      y -= rand() * 0.22 * d
      x += (rand() - 0.5) * 0.12 * d
      dim *= 1 - 0.55 * d
    }
    // color before posing: ember base -> gold crown, a few paper sparks
    const t = Math.min(1, Math.max(0, (y + 1) / 1.9))
    if (rand() < 0.02) {
      col[i * 3] = 0.98; col[i * 3 + 1] = 0.97; col[i * 3 + 2] = 0.94
    } else {
      col[i * 3] = 0.70 + 0.25 * t
      col[i * 3 + 1] = 0.30 + 0.42 * t
      col[i * 3 + 2] = 0.06 + 0.26 * t
    }
    // pose (yaw, pitch, then a slight roll like the reference)
    const px = x * cosY - z * sinY
    const pz = x * sinY + z * cosY
    const py = y * cosP - pz * sinP
    const pz2 = y * sinP + pz * cosP
    const px2 = px * cosR - py * sinR
    const py2 = px * sinR + py * cosR
    // depth shading: the far side fades out so the brain reads as a volume
    const shade = (0.3 + 0.7 * Math.min(1, Math.max(0, pz2 / 2.6 + 0.72))) * dim
    col[i * 3] *= shade; col[i * 3 + 1] *= shade; col[i * 3 + 2] *= shade
    pos[i * 3] = px2 * S
    pos[i * 3 + 1] = (py2 + 0.16) * S
    pos[i * 3 + 2] = pz2 * S
    i++
    return true
  }

  // Point on the brain dome. The longitudinal fissure is a deep dark crease
  // carved along the midplane: particles near it are pulled toward the core,
  // dimmed and thinned, so the groove reads from any angle (like the
  // reference), instead of a see-through slit.
  const domePoint = (u: number, phi: number, q: number, j: () => number, bright = 1) => {
    let lx = HX * Math.sqrt(Math.max(0, 1 - u * u)) * Math.cos(phi) * q
    let ly = HY * u * q
    let lz = HZ * Math.sqrt(Math.max(0, 1 - u * u)) * Math.sin(phi) * q
    // frontal taper so the front rounds off
    const front = Math.max(0, lz / HZ - 0.5)
    lx *= 1 - front * 0.22
    ly *= 1 - front * 0.14
    // temporal bulge on the lower sides
    if (ly < -0.05 && Math.abs(lx) > 0.4) lx *= 1.07
    // longitudinal fissure: gaussian crease around the midplane, deeper on
    // the upper half where it is visible
    const crease = Math.exp(-(lx * lx) / 0.09) * (ly > -0.45 ? 1 : 0.4)
    if (rand() < crease * 0.85) return // the groove is nearly empty
    const pull = 1 - 0.5 * crease
    ly *= pull; lz *= pull
    write(lx + j(), ly + j(), lz + j(), bright * (1 - 0.75 * crease))
  }

  // ── Cortex: tight serpentine fold strands over the dome ──
  const STRANDS = 84
  const STEPS = 40
  const PER_STEP = Math.max(1, Math.floor((COUNT * 0.9) / (STRANDS * STEPS)))
  for (let s = 0; s < STRANDS; s++) {
    // area-true walk (u = cos(theta)) so strands spread evenly
    let u = (rand() * 2 - 1) * 0.8
    let phi = rand() * Math.PI * 2
    let psi = rand() * Math.PI * 2
    // each strand is a ridge (bulging, brighter) or a sulcus (sunken, dimmer)
    const isRidge = rand() < 0.7
    const relief = 1 + (isRidge ? 1 : -1.4) * (0.015 + rand() * 0.03)
    const bright = isRidge ? 0.8 + rand() * 0.4 : 0.45 + rand() * 0.25
    for (let p = 0; p < STEPS; p++) {
      u += 0.038 * Math.cos(psi)
      phi += 0.08 * Math.sin(psi)
      // serpentine wander: folds curve back and forth like real gyri
      psi += Math.sin(p * 0.7 + s * 1.3) * 0.3 + (rand() - 0.5) * 0.14
      // bounce at the poles without piling up on them
      if (u > 0.85) { u = 0.85 - rand() * 0.04; psi = Math.PI - psi }
      if (u < -0.85) { u = -0.85 + rand() * 0.04; psi = Math.PI - psi }
      for (let q = 0; q < PER_STEP; q++) {
        domePoint(u, phi, relief, () => (rand() - 0.5) * 0.02, bright)
      }
    }
  }

  // ── Soft inner fill for body, dimmed so the surface folds stay dominant ──
  let guard = COUNT * 20
  while (i < COUNT && guard-- > 0) {
    const u = rand() * 2 - 1
    domePoint(u, rand() * Math.PI * 2, Math.cbrt(rand()) * 0.92, () => (rand() - 0.5) * 0.02, 0.5)
  }

  return { positions: pos, colors: col }
}

// The exploded knowledge network: node positions, edges between close nodes,
// and dust targets clustered around the nodes.
function networkLayout(rand: () => number) {
  const nodes = new Float32Array(NODE_COUNT * 3)
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes[i * 3] = (rand() - 0.5) * 8.6
    nodes[i * 3 + 1] = (rand() - 0.5) * 5.4
    nodes[i * 3 + 2] = -1.8 + rand() * 2.1
  }

  // Connect each node to its 3 nearest neighbours (deduplicated).
  const edgeSet = new Set<string>()
  for (let i = 0; i < NODE_COUNT; i++) {
    const dists: { j: number; d: number }[] = []
    for (let j = 0; j < NODE_COUNT; j++) {
      if (i === j) continue
      const dx = nodes[i * 3] - nodes[j * 3]
      const dy = nodes[i * 3 + 1] - nodes[j * 3 + 1]
      const dz = nodes[i * 3 + 2] - nodes[j * 3 + 2]
      dists.push({ j, d: dx * dx + dy * dy + dz * dz })
    }
    dists.sort((a, b) => a.d - b.d)
    for (let k = 0; k < 3; k++) {
      const j = dists[k].j
      edgeSet.add(i < j ? `${i}-${j}` : `${j}-${i}`)
    }
  }
  const edges = [...edgeSet].map((s) => s.split('-').map(Number) as [number, number])
  const lines = new Float32Array(edges.length * 6)
  edges.forEach(([a, b], e) => {
    lines[e * 6] = nodes[a * 3]; lines[e * 6 + 1] = nodes[a * 3 + 1]; lines[e * 6 + 2] = nodes[a * 3 + 2]
    lines[e * 6 + 3] = nodes[b * 3]; lines[e * 6 + 4] = nodes[b * 3 + 1]; lines[e * 6 + 5] = nodes[b * 3 + 2]
  })

  // Dust: 55% clustered around nodes, the rest spread across the slab.
  const dust = new Float32Array(COUNT * 3)
  const g = () => (rand() + rand() + rand() - 1.5) * 0.42
  for (let i = 0; i < COUNT; i++) {
    if (rand() < 0.55) {
      const n = Math.floor(rand() * NODE_COUNT)
      dust[i * 3] = nodes[n * 3] + g()
      dust[i * 3 + 1] = nodes[n * 3 + 1] + g()
      dust[i * 3 + 2] = nodes[n * 3 + 2] + g() * 0.6
    } else {
      dust[i * 3] = (rand() - 0.5) * 8.8
      dust[i * 3 + 1] = (rand() - 0.5) * 5.6
      dust[i * 3 + 2] = -1.8 + rand() * 2.2
    }
  }

  return { nodes, lines, dust }
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
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

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
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: true })
    renderer.setClearColor(new THREE.Color(INK), 0)
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 30)
    camera.position.set(0, 0, 4.3)

    // Brain/dust cloud rides in `group` (moves right -> center with scroll).
    const group = new THREE.Group()
    scene.add(group)
    // The network (nodes + lines) is fixed at the center behind the content.
    const netGroup = new THREE.Group()
    scene.add(netGroup)

    // ── Morphing cloud: brain -> exploded network dust ──
    const { positions: brain, colors } = brainShape(rand)
    const { nodes, lines, dust } = networkLayout(rand)
    const positions = new Float32Array(brain)
    const delays = new Float32Array(COUNT)
    const seeds = new Float32Array(COUNT)
    const burstDirs = new Float32Array(COUNT * 3) // radial explosion directions
    for (let i = 0; i < COUNT; i++) {
      delays[i] = rand()
      seeds[i] = rand() * Math.PI * 2
      const bx = brain[i * 3], by = brain[i * 3 + 1], bz = brain[i * 3 + 2]
      const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1
      burstDirs[i * 3] = bx / len; burstDirs[i * 3 + 1] = by / len; burstDirs[i * 3 + 2] = bz / len
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    // Two layers over the same geometry: a crisp core and a soft halo bloom.
    const coreMat = new THREE.PointsMaterial({
      size: 0.030,
      map: dotTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    const haloMat = new THREE.PointsMaterial({
      size: 0.07,
      map: dotTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    group.add(new THREE.Points(geo, coreMat))
    group.add(new THREE.Points(geo, haloMat))

    // ── Network nodes and connecting lines (revealed by the explosion) ──
    const nodeGeo = new THREE.BufferGeometry()
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodes, 3))
    const nodeMat = new THREE.PointsMaterial({
      size: 0.11,
      map: dotTexture(),
      color: new THREE.Color(0.95, 0.72, 0.34),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    netGroup.add(new THREE.Points(nodeGeo, nodeMat))

    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(lines, 3))
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(0.784, 0.369, 0.102),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    netGroup.add(new THREE.LineSegments(lineGeo, lineMat))

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

      // Canvas opacity: only inside the dark zone (instantly on at the top,
      // since the zone now starts at the hero).
      const fadeIn = smootherstep((focus - zoneTop) / (vh * 0.35))
      const fadeOut = 1 - smootherstep((focus - (zoneBottom - vh * 0.35)) / (vh * 0.5))
      const opacity = Math.min(fadeIn, fadeOut)
      canvas.style.opacity = opacity.toFixed(3)
      if (opacity <= 0.001) return

      // Phase: 0 brain in hero -> 1 brain behind the statement -> 2 network.
      let phase: number
      if (reducedMotion) {
        phase = 0
      } else if (focus <= anchors[0]) {
        phase = 0
      } else if (focus >= anchors[2]) {
        phase = 2
      } else if (focus < anchors[1]) {
        phase = (focus - anchors[0]) / (anchors[1] - anchors[0])
      } else {
        phase = 1 + (focus - anchors[1]) / (anchors[2] - anchors[1])
      }

      // 0 -> 1: the brain glides from the right of the hero to the center.
      const glide = smootherstep(clamp01(phase))
      group.position.x = 1.15 * (1 - glide)
      group.position.y = -0.1 * glide

      // 1 -> 2: explosion into the network dust.
      const shapeFrac = clamp01(phase - 1)
      // The brain stays calm and compact; the dust drifts a little more.
      const wobble = 0.012 + 0.028 * shapeFrac
      for (let i = 0; i < COUNT; i++) {
        const t = smootherstep((shapeFrac - delays[i] * 0.35) / 0.65)
        const burst = Math.sin(Math.PI * t) * (1.4 + delays[i] * 0.8)
        const s = seeds[i]
        const w = Math.sin(time * (0.6 + delays[i] * 0.5) + s) * wobble
        positions[i * 3] = brain[i * 3] + (dust[i * 3] - brain[i * 3]) * t + burstDirs[i * 3] * burst + w
        positions[i * 3 + 1] = brain[i * 3 + 1] + (dust[i * 3 + 1] - brain[i * 3 + 1]) * t + burstDirs[i * 3 + 1] * burst + Math.cos(time * 0.5 + s * 1.7) * wobble
        positions[i * 3 + 2] = brain[i * 3 + 2] + (dust[i * 3 + 2] - brain[i * 3 + 2]) * t + burstDirs[i * 3 + 2] * burst
      }
      geo.attributes.position.needsUpdate = true

      // Dust settles quieter once the network is formed, so content stays readable.
      coreMat.opacity = 0.95 - 0.45 * shapeFrac
      haloMat.opacity = 0.16 - 0.07 * shapeFrac

      // Nodes and lines materialize as the explosion settles.
      const netReveal = smootherstep((shapeFrac - 0.45) / 0.55)
      nodeMat.opacity = netReveal * 0.95
      lineMat.opacity = netReveal * 0.22

      // Slow presence: breathing while the brain holds, gentle parallax always.
      const brainHold = 1 - shapeFrac
      group.scale.setScalar(1 + brainHold * 0.06 * Math.sin(time * 0.8))
      group.rotation.y += ((mx * 0.14 + Math.sin(time * 0.05) * 0.06) - group.rotation.y) * 0.04
      group.rotation.x += ((my * 0.08) - group.rotation.x) * 0.04
      netGroup.rotation.y += ((mx * 0.05) - netGroup.rotation.y) * 0.03
      netGroup.rotation.x += ((my * 0.03) - netGroup.rotation.x) * 0.03

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
      geo.dispose(); coreMat.dispose(); haloMat.dispose()
      nodeGeo.dispose(); nodeMat.dispose()
      lineGeo.dispose(); lineMat.dispose()
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
