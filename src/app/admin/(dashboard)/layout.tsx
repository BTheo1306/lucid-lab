import type { Metadata } from 'next';
import Image from 'next/image';
import { Bot, LogOut } from 'lucide-react';
import { adminBasePath, requireAdmin } from '@/lib/admin/auth';
import { logoutAdmin } from '../actions';
import { AdminNav } from './AdminNav';
import { AdminThemeToggle } from './AdminThemeToggle';

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  // Client components cannot read headers(), so the link prefix is resolved
  // here and passed down. See `adminBasePath`.
  const base = await adminBasePath();

  return (
    <div data-admin-root className="relative z-10 min-h-[100dvh] bg-[#f5f6f2] text-zinc-950">
      <style>{`.ll-chat-toggle,.ll-chat-panel,.ll-chat-teaser{display:none!important}`}</style>
      <div className="grid min-h-[100dvh] lg:grid-cols-[252px_1fr]">
        <aside className="border-b border-zinc-200 bg-white/90 px-5 py-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Lucid-Lab" width={24} height={24} className="admin-logo" />
            <span className="text-[16px] font-bold tracking-tight text-zinc-950" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>Lucid-Lab</span>
          </div>

          <AdminNav base={base} />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-[#f5f6f2]/90 px-5 backdrop-blur md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Bot className="size-5 shrink-0 text-zinc-500" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Admin dashboard</p>
                <p className="truncate text-xs text-zinc-500">Leads, conversations, bookings and bot health</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AdminThemeToggle />
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </form>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
