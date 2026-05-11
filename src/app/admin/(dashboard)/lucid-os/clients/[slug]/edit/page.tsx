import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getLucidClientBySlug } from '@/lib/admin/lucid-os';
import { LucidOsHeader, LucidOsTabs, Section } from '../../../components';
import { ClientIntakeForm } from '../../ClientIntakeForm';

export const dynamic = 'force-dynamic';

export default async function EditLucidClientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getLucidClientBySlug(decodeURIComponent(slug));
  if (!client) notFound();

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Client intake"
        title={`Edit ${client.name}`}
        description="Update structured fields or paste fresh notes to let the Client Intake Agent re-extract the record."
        icon={RefreshCw}
      />

      <LucidOsTabs active="clients" />

      <div className="flex justify-start">
        <Link href={`/admin/lucid-os/clients/${client.slug}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
          <ArrowLeft className="size-4" />
          Back to client
        </Link>
      </div>

      <Section title="Edit intake" description="Manual fields stay authoritative. Paste notes only when you want the agent to refresh extracted context.">
        <ClientIntakeForm client={client} submitLabel="Update client" />
      </Section>
    </div>
  );
}
