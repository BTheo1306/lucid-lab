/**
 * gen-logos.mjs
 * Generates all Lucid-Lab logo PNGs from the source public/logo.png
 * Run: node scripts/gen-logos.mjs
 */

import sharp from '/tmp/lucid-brand-tools/node_modules/sharp/lib/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'public/logo.png');
const OUT = path.join(ROOT, 'lucid-lab-brand/01-logo/png');
fs.mkdirSync(OUT, { recursive: true });

const SIZES = [1024, 512, 400, 256, 192, 96, 64, 32];
const PADDING_RATIO = 0.12; // 12% each side

async function makeLogoVariant(size, dark) {
  const padding = Math.round(size * PADDING_RATIO);
  const inner = size - padding * 2;

  // Resize source logo to inner size (contain, transparent background)
  const resized = await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  if (dark) {
    // White L on black background
    // Step 1: negate the alpha-transparent logo to get white mark
    const whiteMark = await sharp(resized)
      .negate({ alpha: false })
      .png()
      .toBuffer();

    // Step 2: composite on black background
    const result = await sharp({
      create: { width: size, height: size, channels: 3, background: { r: 10, g: 10, b: 10 } }
    })
      .composite([{ input: whiteMark, top: padding, left: padding }])
      .png({ compressionLevel: 9 })
      .toBuffer();

    return result;
  } else {
    // Black L on white background
    const result = await sharp({
      create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } }
    })
      .composite([{ input: resized, top: padding, left: padding }])
      .png({ compressionLevel: 9 })
      .toBuffer();

    return result;
  }
}

async function main() {
  console.log('Generating logos from:', SRC);
  for (const size of SIZES) {
    for (const dark of [true, false]) {
      const variant = dark ? 'white-on-black' : 'black-on-white';
      const filename = `logo-${size}x${size}-${variant}.png`;
      const outPath = path.join(OUT, filename);
      const buf = await makeLogoVariant(size, dark);
      fs.writeFileSync(outPath, buf);
      console.log(`  ✓ ${filename} (${(buf.length / 1024).toFixed(1)} Ko)`);
    }
  }

  // Copy 400px versions to public/logos/ for web serving
  const publicLogos = path.join(ROOT, 'public/logos');
  fs.mkdirSync(publicLogos, { recursive: true });
  fs.copyFileSync(
    path.join(OUT, 'logo-400x400-white-on-black.png'),
    path.join(publicLogos, 'avatar-dark.png')
  );
  fs.copyFileSync(
    path.join(OUT, 'logo-400x400-black-on-white.png'),
    path.join(publicLogos, 'avatar-light.png')
  );
  console.log('  ✓ avatar-dark.png → public/logos/');
  console.log('  ✓ avatar-light.png → public/logos/');
  console.log(`\n✅ ${SIZES.length * 2 + 2} fichiers générés dans ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
