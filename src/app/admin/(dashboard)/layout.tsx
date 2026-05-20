import type { Metadata } from 'next';
import Image from 'next/image';
import { Inbox, LogOut } from 'lucide-react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { logoutAdmin } from '../actions';
import { AdminNav } from './AdminNav';
import { AdminSearch } from './AdminSearch';
import './admin-dark.css';

export const metadata: Metadata = {
  title: 'Lucid OS',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div data-admin-root className="admin-dark relative z-10 min-h-[100dvh] bg-[#070708] text-zinc-100">
      <style>{`.ll-chat-toggle,.ll-chat-panel,.ll-chat-teaser{display:none!important}`}</style>
      <div className="grid min-h-[100dvh] md:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#0a0a0c] px-4 py-4 md:sticky md:top-0 md:h-[100dvh] md:overflow-y-auto md:border-b-0 md:border-r">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Lucid-Lab" width={36} height={36} className="size-9 rounded-md border border-white/15 bg-white object-contain p-1.5" priority />
            <div>
              <p className="text-sm font-semibold leading-none text-zinc-50">Lucid-Lab OS</p>
              <p className="mt-1 text-xs text-zinc-500">Espace agence</p>
            </div>
          </div>

          <AdminNav />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 border-b border-white/10 bg-[#070708]/90 px-4 backdrop-blur md:px-6">
            <AdminSearch />
            <div className="min-w-0 md:hidden">
              <p className="truncate text-sm font-medium text-zinc-100">Lucid OS</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/lucid-os/inbox"
                className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-zinc-50"
              >
                <Inbox className="size-4" />
                Actions
              </Link>
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-zinc-50"
                >
                  <LogOut className="size-4" />
                  Déconnexion
                </button>
              </form>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6 md:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
