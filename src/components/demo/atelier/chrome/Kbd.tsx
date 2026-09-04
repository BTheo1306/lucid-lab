import type { ReactNode } from 'react'

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-[4px] border border-[#D4D4D4] bg-white px-1.5 font-mono text-[11px] font-medium text-[#3D3D3D]">
      {children}
    </kbd>
  )
}
