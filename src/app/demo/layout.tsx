import type { Metadata } from 'next'

import { DISCLAIMER } from '@/lib/demo/atelier/identity'

import './atelier/atelier.css'

export const metadata: Metadata = {
  title: "Une journée à l'atelier, avec l'assistant",
  description: DISCLAIMER,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Une journée à l'atelier, avec l'assistant",
    description: DISCLAIMER,
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 min-h-[100dvh] bg-[#F7F5F1] text-[#0A0A0A]">
      {/* The chat widget filters on the pathname; this is the belt-and-braces guard used by the portal layout. */}
      <style>{`.ll-chat-toggle,.ll-chat-panel,.ll-chat-teaser{display:none!important}`}</style>
      {children}
    </div>
  )
}
