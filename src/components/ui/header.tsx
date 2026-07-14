'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon'
import { useScroll } from '@/components/ui/use-scroll'
import { createPortal } from 'react-dom'
import { detectLocale, getDictionary, localizeHref } from '@/lib/i18n/client'

// When `darkZoneId` is set, the header turns ink-on-dark while that zone is
// under it, and flips back to the light style once the page scrolls onto
// light sections.
export function Header({ darkZoneId }: { darkZoneId?: string } = {}) {
  const [open, setOpen] = React.useState(false)
  const scrolled = useScroll(10)
  const [overDark, setOverDark] = React.useState(Boolean(darkZoneId))

  React.useEffect(() => {
    if (!darkZoneId) return
    const measure = () => {
      const zone = document.getElementById(darkZoneId)
      if (!zone) { setOverDark(false); return }
      const r = zone.getBoundingClientRect()
      setOverDark(r.top < 68 && r.bottom > 68)
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [darkZoneId])
  const pathname = usePathname() ?? '/'
  const lang = detectLocale(pathname)
  const t = getDictionary(lang).header
  const homePrefix = lang === 'en' ? '/en' : ''
  const switchHref = localizeHref(pathname, lang === 'en' ? 'fr' : 'en')

  const links = [
    { label: t.nav.expertise, href: `${homePrefix}/#expertises` },
    { label: t.nav.offers, href: `${homePrefix}/#offres` },
    { label: t.nav.secondBrain, href: `${homePrefix}/second-brain` },
    { label: t.nav.training, href: lang === 'en' ? '/en/ai-training' : '/formations-ia' },
    { label: t.nav.delivery, href: `${homePrefix}/#comment-on-livre` },
    { label: t.nav.cases, href: `${homePrefix}/#acquis-livres` },
    { label: t.nav.blog, href: `${homePrefix === '' ? '/blog' : '/en/blog'}` },
    { label: t.nav.contact, href: `${homePrefix}/audit-flash` },
  ]

  const nav = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only intercept hash links that target the *current* page.
    const onSamePage = href.startsWith('#') ||
      (lang === 'en' && href.startsWith('/en/#') && (pathname === '/en' || pathname === '/en/')) ||
      (lang === 'fr' && href.startsWith('/#') && pathname === '/')
    if (onSamePage) {
      e.preventDefault()
      const hashIndex = href.indexOf('#')
      const id = hashIndex >= 0 ? href.slice(hashIndex + 1) : ''
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
        'fixed top-0 z-50 w-full border-b transition-all duration-300',
        overDark
          ? 'border-white/10 bg-[#0A0A0A]/85 backdrop-blur-xl'
          : scrolled
            ? 'border-[#e5e5e5] bg-[#F7F5F1]/80 backdrop-blur-xl'
            : 'border-[#e5e5e5] bg-[#F7F5F1]'
      )}
    >
      <nav className={cn('mx-auto flex h-[68px] w-full max-w-[1264px] items-center justify-between border-x px-[48px] max-lg:px-6', overDark ? 'border-white/10' : 'border-[#e5e5e5]')}>
        {/* Wordmark */}
        <a href={lang === 'en' ? '/en' : '/'} onClick={nav(lang === 'en' ? '/en/#' : '/#')} className="flex items-center gap-2 transition-opacity hover:opacity-70">
          <img src="/logo.png" alt="Lucid-Lab" className={cn('size-6 transition-[filter] duration-300', overDark && 'invert')} />
          <span
            className={cn('text-[16px] font-bold tracking-tight transition-colors duration-300', overDark ? 'text-white' : 'text-black')}
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Lucid-Lab
          </span>
        </a>

        {/* Desktop Nav — Centered */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-4 xl:gap-5 lg:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={nav(link.href)}
              className={cn('text-[14px] font-medium transition-colors', overDark ? 'text-white/70 hover:text-white' : 'text-[#666] hover:text-black')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right CTA + language switcher */}
        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={switchHref}
            className={cn('group flex h-[34px] items-center px-3.5 rounded-full border transition-all', overDark ? 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white' : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900')}
            aria-label={t.languageLabel}
            title={lang === 'en' ? t.switchToFrench : t.switchToEnglish}
          >
            <span className="text-[11px] font-bold tracking-[0.1em] font-mono">
              {lang === 'en' ? 'FR' : 'EN'}
            </span>
          </a>
          <a
            href={`${homePrefix}/audit-flash`}
            className={cn('flex h-[40px] items-center rounded-[10px] px-5 text-[14px] font-medium transition-colors', overDark ? 'bg-white text-black hover:bg-[#e8e8e4]' : 'bg-black text-white hover:bg-[#333]')}
          >
            {t.cta}
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={cn('flex items-center justify-center lg:hidden transition-colors', overDark ? 'text-white' : 'text-black')}
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
            href={switchHref}
            className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#e5e5e5] text-[14px] font-medium text-[#444] transition-colors hover:bg-zinc-50"
          >
            <span className="text-[12px] font-bold tracking-wider font-mono mr-2">
              {lang === 'en' ? 'FR' : 'EN'}
            </span>
            <span className="text-stone-300 mr-1">•</span>
            {lang === 'en' ? t.switchToFrench : t.switchToEnglish}
          </a>
          <a
            href={`${homePrefix}/audit-flash`}
            className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-black text-[15px] font-semibold text-white"
          >
            {t.cta}
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
        'fixed top-[68px] right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-t border-[#e5e5e5] lg:hidden',
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
