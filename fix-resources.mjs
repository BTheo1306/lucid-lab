import fs from 'fs';

const file = 'src/components/marketing/HomePage.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldResourcesStart = 'function Resources({ lang }: { lang: Locale }) {';
const oldResourcesEnd = 'function FAQ({ lang }: { lang: Locale }) {';

const startIndex = code.indexOf(oldResourcesStart);
const endIndex = code.indexOf(oldResourcesEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const oldResources = code.substring(startIndex, endIndex);
  
  const newResources = `function Resources({ lang }: { lang: Locale }) {
  const t = content[lang].resources
  const resourceLinks = lang === 'en'
    ? ['AI audit deliverables', 'AI, GDPR and internal data', 'Automation ROI for operations']
    : ['Audit IA : livrables et scoring', 'IA, RGPD et données internes', 'ROI des automatisations métier']

  return (
    <Section id="blog" tone="gray">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
        </div>
        <div className="hidden md:block">
          <TextLink href={routeMap[lang].blog}>{t.cta}</TextLink>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resourceLinks.map((title) => (
          <Link 
            key={title} 
            href={routeMap[lang].blog} 
            className="group flex flex-col justify-between rounded-[12px] bg-white p-6 border border-zinc-200/80 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.05)] shadow-sm"
          >
            <div className="mb-12">
              <span className="mb-4 inline-flex px-2 py-0.5 rounded-sm bg-zinc-100/80 text-[10.5px] font-bold uppercase tracking-widest text-zinc-500">
                {lang === 'en' ? 'Article' : 'Article'}
              </span>
              <h3 className="text-[17px] font-bold leading-[1.3] tracking-tight transition-colors group-hover:text-[#EC5A1D]" style={{ color: INK }}>
                {title}
              </h3>
            </div>
            
            <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
              <span className="text-[13px] font-medium" style={{ color: EMBER }}>
                {lang === 'en' ? 'Read' : 'Lire'}
              </span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" style={{ color: EMBER }} aria-hidden />
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 md:hidden">
        <TextLink href={routeMap[lang].blog}>{t.cta}</TextLink>
      </div>
    </Section>
  )
}

`;

  code = code.replace(oldResources, newResources);
  fs.writeFileSync(file, code);
  console.log("Updated Resources block to cards format.");
} else {
  console.log("Could not find the bounds for Resources.");
}

