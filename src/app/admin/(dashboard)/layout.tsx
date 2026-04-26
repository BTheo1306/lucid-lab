import type { Metadata } from 'next';
import { Bot, LogOut, ShieldCheck } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { logoutAdmin } from '../actions';
import { AdminNav } from './AdminNav';

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="relative z-10 min-h-[100dvh] bg-[#f5f6f2] text-zinc-950">
      <style>{`.ll-chat-toggle,.ll-chat-panel,.ll-chat-teaser{display:none!important}`}</style>
      <div className="grid min-h-[100dvh] lg:grid-cols-[252px_1fr]">
        <aside className="border-b border-zinc-200 bg-white/90 px-5 py-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Lucid-Lab</p>
              <p className="mt-1 text-xs text-zinc-500">Bot operations</p>
            </div>
          </div>

          <AdminNav />
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
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </form>
          </header>

          <main className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
