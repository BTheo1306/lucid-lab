import type { Metadata } from 'next';
import Image from 'next/image';
import { adminBasePath, adminRedirect, isAdminAuthenticated, isGoogleSsoConfigured } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin login',
  robots: {
    index: false,
    follow: false,
  },
};

const ERROR_MESSAGES: Record<string, string> = {
  not_allowed: "Ce compte Google n'est pas autorisé à accéder au tableau de bord.",
  oauth_failed: 'La connexion Google a échoué. Réessayez.',
  oauth_state: 'Vérification de sécurité échouée. Relancez la connexion.',
  config: "La connexion Google n'est pas encore configurée.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] | undefined }>;
}) {
  if (await isAdminAuthenticated()) {
    return adminRedirect('/admin/lucid-os');
  }

  const params = await searchParams;
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.oauth_failed : null;
  const ssoReady = isGoogleSsoConfigured();
  const base = await adminBasePath();

  return (
    <main className="relative z-10 grid min-h-[100dvh] place-items-center bg-[#f5f6f2] px-4 py-10 text-zinc-950">
      <style>{`.ll-chat-toggle,.ll-chat-panel,.ll-chat-teaser{display:none!important}`}</style>
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Lucid-Lab" width={28} height={28} />
          <span className="text-[18px] font-bold tracking-tight text-zinc-950" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>Lucid-Lab</span>
        </div>
        <h1 className="mt-5 text-base font-semibold text-zinc-900">Accès admin</h1>
        <p className="mt-1.5 text-sm text-zinc-500">Connectez-vous avec votre compte Google Lucid-Lab.</p>

        {errorMessage ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {errorMessage}
          </div>
        ) : null}

        {ssoReady ? (
          <a
            href={`${base}/auth/google`}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
            </svg>
            Continuer avec Google
          </a>
        ) : (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            La connexion Google n&apos;est pas configurée. Définissez GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET.
          </div>
        )}
      </div>
    </main>
  );
}
