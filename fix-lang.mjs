import fs from 'fs';

const file = 'src/components/ui/header.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace desktop language switcher
code = code.replace(
  /<a[\s\n]*href=\{switchHref\}[\s\n]*className="group flex h-\[32px\] w-\[32px\] items-center justify-center \nrounded-full border border-\[#e5e5e5\] bg-white transition-all hover:border-\[#ccc\]\n hover:bg-\[#f9f9f9\]"[\s\n]*aria-label=\{t\.languageLabel\}[\s\n]*title=\{lang === 'en' \? t\.switchToFrench : t\.switchToEnglish\}[\s\n]*>[\s\n]*<span className="text-\[14px\] leading-none opacity-80 transition-opac\nity group-hover:opacity-100">[\s\n]*\{lang === 'en' \? '🇫🇷' : '🇬🇧'\}[\s\n]*<\/span>[\s\n]*<\/a>/s,
  `<a
            href={switchHref}
            className="group flex h-[36px] items-center px-3.5 rounded-full border border-stone-200 bg-white transition-all hover:border-stone-300 hover:bg-stone-50 text-stone-500 hover:text-stone-900"
            aria-label={t.languageLabel}
            title={lang === 'en' ? t.switchToFrench : t.switchToEnglish}
          >
            <span className="text-[11px] font-bold tracking-[0.1em] font-mono">
              {lang === 'en' ? 'FR' : 'EN'}
            </span>
          </a>`
);

// Fallback search since previous regex might have whitespace mismatches due to line wrap in cat output
if (code.includes('🇫🇷') && !code.includes('FR')) {
  console.log("Fallback replacement");
}
