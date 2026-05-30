/**
 * process-banners.mjs
 * Resize the 10 LinkedIn banners from Downloads to 1128×191 (official LinkedIn Company Page format)
 * Saves to lucid-lab-brand/05-digital/banner-01.png … banner-10.png
 * Removes old banner-v12 and banner-v13 files.
 * Run: node scripts/process-banners.mjs
 */

import sharp from '/tmp/lucid-brand-tools/node_modules/sharp/lib/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC_DIR = '/Users/theobenard/Downloads/dossier sans titre';
const OUT_DIR = path.join(ROOT, 'lucid-lab-brand/05-digital');

const BANNERS = [
  { src: 'ChatGPT Image 30 mai 2026, 13_40_24 (1).png',  out: 'banner-01.png', label: 'Bannière 1 — Particles horizontal' },
  { src: 'ChatGPT Image 30 mai 2026, 13_40_24 (2).png',  out: 'banner-02.png', label: 'Bannière 2 — Texte centré' },
  { src: 'ChatGPT Image 30 mai 2026, 13_40_25 (3).png',  out: 'banner-03.png', label: 'Bannière 3 — Grid noir' },
  { src: 'ChatGPT Image 30 mai 2026, 13_40_25 (4).png',  out: 'banner-04.png', label: 'Bannière 4 — Waves dorées' },
  { src: 'ChatGPT Image 30 mai 2026, 13_40_26 (5).png',  out: 'banner-05.png', label: 'Bannière 5 — Logo droite' },
  { src: 'ChatGPT Image 30 mai 2026, 13_40_26 (6).png',  out: 'banner-06.png', label: 'Bannière 6 — Circuit board' },
  { src: 'ChatGPT Image 30 mai 2026, 13_40_27 (7).png',  out: 'banner-07.png', label: 'Bannière 7 — Abstract dark' },
  { src: 'ChatGPT Image 30 mai 2026, 13_40_27 (8).png',  out: 'banner-08.png', label: 'Bannière 8 — Neon accent' },
  { src: 'ChatGPT Image 30 mai 2026, 13_40_28 (9).png',  out: 'banner-09.png', label: 'Bannière 9 — Minimal type' },
  { src: 'ChatGPT Image 30 mai 2026, 13_40_28 (10).png', out: 'banner-10.png', label: 'Bannière 10 — Full brand' },
];

// Labels file for the brandbook to use
const LABELS_OUT = path.join(OUT_DIR, 'banner-labels.json');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Remove old banners
  for (const old of ['banner-v12-perfect.png', 'banner-v13-company.png']) {
    const p = path.join(OUT_DIR, old);
    if (fs.existsSync(p)) {
      fs.rmSync(p);
      console.log(`  🗑  Deleted ${old}`);
    }
  }

  const labels = {};
  for (const banner of BANNERS) {
    const srcPath = path.join(SRC_DIR, banner.src);
    const outPath = path.join(OUT_DIR, banner.out);

    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠  Not found: ${banner.src}`);
      continue;
    }

    // Resize to 1128×191 — LinkedIn Company Page banner exact spec
    // Source is 3072×512 (~6:1 ratio) → 1128×191 (~5.9:1) — cover-center
    await sharp(srcPath)
      .resize(1128, 191, { fit: 'cover', position: 'center' })
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    labels[banner.out] = banner.label;
    const size = (fs.statSync(outPath).size / 1024).toFixed(0);
    console.log(`  ✓  ${banner.out}  (${size} Ko) — ${banner.label}`);
  }

  fs.writeFileSync(LABELS_OUT, JSON.stringify(labels, null, 2));
  console.log(`\n✅ ${BANNERS.length} bannières traitées → ${OUT_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
