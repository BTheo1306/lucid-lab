'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon'
import { useScroll } from '@/components/ui/use-scroll'
import { createPortal } from 'react-dom'

export function Header() {
  const [open, setOpen] = React.useState(false)
  const scrolled = useScroll(10)

  const links = [
    { label: 'Cas clients', href: '#cas-clients' },
    { label: 'Méthode', href: '#solutions' },
    { label: 'Contact', href: '#booking' },
  ]

  const nav = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const id = href.slice(1)
      if (!id) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setOpen(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full border-b border-[#e5e5e5] transition-all duration-300',
        scrolled
          ? 'bg-[#F7F5F1]/80 backdrop-blur-xl'
          : 'bg-[#F7F5F1]'
      )}
    >
      <nav className="mx-auto flex h-[68px] w-full max-w-[1264px] items-center justify-between border-x border-[#e5e5e5] px-[48px] max-lg:px-6">
        {/* Wordmark */}
        <a href="#" onClick={nav('#')} className="flex items-center gap-2 transition-opacity hover:opacity-70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Lucid-Lab" className="h-6 w-auto" />
          <span
            className="text-[16px] font-bold tracking-tight text-black"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Lucid-Lab
          </span>
        </a>

        {/* Desktop Nav — Centered */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={nav(link.href)}
              className="text-[14px] font-medium text-[#666] transition-colors hover:text-black"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right CTA */}
        <div className="hidden items-center gap-5 md:flex">
          <a
            href="#booking"
            onClick={nav('#booking')}
            className="flex h-[40px] items-center rounded-[10px] bg-black px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#333]"
          >
            Réserver l&apos;Audit Flash
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center text-black md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </button>
      </nav>

      <MobileMenu open={open} className="flex flex-col justify-between gap-4">
        <div className="grid gap-y-2 pt-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={nav(link.href)}
              className="text-xl font-semibold tracking-tight text-black transition-colors hover:text-black/60 inline-block px-4 py-2"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-3 pb-8 px-4">
          <a
            href="#booking"
            onClick={nav('#booking')}
            className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-black text-[15px] font-semibold text-white"
          >
            Réserver l&apos;Audit Flash
          </a>
        </div>
      </MobileMenu>
    </header>
  )
}

type MobileMenuProps = React.ComponentProps<'div'> & {
  open: boolean
}

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === 'undefined') return null

  return createPortal(
    <div
      id="mobile-menu"
      className={cn(
        'bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur-lg',
        'fixed top-[68px] right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-t border-[#e5e5e5] md:hidden',
      )}
    >
      <div
        data-slot={open ? 'open' : 'closed'}
        className={cn(
          'data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out',
          'size-full p-4',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

function LucidLabIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <circle cx="12" cy="8" r="3" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <line x1="12" y1="11" x2="6" y2="15.5" strokeOpacity={0.5} />
      <line x1="12" y1="11" x2="18" y2="15.5" strokeOpacity={0.5} />
    </svg>
  )
}
