import { INK, WHITE } from '../tokens'

/** A classic arrow cursor, drawn as SVG so it stays crisp at any scale. */
export function Cursor({ x, y, pressed = false, size = 44 }: { x: number; y: number; pressed?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', left: x, top: y, transform: `scale(${pressed ? 0.88 : 1})`, transformOrigin: '4px 3px', filter: 'drop-shadow(0 6px 10px rgba(10,10,10,0.25))' }}>
      <path d="M5 3 L19 12.5 L12.5 13.6 L16.2 21 L13.6 22.2 L9.9 14.9 L5 19.5 Z" fill={INK} stroke={WHITE} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}
