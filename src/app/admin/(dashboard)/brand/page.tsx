import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Download,
  ImageIcon,
  Mail,
  Palette,
  Square,
  Type,
} from 'lucide-react';
import { ColorPalette } from './ColorPalette';

export default function BrandPage() {
  const banners = Array.from({ length: 10 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return { n, src: `/brand/banners/linkedin-banner-${n}.jpg`, recommended: n === '07' || n === '10' };
  });

  const logos = [
    { label: 'Avatar sombre (400×400)', src: '/logos/avatar-dark.png', dl: '/logos/avatar-dark.png', bg: 'bg-zinc-900' },
    { label: 'Avatar clair (400×400)',  src: '/logos/avatar-light.png', dl: '/logos/avatar-light.png', bg: 'bg-zinc-100' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Palette className="size-4 text-zinc-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">Marque</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Charte de marque</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Logos, couleurs, typographie, bannières LinkedIn et signatures email.
          </p>
        </div>
        <a
          href="/lucid-lab-brand/00-overview/charte-graphique.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
        >
          Charte complète
          <ArrowUpRight className="size-3.5" />
        </a>
      </div>

      {/* Quick stats */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Square, label: '3 variantes logo', sub: 'Compact, horizontal, principal' },
          { icon: Palette, label: '11 couleurs', sub: 'Palette officielle v3.0' },
          { icon: ImageIcon, label: '10 bannières', sub: 'LinkedIn, format AI' },
          { icon: Mail, label: '2 signatures', sub: 'Claire & sombre' },
        ].map((s, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <s.icon className="mb-2 size-4 text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-800">{s.label}</p>
            <p className="text-xs text-zinc-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Logos */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3">
          <Square className="size-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-800">Logo</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {logos.map((logo) => (
            <div key={logo.src} className={`flex flex-col overflow-hidden rounded-lg border border-zinc-200 shadow-sm`}>
              <div className={`flex h-24 items-center justify-center ${logo.bg} p-4`}>
                <Image
                  src={logo.src}
                  alt={logo.label}
                  width={72}
                  height={72}
                  className="object-contain"
                />
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-2.5">
                <span className="text-xs text-zinc-500">{logo.label}</span>
                <a
                  href={logo.dl}
                  download
                  className="ml-2 flex items-center gap-1 rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-orange-300 hover:text-orange-600"
                >
                  <Download className="size-2.5" />
                  PNG
                </a>
              </div>
            </div>
          ))}

          {/* SVG logos */}
          {[
            { label: 'Logo compact SVG', file: 'logo-compact.svg' },
            { label: 'Logo horizontal SVG', file: 'logo-horizontal.svg' },
          ].map((svgLogo) => (
            <div key={svgLogo.file} className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <div className="flex h-24 items-center justify-center bg-zinc-950 p-4">
                <img
                  src={`/brand/svg/${svgLogo.file}`}
                  alt={svgLogo.label}
                  className="h-12 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-xs text-zinc-600">SVG</span>
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-2.5">
                <span className="text-xs text-zinc-500">{svgLogo.label}</span>
                <span className="text-[10px] text-zinc-300">Fichier local</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Les SVG complets sont dans <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-zinc-600">lucid-lab-brand/01-logo/svg/</code>. 
          La charte complète contient tous les formats avec téléchargements intégrés.
        </p>
      </section>

      {/* Colors */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3">
          <Palette className="size-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-800">Couleurs</h2>
          <span className="ml-auto text-xs text-zinc-400">Cliquer pour copier le code hex</span>
        </div>
        <ColorPalette />
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="mb-2 text-xs font-medium text-zinc-500">Variables CSS</p>
          <pre className="overflow-x-auto text-[11px] leading-6 text-zinc-600">
{`:root {
  --black: #0A0A0A;      --anthracite: #1C1C1C;   --gray: #525252;
  --light-gray: #E5E5E5; --warm-white: #F7F5F1;   --pure-white: #FFFFFF;
  --ember: #C85E1A;      --sky: #B4D8FF;           --olive: #3F7D5B;
  --amber: #FFB451;      --error: #B94A48;
}`}
          </pre>
        </div>
      </section>

      {/* Typography */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3">
          <Type className="size-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-800">Typographie</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">Primaire</p>
            <div className="font-['Syne',_sans-serif] text-3xl font-black tracking-tight text-zinc-900">Syne 800</div>
            <p className="mt-2 text-xs text-zinc-500">Display, hero, titres de marque, wordmark</p>
            <p className="mt-1 font-mono text-[10px] text-zinc-300">font-family: &apos;Syne&apos;, sans-serif</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">Secondaire</p>
            <div className="text-3xl font-bold text-zinc-900">Figtree 700</div>
            <p className="mt-2 text-xs text-zinc-500">Corps de texte, interface, labels, captions</p>
            <p className="mt-1 font-mono text-[10px] text-zinc-300">font-family: &apos;Figtree&apos;, sans-serif</p>
          </div>
        </div>
      </section>

      {/* Banners */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3">
          <ImageIcon className="size-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-800">Bannières LinkedIn</h2>
          <span className="ml-auto text-xs text-zinc-400">Recommandées : 07 et 10</span>
        </div>
        <div className="flex flex-col gap-3">
          {banners.map(({ n, src, recommended }) => (
            <div key={n} className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
              <div className="relative bg-zinc-900">
                <Image
                  src={src}
                  alt={`Bannière LinkedIn ${n}`}
                  width={1200}
                  height={200}
                  className="w-full object-cover"
                  unoptimized
                />
                {recommended && (
                  <span className="absolute right-3 top-3 rounded-full bg-orange-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                    ✓ Recommandée
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between bg-white px-4 py-2.5">
                <span className="text-xs font-medium text-zinc-600">Bannière {n}</span>
                <a
                  href={src}
                  download={`lucid-lab-linkedin-banner-${n}.jpg`}
                  className="flex items-center gap-1.5 rounded border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:border-orange-300 hover:text-orange-600"
                >
                  <Download className="size-3" />
                  JPEG
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Signatures */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3">
          <Mail className="size-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-800">Signature Email</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-zinc-700">Signature claire</p>
            <p className="text-xs text-zinc-400">Gmail, Outlook (fond blanc). Ouvrez le fichier HTML, copiez le code, collez dans les paramètres de signature.</p>
            <div className="mt-4 flex gap-2">
              <a
                href="/brand/signatures/signature-email-light.html"
                download="signature-email-light.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-orange-300 hover:text-orange-600"
              >
                <Download className="size-3" />
                Télécharger HTML
              </a>
            </div>
            <p className="mt-3 font-mono text-[10px] text-zinc-300">lucid-lab-brand/05-digital/signature-email-light-logo.html</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-900 p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-zinc-200">Signature sombre</p>
            <p className="text-xs text-zinc-500">Apple Mail, Outlook (fond sombre). Même procédure, variante couleur inversée.</p>
            <div className="mt-4 flex gap-2">
              <a
                href="/brand/signatures/signature-email-dark.html"
                download="signature-email-dark.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-orange-500 hover:text-orange-400"
              >
                <Download className="size-3" />
                Télécharger HTML
              </a>
            </div>
            <p className="mt-3 font-mono text-[10px] text-zinc-600">lucid-lab-brand/05-digital/signature-email-dark-logo.html</p>
          </div>
        </div>
      </section>

      {/* Full charte link */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-950 p-6 text-center shadow-sm">
        <div className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">Référence complète</div>
        <h3 className="mb-2 text-lg font-bold text-white">Charte Graphique v3.0</h3>
        <p className="mb-5 text-sm text-zinc-400">
          Document HTML standalone auto-contenu — logos téléchargeables, couleurs copiables, 
          bannières, signatures, tokens CSS, règles typographiques.
        </p>
        <a
          href="lucid-lab-brand/00-overview/charte-graphique.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          Ouvrir la charte complète
          <ArrowUpRight className="size-4" />
        </a>
        <p className="mt-4 font-mono text-[10px] text-zinc-600">
          lucid-lab-brand/00-overview/charte-graphique.html · 796KB · Auto-contenu
        </p>
      </div>
    </div>
  );
}
