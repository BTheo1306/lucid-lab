import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const toolsPackage = process.env.LUCID_BRAND_TOOLS_PACKAGE ?? '/tmp/lucid-brand-tools/package.json';
try {
  await fs.access(toolsPackage);
} catch {
  console.error(`Missing brand generation tools at ${toolsPackage}`);
  console.error('Install them with: npm install --prefix /tmp/lucid-brand-tools sharp potrace png-to-ico pdfkit');
  process.exit(1);
}
const toolsRequire = createRequire(toolsPackage);
const sharp = toolsRequire('sharp');
const potrace = toolsRequire('potrace');
const pngToIcoModule = toolsRequire('png-to-ico');
const pngToIco = pngToIcoModule.default ?? pngToIcoModule;
const PDFDocument = toolsRequire('pdfkit');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'lucid-lab-brand');
const DATE = '2026-05-27';
const SOURCE_LOGO = path.join(ROOT, 'public/logo.png');
const ROBOT_POSTER = path.join(ROOT, 'public/robot-poster-new.png');
const ROBOT_LIT = path.join(ROOT, 'public/robot-poster-lit.png');
const ROBOT_HEAD = path.join(ROOT, 'public/robot-head.png');

const colors = [
  { name: 'Noir absolu', token: 'black', hex: '#0A0A0A', pantone: 'Black 6 C approx.', usage: 'Fonds sombres, texte primaire, logo noir' },
  { name: 'Papier chaud', token: 'white', hex: '#F7F5F1', pantone: 'Warm Gray 1 C approx.', usage: 'Fond principal du site, surfaces éditoriales' },
  { name: 'Blanc pur', token: 'paper', hex: '#FFFFFF', pantone: 'Cool Gray 1 C approx.', usage: 'Cartes, exports, espaces à contraste maximal' },
  { name: 'Gris anthracite', token: 'anthracite', hex: '#1C1C1C', pantone: 'Neutral Black C approx.', usage: 'Surfaces sombres, cartes premium' },
  { name: 'Gris graphite', token: 'gray', hex: '#525252', pantone: 'Cool Gray 11 C approx.', usage: 'Texte secondaire, légendes' },
  { name: 'Gris clair', token: 'light-gray', hex: '#E5E5E5', pantone: 'Cool Gray 2 C approx.', usage: 'Filets, séparateurs, fonds neutres' },
  { name: 'Bleu Lex', token: 'accent-cold', hex: '#B4D8FF', pantone: '290 C approx.', usage: 'Lueur robot, fonds très subtils, jamais en aplat dominant' },
  { name: 'Ember', token: 'accent-warm', hex: '#C85E1A', pantone: '1675 C approx.', usage: 'Accent primaire, liens, filets, points de décision' },
  { name: 'Vert système', token: 'success', hex: '#3F7D5B', pantone: '5545 C approx.', usage: 'Succès, validation, état positif' },
  { name: 'Ambre signal', token: 'warning', hex: '#FFB451', pantone: '1365 C approx.', usage: 'Warning, attention, accent rare du hero' },
  { name: 'Rouge incident', token: 'error', hex: '#B94A48', pantone: '7608 C approx.', usage: 'Erreur, incident, risque bloquant' },
];

const fonts = {
  primary: 'Syne',
  secondary: 'Figtree',
};

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const n = Number.parseInt(value, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToCmyk({ r, g, b }) {
  const c = 1 - r / 255;
  const m = 1 - g / 255;
  const y = 1 - b / 255;
  const k = Math.min(c, m, y);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((c - k) / (1 - k)) * 100),
    m: Math.round(((m - k) / (1 - k)) * 100),
    y: Math.round(((y - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function colorMeta(color) {
  const rgb = hexToRgb(color.hex);
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);
  return {
    ...color,
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    cmyk: `cmyk(${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k})`,
  };
}

const palette = colors.map(colorMeta);
const byToken = Object.fromEntries(palette.map((color) => [color.token, color]));

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

async function optimizedImageDataUri(filePath, { width, format = 'png', quality = 88 }) {
  const pipeline = sharp(filePath).resize({ width, withoutEnlargement: true });
  const buffer = format === 'jpeg'
    ? await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer()
    : await pipeline.png({ quality, compressionLevel: 9 }).toBuffer();
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

async function loadVisualAssets() {
  return {
    robotPoster: await optimizedImageDataUri(ROBOT_POSTER, { width: 860, format: 'jpeg' }),
    robotLit: await optimizedImageDataUri(ROBOT_LIT, { width: 720, format: 'jpeg' }),
    robotHead: await optimizedImageDataUri(ROBOT_HEAD, { width: 1100, format: 'jpeg' }),
  };
}

async function ensureDirs() {
  const dirs = [
    '00-overview',
    '01-logo/svg',
    '01-logo/png',
    '02-couleurs',
    '03-typographie',
    '04-elements',
    '05-digital/favicon',
    '05-digital/favicon-set',
    '06-print',
    '07-design-system',
    '08-moodboard',
  ];
  await Promise.all(dirs.map((dir) => fs.mkdir(path.join(OUT, dir), { recursive: true })));
}

function traceLogo() {
  return new Promise((resolve, reject) => {
    potrace.trace(SOURCE_LOGO, {
      threshold: 180,
      turdSize: 20,
      optCurve: true,
      optTolerance: 0.18,
      color: byToken.black.hex,
      background: 'transparent',
    }, (err, svg) => {
      if (err) reject(err);
      const match = svg.match(/<path d="([^"]+)"/);
      if (!match) reject(new Error('Could not extract traced logo path'));
      resolve(match[1]);
    });
  });
}

function svgShell({ width, height, content, title, desc, bg = 'transparent', defs = '' }) {
  const bgRect = bg === 'transparent' ? '' : `<rect width="${width}" height="${height}" fill="${bg}"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(desc)}</desc>
  ${defs}
  ${bgRect}
  ${content}
</svg>
`;
}

function markPath(d, x, y, size, fill = byToken.black.hex, opacity = 1) {
  const scale = size / 600;
  const tx = x - 300 * scale;
  const ty = y - 280 * scale;
  return `<g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(6)})" opacity="${opacity}"><path d="${d}" fill="${fill}"/></g>`;
}

function wordmark(x, y, fill = byToken.black.hex, size = 56, anchor = 'start', tracking = 6) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${fonts.primary}, Arial, sans-serif" font-size="${size}" font-weight="700" letter-spacing="${tracking}" text-anchor="${anchor}">LUCID-LAB</text>`;
}

function tagline() {
  return '';
}

function logoSvgs(d) {
  const compact = svgShell({
    width: 512, height: 512, title: 'LUCID-LAB compact logo', desc: '',
    content: markPath(d, 256, 256, 360),
  });

  const principal = svgShell({
    width: 800, height: 560, title: 'LUCID-LAB principal logo', desc: '',
    content: [
      markPath(d, 385, 230, 220), // Optically shifted left by 15px
      wordmark(400, 410, byToken.black.hex, 64, 'middle', 8)
    ].join('\n'),
  });

  const horizontal = svgShell({
    width: 900, height: 260, title: 'LUCID-LAB horizontal logo', desc: '',
    content: [
      markPath(d, 200, 130, 160),
      wordmark(310, 150, byToken.black.hex, 56, 'start', 8) // Moved much closer to counteract L shape empty space
    ].join('\n'),
  });

  const vertical = svgShell({
    width: 600, height: 600, title: 'LUCID-LAB vertical logo', desc: '',
    content: [
      markPath(d, 285, 250, 260),
      wordmark(300, 460, byToken.black.hex, 68, 'middle', 8)
    ].join('\n'),
  });

  const wordmarkOnly = svgShell({
    width: 800, height: 200, title: 'LUCID-LAB wordmark', desc: '',
    content: wordmark(400, 120, byToken.black.hex, 80, 'middle', 10),
  });

  const negativeWhite = svgShell({
    width: 900, height: 260, title: '', desc: '',
    content: [
      markPath(d, 200, 130, 160, byToken.white.hex),
      wordmark(310, 150, byToken.white.hex, 56, 'start', 8)
    ].join('\n'),
  });

  const negativeBlack = svgShell({
    width: 900, height: 260, title: '', desc: '',
    content: [
      markPath(d, 200, 130, 160, byToken.black.hex),
      wordmark(310, 150, byToken.black.hex, 56, 'start', 8)
    ].join('\n'),
  });

  const gray = svgShell({
    width: 900, height: 260, title: '', desc: '',
    content: [
      markPath(d, 200, 130, 160, byToken.gray.hex),
      wordmark(310, 150, byToken.gray.hex, 56, 'start', 8)
    ].join('\n'),
  });

  const favicon = svgShell({ width: 512, height: 512, title: '', desc: '', content: markPath(d, 256, 256, 380) });

  const watermark = svgShell({
    width: 900, height: 260, title: '', desc: '',
    content: [
      markPath(d, 200, 130, 160, byToken.black.hex, 0.12),
      wordmark(310, 150, byToken.black.hex, 56, 'start', 8).replace('<text ', '<text opacity="0.12" ')
    ].join('\n'),
  });

  return {
    'logo-compact.svg': compact,
    'logo-principal.svg': principal,
    'logo-horizontal.svg': horizontal,
    'logo-vertical.svg': vertical,
    'logo-wordmark.svg': wordmarkOnly,
    'logo-negative-white.svg': negativeWhite,
    'logo-negative-black.svg': negativeBlack,
    'logo-gray.svg': gray,
    'logo-favicon.svg': favicon,
    'logo-watermark.svg': watermark,
  };
}

async function renderLogoPngs(files) {
  for (const [name, svg] of Object.entries(files)) {
    const base = name.replace('.svg', '');
    const dims = svg.match(/width="(\d+)" height="(\d+)"/);
    const width = Number(dims[1]);
    const height = Number(dims[2]);
    const transparent = await sharp(Buffer.from(svg)).resize(width * 2, height * 2).png().toBuffer();
    await fs.writeFile(path.join(OUT, '01-logo/png', `${base}-transparent.png`), transparent);
    for (const [suffix, bg] of [['fond-blanc', '#FFFFFF'], ['fond-noir', '#000000']]) {
      const composed = await sharp({
        create: {
          width: width * 2,
          height: height * 2,
          channels: 4,
          background: bg,
        },
      }).composite([{ input: transparent, top: 0, left: 0 }]).png().toBuffer();
      await fs.writeFile(path.join(OUT, '01-logo/png', `${base}-${suffix}.png`), composed);
    }
  }
}

function colorCard(color, x, y, w, h) {
  const textFill = color.token === 'black' || color.token === 'anthracite' || color.token === 'accent-cold' ? byToken.white.hex : byToken.black.hex;
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color.hex}"/>
    <text x="${x + 24}" y="${y + 42}" fill="${textFill}" font-family="${fonts.primary}, Arial" font-size="22" font-weight="600">${esc(color.name)}</text>
    <text x="${x + 24}" y="${y + 78}" fill="${textFill}" font-family="${fonts.secondary}, Arial" font-size="15">${color.hex}</text>
    <text x="${x + 24}" y="${y + 106}" fill="${textFill}" opacity="0.82" font-family="${fonts.secondary}, Arial" font-size="13">${color.rgb}</text>
    <text x="${x + 24}" y="${y + 132}" fill="${textFill}" opacity="0.82" font-family="${fonts.secondary}, Arial" font-size="13">${color.hsl}</text>
    <text x="${x + 24}" y="${y + 158}" fill="${textFill}" opacity="0.82" font-family="${fonts.secondary}, Arial" font-size="13">${color.cmyk}</text>
  </g>`;
}

function swatchboardSvg() {
  const cards = palette.map((color, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    return colorCard(color, 60 + col * 216, 190 + row * 230, 196, 190);
  }).join('\n');
  return svgShell({
    width: 1584,
    height: 396,
    title: "LUCID-LAB swatchboard",
    desc: "Overview of the brand identity.",
    bg: byToken.black.hex,
    content: ""
  });
}




function companyBannerSvg(d) {
  const bg = byToken.black.hex;
  const line = byToken['accent-warm'].hex; // Ember
  
  return svgShell({
    width: 1128,
    height: 191,
    title: 'LUCID-LAB LinkedIn Company Banner',
    desc: 'Perfectly sized 1128x191 banner with architecture workflow',
    bg: bg,
    content: `
      <!-- Fine background grid for tech feel -->
      <pattern id="grid1128" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1A1A1A" stroke-width="0.5"/>
      </pattern>
      <rect width="1128" height="191" fill="url(#grid1128)" />

      <!-- Left Text (safely positioned away from bottom-left avatar overlay) -->
      <text x="230" y="85" fill="#FFFFFF" font-family="'Syne', 'SF Pro Display', Arial" font-size="34" font-weight="800" letter-spacing="-0.5">Fini les démos.</text>
      <text x="230" y="130" fill="${line}" font-family="'Syne', 'SF Pro Display', Arial" font-size="34" font-weight="800" letter-spacing="-0.5">L'IA en production.</text>

      <!-- Right Side: Value Add Workflow -->
      <g transform="translate(680, 75)">
        <!-- Connection lines -->
        <path d="M 90 20 L 130 20 L 130 -5 L 170 -5" fill="none" stroke="#333" stroke-width="2"/>
        <path d="M 90 20 L 130 20 L 130 45 L 170 45" fill="none" stroke="#333" stroke-width="2"/>
        
        <path d="M 270 -5 L 310 -5 L 310 20 L 350 20" fill="none" stroke="${line}" stroke-width="2" stroke-dasharray="3 3"/>
        <path d="M 270 45 L 310 45 L 310 20 L 350 20" fill="none" stroke="${line}" stroke-width="2" stroke-dasharray="3 3"/>

        <!-- Box 1: Sources -->
        <rect x="0" y="4" width="90" height="32" rx="4" fill="#111" stroke="#333" stroke-width="1"/>
        <text x="45" y="24" fill="#999" font-family="'Figtree', Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle">Data Sources</text>

        <!-- Box 2.1: LLM -->
        <rect x="170" y="-21" width="100" height="32" rx="4" fill="#111" stroke="#444" stroke-width="1"/>
        <text x="220" y="-1" fill="#FFF" font-family="'Figtree', Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle">Agent LLM</text>

        <!-- Box 2.2: RAG -->
        <rect x="170" y="29" width="100" height="32" rx="4" fill="#111" stroke="#444" stroke-width="1"/>
        <text x="220" y="49" fill="#FFF" font-family="'Figtree', Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle">Workflows n8n</text>

        <!-- Box 3: ROI -->
        <rect x="350" y="4" width="100" height="32" rx="4" fill="#2A1408" stroke="${line}" stroke-width="1"/>
        <text x="400" y="24" fill="${line}" font-family="'Figtree', Arial, sans-serif" font-size="12" font-weight="700" text-anchor="middle">Opérations</text>
      </g>
    `
  });
}

function avatarSvgDark(d) { return svgShell({ width: 400, height: 400, title: '', desc: '', bg: byToken.black.hex, content: markPath(d, 110, 110, 180, byToken.white.hex) }); }
function avatarSvgEmber(d) { return svgShell({ width: 400, height: 400, title: '', desc: '', bg: byToken.black.hex, content: markPath(d, 58, 58, 284, byToken['accent-warm'].hex) }); }
function avatarSvgLight(d) { return svgShell({ width: 400, height: 400, title: '', desc: '', bg: byToken.white.hex, content: markPath(d, 110, 110, 180, byToken.black.hex) }); }
function avatarSvg(d) {
  return svgShell({
    width: 400,
    height: 400,
    title: 'LUCID-LAB LinkedIn avatar',
    desc: 'Square avatar with compact logo.',
    bg: byToken.black.hex,
    content: markPath(d, 58, 58, 284, byToken.white.hex),
  });
}

function ogSvg(d, type = 'og', assets = {}) {
  const height = type === 'twitter' ? 628 : 630;
  return svgShell({
    width: 1200,
    height,
    title: `LUCID-LAB ${type === 'twitter' ? 'Twitter card' : 'Open Graph image'}`,
    desc: 'Social sharing image.',
    bg: byToken.white.hex,
    content: `
      <rect x="44" y="44" width="1112" height="${height - 88}" fill="none" stroke="${byToken['light-gray'].hex}" stroke-width="1"/>
      <rect x="760" y="44" width="396" height="${height - 88}" fill="${byToken['accent-cold'].hex}" opacity="0.22"/>
      <clipPath id="og-lex-crop"><rect x="760" y="44" width="396" height="${height - 88}"/></clipPath>
      ${assets.robotHead ? `<image href="${assets.robotHead}" x="690" y="-142" width="548" height="564" preserveAspectRatio="xMidYMid slice" clip-path="url(#og-lex-crop)"/>` : markPath(d, 830, 72, 250, byToken.black.hex, 0.12)}
      ${markPath(d, 106, 116, 106, byToken.black.hex)}
      <text x="180" y="136" fill="${byToken.black.hex}" font-family="${fonts.primary}, Arial" font-size="56" font-weight="800" letter-spacing="2">LUCID-LAB</text>
      <rect x="86" y="218" width="92" height="4" fill="${byToken['accent-warm'].hex}"/>
      <text x="84" y="324" fill="${byToken.black.hex}" font-family="${fonts.primary}, Arial" font-size="68" font-weight="800">Vos systèmes IA,</text>
      <text x="84" y="392" fill="${byToken.black.hex}" font-family="${fonts.primary}, Arial" font-size="68" font-weight="800">construits.</text>
      <text x="88" y="462" fill="${byToken.gray.hex}" font-family="${fonts.secondary}, Arial" font-size="26">Agents, outils internes, automatisations, monitoring.</text>
      <path d="M88 ${height - 104}H520L580 ${height - 164}H722" stroke="${byToken['light-gray'].hex}" stroke-width="1.4" fill="none"/>
    `,
  });
}

function loadingSvg(d) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img">
  <title>LUCID-LAB loading screen</title>
  <style>
    @keyframes pulse { 0%, 100% { opacity: .18; transform: scale(.94); } 50% { opacity: 1; transform: scale(1); } }
    @keyframes scan { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }
    .mark { transform-origin: 400px 400px; animation: pulse 1.8s ease-in-out infinite; }
    .scan { stroke-dasharray: 120 480; animation: scan 2.2s linear infinite; }
  </style>
  <rect width="800" height="800" fill="${byToken.black.hex}"/>
  <g class="mark">${markPath(d, 250, 220, 300, byToken.white.hex)}</g>
  <path class="scan" d="M160 610H360L410 550H640" fill="none" stroke="${byToken.white.hex}" stroke-width="2"/>
  <text x="400" y="686" fill="${byToken['light-gray'].hex}" font-family="${fonts.secondary}, Arial" font-size="14" font-weight="700" letter-spacing="3" text-anchor="middle">SYSTEMES IA METIER EN PRODUCTION</text>
</svg>
`;
}

function printCardFrontSvg(d) {
  return svgShell({
    width: 1004,
    height: 650,
    title: 'LUCID-LAB business card front',
    desc: '85 x 55 mm business card front at print-safe vector dimensions.',
    bg: byToken.white.hex,
    content: `
      <rect x="32" y="32" width="940" height="586" fill="none" stroke="${byToken['light-gray'].hex}"/>
      ${markPath(d, 70, 72, 122)}
      <text x="230" y="134" fill="${byToken.black.hex}" font-family="${fonts.primary}, Arial" font-size="44" font-weight="600" letter-spacing="5">LUCID-LAB</text>
      <text x="232" y="174" fill="${byToken.gray.hex}" font-family="${fonts.secondary}, Arial" font-size="13" font-weight="700" letter-spacing="1.6">Systèmes IA métier en production</text>
      <text x="70" y="400" fill="${byToken.black.hex}" font-family="${fonts.primary}, Arial" font-size="30" font-weight="600">Theo Benard</text>
      <text x="70" y="435" fill="${byToken.gray.hex}" font-family="${fonts.secondary}, Arial" font-size="16">Co-founder / AI Systems Architect</text>
      <text x="70" y="505" fill="${byToken.black.hex}" font-family="${fonts.secondary}, Arial" font-size="15">info@lucid-lab.fr  ·  +33 7 59 56 38 47</text>
      <text x="70" y="535" fill="${byToken.black.hex}" font-family="${fonts.secondary}, Arial" font-size="15">lucid-lab.fr</text>
    `,
  });
}

function printCardBackSvg(d) {
  return svgShell({
    width: 1004,
    height: 650,
    title: 'LUCID-LAB business card back',
    desc: '85 x 55 mm business card back.',
    bg: byToken.black.hex,
    content: `
      ${markPath(d, 332, 166, 340, byToken.white.hex)}
      <path d="M70 555H500L560 485H934" stroke="${byToken.gray.hex}" stroke-width="1.2" fill="none"/>
    `,
  });
}

function documentHeaderSvg(d) {
  return svgShell({
    width: 1600,
    height: 360,
    title: 'LUCID-LAB A4 landscape document header',
    desc: 'Official document header.',
    bg: byToken.white.hex,
    content: `
      ${markPath(d, 82, 70, 128)}
      <text x="250" y="130" fill="${byToken.black.hex}" font-family="${fonts.primary}, Arial" font-size="52" font-weight="600" letter-spacing="6">LUCID-LAB</text>
      <text x="253" y="172" fill="${byToken.gray.hex}" font-family="${fonts.secondary}, Arial" font-size="15" font-weight="700" letter-spacing="1.8">Systèmes IA métier en production</text>
      <path d="M80 278H840L900 218H1520" stroke="${byToken.black.hex}" stroke-width="1.2" fill="none"/>
    `,
  });
}

function letterheadSvg(d) {
  return svgShell({
    width: 1240,
    height: 1754,
    title: 'LUCID-LAB A4 letterhead',
    desc: 'Official A4 portrait letterhead.',
    bg: byToken.white.hex,
    content: `
      ${markPath(d, 90, 90, 92)}
      <text x="218" y="142" fill="${byToken.black.hex}" font-family="${fonts.primary}, Arial" font-size="34" font-weight="600" letter-spacing="5">LUCID-LAB</text>
      <text x="220" y="172" fill="${byToken.gray.hex}" font-family="${fonts.secondary}, Arial" font-size="11" font-weight="700" letter-spacing="1.4">Systèmes IA métier en production</text>
      <path d="M90 245H620L680 190H1150" stroke="${byToken.black.hex}" stroke-width="1"/>
      <text x="90" y="1510" fill="${byToken.gray.hex}" font-family="${fonts.secondary}, Arial" font-size="14">Lucid-Lab · Paris, France · info@lucid-lab.fr · lucid-lab.fr</text>
      <path d="M90 1460H1150" stroke="${byToken['light-gray'].hex}" stroke-width="1"/>
    `,
  });
}

function footerSvg() {
  return svgShell({
    width: 1600,
    height: 180,
    title: 'LUCID-LAB document footer',
    desc: 'Standard document footer.',
    bg: byToken.white.hex,
    content: `
      <path d="M80 56H780L840 116H1520" stroke="${byToken.black.hex}" stroke-width="1"/>
      <text x="80" y="132" fill="${byToken.gray.hex}" font-family="${fonts.secondary}, Arial" font-size="14">Lucid-Lab · Systems AI built, deployed, operated · lucid-lab.fr</text>
      <text x="1520" y="132" fill="${byToken.gray.hex}" font-family="${fonts.secondary}, Arial" font-size="14" text-anchor="end">Confidentiel</text>
    `,
  });
}

function cssTokens() {
  const colorVars = palette.map((c) => `  --color-${c.token}: ${c.hex};`).join('\n');
  return `:root {
  /* Couleurs */
  --color-primary: ${byToken.black.hex};
  --color-primary-dark: #000000;
  --color-surface-dark: ${byToken.anthracite.hex};
  --color-background: ${byToken.white.hex};
  --color-foreground: ${byToken.black.hex};
  --color-muted: ${byToken.gray.hex};
  --color-border: ${byToken['light-gray'].hex};
  --color-accent: ${byToken['accent-warm'].hex};
  --color-accent-cold: ${byToken['accent-cold'].hex};
  --color-accent-warm: ${byToken['accent-warm'].hex};
  --color-success: ${byToken.success.hex};
  --color-warning: ${byToken.warning.hex};
  --color-error: ${byToken.error.hex};
${colorVars}

  /* Typographie */
  --font-primary: "${fonts.primary}", Arial, sans-serif;
  --font-secondary: "${fonts.secondary}", Arial, sans-serif;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;
  --text-4xl: 44px;
  --text-5xl: 64px;
  --line-height-tight: 1.05;
  --line-height-normal: 1.55;
  --line-height-relaxed: 1.75;
  --letter-spacing-tight: 0;
  --letter-spacing-wide: 0.08em;
  --letter-spacing-widest: 0.18em;

  /* Espacement */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Bordures */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --border-width: 1px;

  /* Ombres */
  --shadow-sm: 0 1px 2px rgba(10, 10, 10, 0.06);
  --shadow-md: 0 16px 40px rgba(10, 10, 10, 0.10);
  --shadow-lg: 0 28px 80px rgba(10, 10, 10, 0.16);

  /* Animations */
  --transition-fast: 120ms;
  --transition-normal: 220ms;
  --transition-slow: 420ms;
  --easing-standard: cubic-bezier(0.2, 0, 0, 1);
}
`;
}

function componentsPreviewHtml(compactSvg) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LUCID-LAB Components Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap" rel="stylesheet">
  <style>${cssTokens()}
    body{margin:0;background:var(--color-background);color:var(--color-foreground);font-family:var(--font-secondary);}
    main{max-width:1120px;margin:auto;padding:64px 24px;}
    h1,h2{font-family:var(--font-primary);letter-spacing:0;}
    h1{font-size:56px;line-height:1.02;margin:0 0 16px;}
    h2{font-size:28px;margin:56px 0 20px;}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;}
    .panel{border:1px solid var(--color-border);padding:24px;background:#fff;border-radius:var(--radius-lg);}
    .button{display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 18px;border:1px solid var(--color-primary);font-weight:700;text-decoration:none}
    .button.primary{background:var(--color-primary);color:var(--color-background);}
    .button.secondary{color:var(--color-primary);}
    input{height:44px;border:1px solid var(--color-border);padding:0 14px;font:inherit;width:100%;box-sizing:border-box;}
    table{width:100%;border-collapse:collapse;font-size:14px;}td,th{border-bottom:1px solid var(--color-border);padding:12px;text-align:left;}th{font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:var(--color-muted);}
    .badge{display:inline-flex;border:1px solid var(--color-border);padding:7px 10px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;}
    .alert{border-left:4px solid var(--color-accent);padding:18px;background:#fff;}
  </style>
</head>
<body>
<main>
  <div style="width:74px">${compactSvg}</div>
  <h1>Design System Preview</h1>
  <p>Composants UI de base pour interfaces Lucid-Lab : nets, lisibles, sans décoration gratuite.</p>
  <h2>Boutons</h2>
  <p><a class="button primary" href="#">Audit Flash</a> <a class="button secondary" href="#">Voir la méthode</a></p>
  <h2>Cards</h2>
  <div class="grid">
    <div class="panel"><span class="badge">Build</span><h3>Agent IA en production</h3><p>Un système observable, documenté et transférable.</p></div>
    <div class="panel"><span class="badge">Run</span><h3>Monitoring</h3><p>Coût, latence, qualité, erreurs et incidents visibles.</p></div>
  </div>
  <h2>Formulaire</h2>
  <div class="panel"><label>Besoin principal</label><br><br><input value="Automatiser un processus métier"></div>
  <h2>Tableau</h2>
  <table><thead><tr><th>Signal</th><th>Etat</th><th>Action</th></tr></thead><tbody><tr><td>Workflow facture</td><td>Ready</td><td>Build</td></tr><tr><td>Données CRM</td><td>Warning</td><td>Nettoyer</td></tr></tbody></table>
  <h2>Alertes</h2>
  <div class="alert">Incident potentiel : vérifier les permissions avant mise en production.</div>
</main>
</body>
</html>
`;
}

function daGuidelinesMd() {
  return `# LUCID-LAB — Direction artistique

Version 1.0 — ${DATE}

## Ce qu'est la marque

Lucid-Lab est une marque de clarté opérationnelle, pas une marque de hype technologique. Elle exprime la précision, la rigueur et la capacité à transformer un chaos métier en système observable, automatisé et exploitable.

La direction artistique doit évoquer une intelligence opérationnelle précise : fond papier chaud, noir net, gris fonctionnels, un accent Ember très dosé, beaucoup d'espace, une hiérarchie nette et des formes angulaires dérivées du lettermark.

## Ce que la marque n'est pas

- Jamais de gradient arc-en-ciel.
- Jamais de futurisme cheap, néons, hologrammes ou clichés "IA".
- Jamais de mascotte décorative comme axe principal de marque. Lex peut apparaître comme preuve produit, capture ou visuel d'agent réel, jamais comme personnage cartoon.
- Jamais de promesse floue, de vocabulaire conseil générique ou de visuel de startup SaaS interchangeable.
- Jamais d'ombre portée dramatique sur le logo.

## Références de niveau

- Linear : rigueur, interfaces calmes, excellence typographique.
- Vercel : radicalité noir/blanc, économie visuelle.
- Stripe : clarté de système, grille maîtrisée.
- Palantir : intelligence opérationnelle, gravité B2B.
- Anthropic : sobriété intellectuelle, chaleur mesurée.
- Canva LinkedIn : compositions minimalistes noir/blanc, beige, gris, photo sobre, géométrie simple et accent très discret.

## Photographie

Privilégier les captures réelles, les interfaces, les exports ou Lex sur fond clair. Les images doivent montrer un système, un agent, une architecture ou une situation de décision. Pas de photos corporate souriantes génériques.

## Illustration et icônes

Les illustrations doivent rester vectorielles, angulaires et fonctionnelles. Les icônes sont en ligne monochrome, avec angles nets, stroke constant, sans pictogrammes trop ronds. Toute illustration doit aider à comprendre un système, une connexion, un flux ou une décision.

## Vocabulaire visuel interdit

Robot cartoon, cerveau lumineux, réseau de points bleu néon, tunnel de données, globe 3D générique, code vert Matrix, badges colorés non fonctionnels, fond violet/bleu dégradé, formes organiques molles, pictogrammes remplis multicolores.

## LinkedIn

Les bannières doivent garder la zone gauche basse respirante pour la photo de profil. Le message principal commence idéalement après 360 px. Priorité : une phrase courte, une preuve visuelle ou Lex à droite, et un filet Ember plutôt qu'un grand aplat coloré.

## Règles d'usage du logo

Le lettermark est intouchable. Il peut être utilisé noir, blanc, gris officiel ou en filigrane. Aucune recoloration non listée dans la charte, aucune déformation, aucune rotation, aucun effet 3D, aucune ombre portée. La zone d'exclusion minimale correspond à 0,5 fois la hauteur du L autour du logo.
`;
}

function moodboardSvg(d) {
  return svgShell({
    width: 1600,
    height: 1120,
    title: 'LUCID-LAB moodboard',
    desc: 'A3 landscape moodboard for brand direction.',
    bg: byToken.white.hex,
    content: `
      <rect x="0" y="0" width="1600" height="1120" fill="${byToken.white.hex}"/>
      <text x="90" y="110" fill="${byToken.black.hex}" font-family="${fonts.primary}, Arial" font-size="58" font-weight="600" letter-spacing="1">LUCID-LAB MOODBOARD</text>
      <text x="94" y="158" fill="${byToken.gray.hex}" font-family="${fonts.secondary}, Arial" font-size="18">Luxury tech. Intelligence opérationnelle. Zéro bruit.</text>
      ${markPath(d, 90, 240, 250)}
      <rect x="430" y="235" width="260" height="260" fill="${byToken.black.hex}"/>
      <rect x="720" y="235" width="260" height="260" fill="${byToken.anthracite.hex}"/>
      <rect x="1010" y="235" width="260" height="260" fill="${byToken['accent-cold'].hex}"/>
      <rect x="1300" y="235" width="210" height="260" fill="${byToken['accent-warm'].hex}"/>
      <text x="90" y="620" fill="${byToken.black.hex}" font-family="${fonts.primary}, Arial" font-size="48" font-weight="800">SYSTEMES IA METIER EN PRODUCTION</text>
      <text x="92" y="680" fill="${byToken.black.hex}" font-family="${fonts.secondary}, Arial" font-size="22">Architecture sobre · interfaces lisibles · décisions nettes · systèmes qui tournent.</text>
      <g transform="translate(90 765)">
        <rect width="420" height="220" fill="${byToken.black.hex}"/>
        <path d="M40 170H220L250 130H380" stroke="${byToken.white.hex}" stroke-width="2" fill="none"/>
        <text x="40" y="65" fill="${byToken.white.hex}" font-family="${fonts.primary}, Arial" font-size="30">SYSTEM MAP</text>
        <text x="40" y="105" fill="${byToken['light-gray'].hex}" font-family="${fonts.secondary}, Arial" font-size="15">Flows, permissions, monitoring.</text>
      </g>
      <g transform="translate(560 765)">
        <rect width="420" height="220" fill="#FFFFFF" stroke="${byToken['light-gray'].hex}"/>
        <text x="36" y="62" fill="${byToken.black.hex}" font-family="${fonts.primary}, Arial" font-size="30">BUILD / RUN</text>
        <text x="36" y="105" fill="${byToken.gray.hex}" font-family="${fonts.secondary}, Arial" font-size="15">Production-first systems.</text>
        <path d="M36 162H210L250 118H380" stroke="${byToken.black.hex}" stroke-width="1.4" fill="none"/>
      </g>
      <g transform="translate(1030 765)">
        <rect width="480" height="220" fill="${byToken.anthracite.hex}"/>
        ${markPath(d, 1240, 782, 170, byToken.white.hex, 0.22)}
        <text x="36" y="62" fill="${byToken.white.hex}" font-family="${fonts.primary}, Arial" font-size="30">NO POWERPOINT</text>
        <text x="36" y="105" fill="${byToken['light-gray'].hex}" font-family="${fonts.secondary}, Arial" font-size="15">Diagnostics only when they lead to build.</text>
      </g>
    `,
  });
}

function signatureHtml(logoPngBase64, dark = false) {
  const bg = dark ? byToken.black.hex : '#FFFFFF';
  const fg = dark ? byToken.white.hex : byToken.black.hex;
  const muted = dark ? byToken['light-gray'].hex : byToken.gray.hex;
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>LUCID-LAB email signature ${dark ? 'dark' : 'light'}</title></head>
<body style="margin:0;padding:0;background:${bg};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;font-family:Arial,sans-serif;color:${fg};border-collapse:collapse;">
  <tr>
    <td style="width:92px;padding:18px 18px 18px 0;vertical-align:top;">
      <img src="data:image/png;base64,${logoPngBase64}" width="72" height="72" alt="LUCID-LAB" style="display:block;border:0;">
    </td>
    <td style="padding:18px 0;vertical-align:top;border-left:1px solid ${dark ? '#333333' : '#E2E2E2'};padding-left:22px;">
      <div style="font-size:18px;font-weight:700;letter-spacing:.04em;color:${fg};">Theo Benard</div>
      <div style="font-size:13px;line-height:20px;color:${muted};">Co-founder / AI Systems Architect · LUCID-LAB</div>
      <div style="height:12px;line-height:12px;">&nbsp;</div>
      <div style="font-size:13px;line-height:20px;color:${fg};">
        <a href="mailto:info@lucid-lab.fr" style="color:${fg};text-decoration:none;">info@lucid-lab.fr</a> ·
        <a href="tel:+33759563847" style="color:${fg};text-decoration:none;">+33 7 59 56 38 47</a><br>
        <a href="https://lucid-lab.fr" style="color:${fg};text-decoration:none;">lucid-lab.fr</a> ·
        <a href="https://www.linkedin.com/company/lucid-lab-fr" style="color:${fg};text-decoration:none;">LinkedIn</a>
      </div>
      <div style="height:12px;line-height:12px;">&nbsp;</div>
      <div style="font-size:11px;letter-spacing:.12em;font-weight:700;color:${muted};">SYSTEMES IA METIER EN PRODUCTION</div>
    </td>
  </tr>
</table>
</body></html>
`;
}

function brandBookHtml(d, logoFiles, compactSvg, assets = {}) {
  const colorSwatches = palette.map((c) => `
    <button class="swatch" data-copy="${c.hex}" style="--sw:${c.hex}">
      <span>${esc(c.name)}</span><strong>${c.hex}</strong><small>${c.rgb}<br>${c.hsl}<br>${c.cmyk}<br>${c.pantone}</small>
    </button>`).join('');

  const logoPreview = Object.entries(logoFiles).map(([name, svg]) => `
    <figure class="asset-preview">
      <img src="${dataUri(svg)}" alt="${esc(name)}">
      <figcaption>${esc(name)}</figcaption>
    </figure>`).join('');

  const css = cssTokens();
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LUCID-LAB Brand Guidelines</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap" rel="stylesheet">
  <style>
${css}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--color-background);color:var(--color-foreground);font-family:var(--font-secondary);line-height:var(--line-height-normal);overflow-x:hidden}
a{color:inherit}.layout{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:100vh}.sidebar{position:sticky;top:0;height:100vh;padding:28px;border-right:1px solid var(--color-border);background:#fff;overflow:auto}.brand{display:flex;align-items:center;gap:14px;margin-bottom:34px}.brand svg{width:46px;height:46px}.brand strong{font-family:var(--font-primary);letter-spacing:.18em;font-size:14px}.nav{display:grid;gap:6px}.nav a{padding:10px 12px;text-decoration:none;color:var(--color-muted);border-left:2px solid transparent;font-size:14px}.nav a.active,.nav a:hover{color:var(--color-primary);border-left-color:var(--color-primary);background:#f3f3f3}.content{min-width:0;overflow:hidden}.section{padding:96px 84px;border-bottom:1px solid var(--color-border)}.cover{min-height:100vh;background:var(--color-primary);color:var(--color-background);display:grid;align-content:center;position:relative;overflow:hidden}.cover .ghost{position:absolute;right:64px;top:8vh;width:420px;opacity:.10}.kicker{font-size:12px;text-transform:uppercase;letter-spacing:.18em;font-weight:800;color:var(--color-muted)}.cover .kicker{color:var(--color-border)}h1,h2,h3{font-family:var(--font-primary);letter-spacing:0;line-height:1.02}h1{font-size:88px;max-width:880px;margin:18px 0 22px}h2{font-size:60px;margin:0 0 24px;max-width:920px}h3{font-size:28px;margin:0 0 12px}p.lead{font-size:22px;max-width:850px;color:var(--color-muted);overflow-wrap:break-word}.cover p.lead{color:var(--color-border)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px}.panel{border:1px solid var(--color-border);background:#fff;padding:24px;border-radius:var(--radius-lg)}.panel.dark{background:var(--color-primary);color:var(--color-background);border-color:var(--color-primary)}.asset-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}.asset-preview{margin:0;border:1px solid var(--color-border);background:#fff;padding:18px;min-height:190px;display:grid;place-items:center;gap:10px}.asset-preview img{max-width:100%;max-height:140px}.asset-preview figcaption{font-size:12px;color:var(--color-muted)}.swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}.swatch{border:1px solid var(--color-border);background:var(--sw);min-height:220px;padding:18px;text-align:left;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;color:#0a0a0a}.swatch:nth-child(1),.swatch:nth-child(3),.swatch:nth-child(6){color:#f8f8f8}.swatch span{font-weight:800}.swatch strong{font-size:24px}.swatch small{font-size:12px;line-height:1.55}.type-sample .h1{font-family:var(--font-primary);font-size:64px;line-height:1.04;font-weight:600}.type-sample .body{font-size:17px;max-width:760px}.do-dont{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}.rule{padding:22px;border:1px solid var(--color-border);background:#fff}.rule.bad{border-color:var(--color-error)}.button{display:inline-flex;align-items:center;justify-content:center;height:44px;padding:0 18px;border:1px solid var(--color-primary);text-decoration:none;font-weight:800}.button.primary{background:var(--color-primary);color:var(--color-background)}.button.secondary{background:#fff;color:var(--color-primary)}input{width:100%;height:44px;border:1px solid var(--color-border);padding:0 14px;font:inherit}.badge{display:inline-flex;border:1px solid var(--color-border);padding:7px 10px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.table{width:100%;border-collapse:collapse;background:#fff}.table th,.table td{padding:13px;border-bottom:1px solid var(--color-border);text-align:left}.table th{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--color-muted)}pre{white-space:pre-wrap;background:var(--color-primary);color:var(--color-background);padding:20px;overflow:auto}.copy{float:right;border:1px solid var(--color-border);background:#fff;padding:8px 10px;cursor:pointer}@media(max-width:1180px){.section{padding:80px 48px}h1{font-size:72px;max-width:760px}h2{font-size:50px}}@media(max-width:860px){.layout{grid-template-columns:1fr}.sidebar{position:relative;height:auto}.section{padding:64px 24px}.cover{min-height:82vh}.cover .ghost{right:20px;width:240px}h1{font-size:42px;max-width:310px}h2{font-size:38px}p.lead{font-size:20px;max-width:310px}.type-sample .h1{font-size:42px}.nav{grid-template-columns:repeat(2,1fr)}}
@media print{.sidebar{display:none}.layout{display:block}.section{break-after:page;padding:40px}.cover{min-height:auto;color:#000;background:#fff}.copy{display:none}}
  </style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="brand">${compactSvg}<strong>LUCID-LAB</strong></div>
    <nav class="nav">
      <a href="#cover">Cover</a><a href="#intro">Introduction</a><a href="#logo">Logo</a><a href="#colors">Couleurs</a><a href="#type">Typographie</a><a href="#graphics">Éléments</a><a href="#digital">Digital</a><a href="#print">Print</a><a href="#voice">Tonalité</a><a href="#ui">Design system</a><a href="#tokens">Tokens</a>
    </nav>
  </aside>
  <main class="content">
    <section id="cover" class="section cover">
      <div class="ghost">${compactSvg}</div>
      <div class="kicker">Brand Guidelines · v1.0 · ${DATE}</div>
      <h1>LUCID-LAB Brand Guidelines</h1>
      <p class="lead">Une charte pour une marque B2B premium qui construit des systèmes IA livrés en production, avec une présence visuelle sobre, directe et reconnaissable.</p>
    </section>
    <section id="intro" class="section">
      <div class="kicker">Positionnement</div><h2>Une marque de clarté opérationnelle.</h2>
      <p class="lead">Lucid-Lab transforme le chaos opérationnel en systèmes autonomes : agents IA, outils internes, automatisations, intégrations, monitoring et documentation. La marque doit inspirer rigueur, précision et capacité d'exécution.</p>
      <div class="grid"><div class="panel"><h3>ADN</h3><p>Précision, rigueur, intelligence systémique, clarté radicale.</p></div><div class="panel"><h3>Ton</h3><p>Professionnel, confiant, sobre. Zéro effet de manche.</p></div><div class="panel"><h3>Promesse</h3><p>On ne conseille pas. On construit.</p></div></div>
    </section>
    <section id="logo" class="section">
      <div class="kicker">Logo & Usage</div><h2>Lettermark intouchable.</h2>
      <p class="lead">Le symbole est vectorisé depuis le fichier source local <code>public/logo.png</code>. Les lockups associent le lettermark et le wordmark sans reprendre de slogan généré.</p>
      <div class="asset-grid">${logoPreview}</div>
      <h3>Zone d'exclusion</h3><p>Minimum : 0,5 x hauteur du L autour du logo. Taille minimale : 24px favicon, 80px compact. Ne jamais déformer, recolorer hors variantes officielles ou ajouter d'ombre.</p>
      <div class="do-dont"><div class="rule"><h3>DO</h3><p>Utiliser noir sur clair, blanc sur sombre, gris officiel pour un contexte secondaire.</p></div><div class="rule bad"><h3>DON'T</h3><p>Rotation, contour, gradient, ombre portée, couleur non listée, compression horizontale ou verticale.</p></div></div>
    </section>
    <section id="colors" class="section">
      <button class="copy" data-copy="${palette.map((c) => `${c.name}: ${c.hex}`).join('\\n')}">Copier palette</button>
      <div class="kicker">Couleurs</div><h2>Noir, blanc, acier.</h2>
      <div class="swatches">${colorSwatches}</div>
    </section>
    <section id="type" class="section type-sample">
      <div class="kicker">Typographie</div><h2>Syne + Figtree.</h2>
      <div class="panel"><div class="h1">Vos systèmes IA, construits.</div><p class="body">Figtree porte la lecture longue et l'interface. Syne porte le wordmark et les titres de très haut niveau.</p></div>
      <div class="grid"><div class="panel"><h3>Headings</h3><p>Syne 700-800 pour le signal de marque, Figtree 700 pour les titres d'interface.</p></div><div class="panel"><h3>Body / UI</h3><p>Figtree 400-800, line-height 1.55, labels uppercase en tracking 0.12-0.16em.</p></div></div>
    </section>
    <section id="graphics" class="section">
      <div class="kicker">Éléments graphiques</div><h2>Angles, filets, systèmes.</h2>
      <div class="grid"><div class="panel"><h3>Motif</h3><p>Répétition des plans angulaires du lettermark.</p></div><div class="panel"><h3>Icônes</h3><p>Line icons monochromes, stroke constant, angle net.</p></div><div class="panel"><h3>Texture</h3><p>Grain subtil uniquement pour éviter les aplats trop froids.</p></div></div>
    </section>
    <section id="digital" class="section">
      <div class="kicker">Supports digitaux</div><h2>LinkedIn, social, email, favicon.</h2>
      <p class="lead">Les bannières suivent les usages LinkedIn observés sur Canva : composition minimale, zone gauche protégée, message court, accent très fin et visuel à droite.</p>
      <div class="asset-grid"><figure class="asset-preview"><img src="${dataUri(digitalBannerSvg(d, 'signature', assets))}" alt="LinkedIn signature"><figcaption>Signature claire</figcaption></figure><figure class="asset-preview"><img src="${dataUri(digitalBannerSvg(d, 'lex', assets))}" alt="LinkedIn Lex"><figcaption>Lex agent</figcaption></figure><figure class="asset-preview"><img src="${dataUri(digitalBannerSvg(d, 'system', assets))}" alt="LinkedIn system"><figcaption>Système livré</figcaption></figure><figure class="asset-preview"><img src="${dataUri(digitalBannerSvg(d, 'dark', assets))}" alt="LinkedIn dark"><figcaption>Éditorial sombre</figcaption></figure><figure class="asset-preview"><img src="${dataUri(ogSvg(d, 'og', assets))}" alt="OG image"><figcaption>OG Image</figcaption></figure></div>
    </section>
    <section id="print" class="section">
      <div class="kicker">Print</div><h2>Papeterie professionnelle.</h2>
      <div class="asset-grid"><figure class="asset-preview"><img src="${dataUri(printCardFrontSvg(d))}" alt="Business card front"><figcaption>Carte recto</figcaption></figure><figure class="asset-preview"><img src="${dataUri(printCardBackSvg(d))}" alt="Business card back"><figcaption>Carte verso</figcaption></figure><figure class="asset-preview"><img src="${dataUri(letterheadSvg(d))}" alt="Letterhead"><figcaption>Papier à lettre</figcaption></figure></div>
    </section>
    <section id="voice" class="section">
      <div class="kicker">Tonalité éditoriale</div><h2>Dire moins, décider plus.</h2>
      <div class="do-dont"><div class="rule"><h3>À dire</h3><p>“On identifie le premier système utile à construire.”<br>“Zéro PowerPoint.”<br>“Build, run, monitoring, documentation.”</p></div><div class="rule bad"><h3>À éviter</h3><p>“Synergies IA”, “révolution digitale”, “solution 360 holistique”, “10x overnight”.</p></div></div>
    </section>
    <section id="ui" class="section">
      <div class="kicker">Design system UI</div><h2>Composants sobres.</h2>
      <p><a class="button primary" href="#">Audit Flash</a> <a class="button secondary" href="#">Voir la méthode</a></p>
      <div class="grid"><div class="panel"><span class="badge">Build</span><h3>Agent en production</h3><p>État clair, métriques visibles, action directe.</p></div><div class="panel dark"><span class="badge">Run</span><h3>Monitoring</h3><p>Coût, latence, qualité, incidents.</p></div></div>
      <p><input value="Automatiser un processus métier"></p>
      <table class="table"><thead><tr><th>Système</th><th>État</th><th>Action</th></tr></thead><tbody><tr><td>Qualification lead</td><td>Ready</td><td>Déployer</td></tr><tr><td>Flux CRM</td><td>Warning</td><td>Auditer</td></tr></tbody></table>
    </section>
    <section id="tokens" class="section">
      <button class="copy" data-copy="${esc(css)}">Copier CSS</button>
      <div class="kicker">Design Tokens</div><h2>Variables CSS</h2>
      <pre>${esc(css)}</pre>
    </section>
  </main>
</div>
<script>
const links=[...document.querySelectorAll('.nav a')];const sections=links.map(a=>document.querySelector(a.getAttribute('href')));function spy(){let active=0;sections.forEach((s,i)=>{if(s.getBoundingClientRect().top<160)active=i});links.forEach((a,i)=>a.classList.toggle('active',i===active))}addEventListener('scroll',spy,{passive:true});spy();
document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',async()=>{await navigator.clipboard.writeText(btn.dataset.copy);const old=btn.textContent;btn.textContent='Copié';setTimeout(()=>btn.textContent=old,900)}));
</script>
</body>
</html>`;
}

function pdfPages() {
  return [
    ['Cover', 'LUCID-LAB Brand Guidelines', 'Version 1.0 · 27 mai 2026'],
    ['Mission', 'Systèmes IA métier en production', 'Une marque de construction opérationnelle, non de hype technologique.'],
    ['Positionnement', 'Audit, build, run', 'Agents, outils internes, automatisations, monitoring et documentation.'],
    ['Logo', 'Lettermark intouchable', 'Zone d’exclusion : 0,5 x hauteur du L. Taille minimale : 24px favicon, 80px compact.'],
    ['Logo', 'Variantes officielles', 'Principal, horizontal, vertical, compact, wordmark, négatif, gris, favicon, watermark.'],
    ['Couleurs', 'Palette principale', '#0A0A0A, #F7F5F1, #FFFFFF, #525252, #E5E5E5.'],
    ['Couleurs', 'Accents fonctionnels', '#C85E1A, #B4D8FF, #3F7D5B, #FFB451, #B94A48.'],
    ['Typographie', 'Syne', 'Wordmark et titres de marque. Poids 700 à 800.'],
    ['Typographie', 'Figtree', 'Corps de texte, UI, captions, tableaux. Poids 400 à 800.'],
    ['Grille', '12 colonnes desktop', 'Marges 96px, gouttières 24px. Mobile : 4 colonnes, marge 24px.'],
    ['Éléments', 'Motifs angulaires', 'Dérivés des plans et courbes du lettermark. Jamais décoratifs sans fonction.'],
    ['Iconographie', 'Line icons monochromes', 'Stroke constant, angles nets, pictogrammes fonctionnels.'],
    ['Digital', 'LinkedIn', 'Quatre bannières : signature, Lex agent, système livré, éditorial sombre.'],
    ['Digital', 'Social sharing', 'OG image 1200x630 et Twitter card 1200x628.'],
    ['Email', 'Signature', 'HTML table, logo PNG base64, compatible Outlook/Gmail/Apple Mail.'],
    ['Print', 'Carte de visite', '85 x 55 mm, recto clair et verso sombre.'],
    ['Print', 'Papeterie', 'Header A4, papier à lettre, footer standard.'],
    ['Tonalité', 'À dire', 'On ne conseille pas. On construit. Build, run, monitoring, documentation.'],
    ['Tonalité', 'À éviter', 'Synergies, révolution IA, futurisme cheap, promesses 10x.'],
    ['UI', 'Composants', 'Boutons nets, cards sobres, inputs clairs, badges fonctionnels, alertes utiles.'],
    ['Gouvernance', 'Règles absolues', 'Aucune déformation du logo, aucune couleur non officielle, aucune ombre portée.'],
    ['Conclusion', 'Premium, opérationnel, construit', 'La marque doit paraître calme, précise, mature et capable d’exécuter.'],
  ];
}

async function generatePdf() {
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56, info: { Title: 'LUCID-LAB Brand Guidelines' } });
    const output = path.join(OUT, '00-overview/charte-graphique.pdf');
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      await fs.writeFile(output, Buffer.concat(chunks));
      resolve();
    });
    doc.on('error', reject);
    pdfPages().forEach(([kicker, title, body], index) => {
      if (index > 0) doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(index === 0 ? byToken.black.hex : byToken.white.hex);
      const dark = index === 0;
      doc.fillColor(dark ? byToken.white.hex : byToken.black.hex);
      doc.font('Helvetica-Bold').fontSize(10).text(kicker.toUpperCase(), 56, 72, { characterSpacing: 2 });
      doc.font('Helvetica-Bold').fontSize(index === 0 ? 48 : 34).text(title, 56, 148, { width: 460, lineGap: 4 });
      doc.fillColor(dark ? byToken['light-gray'].hex : byToken.gray.hex);
      doc.font('Helvetica').fontSize(15).text(body, 56, index === 0 ? 300 : 250, { width: 460, lineGap: 8 });
      doc.strokeColor(dark ? byToken.gray.hex : byToken['light-gray'].hex).lineWidth(1).moveTo(56, 740).lineTo(540, 680).stroke();
      doc.fontSize(9).fillColor(dark ? byToken['light-gray'].hex : byToken.gray.hex).text(`LUCID-LAB Brand Guidelines · ${index + 1}`, 56, 780);
    });
    doc.end();
  });
}

async function writeSvg(file, svg) {
  await fs.writeFile(path.join(OUT, file), svg, 'utf8');
}

async function writeSvgAndPng(fileBase, svg) {
  await writeSvg(`${fileBase}.svg`, svg);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await fs.writeFile(path.join(OUT, `${fileBase}.png`), png);
}

async function generateFavicons(faviconSvg) {
  const faviconDir = path.join(OUT, '05-digital/favicon');
  const faviconSetDir = path.join(OUT, '05-digital/favicon-set');
  await fs.writeFile(path.join(faviconDir, 'favicon-16.svg'), faviconSvg, 'utf8');
  await fs.writeFile(path.join(faviconDir, 'favicon-32.svg'), faviconSvg, 'utf8');
  await fs.writeFile(path.join(faviconDir, 'apple-touch-icon.svg'), faviconSvg, 'utf8');
  const pngs = [];
  for (const size of [16, 32, 48, 180, 192, 512]) {
    const png = await sharp(Buffer.from(faviconSvg)).resize(size, size).png().toBuffer();
    const name = size === 180 ? 'apple-touch-icon.png' : size === 192 || size === 512 ? `pwa-icon-${size}.png` : `favicon-${size}.png`;
    await fs.writeFile(path.join(faviconDir, name), png);
    await fs.writeFile(path.join(faviconSetDir, name), png);
    if ([16, 32, 48].includes(size)) pngs.push(png);
  }
  const ico = await pngToIco(pngs);
  await fs.writeFile(path.join(faviconDir, 'favicon.ico'), ico);
  await fs.writeFile(path.join(faviconSetDir, 'favicon.ico'), ico);
}


function digitalBannerSvg(d, variant = 'v13-company', assets) {
  if (variant === 'v13-company') {
    return svgShell({ width: 1128, height: 191, title: '', desc: '', bg: '#0A0A0A', content: `
  <!-- Grille subtile -->
  <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
  </pattern>
  <rect width="1128" height="191" fill="url(#gridPattern)" />

  <!-- Diagramme d'architecture à Droite -->
  <g transform="translate(680, 20)">
    <!-- Noeuds principaux -->
    <rect x="50" y="30" width="80" height="40" rx="6" fill="#1C1C1C" stroke="#333" stroke-width="1.5"/>
    <text x="90" y="55" fill="#facc15" font-family="${fonts.primary}, Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle">Input</text>
    
    <path d="M 130 50 L 170 50" stroke="#facc15" stroke-width="1.5" stroke-dasharray="2,2"/>
    <circle cx="150" cy="50" r="3" fill="#facc15"/>
    
    <rect x="170" y="20" width="100" height="60" rx="6" fill="#1C1C1C" stroke="#facc15" stroke-width="1.5"/>
    <text x="220" y="47" fill="#fff" font-family="${fonts.secondary}, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Agent AI</text>
    <text x="220" y="63" fill="#888" font-family="${fonts.secondary}, sans-serif" font-size="9" text-anchor="middle">GPT-4o</text>
    
    <path d="M 270 50 L 310 50" stroke="#333" stroke-width="1.5"/>
    
    <!-- Sorties multiples -->
    <path d="M 310 50 L 310 20 L 330 20" fill="none" stroke="#444" stroke-width="1.5"/>
    <rect x="330" y="0" width="80" height="40" rx="6" fill="#1C1C1C" stroke="#333" stroke-width="1.5"/>
    <text x="370" y="25" fill="#aaa" font-family="${fonts.secondary}, sans-serif" font-size="11" text-anchor="middle">Supabase</text>

    <path d="M 310 50 L 310 80 L 330 80" fill="none" stroke="#444" stroke-width="1.5"/>
    <rect x="330" y="60" width="80" height="40" rx="6" fill="#1C1C1C" stroke="#333" stroke-width="1.5"/>
    <text x="370" y="85" fill="#aaa" font-family="${fonts.secondary}, sans-serif" font-size="11" text-anchor="middle">Outreach</text>
    <circle cx="220" cy="50" r="60" fill="url(#glowObj2)" opacity="0.3"/>
  </g>
  
  <!-- Textes à gauche (Eviter la zone bas-gauche pour l'avatar) -->
  <g transform="translate(430, 75)">
    <text x="0" y="0" fill="#ffffff" font-family="${fonts.primary}, Arial, sans-serif" font-size="34" font-weight="800" letter-spacing="-0.5">Automatisations &amp; Agents IA</text>
    <text x="0" y="30" fill="#a0a0a0" font-family="${fonts.secondary}, Arial, sans-serif" font-size="18" font-weight="400">Transformez vos processus manuels en systèmes scalables.</text>
    <!-- Badge -->
    <rect x="0" y="55" width="220" height="30" rx="15" fill="#1A1A1A" stroke="#333" stroke-width="1"/>
    <text x="25" y="75" fill="#ccc" font-family="${fonts.secondary}, Arial, sans-serif" font-size="12" font-weight="600">Lucid OS Stack : Next.js • Supabase</text>
    <circle cx="12" cy="70" r="3" fill="#facc15"/>
  </g>
  <defs>
    <radialGradient id="glowObj2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#facc15" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#facc15" stop-opacity="0" />
    </radialGradient>
  </defs>`});
  }
  
  // v12-perfect (Original style fallback)
  return svgShell({ width: 1128, height: 191, title: '', desc: '', bg: '#0A0A0A', content: `
  <rect width="1128" height="191" fill="#0A0A0A" />
  <g transform="translate(450, 70)">
    <text x="0" y="0" fill="#ffffff" font-family="${fonts.primary}, Arial, sans-serif" font-size="34" font-weight="800">Operational Excellence</text>
    <text x="0" y="30" fill="#a0a0a0" font-family="${fonts.secondary}, Arial, sans-serif" font-size="18">LUCID-LAB AI Systems</text>
  </g>`});
}


async function main() {
  await ensureDirs();
  const visualAssets = await loadVisualAssets();
  const d = await traceLogo();
  const logoFiles = logoSvgs(d);

  // IMPORTANT: N'effacer QUE les sous-dossiers gérés automatiquement.
  // Ne PAS supprimer 00-overview/ (charte.html), 05-digital/linkedin-banner-*.png, etc.
  // Ces fichiers sont créés manuellement ou par des scripts séparés et ne doivent pas être écrasés.
  await fs.mkdir(path.join(OUT, '01-logo', 'svg'), { recursive: true });
  await fs.mkdir(path.join(OUT, '01-logo', 'png'), { recursive: true });
  await fs.mkdir(path.join(OUT, '05-digital'), { recursive: true });
  await fs.mkdir(path.join(OUT, '00-overview'), { recursive: true });

  // Exporter les SVG principaux
  for (const [name, svg] of Object.entries(logoFiles)) {
    if (name === 'logo-compact.svg' || name === 'logo-principal.svg' || name === 'logo-horizontal.svg') {
      await writeSvg(`01-logo/svg/${name}`, svg);
    }
  }

  // Bannières essentielles
  const bannerVariants = ['v12-perfect', 'v13-company'];
  for (const variant of bannerVariants) {
    await writeSvgAndPng(`05-digital/banner-${variant}`, digitalBannerSvg(d, variant, visualAssets));
  }

  // Génération PNG des logos/avatars
  const darkAvatarSvgStr = avatarSvgDark(d);
  const lightAvatarSvgStr = avatarSvgLight(d);
  
  await writeSvg('05-digital/avatar-dark.svg', darkAvatarSvgStr);
  await writeSvg('05-digital/avatar-light.svg', lightAvatarSvgStr);

  const PUBLIC_LOGOS = path.join(ROOT, 'public/logos');
  await fs.mkdir(PUBLIC_LOGOS, { recursive: true });

  const darkPng = await sharp(Buffer.from(darkAvatarSvgStr)).resize(400, 400).png().toBuffer();
  await fs.writeFile(path.join(PUBLIC_LOGOS, 'avatar-dark.png'), darkPng);
  
  const lightPng = await sharp(Buffer.from(lightAvatarSvgStr)).resize(400, 400).png().toBuffer();
  await fs.writeFile(path.join(PUBLIC_LOGOS, 'avatar-light.png'), lightPng);

  // Generation des Signatures HTML 
  // avec les URLs qui seront live en PROD (ou local via localhost)
  const urlDark = "https://lucid-lab.fr/logos/avatar-dark.png";
  const urlLight = "https://lucid-lab.fr/logos/avatar-light.png";

  await fs.writeFile(path.join(OUT, '05-digital/signature-email-dark-logo.html'), signatureHtml(urlDark), 'utf8');
  await fs.writeFile(path.join(OUT, '05-digital/signature-email-light-logo.html'), signatureHtml(urlLight), 'utf8');

  console.log('✨ Nettoyage & Génération des assets essentiels (Logo, Bannières, Signatures) terminés dans ' + OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
