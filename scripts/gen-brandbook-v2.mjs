/**
 * gen-brandbook-v2.mjs
 * Generates lucid-lab-brand/00-overview/charte-graphique.html
 * Features: download buttons, copy-to-clipboard, 10 banners, 3 signature variants
 * Run: node scripts/gen-brandbook-v2.mjs
 */

import sharp from '/tmp/lucid-brand-tools/node_modules/sharp/lib/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── Helpers ───────────────────────────────────────────────────────────────────
function pngB64(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath)).toString('base64');
}

async function jpgB64(relPath, quality = 82) {
  const buf = await sharp(path.join(ROOT, relPath))
    .jpeg({ quality })
    .toBuffer();
  return buf.toString('base64');
}

// ── Load logos ────────────────────────────────────────────────────────────────
const logos = {
  dark1024: pngB64('lucid-lab-brand/01-logo/png/logo-1024x1024-white-on-black.png'),
  light1024:pngB64('lucid-lab-brand/01-logo/png/logo-1024x1024-black-on-white.png'),
  dark400:  pngB64('lucid-lab-brand/01-logo/png/logo-400x400-white-on-black.png'),
  dark256:  pngB64('lucid-lab-brand/01-logo/png/logo-256x256-white-on-black.png'),
  dark192:  pngB64('lucid-lab-brand/01-logo/png/logo-192x192-white-on-black.png'),
  dark96:   pngB64('lucid-lab-brand/01-logo/png/logo-96x96-white-on-black.png'),
  dark64:   pngB64('lucid-lab-brand/01-logo/png/logo-64x64-white-on-black.png'),
  dark32:   pngB64('lucid-lab-brand/01-logo/png/logo-32x32-white-on-black.png'),
  light400: pngB64('lucid-lab-brand/01-logo/png/logo-400x400-black-on-white.png'),
  light256: pngB64('lucid-lab-brand/01-logo/png/logo-256x256-black-on-white.png'),
  light192: pngB64('lucid-lab-brand/01-logo/png/logo-192x192-black-on-white.png'),
  light96:  pngB64('lucid-lab-brand/01-logo/png/logo-96x96-black-on-white.png'),
  light64:  pngB64('lucid-lab-brand/01-logo/png/logo-64x64-black-on-white.png'),
  light32:  pngB64('lucid-lab-brand/01-logo/png/logo-32x32-black-on-white.png'),
};

const LOGO_SIZES = [
  { key: 'dark400',  name: '400×400', note: 'LinkedIn', filename: 'logo-400x400-white-on-black.png', dark: true },
  { key: 'dark256',  name: '256×256', note: 'Favicon',  filename: 'logo-256x256-white-on-black.png', dark: true },
  { key: 'dark192',  name: '192×192', note: 'PWA',      filename: 'logo-192x192-white-on-black.png', dark: true },
  { key: 'dark96',   name: '96×96',   note: 'Thumb',    filename: 'logo-96x96-white-on-black.png',   dark: true },
  { key: 'dark64',   name: '64×64',   note: 'Sidebar',  filename: 'logo-64x64-white-on-black.png',   dark: true },
  { key: 'dark32',   name: '32×32',   note: 'Favicon',  filename: 'logo-32x32-white-on-black.png',   dark: true },
];
const LOGO_SIZES_LIGHT = [
  { key: 'light400', name: '400×400', note: 'LinkedIn', filename: 'logo-400x400-black-on-white.png', dark: false },
  { key: 'light256', name: '256×256', note: 'Favicon',  filename: 'logo-256x256-black-on-white.png', dark: false },
  { key: 'light192', name: '192×192', note: 'PWA',      filename: 'logo-192x192-black-on-white.png', dark: false },
  { key: 'light96',  name: '96×96',   note: 'Thumb',    filename: 'logo-96x96-black-on-white.png',   dark: false },
  { key: 'light64',  name: '64×64',   note: 'Sidebar',  filename: 'logo-64x64-black-on-white.png',   dark: false },
  { key: 'light32',  name: '32×32',   note: 'Favicon',  filename: 'logo-32x32-black-on-white.png',   dark: false },
];

// ── Load banners (JPEG for compact embedding) ─────────────────────────────────
async function loadAllBanners() {
  const results = [];
  for (let i = 1; i <= 10; i++) {
    const num = String(i).padStart(2, '0');
    const relPath = `lucid-lab-brand/05-digital/banner-${num}.png`;
    const absPath = path.join(ROOT, relPath);
    if (!fs.existsSync(absPath)) { console.warn(`  ⚠ Missing ${relPath}`); continue; }
    const b64 = await jpgB64(relPath);
    results.push({ num, b64, downloadPath: `../05-digital/banner-${num}-hd.png`, filename: `lucid-lab-banner-${num}-hd.png` });
  }
  return results;
}

// ── Logo cell HTML ─────────────────────────────────────────────────────────────
function logoCell(size, b64, displayPx) {
  return `<div class="logo-cell ${size.dark ? 'dk' : ''}">
  <img src="data:image/png;base64,${b64}" width="${displayPx}" height="${displayPx}" alt="${size.name}" loading="lazy">
  <span class="logo-sz ${size.dark ? 'logo-sz-dk' : ''}">${size.name}</span>
  <span class="logo-note ${size.dark ? 'logo-note-dk' : ''}">${size.note}</span>
  <button class="dl-btn" onclick="downloadImg(this)" data-name="${size.filename}">↓ PNG</button>
</div>`;
}

// ── Color card HTML ────────────────────────────────────────────────────────────
function colorCard(hex, name, token, usage) {
  return `<div class="cc">
  <div class="cc-swatch" style="background:${hex};"></div>
  <div class="cc-info">
    <div class="cc-name">${name}</div>
    <div class="cc-hex">${hex}</div>
    <div class="cc-token">${token}</div>
    <div class="cc-usage">${usage}</div>
    <button class="copy-btn" onclick="copyText('${hex}', this)">Copier</button>
  </div>
</div>`;
}

// ── Signature HTML ─────────────────────────────────────────────────────────────
function sigVariant(label, logoB64, extraStyle, dlHref) {
  return `<div class="sig-frame">
  <div class="sig-frame-header">
    <p class="lbl">${label}</p>
    <a href="${dlHref}" download class="dl-btn dl-btn-sm">↓ HTML</a>
  </div>
  <table class="sig-table"><tr>
    <td class="sig-logo-cell">
      <img class="sig-logo" style="${extraStyle}" src="data:image/png;base64,${logoB64}" alt="LUCID-LAB">
    </td>
    <td class="sig-content">
      <div class="sig-name">Théo Benard <span class="sig-role">— Fondateur</span></div>
      <div class="sig-tagline"><span class="sig-brand">LUCID-LAB</span> | Cutting-edge AI expertise. Operational excellence.</div>
      <div class="sig-links">
        <a href="https://lucid-lab.fr">lucid-lab.fr</a>
        <span class="sig-sep">|</span>
        <a href="https://www.linkedin.com/in/theobenard/">LinkedIn</a>
      </div>
    </td>
  </tr></table>
</div>`;
}

// ── Generate standalone signature HTML files ───────────────────────────────────
function generateSignatureFiles() {
  const dir = path.join(ROOT, 'lucid-lab-brand/05-digital');
  fs.mkdirSync(dir, { recursive: true });
  const tmpl = (logoUrl, borderStyle) => `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Signature LUCID-LAB</title></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:20px;background:#fff;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;max-width:560px;"><tr>
  <td style="padding-right:22px;border-right:2px solid #E5E7EB;vertical-align:middle;">
    <img src="${logoUrl}" alt="LUCID-LAB" style="width:72px;height:72px;border-radius:12px;display:block;${borderStyle}">
  </td>
  <td style="padding-left:22px;vertical-align:middle;">
    <p style="margin:0;font-size:17px;font-weight:700;color:#1f2937;">Théo Benard <span style="font-weight:400;color:#6b7280;">— Fondateur</span></p>
    <p style="margin:4px 0 0;font-size:13px;color:#4b5563;"><strong style="color:#C85E1A;">LUCID-LAB</strong> | Cutting-edge AI expertise. Operational excellence.</p>
    <p style="margin:10px 0 0;font-size:13px;">
      <a href="https://lucid-lab.fr" style="color:#374151;text-decoration:none;font-weight:500;">lucid-lab.fr</a>
      <span style="color:#cbd5e1;margin:0 8px;">|</span>
      <a href="https://www.linkedin.com/in/theobenard/" style="color:#374151;text-decoration:none;font-weight:500;">LinkedIn</a>
    </p>
  </td>
</tr></table>
</body></html>`;

  const dark  = 'https://lucid-lab.fr/logos/avatar-dark.png';
  const light = 'https://lucid-lab.fr/logos/avatar-light.png';
  fs.writeFileSync(path.join(dir, 'signature-email-dark-logo.html'),      tmpl(dark,  ''), 'utf8');
  fs.writeFileSync(path.join(dir, 'signature-email-light-logo.html'),     tmpl(light, ''), 'utf8');
  fs.writeFileSync(path.join(dir, 'signature-email-light-bordered.html'), tmpl(light, 'border:2px solid #0A0A0A;'), 'utf8');
  console.log('  ✓ 3 signature HTML files');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Loading assets...');
  const banners = await loadAllBanners();
  generateSignatureFiles();

  const displaySizes = [80, 64, 48, 40, 32, 24];
  const logoCellsDark  = LOGO_SIZES.map((s, i) => logoCell(s, logos[s.key], displaySizes[i])).join('\n');
  const logoCellsLight = LOGO_SIZES_LIGHT.map((s, i) => logoCell(s, logos[s.key], displaySizes[i])).join('\n');

  const COLORS = [
    ['#0A0A0A','Noir absolu',    '--black',      'Fonds sombres, texte primaire'],
    ['#1C1C1C','Anthracite',     '--anthracite', 'Surfaces premium, cartes sombres'],
    ['#525252','Gris graphite',  '--gray',       'Texte secondaire, légendes, muted'],
    ['#E5E5E5','Gris clair',     '--light-gray', 'Filets, séparateurs, fonds neutres'],
    ['#F7F5F1','Papier chaud',   '--warm',       'Fond principal du site'],
    ['#FFFFFF','Blanc pur',      '--pure-white', 'Cartes, exports, contraste maximal'],
    ['#C85E1A','Ember 🔥',        '--ember',      'ACCENT UNIQUE — CTA, liens, hover'],
    ['#B4D8FF','Bleu Lex',       '--cold',       'Lueur robot — décorative seulement'],
    ['#3F7D5B','Vert système',   '--success',    'Succès, validation, état positif'],
    ['#FFB451','Ambre signal',   '--warning',    'Warning, attention, alerte'],
    ['#B94A48','Rouge incident', '--error',      'Erreur, incident, risque bloquant'],
  ];

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LUCID-LAB — Charte Graphique</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Figtree:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --black:#0A0A0A;--anthracite:#1C1C1C;--gray:#525252;--light-gray:#E5E5E5;
  --warm:#F7F5F1;--pure-white:#FFFFFF;--ember:#C85E1A;--cold:#B4D8FF;
  --success:#3F7D5B;--warning:#FFB451;--error:#B94A48;
  --ff-head:'Syne',sans-serif;--ff-body:'Figtree',sans-serif;
  --page-max:1120px;--radius:12px;--radius-sm:8px;
}
body{font-family:var(--ff-body);background:var(--warm);color:var(--black);line-height:1.6}

/* COVER */
.cover{background:var(--black);color:var(--pure-white);min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:80px;position:relative;overflow:hidden}
.cover::after{content:'';position:absolute;top:-30%;right:-5%;width:500px;height:500px;background:radial-gradient(circle,rgba(200,94,26,.1) 0%,transparent 70%);pointer-events:none}
.cover-logo{width:96px;height:96px;border-radius:16px;margin-bottom:48px;position:relative;z-index:1}
.cover-eyebrow{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--gray);margin-bottom:20px;position:relative;z-index:1}
.cover-title{font-family:var(--ff-head);font-size:clamp(52px,7vw,88px);font-weight:800;line-height:1.02;letter-spacing:-2px;position:relative;z-index:1}
.cover-title em{color:var(--ember);font-style:normal}
.cover-divider{width:48px;height:2px;background:var(--ember);margin:40px 0;position:relative;z-index:1}
.cover-desc{max-width:480px;font-size:16px;color:#888;line-height:1.7;position:relative;z-index:1}
.cover-meta{margin-top:64px;font-size:12px;color:var(--gray);letter-spacing:.06em;position:relative;z-index:1}

/* NAV */
.nav{background:var(--anthracite);color:var(--pure-white);padding:0 80px;display:flex;gap:0;flex-wrap:wrap;position:sticky;top:0;z-index:100;border-bottom:1px solid #2a2a2a}
.nav a{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#666;text-decoration:none;padding:16px;border-bottom:2px solid transparent;transition:color .15s,border-color .15s}
.nav a:hover{color:var(--pure-white);border-color:var(--ember)}

/* SECTION */
.section{max-width:var(--page-max);margin:0 auto;padding:80px 40px}
.section-divider{border:none;border-top:1px solid var(--light-gray)}
.sh{display:flex;align-items:baseline;gap:20px;margin-bottom:12px}
.sh-num{font-family:var(--ff-head);font-size:56px;font-weight:800;color:var(--light-gray);line-height:1}
.sh-label{font-family:var(--ff-head);font-size:28px;font-weight:800}
.sh-desc{font-size:15px;color:var(--gray);max-width:600px;line-height:1.65;margin-bottom:48px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media(max-width:700px){.g2{grid-template-columns:1fr}}
.card{border:1px solid var(--light-gray);border-radius:var(--radius);padding:28px;background:var(--pure-white)}
.card-dk{background:var(--black);border-color:#222;color:var(--pure-white)}
.card-an{background:var(--anthracite);border-color:#333;color:var(--pure-white)}
.lbl{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gray);margin-bottom:10px}
.lbl-w{color:#555}

/* INTERACTIVE BUTTONS */
.dl-btn{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-family:var(--ff-body);letter-spacing:.04em;padding:5px 12px;border-radius:6px;cursor:pointer;background:var(--black);color:var(--pure-white);border:1px solid var(--black);text-decoration:none;transition:background .15s,border-color .15s;margin-top:8px}
.dl-btn:hover{background:var(--ember);border-color:var(--ember)}
.dl-btn-sm{margin-top:0;padding:4px 10px;font-size:10px}
.copy-btn{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-family:var(--ff-body);letter-spacing:.04em;padding:4px 10px;border-radius:6px;cursor:pointer;background:transparent;color:var(--gray);border:1px solid var(--light-gray);transition:all .15s;margin-top:8px}
.copy-btn:hover{color:var(--black);border-color:var(--black)}
.copy-btn.copied{color:var(--success)!important;border-color:var(--success)!important}

/* COLOR CARDS */
.color-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px}
.cc{border-radius:var(--radius);overflow:hidden;border:1px solid var(--light-gray)}
.cc-swatch{height:80px}
.cc-info{padding:14px 16px;background:var(--pure-white)}
.cc-name{font-family:var(--ff-head);font-size:14px;font-weight:700;margin-bottom:4px}
.cc-hex{font-family:monospace;font-size:13px;color:var(--gray)}
.cc-token{font-family:monospace;font-size:11px;color:var(--ember);margin-top:2px}
.cc-usage{font-size:11px;color:var(--gray);margin-top:6px;line-height:1.45}

/* LOGO GRID */
.logo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:16px}
.logo-cell{border:1px solid var(--light-gray);border-radius:var(--radius);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 12px;gap:8px}
.logo-cell.dk{background:var(--black);border-color:#222}
.logo-cell img{max-width:100%;object-fit:contain}
.logo-sz{font-size:11px;color:var(--gray);letter-spacing:.04em;font-family:monospace}
.logo-sz-dk{color:#555}
.logo-note{font-size:10px;color:var(--gray)}
.logo-note-dk{color:#444}

/* TYPOGRAPHY */
.type-block{border:1px solid var(--light-gray);border-radius:var(--radius);padding:36px;background:var(--pure-white)}
.font-name-tag{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gray);margin-bottom:10px}
.font-big{font-size:52px;font-weight:800;line-height:1}
.font-weights{display:flex;gap:28px;flex-wrap:wrap;margin-top:14px}
.fw{font-size:14px}
.font-meta{font-family:monospace;font-size:11px;color:var(--gray);margin-top:14px}
.type-scale-row{display:flex;flex-direction:column;gap:24px}
.ts-item{display:flex;align-items:baseline;gap:20px}
.ts-label{font-size:11px;color:var(--gray);letter-spacing:.08em;font-family:monospace;min-width:200px;flex-shrink:0}

/* SPACING */
.spacing-row{display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap}
.sp-item{display:flex;flex-direction:column;align-items:center;gap:8px}
.sp-bar{background:var(--ember);width:36px;border-radius:4px}
.sp-val{font-family:monospace;font-size:11px;color:var(--gray)}
.sp-name{font-family:monospace;font-size:10px;color:var(--ember)}

/* RULES */
.rules-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.rule-do{border:1px solid var(--success);border-radius:var(--radius);padding:24px}
.rule-dont{border:1px solid var(--error);border-radius:var(--radius);padding:24px}
.rule-badge{font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block;margin-bottom:16px}
.rb-do{background:rgba(63,125,91,.1);color:var(--success)}
.rb-dont{background:rgba(185,74,72,.1);color:var(--error)}
.rule-list{list-style:none;display:flex;flex-direction:column;gap:10px}
.rule-list li{font-size:14px;color:var(--gray);line-height:1.5}
.rule-list strong{color:var(--black)}

/* BANNERS */
.banner-item{margin-bottom:28px}
.banner-wrap{border-radius:var(--radius);overflow:hidden;border:1px solid #1a1a1a}
.banner-wrap img{width:100%;display:block}
.banner-footer{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:0 2px}
.banner-label-text{font-size:13px;color:var(--gray)}
.banner-spec{font-family:monospace;font-size:12px;color:var(--ember)}

/* SIGNATURE */
.sig-frame{border:1px solid var(--light-gray);border-radius:var(--radius);padding:32px 40px;background:var(--pure-white);margin-bottom:20px}
.sig-frame-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.sig-table{border-collapse:collapse}
.sig-logo-cell{padding-right:22px;border-right:2px solid #E5E7EB;vertical-align:middle}
.sig-logo{width:72px;height:72px;border-radius:12px;display:block}
.sig-content{padding-left:22px;vertical-align:middle}
.sig-name{font-family:var(--ff-body);font-size:17px;font-weight:700;color:#1f2937;line-height:1.3}
.sig-role{font-weight:400;color:#6b7280}
.sig-tagline{font-size:13px;color:#4b5563;margin-top:4px}
.sig-brand{font-weight:700;color:var(--ember)}
.sig-links{font-size:13px;margin-top:10px}
.sig-links a{color:#374151;text-decoration:none;font-weight:500}
.sig-sep{color:#cbd5e1;margin:0 8px}

/* TOKENS */
.token-pre{background:var(--black);color:#e2e8f0;border-radius:var(--radius);padding:36px;font-family:'Courier New',monospace;font-size:13px;line-height:1.8;overflow:auto;position:relative}
.token-copy-btn{position:absolute;top:16px;right:16px;font-size:11px;font-family:var(--ff-body);padding:6px 14px;border-radius:6px;cursor:pointer;background:#222;color:#aaa;border:1px solid #333;transition:all .15s}
.token-copy-btn:hover{background:var(--ember);color:var(--pure-white);border-color:var(--ember)}

/* FOOTER */
.footer{background:var(--black);color:#444;padding:40px 80px;font-size:13px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.footer strong{color:var(--pure-white)}
.footer a{color:var(--ember);text-decoration:none}

/* TOAST */
.toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:var(--anthracite);color:var(--pure-white);padding:10px 20px;border-radius:8px;font-size:13px;opacity:0;pointer-events:none;transition:opacity .2s;z-index:9999;white-space:nowrap}
.toast.show{opacity:1}
</style>
</head>
<body>
<div class="toast" id="toast"></div>

<!-- ═══ COVER ═════════════════════════════════════════════════════════════ -->
<section class="cover">
  <img class="cover-logo" src="data:image/png;base64,${logos.dark400}" alt="LUCID-LAB">
  <p class="cover-eyebrow">Identité visuelle · Document interne &amp; client · Mai 2026</p>
  <h1 class="cover-title">Charte<br>Graphique<br><em>LUCID-LAB</em></h1>
  <div class="cover-divider"></div>
  <p class="cover-desc">Référence unique pour l'ensemble des usages de la marque — digital, print, communication client, assets produit et marketing.</p>
  <p class="cover-meta">lucid-lab.fr</p>
</section>

<!-- NAV -->
<nav class="nav">
  <a href="#intro">01 · Intro</a>
  <a href="#logo">02 · Logo</a>
  <a href="#couleurs">03 · Couleurs</a>
  <a href="#typo">04 · Typo</a>
  <a href="#espacement">05 · Espacement</a>
  <a href="#usage">06 · Usage</a>
  <a href="#bannieres">07 · Bannières</a>
  <a href="#signature">08 · Signature</a>
  <a href="#tokens">09 · Tokens</a>
</nav>

<!-- ═══ 01 — POSITIONNEMENT ══════════════════════════════════════════════ -->
<hr class="section-divider" id="intro">
<div class="section">
  <div class="sh"><span class="sh-num">01</span><h2 class="sh-label">Positionnement</h2></div>
  <p class="sh-desc">Ce document est la référence unique pour tout usage de la marque Lucid-Lab — communication digitale, documents clients, assets marketing et produit.</p>
  <div class="g2">
    <div class="card">
      <p class="lbl">Personnalité de marque</p>
      <p style="font-family:var(--ff-head);font-size:22px;font-weight:800;margin-bottom:14px;">Précis · Expert · Direct</p>
      <p style="font-size:14px;color:var(--gray);line-height:1.65;">Lucid-Lab est une agence d'IA B2B. L'identité visuelle reflète la rigueur technique, le pragmatisme opérationnel et une esthétique premium sobre.</p>
    </div>
    <div class="card card-dk">
      <p class="lbl lbl-w">Proposition de valeur</p>
      <p style="font-family:var(--ff-head);font-size:20px;font-weight:800;margin-bottom:14px;line-height:1.2;">Cutting-edge AI expertise.<br><span style="color:var(--ember)">Operational excellence.</span></p>
      <p style="font-size:13px;color:#666;line-height:1.65;">Audit → Roadmap → Build → Deploy → Documentation. Un cycle complet livré en production.</p>
    </div>
  </div>
</div>

<!-- ═══ 02 — LOGO ════════════════════════════════════════════════════════ -->
<hr class="section-divider" id="logo">
<div class="section">
  <div class="sh"><span class="sh-num">02</span><h2 class="sh-label">Logo — Mark</h2></div>
  <p class="sh-desc">Le mark est un "L" stylisé — double trait diagonal évoquant vélocité et précision. Padding 12% pré-intégré dans tous les exports. Cliquez ↓ PNG pour télécharger.</p>

  <h3 style="font-family:var(--ff-head);font-size:15px;font-weight:700;margin-bottom:16px;color:var(--gray);letter-spacing:.04em;text-transform:uppercase;">Blanc sur fond noir — principale</h3>
  <div class="logo-grid" style="margin-bottom:40px;">
    ${logoCellsDark}
  </div>

  <h3 style="font-family:var(--ff-head);font-size:15px;font-weight:700;margin-bottom:16px;color:var(--gray);letter-spacing:.04em;text-transform:uppercase;">Noir sur fond blanc — secondaire</h3>
  <div class="logo-grid" style="margin-bottom:48px;">
    ${logoCellsLight}
  </div>

  <div class="card card-dk" style="margin-bottom:24px;">
    <p class="lbl lbl-w">Format 1024 px — Impression &amp; Production HD</p>
    <p style="font-size:13px;color:#666;margin-top:6px;margin-bottom:16px;">Utilisez ces fichiers pour l'impression, les OG images haute résolution, et tout usage nécessitant un rendu net à grande taille.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <a href="data:image/png;base64,${logos.dark1024}" download="logo-1024x1024-white-on-black.png" class="dl-btn">↓ 1024px — Blanc sur Noir</a>
      <a href="data:image/png;base64,${logos.light1024}" download="logo-1024x1024-black-on-white.png" class="dl-btn">↓ 1024px — Noir sur Blanc</a>
    </div>
  </div>

  <div class="card card-an">
    <p class="lbl lbl-w">Tailles disponibles</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:12px;">
      ${[['1024×1024','Impression HD, OG Image'],['512×512','App icons, @2x'],['400×400','Photo de profil LinkedIn'],['256×256','Favicon HD, profil email'],['192×192','PWA manifest'],['96×96','Thumbnails'],['64×64','Sidebar apps'],['32×32','Browser favicon']].map(([s,u])=>`<div style="border:1px solid #333;border-radius:8px;padding:12px 14px;"><p style="font-family:monospace;font-size:12px;color:var(--ember);">${s}</p><p style="font-size:12px;color:#666;margin-top:4px;">${u}</p></div>`).join('')}
    </div>
  </div>
</div>

<!-- ═══ 03 — COULEURS ════════════════════════════════════════════════════ -->
<hr class="section-divider" id="couleurs">
<div class="section">
  <div class="sh"><span class="sh-num">03</span><h2 class="sh-label">Palette de couleurs</h2></div>
  <p class="sh-desc">Palette minimaliste fondée sur le contraste maximum. L'ember est l'unique accent chromatique. Cliquez "Copier" sur chaque couleur pour copier son code hex.</p>

  <div style="display:flex;gap:0;border-radius:var(--radius);overflow:hidden;height:48px;margin-bottom:40px;border:1px solid #ddd;">
    ${[['#0A0A0A','8%'],['#1C1C1C','10%'],['#525252','10%'],['#E5E5E5','12%'],['#F7F5F1','25%'],['#FFFFFF','20%'],['#C85E1A','15%']].map(([c,w])=>`<div style="background:${c};width:${w};flex-shrink:0;"></div>`).join('')}
  </div>

  <div class="color-cards">
    ${COLORS.map(([hex,name,token,usage]) => colorCard(hex,name,token,usage)).join('\n')}
  </div>

  <div class="card card-dk" style="margin-top:32px;">
    <p class="lbl lbl-w" style="color:var(--ember);">⚡ Règle absolue</p>
    <p style="font-size:14px;color:#999;line-height:1.7;margin-top:8px;">L'<strong style="color:var(--ember)">ember (#C85E1A)</strong> est le seul accent coloré autorisé. Il ne coexiste jamais avec une autre couleur vive. <strong style="color:var(--pure-white)">Aucun dégradé multicolore, aucun fond coloré hors palette.</strong></p>
  </div>
</div>

<!-- ═══ 04 — TYPOGRAPHIE ══════════════════════════════════════════════════ -->
<hr class="section-divider" id="typo">
<div class="section">
  <div class="sh"><span class="sh-num">04</span><h2 class="sh-label">Typographie</h2></div>
  <p class="sh-desc">Deux familles. Syne pour les titres — impact fort. Figtree pour le corps — lisibilité maximale sur écran. Cliquez "Copier CSS" pour copier la déclaration.</p>

  <div class="g2" style="margin-bottom:32px;">
    <div class="card">
      <div class="font-name-tag">Syne — Titres &amp; Display</div>
      <div class="font-big" style="font-family:'Syne',sans-serif;">LUCID-LAB</div>
      <div class="font-weights">
        <span class="fw" style="font-family:'Syne',sans-serif;font-weight:400;">Regular</span>
        <span class="fw" style="font-family:'Syne',sans-serif;font-weight:600;">Semibold</span>
        <span class="fw" style="font-family:'Syne',sans-serif;font-weight:700;">Bold</span>
        <span class="fw" style="font-family:'Syne',sans-serif;font-weight:800;">ExtraBold</span>
      </div>
      <div class="font-meta">font-family: 'Syne', sans-serif</div>
      <button class="copy-btn" onclick="copyText(&quot;font-family: 'Syne', sans-serif;&quot;, this)">Copier CSS</button>
    </div>
    <div class="card">
      <div class="font-name-tag">Figtree — Corps de texte</div>
      <div class="font-big" style="font-family:'Figtree',sans-serif;font-size:36px;">Automatisation IA</div>
      <div class="font-weights">
        <span class="fw" style="font-family:'Figtree',sans-serif;font-weight:300;">Light</span>
        <span class="fw" style="font-family:'Figtree',sans-serif;font-weight:400;">Regular</span>
        <span class="fw" style="font-family:'Figtree',sans-serif;font-weight:500;">Medium</span>
        <span class="fw" style="font-family:'Figtree',sans-serif;font-weight:600;">Semibold</span>
      </div>
      <div class="font-meta">font-family: 'Figtree', sans-serif</div>
      <button class="copy-btn" onclick="copyText(&quot;font-family: 'Figtree', sans-serif;&quot;, this)">Copier CSS</button>
    </div>
  </div>

  <div class="type-block">
    <div class="font-name-tag" style="margin-bottom:24px;">Hiérarchie typographique</div>
    <div class="type-scale-row">
      <div class="ts-item"><span class="ts-label">Display · Syne 800 · 56px · ls -1px</span><span style="font-family:'Syne',sans-serif;font-size:52px;font-weight:800;line-height:1.05;letter-spacing:-1px;">Cutting-edge AI.</span></div>
      <div class="ts-item"><span class="ts-label">H1 · Syne 800 · 40px</span><span style="font-family:'Syne',sans-serif;font-size:38px;font-weight:800;line-height:1.1;">Automatisez vos processus</span></div>
      <div class="ts-item"><span class="ts-label">H2 · Syne 700 · 28px</span><span style="font-family:'Syne',sans-serif;font-size:26px;font-weight:700;">Comment ça fonctionne</span></div>
      <div class="ts-item"><span class="ts-label">H3 · Syne 700 · 20px</span><span style="font-family:'Syne',sans-serif;font-size:19px;font-weight:700;">Phase 1 — Audit &amp; Roadmap</span></div>
      <div class="ts-item"><span class="ts-label">Body · Figtree 400 · 16px · lh 1.65</span><span style="font-family:'Figtree',sans-serif;font-size:15px;line-height:1.65;max-width:520px;">Lucid-Lab conçoit et déploie des systèmes d'IA opérationnels : agents, automations, outils internes et intégrations.</span></div>
      <div class="ts-item"><span class="ts-label">Small · Figtree 400 · 13px · #525252</span><span style="font-family:'Figtree',sans-serif;font-size:13px;color:var(--gray);">Mai 2026 · Confidentiel · lucid-lab.fr</span></div>
      <div class="ts-item"><span class="ts-label">Label · Figtree 600 · 11px · uppercase</span><span style="font-family:'Figtree',sans-serif;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;">Étude de cas · Automatisation</span></div>
    </div>
  </div>
</div>

<!-- ═══ 05 — ESPACEMENT ═══════════════════════════════════════════════════ -->
<hr class="section-divider" id="espacement">
<div class="section">
  <div class="sh"><span class="sh-num">05</span><h2 class="sh-label">Espacement &amp; Grille</h2></div>
  <p class="sh-desc">Système basé sur 8px. Toute valeur est un multiple de 4 ou 8. Max-width 1120px, gouttières 40px. Border-radius : 12px cartes, 8px petits éléments.</p>
  <div class="spacing-row">
    ${[[4,'4px','xs'],[8,'8px','sm'],[12,'12px',''],[16,'16px','md'],[24,'24px','lg'],[32,'32px','xl'],[40,'40px','2xl'],[48,'48px','3xl'],[64,'64px','4xl'],[80,'80px','5xl']].map(([h,v,n])=>`<div class="sp-item"><div class="sp-bar" style="height:${h}px;"></div><span class="sp-val">${v}</span>${n?`<span class="sp-name">${n}</span>`:''}</div>`).join('')}
  </div>
</div>

<!-- ═══ 06 — RÈGLES D'USAGE ══════════════════════════════════════════════ -->
<hr class="section-divider" id="usage">
<div class="section">
  <div class="sh"><span class="sh-num">06</span><h2 class="sh-label">Règles d'usage du logo</h2></div>
  <p class="sh-desc">Zone d'exclusion de 12% sur chaque côté — pré-intégrée dans tous les PNG exportés.</p>
  <div class="rules-grid">
    <div class="rule-do">
      <span class="rule-badge rb-do">✓ À faire</span>
      <ul class="rule-list">
        <li>Utiliser la version <strong>blanche sur noir</strong> en principal</li>
        <li>Respecter un <strong>padding ≥ 12%</strong> autour du mark</li>
        <li>Utiliser le noir sur blanc pour les <strong>documents imprimés</strong></li>
        <li>Maintenir les <strong>proportions 1:1</strong></li>
        <li>Placer sur fond <strong>uni</strong> ou avec overlay suffisant</li>
      </ul>
    </div>
    <div class="rule-dont">
      <span class="rule-badge rb-dont">✗ À ne pas faire</span>
      <ul class="rule-list">
        <li><strong style="color:var(--error)">Déformer</strong> le logo (étirer, compresser)</li>
        <li><strong style="color:var(--error)">Recoloriser</strong> hors de la palette officielle</li>
        <li><strong style="color:var(--error)">Ajouter</strong> ombres, glow ou effets non définis</li>
        <li><strong style="color:var(--error)">Placer</strong> sur photo sans overlay sombre</li>
        <li><strong style="color:var(--error)">Utiliser</strong> à moins de 32px en production</li>
      </ul>
    </div>
  </div>
</div>

<!-- ═══ 07 — BANNIÈRES LINKEDIN ══════════════════════════════════════════ -->
<hr class="section-divider" id="bannieres">
<div class="section">
  <div class="sh"><span class="sh-num">07</span><h2 class="sh-label">Bannières LinkedIn</h2></div>
  <p class="sh-desc">Format Company Page : <strong>1128 × 191 px</strong>. Décaler le texte à droite pour éviter d'être masqué par la photo de profil en bas à gauche. Cliquez ↓ PNG HD pour télécharger.</p>
  <div class="card card-dk" style="margin-bottom:32px;">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
      <div><p class="lbl lbl-w">Company Banner</p><p style="font-family:monospace;color:var(--ember);">1128 × 191 px</p></div>
      <div><p class="lbl lbl-w">Photo de profil</p><p style="font-family:monospace;color:var(--ember);">400 × 400 px</p></div>
      <div><p class="lbl lbl-w">Format source</p><p style="font-family:monospace;color:var(--ember);">PNG · RGB</p></div>
    </div>
  </div>
  ${banners.map(b => `<div class="banner-item">
  <div class="banner-wrap">
    <img src="data:image/jpeg;base64,${b.b64}" alt="Bannière ${b.num}" loading="lazy">
  </div>
  <div class="banner-footer">
    <span class="banner-label-text">Bannière ${b.num}</span>
    <div style="display:flex;align-items:center;gap:12px;">
      <span class="banner-spec">2256 × 382 px · PNG @2×</span>
      <a href="${b.downloadPath}" download="${b.filename}" class="dl-btn dl-btn-sm">↓ PNG HD @2×</a>
    </div>
  </div>
</div>`).join('\n')}
</div>

<!-- ═══ 08 — SIGNATURE EMAIL ════════════════════════════════════════════ -->
<hr class="section-divider" id="signature">
<div class="section">
  <div class="sh"><span class="sh-num">08</span><h2 class="sh-label">Signature Email</h2></div>
  <p class="sh-desc">Compatible Gmail &amp; Outlook. Logo chargé depuis l'URL publique de production. Fond blanc uniquement. Cliquez ↓ HTML pour télécharger le fichier à coller dans Gmail.</p>

  ${sigVariant('Version principale — Logo blanc sur fond noir', logos.dark400, '', '../05-digital/signature-email-dark-logo.html')}
  ${sigVariant('Version secondaire — Logo noir sur fond blanc', logos.light400, '', '../05-digital/signature-email-light-logo.html')}
  ${sigVariant('Version avec contour — Logo noir sur fond blanc + border', logos.light400, 'border:2px solid #0A0A0A;', '../05-digital/signature-email-light-bordered.html')}

  <div class="card" style="margin-top:8px;">
    <p class="lbl">Instructions — Gmail</p>
    <ol style="font-size:14px;line-height:2.4;color:var(--gray);padding-left:20px;margin-top:10px;">
      <li>Télécharger le fichier HTML (bouton ↓ HTML ci-dessus)</li>
      <li>Ouvrir dans Chrome → sélectionner tout (<strong>Cmd+A</strong>) → copier (<strong>Cmd+C</strong>)</li>
      <li>Gmail : ⚙️ Paramètres → Signature → Coller dans le champ riche</li>
      <li>S'assurer que <code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">public/logos/</code> est déployé sur Vercel</li>
    </ol>
  </div>
</div>

<!-- ═══ 09 — DESIGN TOKENS ══════════════════════════════════════════════ -->
<hr class="section-divider" id="tokens">
<div class="section">
  <div class="sh"><span class="sh-num">09</span><h2 class="sh-label">Design Tokens CSS</h2></div>
  <p class="sh-desc">Variables CSS à copier dans <code style="background:#f0eeea;padding:2px 6px;border-radius:4px;">globals.css</code>. Cliquez "Copier tout" pour copier d'un coup.</p>
  <div class="token-pre" id="tokenBlock">
    <button class="token-copy-btn" onclick="copyTokens()">Copier tout</button>
<pre id="tokenText">:root {
  /* ── Colors ─────────────────────────────────── */
  --black:      #0A0A0A;     /* Fonds sombres, texte */
  --anthracite: #1C1C1C;     /* Surfaces premium */
  --gray:       #525252;     /* Texte secondaire */
  --light-gray: #E5E5E5;     /* Filets, séparateurs */
  --warm:       #F7F5F1;     /* Fond principal site */
  --pure-white: #FFFFFF;     /* Cartes, exports */
  --ember:      #C85E1A;     /* ACCENT UNIQUE */
  --cold:       #B4D8FF;     /* Déco robot seulement */
  --success:    #3F7D5B;
  --warning:    #FFB451;
  --error:      #B94A48;

  /* ── Typography ──────────────────────────────── */
  --ff-head: 'Syne', sans-serif;
  --ff-body: 'Figtree', sans-serif;

  /* ── Layout ──────────────────────────────────── */
  --page-max:    1120px;
  --gutter:      40px;
  --radius:      12px;
  --radius-sm:   8px;
  --radius-full: 9999px;

  /* ── Spacing (8px base) ──────────────────────── */
  --s1:  4px;   --s2:  8px;   --s3:  12px;  --s4:  16px;
  --s6:  24px;  --s8:  32px;  --s10: 40px;  --s12: 48px;
  --s16: 64px;  --s20: 80px;

  /* ── Motion ──────────────────────────────────── */
  --ease:     cubic-bezier(0.4, 0, 0.2, 1);
  --dur-fast: 150ms;
  --dur:      250ms;
  --dur-slow: 400ms;
}</pre>
  </div>
</div>

<!-- FOOTER -->
<footer class="footer">
  <div><strong>LUCID-LAB</strong> — Charte Graphique</div>
  <div>Mai 2026 &nbsp;·&nbsp; <a href="https://lucid-lab.fr">lucid-lab.fr</a> &nbsp;·&nbsp; <a href="mailto:theo@lucid-lab.fr">theo@lucid-lab.fr</a></div>
</footer>

<script>
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function copyText(text, btn) {
  const doIt = () => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copié !';
    btn.classList.add('copied');
    showToast('Copié : ' + text);
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1600);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(doIt);
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    doIt();
  }
}

function copyTokens() {
  const text = document.getElementById('tokenText').textContent;
  const btn = document.querySelector('.token-copy-btn');
  const orig = btn.textContent;
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
    .then(() => {
      btn.textContent = '✓ Copié !';
      showToast('Design tokens copiés');
      setTimeout(() => { btn.textContent = orig; }, 1800);
    })
    .catch(() => {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      btn.textContent = '✓ Copié !';
      showToast('Design tokens copiés');
      setTimeout(() => { btn.textContent = orig; }, 1800);
    });
}

function downloadImg(btn) {
  const img = btn.parentElement.querySelector('img');
  const a = document.createElement('a');
  a.href = img.src;
  a.download = btn.dataset.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Téléchargement : ' + btn.dataset.name);
}
</script>
</body>
</html>`;

  const outPath = path.join(ROOT, 'lucid-lab-brand/00-overview/charte-graphique.html');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`\n✅ Charte graphique générée — ${kb} Ko`);
  console.log(`   → lucid-lab-brand/00-overview/charte-graphique.html`);
  console.log(`   Bannières : ${banners.length}/10`);
}

main().catch(e => { console.error(e); process.exit(1); });
