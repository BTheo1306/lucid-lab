#!/usr/bin/env node
/**
 * Enregistre la démo « Une journée à l'atelier » en mode automatique.
 *
 *   npm run build && npm run start        (terminal 1, port 3000)
 *   npm run demo:record -- --frames       (terminal 2)
 *
 * Options : --url <base> (défaut http://localhost:3000), --out <dossier> (défaut recordings),
 *           --keep-webm, --no-transcode, --frames (une image toutes les 5 s pour relecture).
 * Prérequis : cd tools/demo-recorder && npm install && npx playwright-core install chromium ;
 *             ffmpeg (variable FFMPEG, défaut /opt/homebrew/bin/ffmpeg).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

function parseArgs(argv) {
  const out = { keepWebm: false, transcode: true, frames: false }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--url') out.url = argv[++i]
    else if (a === '--out') out.out = argv[++i]
    else if (a === '--path') out.path = argv[++i]
    else if (a === '--name') out.name = argv[++i]
    else if (a === '--keep-webm') out.keepWebm = true
    else if (a === '--no-transcode') out.transcode = false
    else if (a === '--frames') out.frames = true
    else if (a === '--help' || a === '-h') {
      console.log('Usage : node record.mjs [--url http://localhost:3000] [--out recordings] [--keep-webm] [--no-transcode] [--frames]')
      process.exit(0)
    }
  }
  return out
}

const args = parseArgs(process.argv.slice(2))
const PAGE_PATH = args.path ?? '/demo/atelier'
const NAME = args.name ?? 'demo-atelier'
const BASE = (args.url ?? process.env.DEMO_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const OUT_DIR = path.resolve(ROOT, args.out ?? 'recordings')
const FFMPEG = process.env.FFMPEG ?? '/opt/homebrew/bin/ffmpeg'
const PAGE_URL = `${BASE}${PAGE_PATH}?autoplay=1&record=1`
const WIDTH = 1920
const HEIGHT = 1080

async function healthCheck() {
  let status = 0
  try {
    const res = await fetch(PAGE_URL, { redirect: 'manual' })
    status = res.status
  } catch {
    status = 0
  }
  if (status !== 200) {
    console.error(`La page ${PAGE_URL} répond ${status || 'rien'}. Lancez d'abord : npm run build && npm run start`)
    process.exit(1)
  }
}

function run(cmd, cmdArgs) {
  return execFileSync(cmd, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] }).toString()
}

async function main() {
  await healthCheck()
  mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    reducedMotion: 'no-preference',
    recordVideo: { dir: OUT_DIR, size: { width: WIDTH, height: HEIGHT } },
  })
  const page = await context.newPage()
  let pageErrors = 0
  page.on('pageerror', (err) => {
    pageErrors += 1
    console.error('Erreur de page :', err.message)
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('Console :', msg.text())
  })

  const t0 = Date.now()
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.documentElement.dataset.demoState === 'playing', null, { timeout: 30_000 })
  const leadIn = (Date.now() - t0) / 1000
  console.log(`Lecture démarrée après ${leadIn.toFixed(2)} s`)
  await page.waitForFunction(() => document.documentElement.dataset.demoState === 'finished', null, { timeout: 600_000, polling: 250 })
  const played = (Date.now() - t0) / 1000 - leadIn
  console.log(`Démo terminée : ${played.toFixed(1)} s de lecture`)
  await page.waitForTimeout(1500)

  const video = page.video()
  await context.close()
  await browser.close()
  if (!video) {
    console.error('Aucune vidéo produite')
    process.exit(1)
  }
  const rawPath = await video.path()
  const webmPath = path.join(OUT_DIR, `${NAME}.webm`)
  if (existsSync(webmPath)) rmSync(webmPath)
  renameSync(rawPath, webmPath)
  console.log(`WebM : ${webmPath}`)

  if (pageErrors > 0) {
    console.error(`${pageErrors} erreur(s) de page pendant l'enregistrement`)
    process.exitCode = 1
  }

  if (!args.transcode) return

  if (!existsSync(FFMPEG)) {
    console.error(`ffmpeg introuvable (${FFMPEG}). Le WebM est conservé.`)
    process.exit(1)
  }
  const mp4Path = path.join(OUT_DIR, `${NAME}.mp4`)
  const trim = Math.max(0, leadIn - 0.3).toFixed(2)
  run(FFMPEG, [
    '-y',
    '-ss', trim,
    '-i', webmPath,
    '-vf', `fps=30,scale=${WIDTH}:${HEIGHT}:flags=lanczos,format=yuv420p`,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-movflags', '+faststart',
    '-an',
    mp4Path,
  ])
  console.log(`MP4 : ${mp4Path}`)

  const ffprobe = path.join(path.dirname(FFMPEG), 'ffprobe')
  if (existsSync(ffprobe)) {
    const info = run(ffprobe, ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,width,height,r_frame_rate,pix_fmt', '-of', 'default=noprint_wrappers=1', mp4Path])
    console.log(info.trim())
  }

  if (args.frames) {
    const framesDir = path.join(OUT_DIR, 'frames')
    rmSync(framesDir, { recursive: true, force: true })
    mkdirSync(framesDir, { recursive: true })
    run(FFMPEG, ['-y', '-i', mp4Path, '-vf', 'fps=1/5', path.join(framesDir, 'frame-%03d.png')])
    console.log(`Images : ${framesDir}`)
  }

  if (!args.keepWebm) rmSync(webmPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
