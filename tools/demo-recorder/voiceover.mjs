#!/usr/bin/env node
/**
 * Mixe la voix off (une prise par scène) sur la vidéo enregistrée de la démo.
 *
 *   npm run demo:voice
 *   node tools/demo-recorder/voiceover.mjs --video recordings/demo-atelier.mp4 --takes recordings/voice/andre --out recordings/demo-atelier-voix.mp4
 *
 * Lit tools/demo-recorder/narration.json (une entrée par scène : speechStart en secondes dans la vidéo)
 * et place chaque prise takeNN.wav à son offset. La vidéo est copiée telle quelle, l'audio est encodé en AAC.
 * Les prises se génèrent avec l'outil de synthèse vocale (voir narration.json) puis se mesurent avec
 * recordings/voice/measure.sh ; une prise trop longue se réécrit, elle ne s'accélère jamais.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', '..')
const FFMPEG = process.env.FFMPEG ?? '/opt/homebrew/bin/ffmpeg'
const FFPROBE = path.join(path.dirname(FFMPEG), 'ffprobe')

function parseArgs(argv) {
  const out = { gainDb: 0 }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--video') out.video = argv[++i]
    else if (a === '--takes') out.takes = argv[++i]
    else if (a === '--out') out.out = argv[++i]
    else if (a === '--gain') out.gainDb = Number.parseFloat(argv[++i])
    else if (a === '--manifest') out.manifest = argv[++i]
    else if (a === '--help' || a === '-h') {
      console.log('Usage : node voiceover.mjs [--video <mp4>] [--takes <dossier des takeNN.wav>] [--out <mp4>] [--gain <dB>]')
      process.exit(0)
    }
  }
  return out
}

const args = parseArgs(process.argv.slice(2))
const manifest = JSON.parse(readFileSync(path.resolve(ROOT, args.manifest ?? 'tools/demo-recorder/narration.json'), 'utf8'))
const videoPath = path.resolve(ROOT, args.video ?? 'recordings/demo-atelier.mp4')
const takesDir = path.resolve(ROOT, args.takes ?? manifest.takesDir ?? 'recordings/voice')
const outPath = path.resolve(ROOT, args.out ?? 'recordings/demo-atelier-voix.mp4')

if (!existsSync(FFMPEG)) {
  console.error(`ffmpeg introuvable (${FFMPEG})`)
  process.exit(1)
}
if (!existsSync(videoPath)) {
  console.error(`Vidéo introuvable : ${videoPath}. Lancez d'abord npm run demo:record`)
  process.exit(1)
}

const takes = [...manifest.takes]
  .sort((a, b) => a.index - b.index)
  .map((t) => ({ ...t, file: path.join(takesDir, `take${String(t.index).padStart(2, '0')}.wav`) }))
const missing = takes.filter((t) => !existsSync(t.file))
if (missing.length > 0) {
  console.error('Prises manquantes : ' + missing.map((t) => t.file).join(', '))
  process.exit(1)
}

const videoDuration = Number.parseFloat(
  execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', videoPath]).toString().trim(),
)

const filters = takes.map((t, i) => {
  const ms = Math.round(t.speechStart * 1000)
  return `[${i + 1}:a]aresample=48000,adelay=${ms}|${ms}[v${i}]`
})
const mixInputs = takes.map((_, i) => `[v${i}]`).join('')
filters.push(`${mixInputs}amix=inputs=${takes.length}:normalize=0:duration=longest[mix]`)
filters.push(`[mix]apad,atrim=0:${videoDuration.toFixed(3)},volume=${args.gainDb}dB,aformat=channel_layouts=stereo[aout]`)

const ffArgs = ['-y', '-i', videoPath]
for (const t of takes) ffArgs.push('-i', t.file)
ffArgs.push('-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', outPath)
execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', ...ffArgs], { stdio: 'inherit' })

console.log(`Voix off mixée : ${outPath}`)
for (const t of takes) {
  const end = t.speechStart + (t.measuredSpeech ?? 0)
  console.log(`  scène ${t.index} (${t.scene}) : voix de ${t.speechStart.toFixed(1)} s à ${end.toFixed(1)} s, fenêtre max ${(t.speechStart + t.maxSpeech).toFixed(1)} s`)
}
const info = execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,channels,sample_rate', '-of', 'default=noprint_wrappers=1', outPath]).toString()
console.log(info.trim())
