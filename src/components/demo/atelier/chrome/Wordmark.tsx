export function LucidWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`select-none text-[13px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A] ${className}`}
      style={{ fontFamily: 'var(--font-syne), ui-sans-serif, system-ui, sans-serif' }}
    >
      Lucid-Lab
    </span>
  )
}
