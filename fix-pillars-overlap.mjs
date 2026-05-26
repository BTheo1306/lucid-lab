import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/components/marketing/HomePage.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const newPillars = `function Pillars({ lang }: { lang: Locale }) {
  const t = content[lang].pillars
  const [activeIdx, setActiveIdx] = useState<number>(0)
  
  return (
    <Section id="expertises" tone="gray">
      <div className="relative">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:min-h-[100vh]">
          
          <div className="sticky top-20 lg:top-32 flex flex-col gap-6 lg:gap-12 z-20 pb-4 lg:pb-0 self-start">
            <div className="grid gap-3 lg:gap-4">
              <SectionTitle>{t.title}</SectionTitle>
              <SectionLede>{t.subtitle}</SectionLede>
            </div>

            <div className="hidden lg:flex flex-col gap-1.5">
              {t.items.map((item, index) => {
                const Icon = pillarIcons[index] ?? SearchCheck
                const isActive = activeIdx === index
                return (
                  <button
                    key={item.title}
                    className="flex items-center justify-between p-3.5 rounded-[6px] border text-left transition-all duration-200 outline-none cursor-default"
                    style={{
                      background: isActive ? PAPER : 'transparent',
                      borderColor: isActive ? GRAY_200 : 'transparent',
                      transform: isActive ? 'translateX(4px)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="size-4 shrink-0" style={{ color: isActive ? EMBER : GRAY_600 }} />
                      <span className="text-[13.5px] font-semibold" style={{ color: isActive ? INK : GRAY_600 }}>
                        {item.title}
                      </span>
                    </div>
                    <span className="font-mono text-[10px]" style={{ color: GRAY_400 }}>0{index + 1}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col relative w-full pb-[60vh] lg:pb-[50vh]">
            {t.items.map((item, index) => {
              const Icon = pillarIcons[index] ?? SearchCheck
              
              return (
                <motion.div
                  key={index}
                  onViewportEnter={() => setActiveIdx(index)}
                  viewport={{ margin: "-40% 0px -40% 0px" }}
                  className="sticky lg:h-[400px] rounded-[12px] border p-6 md:p-8 flex flex-col justify-between bg-white shadow-md overflow-hidden top-[var(--card-top-mobile)] lg:top-[var(--card-top-desktop)]"
                  style={{ 
                    borderColor: GRAY_200,
                    '--card-top-mobile': \`calc(35vh + \${index * 16}px)\`,
                    '--card-top-desktop': \`calc(130px + \${index * 16}px)\`,
                    marginBottom: '50vh',
                    zIndex: index
                  } as React.CSSProperties}
                >
                  <div className="absolute inset-x-0 -bottom-[100vh] h-[100vh] bg-white pointer-events-none" aria-hidden="true" />
                  
                  <div className="flex flex-col h-full justify-between relative z-10">
                    <div>
                      <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: GRAY_100 }}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" style={{ color: EMBER }} />
                          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8a8276]">Expertise 0{index + 1}</span>
                        </div>
                      </div>

                      <h3 className="text-[18px] md:text-[20px] font-bold" style={{ color: INK }}>{item.title}</h3>
                      <p className="mt-2 text-[13.5px] leading-[1.5]" style={{ color: GRAY_600 }}>{item.problem}</p>
                      
                      <ul className="mt-5 space-y-2.5">
                        {item.deliverables.map((deliverable) => (
                          <li key={deliverable} className="flex gap-2.5 text-[13px] items-center font-medium" style={{ color: INK }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: EMBER }} />
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t" style={{ borderColor: GRAY_100 }}>
                      <span className="text-[10px] font-mono text-[#8a8276] block mb-1">Impact final :</span>
                      <p className="text-[13px] font-semibold leading-[1.5]" style={{ color: EMBER }}>{item.result}</p>
                      
                      <Link 
                        href={resolveHref(lang, item.href)}
                        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold group bg-[#F5F5F0] hover:bg-[#EAEAE5] transition-colors py-2 px-3.5 rounded-md"
                        style={{ color: INK }}
                      >
                        {lang === 'en' ? 'Open details' : 'Voir les détails'}
                        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

        </div>
      </div>
    </Section>
  )
}
`

const startIdx = content.indexOf('function Pillars');
const endMarker = 'function Offers';
let endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newPillars + '\n' + content.substring(endIdx);
  fs.writeFileSync(filePath, content);
  console.log('Replaced Pillars');
} else {
  console.error('Could not find start or end markers');
}
