const FRENCH_INDICATORS = [
  'bonjour', 'salut', 'bonsoir', 'merci', 'oui', 'non', 'je', 'nous', 'vous',
  'rendez-vous', 'aide', 'besoin', 'comment', 'quand', 'combien', 'pourquoi',
  'quel', 'quelle', 'automatiser', 'processus', 'équipe', 'entreprise',
  'logiciel', 'système', 'données', 'projet',
];

const ENGLISH_INDICATORS = [
  'hello', 'hi', 'hey', 'thanks', 'thank', 'yes', 'no', 'appointment',
  'help', 'need', 'how', 'when', 'much', 'why', 'what', 'which', 'would',
  'could', 'please', 'automate', 'process', 'team', 'business', 'data',
  'project', 'software', 'system',
];

export function detectLanguage(text: string): 'fr' | 'en' {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  let frScore = 0;
  let enScore = 0;

  for (const word of words) {
    if (FRENCH_INDICATORS.includes(word)) frScore++;
    if (ENGLISH_INDICATORS.includes(word)) enScore++;
  }

  // Default to French (primary audience)
  return enScore > frScore ? 'en' : 'fr';
}

export function getLanguageLabel(lang: string): string {
  const labels: Record<string, string> = { fr: 'Français', en: 'English' };
  return labels[lang] ?? lang;
}
