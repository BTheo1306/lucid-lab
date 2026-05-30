const fs = require('fs');
let code = fs.readFileSync('src/components/ui/header.tsx', 'utf8');

code = code.replace(
  /className="group flex h-\[32px\] w-\[32px\] items-center justify-center\s*rounded-full border border-\[#e5e5e5\] bg-white transition-all hover:border-\[#ccc\]\s*hover:bg-\[#f9f9f9\]"/g,
  'className="group flex h-[34px] items-center px-3.5 rounded-full border border-stone-200 bg-white transition-all hover:border-stone-300 hover:bg-stone-50 text-stone-500 hover:text-stone-900"'
);

code = code.replace(
  /<span className="text-\[14px\] leading-none opacity-80 transition-opacity\s*group-hover:opacity-100">\s*\{lang === 'en' \? '🇫🇷' : '🇬🇧'\}\s*<\/span>/g,
  '<span className="text-[11px] font-bold tracking-[0.1em] font-mono">\n              {lang === \'en\' ? \'FR\' : \'EN\'}\n            </span>'
);

code = code.replace(
  /<span className="text-\[16px\] leading-none">\s*\{lang === 'en' \? '🇫🇷' : '🇬🇧'\}\s*<\/span>/g,
  '<span className="text-[12px] font-bold tracking-wider font-mono mr-2">\n              {lang === \'en\' ? \'FR\' : \'EN\'}\n            </span>\n            <span className="text-stone-300 mr-1">•</span>'
);

fs.writeFileSync('src/components/ui/header.tsx', code);
console.log('Language switcher replaced.');
