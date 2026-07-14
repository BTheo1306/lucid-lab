'use client'

// Scroll-driven particle scene for /second-brain, on every screen size.
// The particle brain sits fully visible in the dark hero (right of the copy
// on desktop, below it on mobile), glides to the center behind the statement
// text as you scroll, then explodes and settles into a wide network of
// interconnected nodes and lines that stays as the background of the rest
// of the dark zone. Ember/amber palette on ink.

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

// The brain is sampled offline from a real 3D brain mesh (generated with
// Higgsfield image_to_3d, sampled by scripts/sample-brain.py):
// /second-brain-points.bin holds x, y, z, nx, ny, nz float32 per point in
// mesh space. The pose is applied here (so orientation variants are free)
// and the lighting is computed live: a front-top key light plus a rim term
// on the silhouette, so gyri catch the light, sulci stay dark and the edge
// glows. Colors run ember at the base to gold on the crown.
type BrainPose = { yaw: number; pitch: number; roll: number }

function brainFromData(data: Float32Array, rand: () => number, pose: BrainPose): { positions: Float32Array; colors: Float32Array } {
  const n = Math.max(1, Math.min(COUNT, Math.floor(data.length / 6)))
  const pos = new Float32Array(COUNT * 3)
  const col = new Float32Array(COUNT * 3)
  const SCALE = 1.32
  const cy = Math.cos(pose.yaw), sy = Math.sin(pose.yaw)
  const cp = Math.cos(pose.pitch), sp = Math.sin(pose.pitch)
  const cr = Math.cos(pose.roll), sr = Math.sin(pose.roll)
  // camera-space key light: from the front, above, slightly right
  const L = [0.32, 0.52, 0.79]
  const rot = (x: number, y: number, z: number): [number, number, number] => {
    let px = x * cy - z * sy
    const pz0 = x * sy + z * cy
    let py = y * cp - pz0 * sp
    const pz = y * sp + pz0 * cp
    const px2 = px * cr - py * sr
    py = px * sr + py * cr
    px = px2
    return [px, py, pz]
  }
  for (let i = 0; i < COUNT; i++) {
    const k = i < n ? i : Math.floor(rand() * n) // recycle if the file is short
    const [x, y, z] = rot(data[k * 6], data[k * 6 + 1], data[k * 6 + 2])
    const [nx, ny, nz] = rot(data[k * 6 + 3], data[k * 6 + 4], data[k * 6 + 5])
    pos[i * 3] = x * SCALE
    pos[i * 3 + 1] = y * SCALE + 0.08
    pos[i * 3 + 2] = z * SCALE
    const lam = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2])
    const rim = Math.pow(1 - Math.abs(nz), 2) * 0.42
    const shade = 0.2 + 0.62 * lam + rim
    const t = Math.min(1, Math.max(0, (y * SCALE + 1.15) / 2.2))
    let r: number, g: number, b: number
    if (rand() < 0.02) {
      r = 0.98; g = 0.97; b = 0.94
    } else {
      r = 0.70 + 0.25 * t
      g = 0.30 + 0.42 * t
      b = 0.06 + 0.26 * t
    }
    col[i * 3] = r * shade
    col[i * 3 + 1] = g * shade
    col[i * 3 + 2] = b * shade
  }
  return { positions: pos, colors: col }
}

// Hero pose: full profile facing the copy, the instantly readable brain
// silhouette (frontal lobe left), with a hint of yaw left so the particle
// cloud keeps some depth. World footprint after SCALE: ~3.0 wide, ~2.65 tall.
const POSE: BrainPose = { yaw: -1.45, pitch: 0.08, roll: 0.02 }
const BRAIN_WIDTH = 3.0

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
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // The brain point cloud loads asynchronously; the scene boots once it
    // arrives. If the fetch fails the canvas simply stays empty.
    let disposedEarly = false
    let cleanup: (() => void) | null = null

    const init = (brainData: Float32Array): (() => void) => {
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
    const { positions: brain, colors } = brainFromData(brainData, rand, POSE)
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
    const ambientDots = makeAmbient(dotTexture(), AMBIENT_COUNT, 0, 0.10, 0.35)

    // ── Zone and section measurements ──
    // heroX/heroY place the assembled brain in the hero (right of the copy on
    // wide screens, centered under it on portrait), baseScale shrinks it to
    // fit narrow viewports. Recomputed on resize.
    let zoneTop = 0, zoneBottom = 1, anchors = [0, 0.5, 1]
    let heroX = 1.15, heroY = 0, baseScale = 1
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
      camera.aspect = width / (height || 1)
      camera.updateProjectionMatrix()
      const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
      const halfW = halfH * camera.aspect
      const portrait = camera.aspect < 1.05
      if (portrait) {
        // Centered under the hero copy (measured live so it clears the CTAs),
        // sized to the viewport width. The brain bbox is y [-1.24, 1.41].
        heroX = 0
        baseScale = Math.min(0.38, (halfW * 2 * 0.88) / BRAIN_WIDTH)
        const copy = document.getElementById('sb-hero-copy')
        const copyBottom = copy
          ? copy.getBoundingClientRect().bottom + window.scrollY
          : height * 0.72
        const pxPerWorld = (height / 2) / halfH
        // The sparse crown may slide slightly behind the last CTA; that beats
        // pushing most of the brain below the fold.
        const topWorld = halfH - (copyBottom - 30) / pxPerWorld
        heroY = topWorld - 1.41 * baseScale
      } else {
        heroX = Math.max(0.4, Math.min(1.15, halfW - BRAIN_WIDTH / 2 - 0.06))
        heroY = 0
        baseScale = 1
      }
    }
    measure()
    // Re-measure once layout settles (fonts, images) and on resize; repaint
    // right away so occluded tabs (throttled rAF) pick the new layout up too.
    const settleTimer = window.setTimeout(() => { measure(); renderFrame() }, 1200)
    const onResize = () => { measure(); renderFrame() }
    window.addEventListener('resize', onResize)

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

      // 0 -> 1: the brain glides from its hero spot to the center.
      const glide = smootherstep(clamp01(phase))
      group.position.x = heroX * (1 - glide)
      group.position.y = heroY * (1 - glide) - 0.1 * glide

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
      // The fit scale eases back to 1 with the explosion so the network dust
      // spreads across the full viewport even on portrait screens. Point
      // sizes follow the scale, otherwise the shrunk cloud saturates into a
      // solid blob on small screens (additive blending).
      const brainHold = 1 - shapeFrac
      const fit = baseScale + (1 - baseScale) * shapeFrac
      group.scale.setScalar(fit * (1 + brainHold * 0.06 * Math.sin(time * 0.8)))
      coreMat.size = 0.030 * fit
      haloMat.size = 0.07 * fit
      // Scrolling tips the brain forward: by the time it sits behind the
      // statement you are looking at the top of both hemispheres. The tilt
      // waits out the first third of the glide so the profile stays readable
      // while the brain travels, and eases back out as the explosion turns
      // it into the network.
      const tilt = 1.02 * smootherstep((glide - 0.3) / 0.7) * (1 - shapeFrac)
      const swing = 0.18 * glide * (1 - shapeFrac)
      group.rotation.x += ((tilt + my * 0.08) - group.rotation.x) * 0.04
      group.rotation.y += ((mx * 0.14 + Math.sin(time * 0.05) * 0.06 + swing) - group.rotation.y) * 0.04
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__sbInfo = () => ({ anchors: [...anchors], zoneTop, zoneBottom, heroX, heroY, baseScale, aspect: camera.aspect })
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.clearTimeout(settleTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll', onScroll)
      geo.dispose(); coreMat.dispose(); haloMat.dispose()
      nodeGeo.dispose(); nodeMat.dispose()
      lineGeo.dispose(); lineMat.dispose()
      ambientDots.geo.dispose(); ambientDots.mat.dispose()
      renderer.dispose()
    }
    }

    fetch('/second-brain-points.bin')
      .then((r) => r.arrayBuffer())
      .then((buf) => { if (!disposedEarly) cleanup = init(new Float32Array(buf)) })
      .catch(() => {})

    return () => { disposedEarly = true; cleanup?.() }
  }, [zoneId, sectionIds])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ opacity: 0, transition: 'opacity 0.2s linear' }}
    />
  )
}
