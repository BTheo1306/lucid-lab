'use client';

import { useState } from 'react';

const COLORS = [
  { name: 'Noir absolu',    hex: '#0A0A0A', var: '--black',      usage: 'Fonds sombres, texte primaire' },
  { name: 'Anthracite',     hex: '#1C1C1C', var: '--anthracite', usage: 'Cards sombres, sections dark' },
  { name: 'Gris officiel',  hex: '#525252', var: '--gray',       usage: 'Textes secondaires, icônes' },
  { name: 'Gris clair',     hex: '#E5E5E5', var: '--light-gray', usage: 'Bordures, séparateurs' },
  { name: 'Papier chaud',   hex: '#F7F5F1', var: '--warm-white', usage: 'Fond principal du site' },
  { name: 'Blanc pur',      hex: '#FFFFFF', var: '--pure-white', usage: 'Texte sur fond sombre' },
  { name: 'Ember',          hex: '#C85E1A', var: '--ember',      usage: 'CTA, accent de marque' },
  { name: 'Ciel IA',        hex: '#B4D8FF', var: '--sky',        usage: 'Agents IA, états info' },
  { name: 'Olive succès',   hex: '#3F7D5B', var: '--olive',      usage: 'Succès, production' },
  { name: 'Ambre alerte',   hex: '#FFB451', var: '--amber',      usage: 'Avertissements' },
  { name: 'Rouge incident', hex: '#B94A48', var: '--error',      usage: 'Erreurs, incidents' },
] as const;

export function ColorPalette() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = hex;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(hex);
      setTimeout(() => setCopied(null), 1500);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:grid-cols-6">
      {COLORS.map((color) => {
        const isCopied = copied === color.hex;
        const isLight = ['#FFFFFF', '#F7F5F1', '#E5E5E5', '#B4D8FF', '#FFB451'].includes(color.hex);
        return (
          <button
            key={color.hex}
            onClick={() => copy(color.hex)}
            title={`Copier ${color.hex}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="h-14 w-full"
              style={{
                backgroundColor: color.hex,
                border: color.hex === '#FFFFFF' ? '1px solid #E5E5E5' : undefined,
              }}
            />
            <div className="flex flex-col gap-0.5 bg-white px-3 py-2.5">
              <span className="text-xs font-semibold text-zinc-800">{color.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-zinc-500">{color.hex}</span>
                {isCopied ? (
                  <span className="rounded bg-emerald-100 px-1 py-px text-[9px] font-semibold text-emerald-700">
                    Copié
                  </span>
                ) : (
                  <span className="rounded bg-zinc-100 px-1 py-px text-[9px] font-medium text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
                    Copier
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-400">{color.usage}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
