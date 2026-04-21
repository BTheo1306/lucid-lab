"use client"

import { useEffect, useRef, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import DottedMap from "dotted-map"


// ─── Dotted Map ────────────────────────────────────────────────────────────────

const MAP_CITIES = [
  { label: "Paris",      lat: 48.8566, lng: 2.3522 },
  { label: "Marseille", lat: 43.2965, lng: 5.3698 },
  { label: "Nice",      lat: 43.7102, lng: 7.2620 },
  { label: "Luxembourg", lat: 49.6117, lng: 6.1319 },
  { label: "Bruxelles",  lat: 50.8503, lng: 4.3517 },
]

// Build the Europe map and derive pin positions using DottedMap's own coordinate
// system. The SVG viewBox is "0 0 width height" — pin x/y from addPin() are in
// that same space, so we divide by viewBox width/height to get exact percentages.
const { SVG_MAP, MAP_PIN_POSITIONS } = (() => {
  const map = new DottedMap({
    height: 60,
    grid: "diagonal",
    region: {
      lat: { min: 36, max: 58 },
      lng: { min: -15, max: 25 },
    },
    projection: { name: "equirectangular" },
  } as any)

  // addPin() returns the exact {x, y} in the SVG coordinate space (0..width, 0..height)
  const pinSvgCoords: Record<string, { x: number; y: number }> = {}
  MAP_CITIES.forEach(({ label, lat, lng }) => {
    const point = map.addPin({ lat, lng, data: label })
    if (point) pinSvgCoords[label] = { x: point.x, y: point.y }
  })

  const svg = map.getSVG({
    radius: 0.28,
    color: "#d4d4d8",
    shape: "circle",
    backgroundColor: "transparent",
  })

  // Extract the definitive SVG dimensions from viewBox="0 0 W H"
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const svgW = vb ? parseFloat(vb[1]) : 1
  const svgH = vb ? parseFloat(vb[2]) : 1

  // Convert pin SVG coords to % of viewBox — exact match with the background image
  const pinPositions: Record<string, { x: number; y: number }> = {}
  for (const [label, p] of Object.entries(pinSvgCoords)) {
    pinPositions[label] = {
      x: (p.x / svgW) * 100,
      y: (p.y / svgH) * 100,
    }
  }

  return { SVG_MAP: svg, MAP_PIN_POSITIONS: pinPositions }
})()

const SVG_MAP_URI = `url("data:image/svg+xml;utf8,${encodeURIComponent(SVG_MAP)}")`

function WorldMap() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="absolute inset-0 select-none rounded-b-xl">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: SVG_MAP_URI,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          opacity: 0.9,
        }}
      />
      {/* Interactive city pins — positions derived from DottedMap's grid coords */}
      {MAP_CITIES.map(({ label }) => {
        const pos = MAP_PIN_POSITIONS[label]
        if (!pos) return null
        const isHovered = hovered === label
        return (
          <div
            key={label}
            className="absolute cursor-pointer"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", zIndex: isHovered ? 50 : 1 }}
            onMouseEnter={() => setHovered(label)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Dot — same visual size as map dots, white ring distinguishes it */}
            <span
              className="relative block rounded-full transition-all duration-150"
              style={{
                width: isHovered ? 7 : 5,
                height: isHovered ? 7 : 5,
                background: "#18181b",
                boxShadow: "0 0 0 1.5px white",
              }}
            />
            {/* Tooltip on hover */}
            {isHovered && (
              <div
                className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg"
                style={{ zIndex: 50 }}
              >
                {label}
                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Terminal Widget ─────────────────────────────────────────────────────────

const MONO = "ui-monospace, 'Cascadia Code', SFMono-Regular, Menlo, monospace"

// Deploy script output — simulates running ./deploy.sh on Lucid-Lab infra
const TERM_EVENTS = [
  { code: "$ bash ./deploy.sh" },
  { code: "\n▸ Lucid-Lab deploy  workflow: Lead Scoring IA" },
  { code: "\n  target:   n8n.lucid-lab.io" },
  { code: "\n\n⟳ Connecting to production..." },
  { code: "\n✓ Connection established" },
  { code: "\n\n⟳ Running pre-flight checks..." },
  { code: "\n✓ Credentials valid" },
  { code: "\n✓ Webhook endpoint registered" },
  { code: "\n\n⟳ Deploying workflow..." },
  { code: "\n✓ n8n workflow active" },
  { code: "\n✓ OpenAI node configured" },
  { code: "\n✓ CRM integration live" },
  { code: "\n\n▸ Done  4.2s · 3 nodes active" },
]

const CHARS_PER_FRAME = 1.8
const DWELL = 6
const INIT_OFFSET = 8

const TERM_TIMELINE = (() => {
  let cursor = INIT_OFFSET
  return TERM_EVENTS.map((ev) => {
    const start = cursor
    const end = start + Math.ceil(ev.code.length / CHARS_PER_FRAME)
    cursor = end + DWELL
    return { ...ev, start, end }
  })
})()
const TOTAL_FRAMES = TERM_TIMELINE[TERM_TIMELINE.length - 1].end + 50

function highlightCode(line: string): { text: string; color: string }[] {
  const trimmed = line.trimStart()
  if (trimmed.startsWith("✓"))  return [{ text: line, color: "#86efac" }]  // green
  if (trimmed.startsWith("⟳"))  return [{ text: line, color: "#fbbf24" }]  // amber
  if (trimmed.startsWith("▸"))  return [{ text: line, color: "#e4e4e7" }]  // white
  if (trimmed.startsWith("$"))  return [{ text: line, color: "#94a3b8" }]  // slate
  if (trimmed.startsWith("target:") || trimmed.startsWith("workflow:")) {
    const colon = line.indexOf(":")
    return [
      { text: line.slice(0, colon + 1), color: "#71717a" },
      { text: line.slice(colon + 1), color: "#93c5fd" },
    ]
  }
  return [{ text: line, color: "#52525b" }]
}

function TerminalWidget({ active }: { active: boolean }) {
  const [frame, setFrame] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef(0)
  const FPS = 28

  useEffect(() => {
    if (!active) {
      setFrame(0)
      prevScrollHeightRef.current = 0
      return
    }
    startRef.current = null
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const f = Math.floor(((ts - startRef.current) / 1000) * FPS) % TOTAL_FRAMES
      setFrame(f)
      // Scroll only when new content was added — avoids layout reflow every frame
      if (scrollRef.current) {
        const sh = scrollRef.current.scrollHeight
        if (sh !== prevScrollHeightRef.current) {
          scrollRef.current.scrollTop = sh
          prevScrollHeightRef.current = sh
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [active])

  let visible = ""
  for (const t of TERM_TIMELINE) {
    if (frame < t.start) break
    const elapsed = frame - t.start
    const chars = Math.min(t.code.length, Math.floor(elapsed * CHARS_PER_FRAME))
    visible += t.code.slice(0, chars)
  }

  const lines = visible.split("\n")
  const lastLine = lines.length - 1
  const cursorOn = frame < TOTAL_FRAMES - 20 && Math.floor(frame / 14) % 2 === 0

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl" style={{ background: "#0a0a0c" }}>
      {/* Title bar */}
      <div
        className="flex shrink-0 items-center gap-2 border-b px-4"
        style={{ height: 38, borderColor: "rgba(255,255,255,0.07)" }}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57", opacity: 0.7 }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e", opacity: 0.7 }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28c840", opacity: 0.7 }} />
        <span className="ml-3 text-[11px]" style={{ color: "rgba(255,255,255,0.35)", fontFamily: MONO }}>
          deploy.sh
        </span>
      </div>

      {/* Code area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 text-[10px] md:text-[12px]"
        style={{ fontFamily: MONO, lineHeight: 1.7, color: "#e4e4e7", scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {lines.map((line, i) => {
          const tokens = highlightCode(line)
          const isLast = i === lastLine
          return (
            <div key={i} style={{ display: "flex", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              <span style={{ width: 24, color: "rgba(255,255,255,0.18)", userSelect: "none", flexShrink: 0, fontSize: 10 }}>
                {i + 1}
              </span>
              <span>
                {tokens.length === 0
                  ? <span> </span>
                  : tokens.map((t, j) => <span key={j} style={{ color: t.color }}>{t.text}</span>)
                }
                {isLast && cursorOn && (
                  <span
                    style={{ display: "inline-block", width: 7, height: 14, marginLeft: 1, verticalAlign: "text-bottom", background: "#93c5fd" }}
                  />
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Area Chart ─────────────────────────────────────────────────────────────────

const workflowData = [
  { month: "Jan", workflows: 860, automations: 430 },
  { month: "Fév", workflows: 1020, automations: 510 },
  { month: "Mar", workflows: 1340, automations: 670 },
  { month: "Avr", workflows: 1580, automations: 790 },
]

const chartConfig = {
  workflows: {
    label: "Workflows exécutés",
    color: "#18181b",
  },
  automations: {
    label: "Automatisations actives",
    color: "#71717a",
  },
}

function ActivityChart() {
  // Measure container first, then render AreaChart with explicit width/height.
  // This bypasses ResponsiveContainer's internal -1 initial state that triggers a warning.
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setDims({ w: Math.floor(width), h: Math.floor(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full">
      {dims && (
        <AreaChart width={dims.w} height={dims.h} data={workflowData} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="fillWorkflows" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#18181b" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillAutomations" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#71717a" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e5e5e5" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
        <Tooltip
          cursor={false}
          contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e5e5', background: '#fff' }}
          itemStyle={{ color: '#374151' }}
          labelStyle={{ fontWeight: 600, color: '#111' }}
        />
        <Area
          type="monotone"
          dataKey="automations"
          fill="url(#fillAutomations)"
          stroke="#71717a"
          strokeWidth={1.5}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="workflows"
          fill="url(#fillWorkflows)"
          stroke="#18181b"
          strokeWidth={1.5}
          dot={false}
        />
      </AreaChart>
      )}
    </div>
  )
}

// ─── Chat Widget ───────────────────────────────────────────────────────────────

const chatMessages = [
  {
    from: "client",
    text: "On a 200 emails support / semaine et ma Lead Gen LinkedIn tourne au ralenti. Vous prenez les deux ?",
  },
  {
    from: "agent",
    text: "Oui : agent IA pour qualifier/router le support + bot LinkedIn autonome qui scrape, score et engage. Roadmap chiffrée en 30 min.",
  },
  {
    from: "client",
    text: "Et si ça explose en volume comme chez Turismo ?",
  },
  {
    from: "agent",
    text: "On scale sans gonfler la masse salariale. C\u2019est exactement notre Scalability Framework.",
  },
]

function ChatWidget({ active }: { active: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!active) return
    if (visibleCount >= chatMessages.length) return
    // First message shows instantly, subsequent messages with delay
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), visibleCount === 0 ? 0 : 1200)
    return () => clearTimeout(timer)
  }, [visibleCount, active])

  return (
    <div className="flex h-full flex-col justify-end gap-2 px-1 pb-1">
      {chatMessages.slice(0, visibleCount).map((msg, i) => (
        <div
          key={i}
          className={`flex gap-2 items-end transition-all duration-500 ${
            msg.from === "client" ? "flex-row" : "flex-row-reverse"
          }`}
          style={{ opacity: 1, transform: "translateY(0)" }}
        >
          <div
            className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-semibold ${
              msg.from === "client"
                ? "bg-zinc-200 text-zinc-600"
                : "bg-zinc-900 text-white"
            }`}
          >
            {msg.from === "client" ? "C" : "L"}
          </div>
          <div
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
              msg.from === "client"
                ? "bg-zinc-100 text-zinc-700"
                : "bg-zinc-900 text-white"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      {visibleCount < chatMessages.length && (
        <div className="flex items-center gap-1 pl-8">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:300ms]" />
        </div>
      )}
    </div>
  )
}

// ─── Viewport hook ──────────────────────────────────────────────────────────────

function useInView(ref: { current: HTMLElement | null }, threshold = 0.25) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return inView
}

// ─── Counter animation ──────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1400, active = false) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    const raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, active])

  return value
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function FeaturesBento() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, 0.35)
  const [animActive, setAnimActive] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setAnimActive(true), 600)
    return () => clearTimeout(t)
  }, [inView])

  const deployedCount = useCountUp(10, 1400, animActive)
  const satisfactionCount = useCountUp(100, 1800, animActive)

  return (
    <section id="cas-clients" ref={sectionRef} className="w-full border-t border-b border-[#e5e5e5]">
      <div className="mx-auto max-w-[1264px] border-x border-[#e5e5e5] px-6 py-16 md:px-[48px] md:py-[100px]">
        {/* Header */}
        <div className="mb-14">
          <p className="text-sm font-medium text-zinc-400 mb-3">Preuve par l&apos;action</p>
          <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900 leading-[1.1] max-w-2xl md:text-[40px]">
            Turismo, Universal, Périscope · et 10+ autres en production.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-[1.65] text-zinc-500">
            Full Scaling opérationnel, Lead Gen autonome, monitoring data temps réel, micro-business de niche, website &amp; e-commerce. Si un début de process «&#8239;existe&#8239;», on le systématise, on l&apos;automatise et on rend les clefs du succès à vos équipes.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:grid-rows-[340px_160px_320px]">          
          {/* Top-left : Map */}
          <div className="relative h-[250px] overflow-hidden rounded-xl border border-[#e5e5e5] bg-white md:h-auto">
            <div className="absolute inset-0">
              <WorldMap />
            </div>
            {/* Gradient fades — smooth edges on all 4 sides */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-white via-white/80 to-transparent" style={{ zIndex: 5 }} />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-white via-white/70 to-transparent" style={{ zIndex: 5 }} />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[12%] bg-gradient-to-r from-white to-transparent" style={{ zIndex: 5 }} />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[18%] bg-gradient-to-l from-white to-transparent" style={{ zIndex: 5 }} />
            <div className="absolute bottom-3 right-3 md:bottom-5 md:right-5" style={{ zIndex: 10 }}>
              <div className="rounded-full bg-zinc-900/90 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
                Dernier dépl. · Paris 🇫🇷
              </div>
            </div>
            <div className="absolute left-3 top-3 md:left-5 md:top-5" style={{ zIndex: 10 }}>
              <p className="text-sm font-semibold text-zinc-800">Multi-sectoriel · multi-tailles</p>
              <p className="text-xs text-zinc-400 mt-0.5">Startups, PMEs, paquebots industriels & niches</p>
            </div>
          </div>

          {/* Top-right : Chat */}
          <div className="relative min-h-[200px] overflow-hidden rounded-xl border border-[#e5e5e5] bg-zinc-50 flex flex-col md:h-full">
            <div className="px-5 pt-5 pb-3 border-b border-[#e5e5e5]">
              <p className="text-sm font-semibold text-zinc-800">Lucid · votre Strategist en direct</p>
              <p className="text-xs text-zinc-400 mt-0.5">WhatsApp branché, réponse en 2h ouvrées</p>
            </div>
            <div className="flex-1 overflow-hidden px-4 py-3">
              <ChatWidget active={animActive} />
            </div>
          </div>

          {/* Bottom-left : Stat 1 — Systèmes déployés */}
          <div className="flex flex-col justify-between rounded-xl border border-[#e5e5e5] bg-zinc-900 p-6 text-white">
            <div>
              <p className="text-[13px] text-zinc-400 font-medium">Systèmes autonomes en production</p>
            </div>
            <div>
              <p className="text-[48px] font-bold tracking-tight leading-none md:text-[72px]">
                +{deployedCount}
              </p>
              <p className="text-sm text-zinc-400 mt-2">déploiements live · du paquebot industriel à la niche</p>
            </div>
          </div>

          {/* Bottom-right : Stat 2 — Taux de livraison */}
          <div className="flex flex-col justify-between rounded-xl border border-[#e5e5e5] bg-white p-6">
            <div>
              <p className="text-[13px] text-zinc-500 font-medium">Roadmap → Production</p>
            </div>
            <div>
              <p className="text-[48px] font-bold tracking-tight leading-none text-zinc-900 md:text-[72px]">
                {satisfactionCount}%
              </p>
              <p className="text-sm text-zinc-400 mt-2">des Roadmaps d&apos;Exécution livrées en production dans les délais</p>
            </div>
          </div>

          {/* Bottom-left: Activity chart (blanc) */}
          <div className="h-[300px] rounded-xl border border-[#e5e5e5] bg-white p-6 flex flex-col md:h-full">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-800">Volume traité par les agents IA</p>
                <p className="text-xs text-zinc-400 mt-0.5">Exécutions mensuelles · cas Turismo, Universal & autres</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-zinc-900" />
                  Workflows
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-zinc-400" />
                  Automations
                </span>
              </div>
            </div>
            <div className="flex-1" style={{ minHeight: 80 }}>
              <ActivityChart />
            </div>
          </div>

          {/* Bottom-right: Code Terminal (noir) */}
          <div className="h-[320px] overflow-hidden rounded-xl border border-[#e5e5e5] md:h-auto">
            <TerminalWidget active={animActive} />
          </div>
        </div>
      </div>
    </section>
  )
}
