#!/usr/bin/env node
/**
 * Contrôle du vocabulaire de la démo /demo/atelier : aucun tiret long, aucun
 * nom réel du client de référence, aucune expression bannie, aucun emoji.
 * Sortie 1 dès qu'une ligne fautive existe.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TARGETS = ['src/app/demo', 'src/components/demo', 'src/lib/demo', 'tools/demo-recorder']

// Expressions interdites, construites sans les écrire en clair dans ce fichier.
const banned = [
  { label: 'tiret long', regex: /[—–]/ },
  { label: 'expression bannie', regex: new RegExp(['feuille', 'de', 'route'].join(' '), 'i') },
  { label: 'nom réel', regex: new RegExp(['BSP', '37'].join('')) },
  { label: 'nom réel', regex: new RegExp(['Soph', 'ia'].join('')) },
  { label: 'nom réel', regex: new RegExp(['Kan', 'ouni'].join('')) },
  { label: 'nom réel', regex: new RegExp(['Ana', 'ïs'].join('')) },
  { label: 'nom réel', regex: new RegExp(['Flor', 'ent'].join('')) },
  { label: 'nom réel', regex: new RegExp(['Lém', 'eré'].join('')) },
  { label: 'nom réel', regex: new RegExp(['Prol', 'ians'].join('')) },
  { label: 'outil à ne pas nommer', regex: new RegExp(['Higgs', 'field'].join('')) },
  { label: 'expression bannie', regex: new RegExp(['nos', 'experts'].join(' '), 'i') },
  { label: 'emoji', regex: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u },
]

function walk(p, acc) {
  const st = statSync(p)
  if (st.isDirectory()) {
    if (path.basename(p) === 'node_modules') return acc
    for (const child of readdirSync(p)) walk(path.join(p, child), acc)
  } else if (/\.(ts|tsx|mjs|css|json)$/.test(p) && !p.endsWith('package-lock.json')) {
    acc.push(p)
  }
  return acc
}

const files = TARGETS.flatMap((t) => walk(path.join(ROOT, t), []))
const hits = []
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const rule of banned) {
      if (rule.regex.test(line)) hits.push(`${path.relative(ROOT, file)}:${i + 1}  [${rule.label}]  ${line.trim().slice(0, 120)}`)
    }
  })
}

if (hits.length > 0) {
  console.error(`${hits.length} ligne(s) à corriger :`)
  for (const h of hits) console.error('  ' + h)
  process.exit(1)
}
console.log(`OK : ${files.length} fichiers contrôlés, aucune chaîne interdite.`)
