export function formatDate(date: Date | string, lang: 'fr' | 'en' = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string, lang: 'fr' | 'en' = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date | string, lang: 'fr' | 'en' = 'fr'): string {
  const sep = lang === 'fr' ? ' à ' : ' at ';
  return `${formatDate(date, lang)}${sep}${formatTime(date, lang)}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '●●●@●●●';
  const maskedLocal = local[0] + '●●●';
  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0]![0] + '●●●.' + domainParts.slice(1).join('.');
  return `${maskedLocal}@${maskedDomain}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
