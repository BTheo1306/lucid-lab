import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { LucidOsHeader, LucidOsTabs, Section } from '../../components';
import { ClientIntakeForm } from '../ClientIntakeForm';

export const dynamic = 'force-dynamic';

export default function NewLucidClientPage() {
  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Client intake"
        title="Add client"
        description="Capture the contact, meeting state, commercial context, and pasted notes in one pass."
        icon={UserPlus}
      />

      <LucidOsTabs active="clients" />

      <div className="flex justify-start">
        <Link href="/admin/lucid-os/clients" className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>
      </div>

      <Section title="Client intake" description="Save the record, then review the complete client page that Lucid OS creates from it.">
        <ClientIntakeForm />
      </Section>
    </div>
  );
}
