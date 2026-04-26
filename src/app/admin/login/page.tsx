import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { isAdminApiKeyConfigured, isAdminAuthenticated } from '@/lib/admin/auth';
import { loginAdmin } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin login',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] | undefined }>;
}) {
  if (await isAdminAuthenticated()) {
    redirect('/admin');
  }

  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const missingKey = !isAdminApiKeyConfigured();

  return (
    <main className="relative z-10 grid min-h-[100dvh] place-items-center bg-[#f5f6f2] px-4 py-10 text-zinc-950">
      <style>{`.ll-chat-toggle,.ll-chat-panel,.ll-chat-teaser{display:none!important}`}</style>
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.01em]">Admin access</h1>
            <p className="text-sm text-zinc-500">Lucid-Lab bot operations</p>
          </div>
        </div>

        <form action={loginAdmin} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-zinc-700" htmlFor="admin_key">
            Admin API key
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="admin_key"
                name="admin_key"
                type="password"
                autoComplete="current-password"
                required
                className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                placeholder="Paste ADMIN_API_KEY"
              />
            </div>
          </label>

          {missingKey ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              ADMIN_API_KEY is not configured. Set it before using the dashboard.
            </div>
          ) : null}

          {error === 'invalid' ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              Invalid admin key.
            </div>
          ) : null}

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={missingKey}
          >
            Open dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
