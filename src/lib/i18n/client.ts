// Client-safe locale helpers (no headers() / no 'server-only').

import { en } from './dictionaries/en';
import { fr } from './dictionaries/fr';

export type Locale = 'fr' | 'en';
export const DEFAULT_LOCALE: Locale = 'fr';

const dictionaries = { fr, en } as const;

export type Dictionary = typeof fr;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Detect locale from a pathname (e.g. usePathname()). */
export function detectLocale(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'fr';
}

/** Map a FR href to its EN equivalent and vice-versa for the language switcher. */
export function localizeHref(pathname: string, target: Locale): string {
  const isEn = pathname === '/en' || pathname.startsWith('/en/');
  const stripped = isEn ? (pathname === '/en' ? '/' : pathname.slice(3)) : pathname;

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
  return EN_TO_FR[stripped] ?? stripped;
}
