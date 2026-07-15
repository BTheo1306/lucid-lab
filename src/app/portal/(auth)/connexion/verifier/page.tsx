import type { Metadata } from 'next';
import Image from 'next/image';
import { portalBasePath } from '@/lib/portal/auth';
import { portalStrings } from '@/lib/portal/strings';

export const metadata: Metadata = {
  title: 'Connexion',
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Anti-scanner interstitial: the GET never consumes the token (Outlook
 * SafeLinks and mail scanners follow GET links and would burn the single-use
 * token). Only the explicit POST below signs the visitor in.
 */
export default async function VerifyLoginPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const base = await portalBasePath();
  const s = portalStrings.verify;

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
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-7 text-center shadow-sm">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            {s.title}
          </h1>

          {token ? (
            <div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">{s.body}</p>
              <form action={`${base}/connexion/verifier/valider`} method="post" className="mt-6">
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  {s.submit}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">{s.missingToken}</p>
              <a
                href={`${base}/connexion`}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                {s.backToLogin}
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
