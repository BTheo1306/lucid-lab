'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// Eagerly start loading the Spline runtime so the scene fetches while React mounts.
const runtimePromise =
  typeof window !== 'undefined' ? import('@splinetool/runtime') : null

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !runtimePromise) return

    let disposed = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any = null

    ;(async () => {
      const { Application } = await runtimePromise
      if (disposed) return
      app = new Application(canvas)
      await app.load('https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode')
      if (disposed) return

      // Lock camera to full-body view
      const camera = app._camera
      const renderer = app._renderer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalRender = renderer.render.bind(renderer) as (...a: any[]) => void
      const deadline = performance.now() + 5000
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderer.render = function (...args: any[]) {
        if (camera && performance.now() < deadline) {
          camera.position.set(0, 147, 1000)
          camera.rotation.set(0.007, 0, 0)
        }
        return originalRender(...args)
      }
      if (camera) {
        camera.position.set(0, 147, 1000)
        camera.rotation.set(0.007, 0, 0)
      }

      setLoaded(true)
    })()

    return () => {
      disposed = true
      app?.dispose?.()
    }
  }, [])

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F7F5F1] px-6">
      {/* Robot canvas — fills half the viewport height */}
      <div
        className="relative mb-4 w-full max-w-[480px]"
        style={{ height: 'min(50vh, 440px)' }}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full transition-opacity duration-700"
          style={{ opacity: loaded ? 1 : 0 }}
        />
        {/* Placeholder while Spline loads */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="loader" />
          </div>
        )}
      </div>

      {/* Copy */}
      <div className="text-center">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Erreur 404
        </p>
        <h1 className="mb-3 text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-zinc-900 sm:text-[56px]">
          Page introuvable.
        </h1>
        <p className="mb-8 text-[16px] leading-[1.6] text-zinc-500">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-80"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  )
}
