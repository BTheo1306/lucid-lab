import fs from 'fs';

const file = 'src/components/marketing/HomePage.tsx';
let code = fs.readFileSync(file, 'utf8');

// The string we want to replace
const oldCTAStart = 'function FinalCTA({ lang }: { lang: Locale }) {';
const oldCTAEnd = 'export function MarketingFooter';

const startIndex = code.indexOf(oldCTAStart);
const endIndex = code.indexOf(oldCTAEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const oldCTA = code.substring(startIndex, endIndex);
  
  const newCTA = `function FinalCTA({ lang }: { lang: Locale }) {
  const t = content[lang].final
  const isEn = lang === 'en'

  return (
    <section className="py-16 md:py-32" style={{ background: PAPER }}>
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <div 
          className="relative flex flex-col items-center justify-center overflow-hidden rounded-[20px] px-6 py-16 text-center md:py-24"
          style={{ background: INK, color: PAPER }}
        >
          {/* Minimalist architectural lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-[300px] bg-gradient-to-b from-transparent via-white/5 to-transparent hidden md:block" />
            <div className="absolute left-1/2 top-0 h-full w-[1px] translate-x-[300px] bg-gradient-to-b from-transparent via-white/5 to-transparent hidden md:block" />
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <span 
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em]"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: EMBER }}
            >
              <span className="size-1.5 rounded-full" style={{ background: EMBER }}></span>
              {isEn ? 'Begin the process' : 'Démarrer le processus'}
            </span>
            
            <h2 className="max-w-[18ch] text-[32px] font-extrabold leading-[1.05] tracking-tight md:text-[44px] lg:text-[52px]">
              {t.title}
            </h2>
            
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed md:text-[16px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {t.subtitle}
            </p>

            <div className="mt-10">
              <PrimaryCta href={routeMap[lang].booking} inverted>
                {t.cta}
              </PrimaryCta>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

`;

  code = code.replace(oldCTA, newCTA);
  fs.writeFileSync(file, code);
  console.log("Updated FinalCTA to an elegant agency style.");
} else {
  console.log("Could not find the bounds for FinalCTA.");
}
