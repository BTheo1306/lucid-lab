import 'server-only';
import { headers } from 'next/headers';

import { en } from './dictionaries/en';
import { fr } from './dictionaries/fr';

export type Locale = 'fr' | 'en';
export const DEFAULT_LOCALE: Locale = 'fr';
export const LOCALES: Locale[] = ['fr', 'en'];

const dictionaries = { fr, en } as const;

export type Dictionary = typeof fr;

/** Locale derived from the current request's pathname. */
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  const pathname = h.get('x-pathname') ?? '/';
  return pathname.startsWith('/en') ? 'en' : 'fr';
}

export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  const l = locale ?? (await getLocale());
  return dictionaries[l];
}

export function getDictionarySync(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Map a FR href to its EN equivalent and vice-versa. Used by the language switcher. */
export function localizeHref(href: string, target: Locale): string {
  // Normalise the path: strip the locale prefix if present.
  const isEn = href.startsWith('/en/') || href === '/en';
  const stripped = isEn ? (href === '/en' ? '/' : href.slice(3)) : href;

  // Translate FR-only URL slugs to their EN equivalents.
  const FR_TO_EN: Record<string, string> = {
    '/confidentialite': '/privacy',
    '/mentions-legales': '/legal-notice',
    '/cgv': '/terms',
  };
  const EN_TO_FR: Record<string, string> = {
    '/privacy': '/confidentialite',
    '/legal-notice': '/mentions-legales',
    '/terms': '/cgv',
  };

  if (target === 'en') {
    const mapped = FR_TO_EN[stripped] ?? stripped;
    return mapped === '/' ? '/en' : `/en${mapped}`;
  }
  // target === 'fr'
  return EN_TO_FR[stripped] ?? stripped;
}
