'use client'

import { useEffect, useRef, useState } from 'react'
import { LogoCloud } from '@/components/ui/logo-cloud'
import { LucidRobot } from '@/components/ui/lucid-robot'
import { getDictionary, type Locale } from '@/lib/i18n/client'

// Render text containing **bold** markers as a fragment with <span>s.
function renderBold(text: string, className: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <span key={i} className={className}>{p.slice(2, -2)}</span>
      : <span key={i}>{p}</span>
  )
}

// ─── Camera target: full-body view (captured from the scene's final rest state) ──
const CAM_POS = { x: 0, y: 147, z: 1000 } as const
const CAM_ROT = { x: 0.007, y: 0, z: 0 } as const
// Duration to force-override camera position (ms) — must exceed the dezoom tween
const OVERRIDE_DURATION = 6000

// Eagerly start loading the Spline runtime at module-evaluation time
// so the ~100 KB JS is fetched in parallel with React hydration.
const runtimePromise = import('@splinetool/runtime')

export type HeroCopy = {
  titleLine1: string
  titleLine2: string
  subtitle: string
  subtitleLine2: string
  ctaPrimary: string
  ctaPrimaryHref: string
  ctaSecondary: string
  ctaSecondaryHref: string
}

export function HeroSection({ lang = 'fr', copy }: { lang?: Locale; copy?: HeroCopy } = {}) {
  const dict = getDictionary(lang).hero
  const homePrefix = lang === 'en' ? '/en' : ''
  const t: HeroCopy = copy ?? {
    titleLine1: dict.titleLine1,
    titleLine2: dict.titleLine2,
    subtitle: dict.subtitle,
    subtitleLine2: dict.subtitleLine2,
    ctaPrimary: dict.ctaPrimary,
    ctaPrimaryHref: `${homePrefix}/#booking`,
    ctaSecondary: dict.ctaSecondary,
    ctaSecondaryHref: `${homePrefix}/#acquis-livres`,
  }
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appRef = useRef<any>(null)
  const robotRef = useRef<LucidRobot | null>(null)
  // Flips the moment scattered parts are in place, so the canvas crossfades
  // in BEFORE the visible reassembly tween starts.
  const [canvasVisible, setCanvasVisible] = useState(false)

  // ─── Load Spline scene with full lifecycle control ───────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any = null

    ;(async () => {
      const { Application } = await runtimePromise
      if (disposed) return

      app = new Application(canvas)
      appRef.current = app

      await app.load('https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode')
      if (disposed) return

      // ── Kill the dezoom animation ──────────────────────────────────────
      // The scene's 12 "Start" events drive a camera tween (close-up →
      // full-body). We patch _renderer.render to force the camera to its
      // final full-body position right before every GPU draw.

      const camera = app._camera
      const threeRenderer = app._renderer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalDraw = threeRenderer.render.bind(threeRenderer) as (...args: any[]) => void
      const overrideStart = performance.now()
      let cameraOverrideActive = true

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      threeRenderer.render = function patchedDraw(...args: any[]) {
        if (cameraOverrideActive && camera && performance.now() - overrideStart < OVERRIDE_DURATION) {
          camera.position.set(CAM_POS.x, CAM_POS.y, CAM_POS.z)
          camera.rotation.set(CAM_ROT.x, CAM_ROT.y, CAM_ROT.z)
        }
        return originalDraw(...args)
      }

      if (camera) {
        camera.position.set(CAM_POS.x, CAM_POS.y, CAM_POS.z)
        camera.rotation.set(CAM_ROT.x, CAM_ROT.y, CAM_ROT.z)
      }

      // Deactivate camera override after the Spline tween has settled
      window.setTimeout(() => { cameraOverrideActive = false }, OVERRIDE_DURATION)

      // Boot the robot IMMEDIATELY (one frame delay so Spline applies
      // initial transforms). The camera override continues running
      // independently in the background for 6 s.
      requestAnimationFrame(() => {
        if (disposed) return
        try {
          const robot = new LucidRobot(app)
          robotRef.current = robot
          robot.prepareAssembly()
          setCanvasVisible(true)

          requestAnimationFrame(() => {
            if (disposed) return
            robot.startAssembly().then(() => {
              if (disposed) return
              // Enable LookAt now that the robot is assembled
              try {
                const lookAt = app._eventManager?.handlers?.LookAt
                if (lookAt) {
                  const evts = lookAt.events || []
                  for (const ev of evts) ev.paused = false
                  lookAt.connect?.()
                }
              } catch {}
              robot.startBreathing()
              window.setTimeout(() => { robot.wave().catch(() => {}) }, 1000)
              robot.startAmbient()
            })
          })
        } catch (err) {
           
          console.error('[Lucid] Animator failed to boot:', err)
          setCanvasVisible(true)
        }
      })
    })()

    return () => {
      disposed = true
      try { robotRef.current?.dispose() } catch {}
      robotRef.current = null
      try { app?.dispose() } catch {}
      appRef.current = null
    }
  }, [])

  // ─── Responsive canvas sizing ────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ro = new ResizeObserver(() => {
      const app = appRef.current
      if (!app) return
      const { width, height } = parent.getBoundingClientRect()
      try { app.setSize(width, height) } catch {}
    })
    ro.observe(parent)
    return () => ro.disconnect()
  }, [])

  // ─── Forward mouse → Spline (full-page mouse follow) ────────────────────
  useEffect(() => {
    const forward = (e: MouseEvent) => {
      const section = sectionRef.current
      if (!section) return
      const sRect = section.getBoundingClientRect()
      if (sRect.bottom < 0 || sRect.top > window.innerHeight) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const rawX = rect.left + (e.clientX / window.innerWidth) * rect.width
      const rawY = rect.top + (e.clientY / window.innerHeight) * rect.height
      canvas.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: Math.max(rect.left, Math.min(rect.right, rawX)),
          clientY: Math.max(rect.top, Math.min(rect.bottom, rawY)),
          bubbles: true,
          cancelable: true,
          pointerType: 'mouse',
          isPrimary: true,
        })
      )
    }
    window.addEventListener('mousemove', forward, { passive: true })
    return () => window.removeEventListener('mousemove', forward)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F7F5F1] pt-[56px]"
      style={{ overflowX: 'clip', overflowY: 'hidden' }}
    >
      {/* Warm gradient background */}
      <div
        className="absolute inset-0 -z-[1]"
        style={{
          background:
            'radial-gradient(84.42% 84.32% at 51.63% 100%, #FFB451 0%, #EFC680 24.76%, #B4D8FF 47.6%, #D2E8FF 75%, #FAFDFF 100%)',
        }}
      />

      {/* Ambient glow for the robot — behind everything */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 -z-[0]"
        style={{
          width: '52%',
          background:
            'radial-gradient(ellipse 80% 70% at 65% 50%, rgba(180,216,255,0.30) 0%, transparent 65%)',
        }}
      />

      {/* Bordered container */}
      <div className="relative mx-auto max-w-[1264px] border-x border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center sm:min-h-[654px]">
        <div className="flex flex-col gap-8 px-6 py-12 sm:px-[48px] sm:py-[100px] sm:max-w-[50%]">
          {/* Headline */}
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-[-0.03em] text-[#000] sm:text-[48px] lg:text-[56px]">
            {t.titleLine1}
            <br />
            {t.titleLine2}
          </h1>

          {/* Subtitle */}
          <p className="max-w-[480px] text-[17px] leading-[1.65] text-[#555]">
            {renderBold(t.subtitle, 'font-semibold text-black')}
            <br />
            {renderBold(t.subtitleLine2, 'text-black')}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={t.ctaPrimaryHref}
              className="flex h-[40px] items-center rounded-[10px] bg-black px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#222]"
            >
              {t.ctaPrimary}
            </a>
            <a
              href={t.ctaSecondaryHref}
              className="flex h-[40px] items-center rounded-[10px] border border-[#d4d4d4] bg-[#F7F5F1] px-6 text-[14px] font-medium text-[#333] transition-colors hover:bg-[#edeae4]"
            >
              {t.ctaSecondary}
            </a>
          </div>
        </div>

        {/* Robot — custom runtime integration, no dezoom.
            Canvas is always mounted (prevents any replay).
            contain:layout paint isolates the WebGL repaints from the rest of the page. */}
        <div
          className="relative h-[260px] w-full overflow-hidden sm:absolute sm:inset-y-0 sm:right-0 sm:h-auto sm:w-[55%]"
          style={{ contain: 'layout paint' }}
        >
          {/* Static poster — hidden until Spline loads.
              The canvas + assembly animation handles the reveal. */}
          <img
            src="/robot-poster.png"
            alt=""
            aria-hidden
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...{ fetchPriority: 'high' } as any}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: 0,
              visibility: 'hidden',
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              opacity: canvasVisible ? 1 : 0,
              transition: 'opacity 0.5s ease-out',
            }}
          />
        </div>
      </div>
    </section>
  )
}

export function LogosSection({ lang: _lang = 'fr' }: { lang?: Locale } = {}) {
  void _lang
  return (
    <section className="border-y border-[#e5e5e5] bg-[#F7F5F1]" aria-hidden>
      <div className="mx-auto max-w-[1264px] border-x border-[#e5e5e5] py-[40px] max-sm:py-6">
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <LogoCloud logos={logos} />
        </div>
      </div>
    </section>
  )
}

const _mk = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`

const logos = [
  { src: '/nextra.png', alt: 'Nextra' },
  {
    // Turismo — bold italic wordmark
    src: _mk('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 52"><text x="0" y="40" font-family="\'Arial Black\',Impact,sans-serif" font-size="42" fill="#000" font-weight="900" font-style="italic" letter-spacing="-1">TURISMO</text></svg>'),
    alt: 'Turismo',
  },
  {
    src: _mk('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 56"><text x="0" y="36" font-family="Georgia,\'Times New Roman\',serif" font-size="26" fill="#C85E1A" letter-spacing="12">P\u00c9RISCOPE</text></svg>'),
    alt: 'P\u00e9riscope',
  },
  { src: '/bsp37.png', alt: 'BSP37' },
  {
    // Kobia — ultra-bold display wordmark
    src: _mk('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 56"><text x="0" y="46" font-family="\'Arial Black\',Georgia,serif" font-size="52" fill="#000" font-weight="900" letter-spacing="-2">KOBIA</text></svg>'),
    alt: 'Kobia',
  },
  {
    src: _mk('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 52"><text x="0" y="30" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="#777" letter-spacing="4" font-weight="bold">SINIBALDI</text><text x="2" y="46" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#aaa" letter-spacing="3">global design</text></svg>'),
    alt: 'Sinibaldi',
  },
  { src: '/melting-forme.png', alt: 'Melting Forme' },
  {
    src: _mk('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 48"><text x="0" y="36" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="26" fill="#000" letter-spacing="6">UNIVERSAL</text></svg>'),
    alt: 'Universal',
  },
  {
    src: _mk('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 52"><text x="24" y="30" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="24" fill="#1B3A8C" letter-spacing="1">APSIDE</text><text x="32" y="46" font-family="Arial,Helvetica,sans-serif" font-size="13" fill="#1B3A8C" letter-spacing="3">BELGIUM</text></svg>'),
    alt: 'Apside Belgium',
  },
]
