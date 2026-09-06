import { loadFont } from '@remotion/fonts'
import { staticFile } from 'remotion'

// Brand kit faces, self-hosted (docs/brand-kit/assets/fonts).
export const fontsReady = Promise.all([
  loadFont({ family: 'Figtree', url: staticFile('fonts/figtree-latin.woff2'), weight: '300 900', display: 'block' }),
  loadFont({ family: 'Geist Mono', url: staticFile('fonts/geist-mono-latin.woff2'), weight: '400 600', display: 'block' }),
  loadFont({ family: 'Syne', url: staticFile('fonts/syne-latin.woff2'), weight: '700', display: 'block' }),
])

export const SANS = "'Figtree', ui-sans-serif, system-ui, sans-serif"
export const MONO = "'Geist Mono', ui-monospace, Menlo, monospace"
export const WORDMARK = "'Syne', ui-sans-serif, system-ui, sans-serif"
