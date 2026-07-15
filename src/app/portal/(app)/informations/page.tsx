import type { Metadata } from 'next';
import { portalBasePath, requirePortalUser } from '@/lib/portal/auth';
import { getPortalClientInfo } from '@/lib/portal/data';
import { portalStrings } from '@/lib/portal/strings';
import { PortalCard, PortalPageHeader } from '../../components';

export const metadata: Metadata = {
  title: 'Mes informations',
};

interface PageProps {
  searchParams: Promise<{ maj?: string; envoye?: string; erreur?: string }>;
}

const inputClass =
  'h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10';

export default async function PortalInfoPage({ searchParams }: PageProps) {
  const session = await requirePortalUser();
  const base = await portalBasePath();
  const info = await getPortalClientInfo(session);
  const params = await searchParams;
  const s = portalStrings.info;

  return (
    <div>
      <PortalPageHeader title={s.title} description={s.description} />

      {params.maj === '1' ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">{s.saved}</p>
      ) : null}
      {params.envoye === '1' ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">{s.contextSent}</p>
      ) : null}
      {params.erreur === '1' ? (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">{s.saveFailed}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <PortalCard>
          <h2 className="text-sm font-semibold text-zinc-900">{s.companyTitle}</h2>
          <p className="mt-1 text-xs text-zinc-500">{info.name}</p>
          <form action={`${base}/informations/entreprise`} method="post" className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              {s.legalName}
              <input type="text" name="legal_name" defaultValue={info.legalName ?? ''} maxLength={200} className={inputClass} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
                {s.siren}
                <input type="text" name="siren" defaultValue={info.siren ?? ''} maxLength={20} className={inputClass} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
                {s.siret}
                <input type="text" name="siret" defaultValue={info.siret ?? ''} maxLength={20} className={inputClass} />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              {s.billingAddress}
              <textarea
                name="billing_address"
                rows={2}
                defaultValue={info.billingAddress ?? ''}
                maxLength={400}
                className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm leading-6 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              {s.websiteUrl}
              <input type="url" name="website_url" defaultValue={info.websiteUrl ?? ''} maxLength={300} placeholder="https://" className={inputClass} />
            </label>
            <button
              type="submit"
              className="h-11 rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:justify-self-start sm:px-6"
            >
              {s.save}
            </button>
          </form>
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-semibold text-zinc-900">{s.contextTitle}</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{s.contextHint}</p>
          <form action={`${base}/informations/contexte`} method="post" className="mt-4 grid gap-3">
            <textarea
              name="content"
              rows={9}
              required
              maxLength={20000}
              placeholder={s.contextPlaceholder}
              className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm leading-6 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            />
            <button
              type="submit"
              className="h-11 rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:justify-self-start sm:px-6"
            >
              {s.send}
            </button>
          </form>
        </PortalCard>
      </div>
    </div>
  );
}
