import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LucidOsHeader, Section } from '../../components';
import { ClientIntakeForm } from '../ClientIntakeForm';

export const dynamic = 'force-dynamic';

type NewClientSearchParams = {
  client_error?: string | string[];
};

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function ActionErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
      {message}
    </div>
  );
}

export default async function NewLucidClientPage({ searchParams }: { searchParams?: Promise<NewClientSearchParams> }) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const clientError = firstSearchParam(resolvedSearchParams.client_error);

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        title="Ajouter un client"
        action={(
          <Link href="/admin/lucid-os/clients" className="inline-flex h-9 items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07]">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        )}
      />
      <ActionErrorBanner message={clientError} />

      <Section title="Fiche complète">
        <ClientIntakeForm submitLabel="Créer / importer avec IA" />
      </Section>
    </div>
  );
}
