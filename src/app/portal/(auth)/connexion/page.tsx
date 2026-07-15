import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getPortalSession, portalBasePath } from '@/lib/portal/auth';
import { portalStrings } from '@/lib/portal/strings';

export const metadata: Metadata = {
  title: 'Connexion',
};

interface PageProps {
  searchParams: Promise<{ envoye?: string; erreur?: string }>;
}

export default async function PortalLoginPage({ searchParams }: PageProps) {
  const session = await getPortalSession();
  const base = await portalBasePath();
  if (session) redirect(base || '/');

  const params = await searchParams;
  const sent = params.envoye === '1';
  const s = portalStrings.login;
  const errorMessage =
    params.erreur === 'expiree'
      ? s.errorExpired
      : params.erreur === 'acces'
        ? s.errorRevoked
        : params.erreur
          ? s.errorInvalid
          : null;

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <Image src="/logo.png" alt="Lucid-Lab" width={28} height={28} />
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Lucid-Lab
          </span>
          <span className="mt-0.5 rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            {portalStrings.appName}
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
          {sent ? (
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {s.sentTitle}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">{s.sentBody}</p>
              <form action={`${base}/connexion/demande`} method="post" className="mt-6 space-y-3">
                <input
                  type="email"
                  name="email"
                  required
                  maxLength={254}
                  placeholder={s.emailPlaceholder}
                  className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
                <button
                  type="submit"
                  className="h-11 w-full rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  {s.resend}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {s.title}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">{s.subtitle}</p>

              {errorMessage ? (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
                  {errorMessage}
                </p>
              ) : null}

              <form action={`${base}/connexion/demande`} method="post" className="mt-6 space-y-3">
                <label className="block text-sm font-medium text-zinc-800" htmlFor="portal-email">
                  {s.emailLabel}
                </label>
                <input
                  id="portal-email"
                  type="email"
                  name="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder={s.emailPlaceholder}
                  className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
                <button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  {s.submit}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">{s.help}</p>
      </div>
    </main>
  );
}
