import Image from 'next/image';
import { portalBasePath, requirePortalUser } from '@/lib/portal/auth';
import { portalStrings } from '@/lib/portal/strings';
import { PortalNav, type PortalNavItem } from './PortalNav';

export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePortalUser();
  const base = await portalBasePath();

  const navItems: PortalNavItem[] = [
    { href: '/', label: portalStrings.nav.home },
    { href: '/projets', label: portalStrings.nav.projects },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[#F7F5F1]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image src="/logo.png" alt="Lucid-Lab" width={24} height={24} />
            <span
              className="text-[16px] font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Lucid-Lab
            </span>
            <span className="mt-0.5 hidden rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] font-medium text-zinc-600 sm:inline-block">
              {portalStrings.appName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-[220px] truncate text-sm text-zinc-500 md:block">
              {session.clientName}
            </span>
            <form action={`${base}/deconnexion`} method="post">
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                {portalStrings.nav.logout}
              </button>
            </form>
          </div>
        </div>
        <PortalNav items={navItems} base={base} />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>

      <footer className="border-t border-zinc-200 py-6">
        <p className="text-center text-xs text-zinc-500">{portalStrings.footer.contact}</p>
      </footer>
    </div>
  );
}
